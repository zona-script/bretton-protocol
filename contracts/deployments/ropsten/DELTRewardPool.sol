pragma solidity 0.5.16;

import "../../pools/ManagedRewardPool.sol";

/**
 * @title DELTRewardPool
 * @dev Reward pool to issue DELT, managed by a dToken
 */
contract DELTRewardPool is ManagedRewardPool {
    constructor ()
        ManagedRewardPool (
            address(0x1dA02F7abbD841C1BaFE9eFe987a72D9008CbB1E), // DELT token address
            10000000000000000000 // 10 DELTs per block
        )
        public
    {
    }
}
