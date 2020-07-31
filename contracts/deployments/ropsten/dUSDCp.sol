pragma solidity 0.5.16;

import "../../pools/dPool.sol";

/**
 * @title dUSDCp
 * @dev dPool for USDC
 */
contract dUSDCp is dPool {
    constructor ()
        dPool (
            "Delta USDC Pool",
            "dUSDCp",
            6,
            address(0x0D9C8723B343A8368BebE0B5E89273fF8D712e3C), // USDC
            address(0), // reward token
            address(0x8aF93cae804cC220D1A608d4FA54D1b6ca5EB361), // compound cUSDC
            address(0) // staking contract
        )
        public
    {
    }
}
