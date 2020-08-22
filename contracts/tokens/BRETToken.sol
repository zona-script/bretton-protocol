pragma solidity 0.5.16;

import "./BurnableMintableERC20.sol";

/**
 * @title BRETToken
 * @dev Bretton Protocol token
 */
contract BRETToken is BurnableMintableERC20 {
    constructor ()
        BurnableMintableERC20(
            "Bretton Protocol Token",
            "BRET",
            18
        )
        public
    {
    }
}
