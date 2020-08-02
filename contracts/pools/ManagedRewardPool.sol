pragma solidity 0.5.16;

import "../externals/SafeMath.sol";
import "../externals/SafeERC20.sol";
import "../externals/IERC20.sol";

import "./abstract/RewardPool.sol";

/*
 * @title  ManagedRewardPool
 * @notice RewardPool with shares governed by a pool manager
 */
contract ManagedRewardPool is RewardPool {
    using SafeERC20 for IERC20;

    mapping (address => bool) public isManager;

    /**
     * @dev ManagedRewardPool constructor
     * @param _rewardToken The rewardToken
     * @param _rewardsPerBlock Reward distribution rate
     */
    constructor(
        address _rewardToken,
        uint256 _rewardsPerBlock
    )
        RewardPool (
            _rewardToken,
            _rewardsPerBlock
        )
        public
    {

    }

    modifier onlyManager() {
        require(isManager[msg.sender], "MINING_REWARD_POOL: caller is not a pool manager");
        _;
    }

    /*** MANAGER ***/

    /**
     * @dev Increase account shares
     * @param _account Account to increase share for
     * @param _amount Units of shares
     */
    function increaseShares(address _account, uint256 _amount)
        external
        onlyManager
    {
        _increaseShares(_account, _amount);
        updateReward();
    }

    /**
     * @dev Decrease account shares
     * @param _account Account to decrease share for
     * @param _amount Units of shares
     */
    function decreaseShares(address _account, uint256 _amount)
        external
        onlyManager
    {
        _decreaseShares(_account, _amount);
        updateReward();
    }

    /*** ADMIN ***/

    /**
     * @dev Promote a manager
     * @param _address Address to promote
     */
    function promote(address _address)
        external
        onlyOwner
    {
        isManager[_address] = true;
    }

    /**
     * @dev Demote a manager
     * @param _address Address to demote
     */
    function demote(address _address)
        external
        onlyOwner
    {
        isManager[_address] = false;
    }
}
