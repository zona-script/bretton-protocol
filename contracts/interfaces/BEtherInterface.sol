pragma solidity 0.5.16;

/**
 * @title BEtherInterface
 * @dev BEther token interface
 */
contract BEtherInterface {

    /*** User Functions ***/

    function mint(uint mintAmount) external payable;
    function redeem(uint redeemTokens) external returns (uint);
    function redeemUnderlying(uint redeemAmount) external returns (uint);
    function borrow(uint borrowAmount) external returns (uint);
    function repayBorrow(uint repayAmount) external payable;
    function repayBorrowBehalf(address borrower, uint repayAmount) external payable;
    function liquidateBorrow(address borrower, uint repayAmount, address bTokenCollateral) external payable;
    function () external payable;

    /*** Admin Functions ***/

    function _addReserves(uint addAmount) external returns (uint);
}
