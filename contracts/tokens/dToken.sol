pragma solidity 0.5.16;

import "../externals/SafeMath.sol";
import "../externals/Address.sol";
import "../externals/SafeERC20.sol";
import "../externals/ReentrancyGuard.sol";
import "../externals/IERC20.sol";
import "../externals/ERC20.sol";
import "../externals/ERC20Detailed.sol";

import "../interfaces/dPoolInterface.sol";

/**
 * @title dToken
 * @dev dToken are collateralized assets pegged to a specific value.
        Collaterals are dPool tokens
 */
contract dToken is ERC20, ERC20Detailed, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using Address for address;
    using SafeMath for uint256;

    mapping(address => address) public underlyingToDPoolMap;
    address[] public supportedUnderlyings;

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
    }

    /*** External Functions ***/

    // mint dToken using _amount of _underlying
    // _underlying = address of underlying token
    // _amount = amount of underlying deposited for minting dToken
    function mint(
        address _underlying,
        uint _amount
    )
        external
        nonReentrant
    {
        require(_amount > 0, "DTOKEN: mint must be greater than 0");
        require(isUnderlyingSupported(_underlying), "DTOKEN: mint underlying is not supported");

        // check risk manager

        // transfer underlying into dToken and deposit into dPool
        dPoolInterface pool = dPoolInterface(underlyingToDPoolMap[_underlying]);
        IERC20(_underlying).safeTransferFrom(msg.sender, address(this), _amount);
        pool.deposit(_amount);

        // check mining manager to register mint rewards

        // mint dToken
        uint mintAmount = _convertToDToken(_underlying, _amount);
        _mint(msg.sender, mintAmount);
    }

    // redeem _amount of dToken into _underlying
    // _underlying = address of underlying token
    // _amount = amount of dToken to redeem
    function redeem(
        address _underlying,
        uint _amount
    )
        external
        nonReentrant
    {
        require(_amount > 0, "DTOKEN: redeem must be greater than 0");
        require(isUnderlyingSupported(_underlying), "DTOKEN: redeem underlying is not supported");

        // check risk manager

        // withdraw underlying from dPool and transfer to user
        dPoolInterface pool = dPoolInterface(underlyingToDPoolMap[_underlying]);
        pool.withdraw(_amount);
        IERC20(_underlying).safeTransfer(msg.sender, _amount);

        // check mining manager to register mint rewards

        // burn dToken
        uint burnAmount = _convertToDToken(_underlying, _amount);
        _burn(msg.sender, burnAmount);
    }

    function isUnderlyingSupported(address _underlying) public view returns (bool) {
        return underlyingToDPoolMap[_underlying] != address(0);
    }

    function getAllSupportedUnderlyings() public view returns (address[] memory) {
        return supportedUnderlyings;
    }

    /*** INTERNAL FUNCTIONS ***/

    // aprove underlying token to pool
    function _approveUnderlyingToPool(address _underlying, address _pool) internal {
        IERC20(_underlying).safeApprove(_pool, uint(-1));
    }

    function _convertToDToken(address _underlying, uint _underlyingAmount) internal returns (uint) {
        uint underlyingDecimalPlace = uint(ERC20Detailed(_underlying).decimals());
        uint dTokenAmount;
        // expect underlying to have less or equal decimals than dToken
        dTokenAmount = uint(10**(uint(18).sub(underlyingDecimalPlace))).mul(_underlyingAmount);
        return dTokenAmount;
    }
}
