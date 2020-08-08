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
            address(0x4e491B012B7E7aAEBe83Fd1788ca97a20f234947) // DELT reward pool
        )
        public
    {

    }

    function getInitialPools()  pure internal returns (address[] memory) {
        address[] memory pools = new address[](2);
        pools[0] = address(0xbF37bC6226A44d2017971d5dBa404f34cDc40048); // USDC dPool
        pools[1] = address(0x47842daB6819F6B70fA959d5E3F06C7C60218695); // USDT dPool
        return pools;
    }
}
