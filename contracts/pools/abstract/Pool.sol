pragma solidity 0.5.16;

import "../../externals/SafeMath.sol";
import "../../externals/SafeERC20.sol";
import "../../externals/IERC20.sol";

/*
 * @title  Pool
 * @notice Abstract pool to facilitate tracking of shares in a pool
 */
contract Pool {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    uint256 private _totalShares;
    mapping(address => uint256) private _shares;

    /**
     * @dev Pool constructor
     */
    constructor() internal {
    }

    /**
     * @dev Get the total number of shares in pool
     * @return uint256 total shares
     */
    function totalShares()
        public
        view
        returns (uint256)
    {
        return _totalShares;
    }

    /**
     * @dev Get the share of a given account
     * @param _account User for which to retrieve balance
     * @return uint256 shares
     */
    function sharesOf(address _account)
        public
        view
        returns (uint256)
    {
        return _shares[_account];
    }

    /**
     * @dev Add a given amount of shares to a given account
     * @param _account Account to increase shares for
     * @param _amount Units of shares
     */
    function _increaseShares(address _account, uint256 _amount)
        internal
    {
        _totalShares = _totalShares.add(_amount);
        _shares[_account] = _shares[_account].add(_amount);
    }

    /**
     * @dev Remove a given amount of shares from a given account
     * @param _account Account to decrease shares for
     * @param _amount Units of shares
     */
    function _decreaseShares(address _account, uint256 _amount)
        internal
    {
        _totalShares = _totalShares.sub(_amount);
        _shares[_account] = _shares[_account].sub(_amount);
    }
}
