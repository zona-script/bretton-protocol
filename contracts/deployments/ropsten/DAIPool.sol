pragma solidity 0.5.16;

import "../../pools/EarningPool.sol";

/**
 * @title DAIPool
 * @dev Earning pool for DAI
 */
contract DAIPool is EarningPool {
    constructor ()
        EarningPool (
            address(0xc2118d4d90b274016cB7a54c03EF52E6c537D957), // DAI
            address(0), // reward token
            address(0xdb5Ed4605C11822811a39F94314fDb8F0fb59A2C) // compound cDAI
        )
        public
    {
    }
}
