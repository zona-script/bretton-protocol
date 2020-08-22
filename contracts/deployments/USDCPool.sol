pragma solidity 0.5.16;

import "../pools/EarningPool.sol";

/**
 * @title USDCPool
 * @dev Earning pool for USDC
 */
contract USDCPool is EarningPool {
    constructor ()
        EarningPool (
            address(0x0D9C8723B343A8368BebE0B5E89273fF8D712e3C), // USDC
            address(0x1Fe16De955718CFAb7A44605458AB023838C2793), // reward token
            address(0x8aF93cae804cC220D1A608d4FA54D1b6ca5EB361) // compound cUSDC
        )
        public
    {
    }
}
