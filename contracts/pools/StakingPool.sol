pragma solidity 0.5.16;

import "../externals/SafeMath.sol";
import "../externals/SafeERC20.sol";
import "../externals/ReentrancyGuard.sol";
import "../externals/Ownable.sol";
import "../externals/IERC20.sol";
import "../externals/ERC20.sol";
import "../externals/ERC20Detailed.sol";

import "../interfaces/dPoolInterface.sol";

/**
 * @title StakingPool
 * @author Originally: Synthetix (forked from /Synthetixio/synthetix/contracts/StakingRewards.sol)
 *         Audit: https://github.com/sigp/public-audits/blob/master/synthetix/unipool/review.pdf
 *         Changes by: Stability Labs Pty. Ltd.
 * @notice Rewards stakers of a given LP token (a.k.a StakingToken) with RewardsToken, on a pro-rata basis
 * @dev    Uses an ever increasing 'rewardPerTokenStored' variable to distribute rewards
 *         Changes:
 *           - Cosmetic (comments, readability)
 *           - Expand to multiple reward tokens
 *           - Allow adding and removing earning pools

        Calculating earnings for an account:

        REWARD_PERIOD - a period of time where all outstanding rewards are distributed to stakers within that period
        rewardPeriodEnd - timestamp for current reward period's end


        rewardPerStake() - calculate new rewardPerStake:
                      rewardUnitsToDistribute = rewardPerSecond * timeSinceLastUpdate
                      newRewardPerStake = (rewardUnitsToDistribute) / (total stake / 1e18) (stake token is 18 decimal place)
                      rewardPerStake = oldRewardPerStake + newRewardPerStake

        earn() - calculate rewards earned for a user:
                      userRewardDelta = rewardPerStake - userRewardPerStakePaid
                      new reward = staked tokens * difference in rate

        updateReward() - updating userRewardBalance and userRewardPerStakePaid. This is called on every user action
                      oldRewardPerStake = rewardPerStake()
                      call earn() and update userRewardBalance
                      userRewardPerStakePaid = rewardPerStake()

        onrewardcollection() - updateing rewardPerSecond:
                     if current reward period has ended: // distribute new rewards evenly within a new period
                        rewardPerSecond = collectedReward / REWARD_PERIOD

                     if current reward period is not finished: // distribute remaining rewards in current period with new rewards evenly in a new period
                        remaingPeriod = remaining time of REWARD_PERIOD
                        remaingRewardInPeriod = remaingPeriod * rewardPerSecond
                        rewardPerSecond = (collectedReward + remaingRewardInPeriod) / REWARD_PERIOD

                     lastUpdateTime = currentTime;
                     rewardPeriodEnd = currentTime.add(REWARD_PERIOD); // reward period is extened on every collection

        claimReward():
                      transfer userRewardBalance to user
 */
