pragma solidity 0.5.16;

import "../externals/SafeMath.sol";
import "../externals/SafeERC20.sol";
import "../externals/ReentrancyGuard.sol";
import "../externals/Ownable.sol";
import "../externals/IERC20.sol";
import "../externals/ERC20.sol";
import "../externals/ERC20Detailed.sol";

import "../interfaces/EarningPoolInterface.sol";
import "../interfaces/ManagedRewardPoolInterface.sol";

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

    ManagedRewardPoolInterface public managedRewardPool;

    event Minted(address indexed user, address indexed underlying, uint256 amount);
    event Redeemed(address indexed user, address indexed underlying, uint256 amount);
    event Swapped(address indexed user, address indexed underlyingFrom, uint256 amountFrom, address indexed underlyingTo, uint256 amountTo);
    event EarningPoolAdded(address indexed earningPool, address indexed underlying);

    /**
     * @dev dToken constructor
     * @param _name Name of dToken
     * @param _symbol Symbol of dToken
     * @param _decimals Decimal place of dToken
     * @param _earningPools List of earning pools to supply underlying token to
     */
    constructor (
        string memory _name,
        string memory _symbol,
        uint8 _decimals,
        address[] memory _earningPools
    )
        ERC20Detailed(_name, _symbol, _decimals)
        public
    {
        for (uint i=0; i<_earningPools.length; i++) {
            _addEarningPool(_earningPools[i]);
        }

        managedRewardPool = ManagedRewardPoolInterface(0); // initialize to address 0
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
        _mintInternal(_underlying, _amount);
        emit Minted(msg.sender, _underlying, _amount);
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
        _redeemInternal(_underlying, _amount);
        emit Redeemed(msg.sender, _underlying, _amount);
    }

    /**
     * @dev Swap from one underlying to another
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
        require(isUnderlyingSupported(_underlyingFrom), "DTOKEN: swap underlyingFrom is not supported");
        require(isUnderlyingSupported(_underlyingTo), "DTOKEN: swap underlyingTo is not supported");

        // check if there is sufficient underlyingTo to swap
        // currently there are no exchange rate between underlyings as only stable coins are supported
        EarningPoolInterface pool = EarningPoolInterface(underlyingToEarningPoolMap[_underlyingTo]);
        uint amountTo = _scaleTokenAmount(_underlyingFrom, _amountFrom, _underlyingTo);
        require(pool.calcPoolValueInUnderlying() >= amountTo, "DTOKEN: insufficient underlyingTo for swap");

        // mint with _underlyingFrom
        _mintInternal(_underlyingFrom, _amountFrom);

        // redeem to _underlyingTo
        _redeemInternal(_underlyingTo, amountTo);

        emit Swapped(msg.sender, _underlyingFrom, _amountFrom, _underlyingTo, amountTo);
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
        managedRewardPool.burnShares(msg.sender, _amount);
        managedRewardPool.mintShares(_recipient, _amount);
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
     * @dev Get corresponding earning pool address of underlying
     * @param _underlying Address of underlying token
     */
    function getUnderlyingEarningPool(address _underlying) public view returns (address) {
        return underlyingToEarningPoolMap[_underlying];
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
     * @dev Set the managedRewardPool of this dToken
     * @param _managedRewardPool Address of reward pool
     */
    function setRewardPoolAddress(address _managedRewardPool)
        external
        onlyOwner
    {
        require(address(managedRewardPool) == address(0), "DTOKEN: cannot reset mining pool address");
        managedRewardPool = ManagedRewardPoolInterface(_managedRewardPool);
    }

    /**
     * @dev Add earning pool to dToken
     * @param _earningPool Address of earning pool
     */
    function addEarningPool(address _earningPool)
        external
        onlyOwner
    {
        _addEarningPool(_earningPool);
    }

    /*** INTERNAL ***/

    function _mintInternal(address _underlying, uint _amount) internal {
        require(_amount > 0, "DTOKEN: mint must be greater than 0");
        require(isUnderlyingSupported(_underlying), "DTOKEN: mint underlying is not supported");

        // transfer underlying into dToken and deposit into earning pool
        EarningPoolInterface pool = EarningPoolInterface(underlyingToEarningPoolMap[_underlying]);
        IERC20(_underlying).safeTransferFrom(msg.sender, address(this), _amount);
        pool.deposit(address(this), _amount);

        // mint dToken
        uint mintAmount = _scaleTokenAmount(_underlying, _amount, address(this));
        _mint(msg.sender, mintAmount);

        // mint shares in managedRewardPool
        if (address(managedRewardPool) != address(0)) {
            managedRewardPool.mintShares(msg.sender, _amount);
        }
    }

    function _redeemInternal(address _underlying, uint _amount) internal {
        require(_amount > 0, "DTOKEN: redeem must be greater than 0");
        require(isUnderlyingSupported(_underlying), "DTOKEN: redeem underlying is not supported");

        // burn dToken
        uint burnAmount = _scaleTokenAmount(_underlying, _amount, address(this));
        _burn(msg.sender, burnAmount);

        // withdraw underlying from earning pool and transfer to user
        EarningPoolInterface pool = EarningPoolInterface(underlyingToEarningPoolMap[_underlying]);
        pool.withdraw(address(this), _amount);
        IERC20(_underlying).safeTransfer(msg.sender, _amount);

        // burn shares from managedRewardPool
        if (address(managedRewardPool) != address(0)) {
            managedRewardPool.burnShares(msg.sender, _amount);
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

    /**
     * @dev Add earning pool to dToken
     * @param _earningPool Address of earning pool
     */
    function _addEarningPool(address _earningPool)
        internal
    {
        EarningPoolInterface pool = EarningPoolInterface(_earningPool);

        underlyingToEarningPoolMap[pool.underlyingToken()] = _earningPool;
        supportedUnderlyings.push(pool.underlyingToken());
        _approveUnderlyingToEarningPool(pool.underlyingToken(), _earningPool);

        emit EarningPoolAdded(_earningPool, pool.underlyingToken());
    }
}
