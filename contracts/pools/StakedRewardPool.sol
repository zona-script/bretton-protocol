pragma solidity 0.5.16;

import "../externals/SafeERC20.sol";
import "../externals/IERC20.sol";

import "./abstract/RewardPool.sol";

/**
 * @title  StakedRewardPool
 * @notice RewardPool that track shares based on staking of a stakingToken
 */
contract StakedRewardPool is RewardPool {
    using SafeERC20 for IERC20;

    IERC20 public stakingToken;

    event Staked(address indexed beneficiary, uint256 amount, address payer);
    event Withdrawn(address indexed beneficiary, uint256 amount, address payer);

    /**
     * @dev StakedRewardPool constructor
     * @param _stakingToken Token to be staked
     */
    constructor(
        address _stakingToken,
        uint256 _DURATION,
        address _rewardToken
    )
        RewardPool (
            _DURATION,
            _rewardToken
        )
        public
    {
        stakingToken = IERC20(_stakingToken);
    }

    /*** PUBLIC ***/

    /**
     * @dev Deposits a given amount of StakingToken from sender, increase beneficiary shares
     * @param _beneficiary Account to stake for
     * @param _amount Units of shares
     */
    function stake(address _beneficiary, uint256 _amount)
        public
    {
        stakingToken.safeTransferFrom(msg.sender, address(this), _amount);
        _mintShares(_beneficiary, _amount);

        emit Staked(_beneficiary, _amount, msg.sender);
    }

    /**
     * @dev Remove a given amount of shares from sender, decrease msg.sender shares
     * @param _beneficiary Account to withdraw to
     * @param _amount Units of shares
     */
    function withdraw(address _beneficiary, uint256 _amount)
        public
    {
        require(sharesOf(msg.sender) >= _amount, "STAKED_REWARD_POOL: withdraw insufficient stake");
        _burnShares(msg.sender, _amount);
        stakingToken.safeTransfer(_beneficiary, _amount);

        emit Withdrawn(_beneficiary, _amount, msg.sender);
    }

    /**
     * @dev Withdraws stake from pool and claims any rewards
     */
    function exit()
        external
    {
        withdraw(msg.sender, sharesOf(msg.sender));
        claim();
    }
}
