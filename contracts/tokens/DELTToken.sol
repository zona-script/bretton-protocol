pragma solidity 0.5.16;

import "./BurnableMintableERC20.sol";

/**
 * @title DELTToken
 * @dev Delta Protocol token
 */
contract DELTToken is BurnableMintableERC20 {
    constructor ()
        BurnableMintableERC20(
            "Delta",
            "DELT",
            18
        )
        public
    {
    }
}
