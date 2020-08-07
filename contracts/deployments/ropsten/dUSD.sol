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
            address(0) // DELT reward pool
        )
        public
    {

    }

    function getInitialPools()  pure internal returns (address[] memory) {
        address[] memory pools = new address[](2);
        pools[0] = address(0xCc4D908C2396321F57cbEE82844e313CE1F07252); // USDC dPool
        pools[1] = address(0xe326C533ec1055badCB7D10baBFA0947aCe602E0); // USDT dPool
        return pools;
    }
}
