pragma solidity 0.5.16;

import "../tokens/BEtherBase.sol";

/**
 * @title BEtherTokenFake
 * @dev Fake BEther token implementation for testing
 */
contract BEtherTokenFake is BEtherBase {
    constructor() public {}

    /*** TEST FUNCTIONS ***/

    function setSymbol(string memory symbol_) public {
        symbol = symbol_;
    }

    function setUnderlying(address underlying_) public {
        underlying = underlying_;
    }
}
