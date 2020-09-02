pragma solidity 0.5.16;

import "../../pools/LiquidityRewardPoolWithBonus.sol";

contract nUSD_BRET_Pool is LiquidityRewardPoolWithBonus {
    constructor (
        address _BRET,
        address _rewardReferral,
        uint256 _DURATION,
        uint256 _BONUS_ENDTIME,
        uint256 _initiReward,
        uint256 _starttime,
        address _devAddr
    )
        LiquidityRewardPoolWithBonus (
            _BRET,
            _rewardReferral,
            address(0), // nUSD-BRET BPT
            _initiReward,
            _starttime,
            _devAddr
        )
        public
    {
    }
}
