pragma solidity 0.5.16;

import "../pools/EarningPool.sol";

/**
 * @title USDCPool
 * @dev Earning pool for USDC
 */
contract USDCPool is EarningPool {
    constructor ()
        EarningPool (
            address(0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48), // USDC
            address(0xc00e94Cb662C3520282E6f5717214004A7f26888), // reward token
            address(0x39AA39c021dfbaE8faC545936693aC917d5E7563) // compound cUSDC
        )
        public
    {
    }
}
