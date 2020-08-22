pragma solidity 0.5.16;

import "../pools/ManagedRewardPool.sol";

/**
 * @title dUSDMintRewardPool
 * @dev Reward pool to issue DELT for minting dUSD
 */
contract dUSDMintRewardPool is ManagedRewardPool {
    constructor (address _deltToken)
        ManagedRewardPool (
            172800, // 2 days
            _deltToken
        )
        public
    {
    }
}
