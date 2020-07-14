pragma solidity 0.5.16;

import "../interfaces/BErc20Interface.sol";
import "../bases/BToken.sol";

/**
 * @title BErc20TokenFake
 * @dev Fake BErc20 token implementation for testing
 */
contract BErc20TokenFake is BToken, BErc20Interface {
    constructor() public {}

    /*** BERC20 USER FUNCTIONS ***/

    function mint(uint mintAmount) external returns (uint) {}

    function redeem(uint redeemTokens) external returns (uint) {}

    function redeemUnderlying(uint redeemAmount) external returns (uint) {}

    function borrow(uint borrowAmount) external returns (uint) {}

    function repayBorrow(uint repayAmount) external returns (uint) {}

    function repayBorrowBehalf(address borrower, uint repayAmount) external returns (uint) {}

    function liquidateBorrow(address borrower, uint repayAmount, BTokenInterface bTokenCollateral) external returns (uint) {}

    /*** BERC20 ADMIN FUNCTIONS ***/

    function _addReserves(uint addAmount) external returns (uint) {}

    /*** TEST FUNCTIONS ***/

    function setUnderlying(address underlying_) public {
        underlying = underlying_;
    }
}
