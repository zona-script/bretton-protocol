pragma solidity 0.5.16;

import "./BTokenInterface.sol";

/**
 * @title BErc20Interface
 * @dev BErc20 token interface
 */
contract BErc20Interface {
    /**
    * @notice Underlying asset for this BErc20 Token
    */
    address public underlying;

    /*** User Interface ***/
    function mint(uint mintAmount) external returns (uint);
    function redeem(uint redeemTokens) external returns (uint);
    function redeemUnderlying(uint redeemAmount) external returns (uint);
    function borrow(uint borrowAmount) external returns (uint);
    function repayBorrow(uint repayAmount) external returns (uint);
    function repayBorrowBehalf(address borrower, uint repayAmount) external returns (uint);
    function liquidateBorrow(address borrower, uint repayAmount, BTokenInterface bTokenCollateral) external returns (uint);

    /*** Admin Functions ***/
    function _addReserves(uint addAmount) external returns (uint);
}
