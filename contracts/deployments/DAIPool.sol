pragma solidity 0.5.16;

import "../pools/EarningPool.sol";

/**
 * @title DAIPool
 * @dev Earning pool for DAI
 */
contract DAIPool is EarningPool {
    constructor ()
        EarningPool (
            address(0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa), // DAI
            address(0x61460874a7196d6a22D1eE4922473664b3E95270), // reward token
            address(0xF0d0EB522cfa50B716B3b1604C4F0fA6f04376AD) // compound cDAI
        )
        public
    {
    }
}
