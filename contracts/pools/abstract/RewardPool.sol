pragma solidity 0.5.16;

import "../../externals/SafeMath.sol";
import "../../externals/SafeERC20.sol";
import "../../externals/ReentrancyGuard.sol";
import "../../externals/Ownable.sol";
import "../../externals/IERC20.sol";

import "./Pool.sol";

/**
 * @title  RewardPool
 * @notice Abstract pool to evenly distribute a rewardTokens to pool shareholders at a fixed per block rate
 */
contract RewardPool is ReentrancyGuard, Ownable, Pool {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    IERC20 public rewardToken;

    // Amount of rewardToken to distribute to all shareholders per block
    uint256 public rewardsPerBlock;

    // The rewardsPerShare rate based on last update
    uint256 public rewardsPerShareStored;

    // The rewardsPerShare already paided out to a given user
    mapping(address => uint256) public rewardsPerSharePaid;

    // The rewards unclaimed for an account based on last update
    mapping(address => uint256) public rewardUnclaimedStored;

    // Block of which rewardsPerShareStored was updated last
    uint256 public lastUpdateBlock = 0;

    uint256 public totalRewardsClaimed;

    event RewardPaid(address indexed user, uint256 reward);

    /**
     * @dev RewardPool constructor
     * @param _rewardToken The rewardToken
     * @param _rewardsPerBlock Reward distribution rate
     */
    constructor (
        address _rewardToken,
        uint256 _rewardsPerBlock
    )
        Pool ()
        internal
    {
        rewardToken = IERC20(_rewardToken);
        rewardsPerBlock = _rewardsPerBlock;
        // mining rewards starts accumulate on the block miningPool was deployed
        lastUpdateBlock = getBlockNumber();
    }

    /*** PUBLIC FUNCTIONS ***/

    /**
     * @dev Update rewards per share stored and last update block
     *      MUST be called on every shares change
     */
    function updateReward(address _account)
        public
    {
        uint256 newRewardPerShare = rewardsPerShare();

        if (newRewardPerShare > 0) {
            rewardsPerShareStored = newRewardPerShare;
            lastUpdateBlock = getBlockNumber();

            // Record unclaimed rewards for account and mark as paid
            rewardUnclaimedStored[_account] = unclaimedRewards(_account);
            rewardsPerSharePaid[_account] = newRewardPerShare;
        }
    }

    /**
     * @dev Claim outstanding rewards for a given account
     * First updates outstanding reward allocation and then transfers.
     * @param _account User for which to claim rewards for
     * @return uint256 amount claimed
     */
    function claim(address _account)
        internal
        returns (uint256)
    {
        updateReward(_account);
        uint256 rewardsToClaim = rewardUnclaimedStored[_account];

        if (rewardsToClaim > 0 && rewardsToClaim <= rewardToken.balanceOf(address(this))) {
            rewardUnclaimedStored[_account] = 0;
            rewardToken.safeTransfer(_account, rewardsToClaim);

            // increment total claimed
            totalRewardsClaimed = totalRewardsClaimed.add(rewardsToClaim);

            emit RewardPaid(_account, rewardsToClaim);

            return rewardsToClaim;
        }

        return 0;
    }

    /*** VIEW ***/

    /**
     * @dev Calculate rewards available in pool to be issued
     *      rewardsAvailable = max(current balance - total claimed, 0)
     * @return uint256 Amount of rewards available
     */
    function rewardsAvailableToIssue()
        public
        view
        returns (uint256)
    {
        if (rewardToken.balanceOf(address(this)) >= totalRewardsClaimed) {
            return rewardToken.balanceOf(address(this)).sub(totalRewardsClaimed);
        } else {
            return 0;
        }
    }

    /**
     * @dev Calculate latest rewardsPerShare
     *      rewards per share = last updates rewards per share + rewards per block * num of block since last update / total shares
     * @return uint256 rewardsPerShare
     */
    function rewardsPerShare()
        public
        view
        returns (uint256)
    {
        // If there is no shares, avoid div(0)
        uint256 totalShares = totalShares();
        if (totalShares == 0) {
            return rewardsPerShareStored;
        }

        uint256 newRewardsToIssue = rewardsPerBlock.mul(blockSinceLastUpdate());
        uint256 rewardsAvailable = rewardsAvailableToIssue();
        uint256 actualRewardsToIssue = newRewardsToIssue > rewardsAvailable ? rewardsAvailable : newRewardsToIssue;
        uint256 newRewardToIssuePerShare = actualRewardsToIssue.mul(1e18).div(totalShares);
        return rewardsPerShareStored.add(newRewardToIssuePerShare);
    }

    /**
     * @dev Calculates the amount of unclaimed rewards for a given account
     *      unclaimed = (rewards per share - rewards per share already paid to user) * shares of user
     * @param _account User for which calculate unclaimed rewards for
     * @return uint256 Unclaimed rewards
     */
    function unclaimedRewards(address _account)
        public
        view
        returns (uint256)
    {
        uint256 unclaimedRewardsPerShare = rewardsPerShare().sub(rewardsPerSharePaid[_account]);
        uint256 userNewReward = unclaimedRewardsPerShare.mul(sharesOf(_account)).div(1e18);
        return rewardUnclaimedStored[_account].add(userNewReward);
    }

    /**
     * @dev Wrapper for block.number for easy mocking in tests
     * @return uint256 Block number
     */
    function getBlockNumber()
        public
        view
        returns (uint256)
    {
        return block.number;
    }

    /**
     * @dev Block since last update
     * @return uint256 Block number
     */
    function blockSinceLastUpdate()
        public
        view
        returns (uint256)
    {
        return getBlockNumber().sub(lastUpdateBlock);
    }

    /*** ADMIN ***/

    /**
     * @dev Withdraw unissued rewards from pool
     */
    function withdrawRemainingRewards()
        external
        onlyOwner
    {
        rewardToken.safeTransfer(owner(), rewardToken.balanceOf(address(this)));
    }

    /**
     * @dev Set the rewards per block rate
     * @param _newRewardsPerBlock new rewards per block
     */
    function setRewardsPerBlock(uint256 _newRewardsPerBlock)
        external
        onlyOwner
    {
        rewardsPerBlock = _newRewardsPerBlock;
    }
}
