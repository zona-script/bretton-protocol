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
        pools[0] = address(0x6968E171E85D325e017173a8ee0ebF633261F970); // USDC dPool
        pools[1] = address(0xFf687af06ef7a52A7e95c0739b832d3A5FD04946); // USDT dPool
        return pools;
    }
}
