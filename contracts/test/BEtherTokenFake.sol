pragma solidity 0.5.16;

import "../tokens/BEtherBase.sol";

/**
 * @title BEtherTokenFake
 * @dev Fake BEther token implementation for testing
 */
contract BEtherTokenFake is BEtherBase {
    constructor() public {}

    /*** BEther USER FUNCTIONS ***/

    function mint(uint mintAmount) external payable {}
    function redeem(uint redeemTokens) external returns (uint) {}
    function redeemUnderlying(uint redeemAmount) external returns (uint) {}
    function borrow(uint borrowAmount) external returns (uint) {}
    function repayBorrow(uint repayAmount) external payable {}
    function repayBorrowBehalf(address borrower, uint repayAmount) external payable {}
    function liquidateBorrow(address borrower, uint repayAmount, BTokenInterface bTokenCollateral) external payable {}
    function () external payable {}

    /*** BEther ADMIN FUNCTIONS ***/

    function _addReserves(uint addAmount) external returns (uint) {
        return 0;
    }

    /*** TEST FUNCTIONS ***/

    function setSymbol(string memory symbol_) public {
        symbol = symbol_;
    }

    function setUnderlying(address underlying_) public {
        underlying = underlying_;
    }
}
