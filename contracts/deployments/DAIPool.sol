pragma solidity 0.5.16;

import "../pools/EarningPool.sol";

/**
 * @title DAIPool
 * @dev Earning pool for DAI
 */
contract DAIPool is EarningPool {
    constructor ()
        EarningPool (
            address(0x6B175474E89094C44Da98b954EedeAC495271d0F), // DAI
            address(0xc00e94Cb662C3520282E6f5717214004A7f26888), // reward token
            address(0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643) // compound cDAI
        )
        public
    {
    }
}
