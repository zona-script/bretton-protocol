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
        external
        returns (uint256)
    {
        uint256 rewardsToClaim = unclaimedRewards(_account);
        rewardsPerSharePaid[_account] = rewardsPerShare();
        rewardToken.safeTransfer(_account, rewardsToClaim);
        return rewardsToClaim;
    }

    /**
     * @dev Update rewards per share stored and last update block
     */
    function updateReward()
        external
    {
        rewardsPerShareStored = rewardsPerShare();
        totalRewardsIssuedStored = totalRewardsIssued();
        lastUpdateBlock = block.number;
    }

    /*** VIEW ***/

    /**
     * @dev Calculate latest rewardsPerShare
     *      rewards per share =
     * @return uint256 rewardsPerShare
     */
    function rewardsPerShare()
        public
        view
        returns (uint256)
    {
        uint256 blockDelta = block.number - lastUpdateBlock;
        uint256 newRewardsToDistribute = rewardsPerBlock.mul(blockDelta);

        // Check against initial case when pool does not have any shares
        if (totalShares() == 0) {
            return 0;
        }

        uint256 newRewardToDistributePerShare = newRewardsToDistribute.div(totalShares());
        return rewardsPerShareStored.add(newRewardToDistributePerShare);
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
     *      total rewards issued = current rewardsPerBlock
     * @return uint256 total rewards issued
     */
    function totalRewardsIssued()
        public
        view
        returns (uint256)
    {

    }

    /*** INTERNAL ***/

    /*** ADMIN ***/

    function withdrawUnissuedTokens(uint256 _amount)
        external
        onlyOwner
    {
        rewardToken.safeTransfer(owner(), _amount);
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
