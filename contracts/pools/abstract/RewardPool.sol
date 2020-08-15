pragma solidity 0.5.16;

import "../../externals/SafeMath.sol";
import "../../externals/SafeERC20.sol";
import "../../externals/IERC20.sol";
import "../../externals/Math.sol";

import "./Pool.sol";
import "./RewardDistributionRecipient.sol";

/**
 * @title  RewardPool
 * @author Originally: Synthetix (forked from /Synthetixio/synthetix/contracts/StakingRewards.sol)
 *         Audit: https://github.com/sigp/public-audits/blob/master/synthetix/unipool/review.pdf
 * @notice Rewards share holders with RewardToken, on a pro-rata basis
 */
contract RewardPool is Pool, RewardDistributionRecipient {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    IERC20 public rewardToken;

    uint256 public DURATION;
    uint256 public periodFinish = 0;
    uint256 public rewardPerSecond = 0;
    uint256 public lastUpdateTime;
    uint256 public rewardPerShareStored;
    mapping(address => uint256) public userRewardPerSharePaid;
    mapping(address => uint256) public rewards;

    event RewardAdded(uint256 amount);
    event RewardPaid(address indexed user, uint256 amount);

    /**
     * @dev RewardPool constructor
     * @param _DURATION The duration of each reward period
     * @param _rewardToken The rewardToken
     */
    constructor (
        uint256 _DURATION,
        address _rewardToken
    )
        RewardDistributionRecipient(msg.sender)
        internal
    {
        DURATION = _DURATION;
        rewardToken = IERC20(_rewardToken);
    }

    /** @dev Updates the reward for a given address, before executing function */
    modifier updateReward(address _account) {
        // Setting of global vars
        uint256 newRewardPerShare = rewardPerShare();
        // If statement protects against loss in initialisation case
        if(newRewardPerShare > 0) {
            rewardPerShareStored = newRewardPerShare;
            lastUpdateTime = lastTimeRewardApplicable();
            // Setting of personal vars based on new globals
            if (_account != address(0)) {
                rewards[_account] = earned(_account);
                userRewardPerSharePaid[_account] = newRewardPerShare;
            }
        }
        _;
    }

    /*** PUBLIC FUNCTIONS ***/

    /**
     * @dev Claim outstanding rewards for sender
     * @return uint256 amount claimed
     */
    function claim()
        public
        updateReward(msg.sender)
    {
        uint256 reward = earned(msg.sender);
        if (reward > 0) {
            rewards[msg.sender] = 0;
            rewardToken.transfer(msg.sender, reward);
            emit RewardPaid(msg.sender, reward);
        }
    }

    /*** VIEW ***/

    /**
     * @dev Get current block timestamp. For easy mocking in test
     */
    function getCurrentTimestamp()
        public
        view
        returns (uint256)
    {
        return block.timestamp;
    }

    /**
     * @dev Gets the last applicable timestamp for this reward period
     */
    function lastTimeRewardApplicable()
        public
        view
        returns (uint256)
    {
        return Math.min(getCurrentTimestamp(), periodFinish);
    }

    /**
     * @dev Calculate rewardsPerShare
     * @return uint256 rewardsPerShare
     */
    function rewardPerShare()
        public
        view
        returns (uint256)
    {
        if (totalShares() == 0) {
            return rewardPerShareStored;
        }
        return rewardPerShareStored.add(
          lastTimeRewardApplicable()
          .sub(lastUpdateTime)
          .mul(rewardPerSecond)
          .mul(1e18)
          .div(totalShares())
          );
    }

    /**
     * @dev Calculates the amount of rewards earned for a given account
     * @param _account User for which calculate earned rewards for
     * @return uint256 Earned rewards
     */
    function earned(address _account)
        public
        view
        returns (uint256)
    {
        return sharesOf(_account)
               .mul(rewardPerShare().sub(userRewardPerSharePaid[_account]))
               .div(1e18)
               .add(rewards[_account]);
    }

    /*** ADMIN ***/

    /**
     * @dev Notifies the contract that new rewards have been added.
     * Calculates an updated rewardPerSecond based on the rewards in period.
     * @param _reward Units of RewardToken that have been added to the pool
     */
    function notifyRewardAmount(uint256 _reward)
        external
        onlyRewardDistributor
        updateReward(address(0))
    {
        uint256 currentTime = getCurrentTimestamp();
        // If previous period over, reset rewardPerSecond
        if (currentTime >= periodFinish) {
            rewardPerSecond = _reward.div(DURATION);
        }
        // If additional reward to existing period, calc sum
        else {
            uint256 remaining = periodFinish.sub(currentTime);
            uint256 leftover = remaining.mul(rewardPerSecond);
            rewardPerSecond = _reward.add(leftover).div(DURATION);
        }

        lastUpdateTime = currentTime;
        periodFinish = currentTime.add(DURATION);

        emit RewardAdded(_reward);
    }

    /*** INTERNAL ***/

    /**
     * @dev Add a given amount of shares to a given account
     * @param _account Account to increase shares for
     * @param _amount Units of shares
     */
    function _mintShares(address _account, uint256 _amount)
        internal
        updateReward(_account)
    {
        require(_amount > 0, "REWARD_POOL: cannot mint 0 shares");
        _increaseShares(_account, _amount);
    }

    /**
     * @dev Remove a given amount of shares from a given account
     * @param _account Account to decrease shares for
     * @param _amount Units of shares
     */
    function _burnShares(address _account, uint256 _amount)
        internal
        updateReward(_account)
    {
        require(_amount > 0, "REWARD_POOL: cannot burn 0 shares");
        _decreaseShares(_account, _amount);
    }
}
