pragma solidity 0.5.16;

import "../externals/SafeMath.sol";
import "../externals/SafeERC20.sol";
import "../externals/ReentrancyGuard.sol";
import "../externals/Ownable.sol";
import "../externals/IERC20.sol";
import "../externals/ERC20.sol";
import "../externals/ERC20Detailed.sol";

import "../interfaces/EarningPoolInterface.sol";
import "../interfaces/MiningRewardPoolInterface.sol";

/**
 * @title dToken
 * @dev dToken are collateralized assets pegged to a specific value.
 *      Collaterals are EarningPool shares
 */
contract dToken is ERC20, ERC20Detailed, ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    mapping(address => address) public underlyingToEarningPoolMap;
    address[] public supportedUnderlyings;

    MiningRewardPoolInterface public miningPool;

    /**
     * @dev dToken constructor
     * @param _name Name of dToken
     * @param _symbol Symbol of dToken
     * @param _decimals Decimal place of dToken
     * @param _underlyings List of underlyings to be used for minting dToken
     * @param _earningPools List of earning pools to supply underlying token to
     */
    constructor (
        string memory _name,
        string memory _symbol,
        uint8 _decimals,
        address[] memory _underlyings,
        address[] memory _earningPools
    )
        ERC20Detailed(_name, _symbol, _decimals)
        public
    {
        for (uint i=0; i<_underlyings.length; i++) {
            underlyingToEarningPoolMap[_underlyings[i]] = _earningPools[i];
            supportedUnderlyings.push(_underlyings[i]);
            _approveUnderlyingToEarningPool(_underlyings[i], _earningPools[i]);
        }

        miningPool = MiningRewardPoolInterface(0); // initialize to address 0
    }

    /*** PUBLIC ***/

    /**
     * @dev Mint dToken using underlying
     * @param _underlying Token supplied for minting
     * @param _amount Amount of _underlying
     */
    function mint(
        address _underlying,
        uint _amount
    )
        external
        nonReentrant
    {
        _mintInternal(_underlying, _amount, msg.sender);
    }

    /**
     * @dev Redeem dToken to underlying
     * @param _underlying Token withdrawn for redeeming
     * @param _amount Amount of _underlying
     */
    function redeem(
        address _underlying,
        uint _amount
    )
        external
        nonReentrant
    {
        _redeemInternal(_underlying, _amount, msg.sender);
    }

    /**
     * @dev Swap underlyings
     * @param _underlyingFrom Token to swap from
     * @param _amountFrom Amount of _underlyingFrom
     * @param _underlyingTo Token to swap to
     */
    function swap(
        address _underlyingFrom,
        uint _amountFrom,
        address _underlyingTo
    )
        external
        nonReentrant
    {
        // check if there is sufficient underlyingTo to swap
        // currently there are no exchange rate between underlyings as only stable coins are supported
        EarningPoolInterface pool = EarningPoolInterface(underlyingToEarningPoolMap[_underlyingTo]);
        uint amountTo = _scaleTokenAmount(_underlyingFrom, _amountFrom, _underlyingTo);
        require(pool.calcPoolValueInUnderlying() >= amountTo, "DTOKEN: insufficient underlyingTo for swap");

        // mint with _underlyingFrom
        _mintInternal(_underlyingFrom, _amountFrom, msg.sender);

        // redeem to _underlyingTo
        _redeemInternal(_underlyingTo, amountTo, msg.sender);
    }

    /**
     * @dev Overrides parent ERC20 transfer function to update reward for sender and recipient
     * @param _recipient Address to recieve transfer
     * @param _amount Amount to transfer
     * @return bool Is transfer successful
     */
    function transfer(address _recipient, uint256 _amount)
        public
        returns (bool)
    {
        miningPool.updateReward(msg.sender);
        miningPool.updateReward(_recipient);
        return super.transfer(_recipient, _amount);
    }

    /*** VIEW ***/

    /**
     * @dev Check if an underlying is supported
     * @param _underlying Address of underlying token
     */
    function isUnderlyingSupported(address _underlying) public view returns (bool) {
        return underlyingToEarningPoolMap[_underlying] != address(0);
    }

    /**
     * @dev Get all supported underlyings
     * @return address[] List of address of supported underlying token
     */
    function getAllSupportedUnderlyings() public view returns (address[] memory) {
        return supportedUnderlyings;
    }

    /*** ADMIN ***/

    /**
     * @dev Set the miningRewardPool of this dToken
     * @param _miningPool Address of miningPool
     */
    function setMiningPool(address _miningPool)
        external
        onlyOwner
    {
        miningPool = MiningRewardPoolInterface(_miningPool);
    }

    /*** INTERNAL ***/

    function _mintInternal(address _underlying, uint _amount, address _beneficiary) internal {
        require(_amount > 0, "DTOKEN: mint must be greater than 0");
        require(isUnderlyingSupported(_underlying), "DTOKEN: mint underlying is not supported");

        // transfer underlying into dToken and deposit into earning pool
        EarningPoolInterface pool = EarningPoolInterface(underlyingToEarningPoolMap[_underlying]);
        IERC20(_underlying).safeTransferFrom(msg.sender, address(this), _amount);
        pool.deposit(_amount);

        // mint dToken
        uint mintAmount = _scaleTokenAmount(_underlying, _amount, address(this));
        _mint(_beneficiary, mintAmount);

        // check miningPool to update mining rewards
        if (address(miningPool) != address(0)) {
            miningPool.updateReward(_beneficiary);
        }
    }

    function _redeemInternal(address _underlying, uint _amount, address _beneficiary) internal {
        require(_amount > 0, "DTOKEN: redeem must be greater than 0");
        require(isUnderlyingSupported(_underlying), "DTOKEN: redeem underlying is not supported");

        // withdraw underlying from earning pool and transfer to user
        EarningPoolInterface pool = EarningPoolInterface(underlyingToEarningPoolMap[_underlying]);
        pool.withdraw(_amount);
        IERC20(_underlying).safeTransfer(_beneficiary, _amount);

        // burn dToken
        uint burnAmount = _scaleTokenAmount(_underlying, _amount, address(this));
        _burn(msg.sender, burnAmount);

        // check miningPool to update mining rewards
        if (address(miningPool) != address(0)) {
            miningPool.updateReward(msg.sender);
        }
    }

    /**
     * @dev Approve underlyings to earning pool
     * @param _underlying Address of underlying token
     * @param _pool Address of earning pool
     */
    function _approveUnderlyingToEarningPool(address _underlying, address _pool) internal {
        IERC20(_underlying).safeApprove(_pool, uint(-1));
    }

    /**
     * @dev Scale token amount from one decimal precision to another
     * @param _from Address of token to convert from
     * @param _fromAmount Amount of _from token
     * @param _to Address of token to convert to
     */
    function _scaleTokenAmount(address _from, uint _fromAmount, address _to) internal view returns (uint) {
        uint fromTokenDecimalPlace = uint(ERC20Detailed(_from).decimals());
        uint toTokenDecimalPlace = uint(ERC20Detailed(_to).decimals());
        uint toTokenAmount;
        uint scaleFactor;
        if (fromTokenDecimalPlace > toTokenDecimalPlace) {
            scaleFactor = fromTokenDecimalPlace.sub(toTokenDecimalPlace);
            toTokenAmount = _fromAmount.div(uint(10**scaleFactor)); // expect precision loss
        } else {
            scaleFactor = toTokenDecimalPlace.sub(fromTokenDecimalPlace);
            toTokenAmount = _fromAmount.mul(uint(10**(scaleFactor)));
        }
        return toTokenAmount;
    }
}
