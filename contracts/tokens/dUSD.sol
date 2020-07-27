pragma solidity 0.5.16;

import "./dToken.sol";

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
        address[] memory initial = new address[](1);
        /* initial[0] = address(0xdAC17F958D2ee523a2206206994597C13D831ec7); // USDT */
        initial[0] = address(0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48); // USDC
        return initial;
    }

    function getInitialPools()  pure internal returns (address[] memory) {
        address[] memory initial = new address[](2);
        /* initial[0] = address(0); // USDT dPool */
        initial[0] = address(0); // USDC dPool
        return initial;
    }
}
