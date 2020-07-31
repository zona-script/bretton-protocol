pragma solidity 0.5.16;

import "../../pools/dPool.sol";

/**
 * @title dUSDTp
 * @dev dPool for USDT
 */
contract dUSDTp is dPool {
    constructor ()
        dPool (
            "Delta USDT Pool",
            "dUSDTp",
            6,
            address(0x516de3a7A567d81737e3a46ec4FF9cFD1fcb0136), // USDT
            address(0), // reward token
            address(0x135669c2dcBd63F639582b313883F101a4497F76), // compound cUSDT
            address(0) // staking contract
        )
        public
    {
    }
}
