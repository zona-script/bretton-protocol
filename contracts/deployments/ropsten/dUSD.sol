pragma solidity 0.5.16;

import "../../tokens/dToken.sol";

/**
 * @title dUSD
 * @dev dToken pegged to USD
 */
contract dUSD is dToken {
    constructor ()
        dToken (
            "Delta USD",
            "dUSD",
            18,
            getInitialPools(),
            address(0x8b7bfe20BBa5CcaE9fA7796357263a658c61e892) // DELT reward pool
        )
        public
    {
    }

    function getInitialPools()  pure internal returns (address[] memory) {
        address[] memory pools = new address[](3);
        pools[0] = address(0x28f7E2472B74C5F0d8df40c6EB308B3A9334DbfE); // USDC dPool
        pools[1] = address(0x37C8D49E6800729db3f63c8dA086cBE7Ea1B7Bae); // USDT dPool
        pools[2] = address(0x6075dAfAd453e9002A216cc9c67F9e8B92DfCc66); // DAI dPool
        return pools;
    }
}
