pragma solidity 0.5.16;

import "../tokens/BErc20Base.sol";

/**
 * @title BErc20TokenFake
 * @dev Fake BErc20 token implementation for testing
 */
contract BErc20TokenFake is BErc20Base {
    constructor() public {}

    /*** TEST FUNCTIONS ***/

    function setUnderlying(address underlying_) public {
        underlying = underlying_;
    }
}
