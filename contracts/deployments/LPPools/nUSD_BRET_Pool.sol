pragma solidity 0.5.16;

import "../../pools/LiquidityRewardPoolWithBonus.sol";

contract nUSD_BRET_Pool is LiquidityRewardPoolWithBonus {
    constructor (
        address _BRET,
        address _rewardReferral,
        uint256 _initiReward,
        uint256 _starttime,
        address _devAddr
    )
        LiquidityRewardPoolWithBonus (
            _BRET,
            _rewardReferral,
            address(0x030E5A54A997e60926f89772A092EC9b5CaF1E60), // nUSD-BRET BPT
            _initiReward,
            _starttime,
            _devAddr
        )
        public
    {
    }
}