contract StakingPool is ERC20, ERC20Detailed, ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    // address of the stake token
    address public stakingToken;

    // mapping to indicate if an address is a registered earning pool
    mapping (address => bool) public isEarningPool;

    // list of reward tokens
    address[] public rewardTokens;

    // mapping to reward token to rewards per second for that token
    mapping(address => uint256) public rewardPerSecond;

    // mapping to reward token to rewards per stake for that token
    // Ever increasing rewardPerToken rate, based on % of total supply
    mapping(address => uint256) public rewardPerStakeStored;

    // mapping of user account to reward token to amount of reward per stake already paid
    mapping(address => mapping(address => uint256)) public userRewardPerStakePaid;

    // mapping of user account to reward token to amount of reward unclaimed
    mapping(address => mapping(address => uint256)) public userRewardUnclaimed;

    uint256 public constant REWARD_DURATION = 7 days;
    // timestamp for current reward period finish
    uint256 public rewardPeriodEnd = 0;
    uint256 public lastUpdateTime = 0;

    event RewardAdded(address indexed _rewardToken, uint256 reward);
    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardPaid(address indexed user, address indexed _rewardToken, uint256 reward);

    constructor (
        address _stakingToken
    )
        public
    {
        stakingToken = _stakingToken;
    }


    modifier onlyEarningPool() {
        require(isEarningPool[msg.sender], "STAKING_POOL: only registered earning pool call onRewardReceived");
        _;
    }

    // update reward balance for a given account
    modifier updateReward(address _account) {
        for (uint256 i=0; i<rewardTokens.length; i++) {
            // Setting of global vars
            uint256 newRewardPerStake = rewardPerStake(rewardTokens[i]);
            // If statement protects against loss in initialisation case
            if(newRewardPerStake > 0) {
                rewardPerStakeStored[rewardTokens[i]] = newRewardPerStake;
                lastUpdateTime = lastTimeRewardApplicable();
                // Setting of personal vars based on new globals
                if (_account != address(0)) {
                    userRewardUnclaimed[_account][rewardTokens[i]] = earned(_account, rewardTokens[i]);
                    userRewardPerStakePaid[_account][rewardTokens[i]] = newRewardPerStake;
                }
            }
        }
        _;
    }

    /*** ACTIONS ***/

    // deposit stake token and stake
    function stake(uint256 _amount)
        external
        nonReentrant
        updateReward(msg.sender)
    {
        require(_amount > 0, "STAKING_POOL: deposit amount cannot be 0");
        // transfer stakingtoken from msg.sender
        IERC20(stakingToken).safeTransferFrom(msg.sender, address(this), _amount);
        // Mint stakingPool token for staker
        _mint(msg.sender, _amount);

        emit Staked(msg.sender, _amount);
    }

    // withdraw stake token
    // _amount = amount of stake token to withdraw
    function withdraw(uint256 _amount)
        public
        nonReentrant
        updateReward(msg.sender)
    {
        require(_amount > 0, "STAKING_POOL: withdraw amount cannot be 0");
        // transfer stakingToken to msg.sender
        IERC20(stakingToken).safeTransfer(msg.sender, _amount);
        // Burn stakingToken for withdrawer
        _burn(msg.sender, _amount);

        emit Withdrawn(msg.sender, _amount);
    }

    // exit pool, claim stake and earning
    function exit()
        external
        nonReentrant
    {
        withdraw(balanceOf(msg.sender));
        claimReward(msg.sender);
    }

    // transfer unclaimwd rewards to a given account
    // _account = account to claim reward for
    function claimReward(address _account) public {
        for (uint i=0; i<rewardTokens.length; i++) {
            uint256 rewardsToClaim = userRewardUnclaimed[_account][rewardTokens[i]];
            if (rewardsToClaim > 0) {
                userRewardUnclaimed[_account][rewardTokens[i]] = 0;
                IERC20(rewardTokens[i]).safeTransfer(_account, rewardsToClaim);

                emit RewardPaid(msg.sender, rewardTokens[i], rewardsToClaim);
            }
        }
    }

    /*** VIEW ***/

    // Gets the last applicable timestamp for this reward period
    function lastTimeRewardApplicable()
        public
        view
        returns (uint256)
    {
        if (block.timestamp < rewardPeriodEnd) {
            return block.timestamp;
        } else {
            return rewardPeriodEnd;
        }
    }

    // Calculates the amount of unclaimed rewards per stake for a given reward token since last update,
    // and sums with stored to give the new cumulative reward per stake
    function rewardPerStake(address _token)
        public
        view
        returns (uint256)
    {
        // If there is no StakingToken liquidity, avoid div(0)
        uint256 stakedTokens = totalSupply();
        if (stakedTokens == 0) {
           return rewardPerStakeStored[_token];
        }
        // new reward units to distribute = rewardPerSecond * timeSinceLastUpdate
        uint256 rewardUnitsToDistribute = rewardPerSecond[_token].mul(lastTimeRewardApplicable().sub(lastUpdateTime));
        // new reward units per token = (rewardUnitsToDistribute * 1e18) / totalTokens
        uint256 unitsToDistributePerStake = rewardUnitsToDistribute.mul(1e18).div(stakedTokens); // scale by full scale
        // return summed rate
        return rewardPerStakeStored[_token].add(unitsToDistributePerStake);
    }

    // calculates the amount of unclaimed rewards a user has earned for a given reward token
    function earned(address _account, address _token)
        public
        view
        returns (uint256)
    {
        // current rate per token - rate user previously received
        uint256 userRewardPerStakeDelta = rewardPerStake(_token).sub(userRewardPerStakePaid[_account][_token]);
        // new reward = staked tokens * difference in rate
        uint256 userNewReward = balanceOf(_account).mul(userRewardPerStakeDelta).div(1e18); // truncate by full scale
        // add to previous rewards
        return userRewardUnclaimed[_account][_token].add(userNewReward);
    }


    /*** INTERNAL ***

    /*** ADMIN ***/

    function onRewardReceived(
        address _token,
        uint256 _amount
    )
        external
        onlyEarningPool
    {
        uint256 currentTime = block.timestamp;
        // If previous period over, reset rewardPerSecond
        if (currentTime >= rewardPeriodEnd) {
            rewardPerSecond[_token] = _amount.div(REWARD_DURATION);
        }
        // If additional reward to existing period, calc sum
        else {
            uint256 remaining = rewardPeriodEnd.sub(currentTime);
            uint256 leftover = remaining.mul(rewardPerSecond[_token]);
            rewardPerSecond[_token] = _amount.add(leftover).div(REWARD_DURATION);
        }

        lastUpdateTime = currentTime;
        rewardPeriodEnd = currentTime.add(REWARD_DURATION);

        emit RewardAdded(_token, _amount);
    }

    function registerEarningPool(
        address _earningPool
    )
        external
        onlyOwner
    {
        isEarningPool[_earningPool] = true;

        dPoolInterface earningPool = dPoolInterface(_earningPool);
        rewardTokens.push(earningPool.underlyingToken());
        rewardTokens.push(earningPool.rewardToken());
    }
}
