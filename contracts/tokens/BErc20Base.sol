pragma solidity 0.5.16;

import "../interfaces/BErc20Interface.sol";
import "./BTokenBase.sol";

/**
 * @title Bretton's BErc20 Token Base Contract
 * @notice Abstract base for BErc20 (BToken which wrap an EIP-20 underlying). Implements BErc20Interface
 * @author Bretton
 */
contract BErc20Base is BTokenBase, BErc20Interface {
    // NO STORAGE VARIABLES ALLOWED. ALL STORAGE VARIABLE SHOULD GO INTO BTOKEN

    /*** BErc20 USER FUNCTIONS ***/

    function mint(uint mintAmount) external returns (uint) {}

    function redeem(uint redeemTokens) external returns (uint) {}

    function redeemUnderlying(uint redeemAmount) external returns (uint) {}

    function borrow(uint borrowAmount) external returns (uint) {}

    function repayBorrow(uint repayAmount) external returns (uint) {}

    function repayBorrowBehalf(address borrower, uint repayAmount) external returns (uint) {}

    function liquidateBorrow(address borrower, uint repayAmount, address bTokenCollateral) external returns (uint) {}

    /*** BErc20 ADMIN FUNCTIONS ***/

    function _addReserves(uint addAmount) external returns (uint) {}
}
