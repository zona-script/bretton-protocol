pragma solidity 0.5.16;

import "../pools/dPool.sol";
import "../tokens/dToken.sol";

contract Deploy {
    function deploy() external returns (address) {
        dPool USDCPool = new dPool (
                                       "Delta USDC Pool",
                                       "dUSDC",
                                       6,
                                       address(0x0D9C8723B343A8368BebE0B5E89273fF8D712e3C), // USDC
                                       address(0x5B281A6DdA0B271e91ae35DE655Ad301C976edb1), // compound cUSDC
                                       address(0x66Fe29f2963f86f007d1ae30E1dF6F4e6E438B08) // earn contract
                                   );

        dPool USDTPool = new dPool (
                                       "Delta USDT Pool",
                                       "dUSDT",
                                       6,
                                       address(0x516de3a7A567d81737e3a46ec4FF9cFD1fcb0136), // USDT
                                       address(0x2fB298BDbeF468638AD6653FF8376575ea41e768), // compound cUSDT
                                       address(0x66Fe29f2963f86f007d1ae30E1dF6F4e6E438B08) // earn contract
                                   );

        address[] memory underlyings = new address[](2);
        underlyings[0] = address(0x0D9C8723B343A8368BebE0B5E89273fF8D712e3C); // USDC
        underlyings[1] = address(0x516de3a7A567d81737e3a46ec4FF9cFD1fcb0136); // USDT

        address[] memory pools = new address[](2);
        pools[0] = address(USDCPool); // USDC dPool
        pools[1] = address(USDTPool); // USDT dPool

        dToken dUSD = new dToken (
                                     "Delta USD",
                                     "dUSD",
                                     18,
                                     underlyings,
                                     pools
                                 );
        return address(dUSD);
    }
}
