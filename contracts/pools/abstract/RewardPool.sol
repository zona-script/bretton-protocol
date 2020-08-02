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

    // NOTE: We assume rewardToken and pool shares have the same decimal precision
    IERC20 public rewardToken;

    // Amount of rewardToken to distribute to all shareholders per block
    uint256 public rewardsPerBlock;

    // The rewardsPerShare rate based on last update
    uint256 public rewardsPerShareStored;

    // The rewardsPerShare already paided out to a given user
    mapping(address => uint256) public rewardsPerSharePaid;

    // The total rewards issued based on last update
    uint256 public totalRewardsIssuedStored;

    // Block of which rewardsPerShareStored was updated last
    uint256 public lastUpdateBlock;

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
        lastUpdateBlock = block.number;
    }

    /*** PUBLIC FUNCTIONS ***/

    /**
     * @dev Claim outstanding rewards for a given account
     * @param _account User for which to claim rewards for
     * @return uint256 amount claimed
     */
    function claim(address _account)
        public
        returns (uint256)
    {
        uint256 rewardsToClaim = unclaimedRewards(_account);
        rewardsPerSharePaid[_account] = rewardsPerShare();
        rewardToken.safeTransfer(_account, rewardsToClaim);

        emit RewardPaid(_account, rewardsToClaim);

        return rewardsToClaim;
    }

    /**
     * @dev Update rewards per share stored and last update block
     *      Called on every shares change
     */
    function updateReward()
        public
    {
        rewardsPerShareStored = rewardsPerShare();
        totalRewardsIssuedStored = totalRewardsIssued();
        lastUpdateBlock = block.number;
    }

    /*** VIEW ***/

    /**
     * @dev Calculate rewards available in pool to be issued
     *      rewards available to issue = max(pool reward balance - total rewards issued, 0)
     * @return uint256 rewardsAvailableToIssue
     */
    function rewardsAvailableToIssue()
        public
        view
        returns (uint256)
    {
        return rewardToken.balanceOf(address(this)) > totalRewardsIssued() ? rewardToken.balanceOf(address(this)).sub(totalRewardsIssued()) : 0;
    }

    /**
     * @dev Calculate latest rewardsPerShare
     *      rewards per share = last updates rewards per share + min(rewards per block * num of block since last update, balance of reward left in pool) / total shares
     * @return uint256 rewardsPerShare
     */
    function rewardsPerShare()
        public
        view
        returns (uint256)
    {
        // Check against initial case when pool does not have any shares
        if (totalShares() == 0) {
            return 0;
        }

        uint256 blockDelta = block.number - lastUpdateBlock;
        uint256 rewardsShouldIssue = rewardsPerBlock.mul(blockDelta);
        uint256 rewardsAvailable = rewardsAvailableToIssue();
        // rewards to distributed = min(rewardsShouldIssue, rewardsAvailable)
        uint256 newRewardsToIssue = rewardsShouldIssue > rewardsAvailable ? rewardsAvailable : rewardsShouldIssue;

        uint256 newRewardToIssuePerShare = newRewardsToIssue.div(totalShares());
        return rewardsPerShareStored.add(newRewardToIssuePerShare);
    }

    /**
     * @dev Calculates the amount of unclaimed rewards for a given account
     *      unclaimed = (rewards per share - rewards per share already paid to user) * shares of user
     * @param _account User for which calculate unclaimed rewards for
     * @return uint256 unclaimed rewards
     */
    function unclaimedRewards(address _account)
        public
        view
        returns (uint256)
    {
        uint256 unclaimedRewardsPerShare = rewardsPerShare().sub(rewardsPerSharePaid[_account]);
        return unclaimedRewardsPerShare.mul(sharesOf(_account));
    }

    /**
     * @dev Calculates the total amount of rewards issued so far
     *      total rewards issued = rewards issued stored + current rewardsPerBlock * block delta
     * @return uint256 total rewards issued
     */
    function totalRewardsIssued()
        public
        view
        returns (uint256)
    {
        uint256 blockDelta = block.number - lastUpdateBlock;
        return totalRewardsIssuedStored.add(rewardsPerBlock.mul(blockDelta));
    }

    /*** INTERNAL ***/

    /*** ADMIN ***/

    /**
     * @dev Withdraw unissued rewards from pool
     */
    function withdrawUnissuedRewards()
        external
        onlyOwner
    {
        rewardToken.safeTransfer(owner(), rewardsAvailableToIssue());
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
