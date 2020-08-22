pragma solidity 0.5.16;

import "../pools/ManagedRewardPool.sol";

/**
 * @title nUSDMintRewardPool
 * @dev Reward pool to issue BRET for minting nUSD
 */
contract nUSDMintRewardPool is ManagedRewardPool {
    constructor (address _bretToken)
        ManagedRewardPool (
            172800, // 2 days
            _bretToken
        )
        public
    {
    }
}
