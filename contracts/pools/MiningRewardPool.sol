pragma solidity 0.5.16;

import "../externals/SafeMath.sol";
import "../externals/SafeERC20.sol";
import "../externals/IERC20.sol";

import "./abstract/RewardPool.sol";

/*
 * @title  MiningRewardPool
 * @notice RewardPool with shares tracking the balance of another token
 */
contract MiningRewardPool is RewardPool {
    using SafeERC20 for IERC20;

    // Address of an ERC20 token used to track for shares
    IERC20 sharesToken;

    /**
     * @dev MiningRewardPool constructor
     * @param _rewardToken The rewardToken
     * @param _rewardsPerBlock Reward distribution rate
     */
    constructor(
        address _rewardToken,
        uint256 _rewardsPerBlock,
        address _sharesToken
    )
        RewardPool (
            _rewardToken,
            _rewardsPerBlock
        )
        public
    {
        sharesToken = IERC20(_sharesToken);
    }

    /*** PUBLIC ***/

    /**
     * @dev Get the totalSupply of sharesToken. Overrides Pool function
     * @return uint256 total shares
     */
    function totalShares()
        public
        view
        returns (uint256)
    {
        return sharesToken.totalSupply();
    }

    /**
     * @dev Get the balanceOf of a given account of sharesToken. Overrides Pool function
     * @param _account User for which to retrieve balance
     * @return uint256 shares
     */
    function sharesOf(address _account)
        public
        view
        returns (uint256)
    {
        return sharesToken.balanceOf(_account);
    }
}
