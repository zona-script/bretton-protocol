pragma solidity 0.5.16;

import "../pools/EarningPool.sol";

/**
 * @title USDTPool
 * @dev Earning pool for USDT
 */
contract USDTPool is EarningPool {
    constructor ()
        EarningPool (
            address(0xdAC17F958D2ee523a2206206994597C13D831ec7), // USDT
            address(0xc00e94Cb662C3520282E6f5717214004A7f26888), // reward token
            address(0xf650C3d88D12dB855b8bf7D11Be6C55A4e07dCC9) // compound cUSDT
        )
        public
    {
    }
}
