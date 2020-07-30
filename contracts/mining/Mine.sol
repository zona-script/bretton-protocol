pragma solidity 0.5.16;

import "../externals/SafeMath.sol";
import "../externals/SafeERC20.sol";
import "../externals/ReentrancyGuard.sol";
import "../externals/Ownable.sol";
import "../externals/IERC20.sol";

// this is a mine that distributes out miningToken in a fixedRate until it has no more miningTokens
contract Mine is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    // address of token to mine
    IERC20 public miningToken;

    // address of token used to represent shares of mining
    // total share = shares token totalSupply
    // user share = shares token balanceOf(user)
    IERC20 public sharesToken;

    // NOTE: We assume sharesToken and miningToken have the same decimal places (1e18)

    // amount of miningToken to distribute to all miners per block
    uint256 public rewardsPerBlock;

    // the rewardsPerShare rate based on last update
    uint256 public rewardsPerShareStored;

    // the rewardsPerShare already paided out to a given user
    mapping(address => uint256) public rewardsPerSharePaid;

    // block of which rewardsPerShareStored were updated last
    uint256 public lastUpdateBlock;

    constructor (
        IERC20 _miningToken,
        IERC20 _sharesToken,
        uint256 _rewardsPerBlock
    )
        public
    {
        miningToken = _miningToken;
        sharesToken = _sharesToken;
        rewardsPerBlock = _rewardsPerBlock;
        lastUpdateBlock = block.number; // mining rewards starts accumulate on the block mine was deployed
    }

    /*** PUBLIC FUNCTIONS ***/

    // claim unclaimed tokens for a given account
    function claim(address _account)
        external
    {
        uint256 unclaimedReward = unclaimedRewards(_account);
        rewardsPerSharePaid[_account] = rewardsPerShare();
        IERC20(miningToken).safeTransfer(_account, unclaimedReward);
    }

    // updates reward rates
    // must be called when totalShare changes
    function updateReward()
        external
    {
        rewardsPerShareStored = rewardsPerShare();
        lastUpdateBlock = block.number;
    }

    /*** VIEW ***/

    // calculate lastest rewardsPerShare
    function rewardsPerShare()
        public
        view
        returns (uint256)
    {
        uint256 blockDelta = block.number - lastUpdateBlock;
        uint256 newRewardsToDistribute = rewardsPerBlock.mul(blockDelta);

        // check against initial case when sharesToken does not have any supply
        if (sharesToken.totalSupply() == 0) {
            return 0;
        }

        uint256 newRewardToDistributePerShare = newRewardsToDistribute.div(sharesToken.totalSupply());
        return rewardsPerShareStored.add(newRewardToDistributePerShare);
    }

    // calculates the amount of unclaimed miningTokens a user has in mine
    // unclaimed = current (rewardsPerShare - rewardsPerSharePaid[user]) * shares[user]
    function unclaimedRewards(address _account)
        public
        view
        returns (uint256)
    {
        uint256 unclaimedRewardsPerShare = rewardsPerShare().sub(rewardsPerSharePaid[_account]);
        return unclaimedRewardsPerShare.mul(sharesToken.balanceOf(_account));
    }

    /*** INTERNAL ***/

    /*** ADMIN ***/

    function withdrawMiningTokens(uint256 _amount)
        external
        onlyOwner
    {
        miningToken.safeTransfer(owner(), _amount);
    }

    function setRewardsPerBlock(uint256 _newRewardsPerBlock)
        external
        onlyOwner
    {
        rewardsPerBlock = _newRewardsPerBlock;
    }
}
