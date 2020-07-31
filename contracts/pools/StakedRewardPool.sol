pragma solidity 0.5.16;

import "../externals/SafeERC20.sol";
import "../externals/ReentrancyGuard.sol";
import "../externals/IERC20.sol";

import "./abstract/RewardPool.sol";

/**
 * @title  StakedRewardPool
 * @notice RewardPool that track shares based on staking of a stakingToken
 */
contract StakedRewardPool is ReentrancyGuard, RewardPool {
    using SafeERC20 for IERC20;

    IERC20 public stakingToken;

    /**
     * @dev StakedRewardPool constructor
     * @param _stakingToken Token to be staked
     * @param _rewardToken The rewardToken
     * @param _rewardsPerBlock Reward distribution rate
     */
    constructor(
        address _stakingToken,
        address _rewardToken,
        uint256 _rewardsPerBlock
    )
        RewardPool (
            _rewardToken,
            _rewardsPerBlock
        )
        public
    {
        stakingToken = IERC20(_stakingToken);
    }

    /**
     * @dev Deposits a given amount of StakingToken from sender, increase beneficiary shares
     * @param _beneficiary Account to stake for
     * @param _amount Units of shares
     */
    function stake(address _beneficiary, uint256 _amount)
        external
        nonReentrant
    {
        stakingToken.safeTransferFrom(msg.sender, address(this), _amount);
        _increaseShares(_beneficiary, _amount);
    }

    /**
     * @dev Remove a given amount of shares from sender, decrease msg.sender shares
     * @param _amount Units of shares
     */
    function withdraw(uint256 _amount)
        external
        nonReentrant
    {
        stakingToken.safeTransfer(msg.sender, _amount);
        _decreaseShares(msg.sender, _amount);
    }
}
