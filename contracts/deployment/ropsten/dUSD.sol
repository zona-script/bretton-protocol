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
        pools[0] = address(0x6a474ba655401D91b43fbF7Aa82589e21aaD9F3b); // USDC dPool
        pools[1] = address(0xd3E15E16ed8e0337D13587Ec791b88c3e7E62d3d); // USDT dPool
        return pools;
    }
}
