pragma solidity 0.5.16;

import "../pools/EarningPool.sol";

/**
 * @title USDTPool
 * @dev Earning pool for USDT
 */
contract USDTPool is EarningPool {
    constructor ()
        EarningPool (
            address(0x07de306FF27a2B630B1141956844eB1552B956B5), // USDT
            address(0x61460874a7196d6a22D1eE4922473664b3E95270), // reward token
            address(0x3f0A0EA2f86baE6362CF9799B523BA06647Da018) // compound cUSDT
        )
        public
    {
    }
}
