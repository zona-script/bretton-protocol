pragma solidity 0.5.16;

import "../../pools/EarningPool.sol";

/**
 * @title USDTPool
 * @dev Earning pool for USDT
 */
contract USDTPool is EarningPool {
    constructor ()
        EarningPool (
            "Earning Pool USDT",
            "eUSDTp",
            18,
            address(0x516de3a7A567d81737e3a46ec4FF9cFD1fcb0136), // USDT
            address(0), // reward token
            address(0x135669c2dcBd63F639582b313883F101a4497F76) // compound cUSDT
        )
        public
    {
    }
}
