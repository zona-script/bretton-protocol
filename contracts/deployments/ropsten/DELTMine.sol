pragma solidity 0.5.16;

import "../../externals/IERC20.sol";
import "../../mining/Mine.sol";

/**
 * @title DELTMine
 * @dev a mine for the DELT token
 */
contract DELTMine is Mine {
    constructor ()
        Mine (
            IERC20(0x05caba314ae1D78C2D33246F8a0add766965c61D), // mining token = DELTToken
            IERC20(0xAE5Ee15794ca9C646ca8a4E851C7A4A32f8d5869), // shares token = dUSD
            1000000000000000000000 // 1000 rewards per token
        )
        public
    {
    }
}
