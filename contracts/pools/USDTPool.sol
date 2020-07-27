pragma solidity 0.5.16;

import "./dPool.sol";

/**
 * @title USDTPool
 * @dev dPool for USDT
 */
contract USDTPool is dPool {
    constructor ()
        dPool(
            "Delta USDT Pool",
            "dUSDT",
            6,
            address(0xdAC17F958D2ee523a2206206994597C13D831ec7), // USDT
            address(0xf650C3d88D12dB855b8bf7D11Be6C55A4e07dCC9), // compound cUSDT
            address(0) // earn contract
        )
        public
    {

    }
}
