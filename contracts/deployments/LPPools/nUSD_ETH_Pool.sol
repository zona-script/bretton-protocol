pragma solidity 0.5.16;

import "../../pools/LiquidityRewardPoolWithBonus.sol";

contract nUSD_ETH_Pool is LiquidityRewardPoolWithBonus {
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
            address(0x9fECE8de1077a9475cBca7770a60777643A936bF), // nUSD-ETH Uniswap
            _initiReward,
            _starttime,
            _devAddr
        )
        public
    {
    }
}
