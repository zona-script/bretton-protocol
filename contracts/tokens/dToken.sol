pragma solidity 0.5.16;

import "../externals/SafeMath.sol";
import "../externals/SafeERC20.sol";
import "../externals/ReentrancyGuard.sol";
import "../externals/Ownable.sol";
import "../externals/IERC20.sol";
import "../externals/ERC20.sol";
import "../externals/ERC20Detailed.sol";

import "../interfaces/dPoolInterface.sol";
import "../interfaces/MineInterface.sol";

/**
 * @title dToken
 * @dev dToken are collateralized assets pegged to a specific value.
        Collaterals are dPool tokens
 */
contract dToken is ERC20, ERC20Detailed, ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    mapping(address => address) public underlyingToDPoolMap;
    address[] public supportedUnderlyings;

    MineInterface public mine;

    constructor (
        string memory _name,
        string memory _symbol,
        uint8 _decimals,
        address[] memory _underlyings,
        address[] memory _dPools
    )
        ERC20Detailed(_name, _symbol, _decimals)
        public
    {
        for (uint i=0; i<_underlyings.length; i++) {
            underlyingToDPoolMap[_underlyings[i]] = _dPools[i];
            supportedUnderlyings.push(_underlyings[i]);
            _approveUnderlyingToPool(_underlyings[i], _dPools[i]);
        }

        mine = MineInterface(0); // initialize to address 0
    }

    /*** External Functions ***/

    // mint dToken using _amount of _underlying
    // _underlying = address of underlying token
    // _amount = amount of underlying deposited for minting dToken
    function mint(
        address _underlying,
        uint _amount
    )
        public
        nonReentrant
    {
        _mintInternal(_underlying, _amount);
    }

    // redeem _amount of dToken into _underlying
    // _underlying = address of underlying token
    // _amount = amount of underlying to redeem
    function redeem(
        address _underlying,
        uint _amount
    )
        public
        nonReentrant
    {
        _redeemInternal(_underlying, _amount);
    }

    // swap _amountFrom of _underlyingFrom to _underlyingTo
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
        dPoolInterface pool = dPoolInterface(underlyingToDPoolMap[_underlyingTo]);
        uint amountTo = _scaleTokenAmount(_underlyingFrom, _amountFrom, _underlyingTo);
        require(pool.calcPoolValueInUnderlying() >= amountTo, "DTOKEN: insufficient underlyingTo for swap");

        // mint with _underlyingFrom
        _mintInternal(_underlyingFrom, _amountFrom);

        // redeem to _underlyingTo
        _redeemInternal(_underlyingTo, amountTo);
    }

    function isUnderlyingSupported(address _underlying) public view returns (bool) {
        return underlyingToDPoolMap[_underlying] != address(0);
    }

    function getAllSupportedUnderlyings() public view returns (address[] memory) {
        return supportedUnderlyings;
    }

    /*** INTERNAL FUNCTIONS ***/

    function _mintInternal(address _underlying, uint _amount) internal {
        require(_amount > 0, "DTOKEN: mint must be greater than 0");
        require(isUnderlyingSupported(_underlying), "DTOKEN: mint underlying is not supported");

        // check risk manager

        // transfer underlying into dToken and deposit into dPool
        dPoolInterface pool = dPoolInterface(underlyingToDPoolMap[_underlying]);
        IERC20(_underlying).safeTransferFrom(msg.sender, address(this), _amount);
        pool.deposit(_amount);

        // mint dToken
        uint mintAmount = _scaleTokenAmount(_underlying, _amount, address(this));
        _mint(msg.sender, mintAmount);

        // check mine to update mining rewards
        if (address(mine) != address(0)) {
            mine.updateReward();
        }
    }

    function _redeemInternal(address _underlying, uint _amount) internal {
        require(_amount > 0, "DTOKEN: redeem must be greater than 0");
        require(isUnderlyingSupported(_underlying), "DTOKEN: redeem underlying is not supported");

        // check risk manager

        // withdraw underlying from dPool and transfer to user
        dPoolInterface pool = dPoolInterface(underlyingToDPoolMap[_underlying]);
        pool.withdraw(_amount);
        IERC20(_underlying).safeTransfer(msg.sender, _amount);

        // burn dToken
        uint burnAmount = _scaleTokenAmount(_underlying, _amount, address(this));
        _burn(msg.sender, burnAmount);

        // check mine to update mining rewards
        if (address(mine) != address(0)) {
            mine.updateReward();
        }
    }

    // aprove underlying token to pool
    function _approveUnderlyingToPool(address _underlying, address _pool) internal {
        IERC20(_underlying).safeApprove(_pool, uint(-1));
    }

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

    /*** ADMIN ***/

    function setMine(MineInterface _mine)
        external
        onlyOwner
    {
        mine = _mine;
    }
}
