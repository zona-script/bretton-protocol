pragma solidity 0.5.16;

import "./dPool.sol";

/**
 * @title USDCPool
 * @dev dPool for USDC
 */
contract USDCPool is dPool {
    constructor ()
        dPool(
            "Delta USDC Pool",
            "dUSDC",
            6,
            address(0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48), // USDC
            address(0x39AA39c021dfbaE8faC545936693aC917d5E7563)  // compound cUSDC
        )
        public
    {

    }
}
