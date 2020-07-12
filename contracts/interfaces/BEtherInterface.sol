pragma solidity 0.5.16;

import "./BTokenInterface.sol";

/**
 * @title BEtherInterface
 * @dev BToken token interface
 */
contract BEtherInterface {
    /**
    * @notice Underlying asset for this BToken
    */
    address public underlying;

    /*** User Interface ***/
    function mint(uint mintAmount) external payable;
    function redeem(uint redeemTokens) external returns (uint);
    function redeemUnderlying(uint redeemAmount) external returns (uint);
    function borrow(uint borrowAmount) external returns (uint);
    function repayBorrow(uint repayAmount) external payable;
    function repayBorrowBehalf(address borrower, uint repayAmount) external payable;
    function liquidateBorrow(address borrower, uint repayAmount, BTokenInterface bTokenCollateral) external payable;
    function () external payable;

    /*** Admin Functions ***/
    function _addReserves(uint addAmount) external returns (uint);
}
