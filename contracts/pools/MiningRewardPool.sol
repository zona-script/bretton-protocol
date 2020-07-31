pragma solidity 0.5.16;

import "../externals/SafeMath.sol";
import "../externals/SafeERC20.sol";
import "../externals/IERC20.sol";

import "./abstract/RewardPool.sol";

/*
 * @title  MiningRewardPool
 * @notice RewardPool with shares governed by a shares manager
 */
contract MiningRewardPool is RewardPool {
    using SafeERC20 for IERC20;

    mapping (address => bool) public isSharesManager;

    /**
     * @dev MinigRewardPool constructor
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

    modifier onlySharesManager() {
        require(isSharesManager[msg.sender], "MINING_REWARD_POOL: caller is not shares manager");
        _;
    }

    /*** SHARES MANAGER ***/

    /**
     * @dev Increase account shares
     * @param _account Account to increase share for
     * @param _amount Units of shares
     */
    function increaseShares(address _account, uint256 _amount)
        external
        onlySharesManager
    {
        _increaseShares(_account, _amount);
    }

    /**
     * @dev Decrease account shares
     * @param _account Account to decrease share for
     * @param _amount Units of shares
     */
    function decreaseShares(address _account, uint256 _amount)
        external
        onlySharesManager
    {
        _decreaseShares(_account, _amount);
    }

    /*** ADMIN ***/

    /**
     * @dev Promote a shares manager
     * @param _address Address to promote
     */
    function promote(address _address)
        external
        onlyOwner
    {
        isSharesManager[_address] = true;
    }

    /**
     * @dev Demote a shares manager
     * @param _address Address to demote
     */
    function demote(address _address)
        external
        onlyOwner
    {
        isSharesManager[_address] = false;
    }
}
