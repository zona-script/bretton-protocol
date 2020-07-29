pragma solidity 0.5.16;

import "../../tokens/dToken.sol";

/**
 * @title dUSD
 * @dev dToken pegged to USD
 */
contract dUSD is dToken {
    constructor ()
        dToken(
            "Delta USD",
            "dUSD",
            18,
            getInitialUnderlyings(),
            getInitialPools()
        )
        public
    {

    }

    function getInitialUnderlyings() pure internal returns (address[] memory) {
        address[] memory underlyings = new address[](2);
        underlyings[0] = address(0x0D9C8723B343A8368BebE0B5E89273fF8D712e3C); // USDC
        underlyings[1] = address(0x516de3a7A567d81737e3a46ec4FF9cFD1fcb0136); // USDT
        return underlyings;
    }

    function getInitialPools()  pure internal returns (address[] memory) {
        address[] memory pools = new address[](2);
        pools[0] = address(0xE9A8b9A96E6bC629B19305a6251ebFC0E69Bb3d6); // USDC dPool
        pools[1] = address(0xAcfB5be533836380Bdb8e42783998C6382E22527); // USDT dPool
        return pools;
    }
}
