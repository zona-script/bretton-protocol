pragma solidity 0.5.16;

import "../../pools/ManagedRewardPool.sol";

/**
 * @title dUSDMintRewardPool
 * @dev Reward pool to issue DELT for minting dUSD
 */
contract dUSDMintRewardPool is ManagedRewardPool {
    constructor ()
        ManagedRewardPool (
            172800, // 2 days
            address(0xBa4f8fCf70085594124D0704C227C2B92d6a7895) // DELT token address
        )
        public
    {
    }
}
