pragma solidity 0.5.16;

import "../pools/EarningPool.sol";

/**
 * @title USDCPool
 * @dev Earning pool for USDC
 */
contract USDCPool is EarningPool {
    constructor ()
        EarningPool (
            address(0xb7a4F3E9097C08dA09517b5aB877F7a917224ede), // USDC
            address(0x61460874a7196d6a22D1eE4922473664b3E95270), // reward token
            address(0x4a92E71227D294F041BD82dd8f78591B75140d63) // compound cUSDC
        )
        public
    {
    }
}
