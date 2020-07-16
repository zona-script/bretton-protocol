pragma solidity 0.5.16;

import "../interfaces/BEtherInterface.sol";
import "./BTokenBase.sol";

/**
 * @title Bretton's BEther Base Contract
 * @notice Abstract base for BEther (Btoken which wrap Ether underlying). Implements BEtherInterface
 * @author Bretton
 */
contract BEtherBase is BTokenBase, BEtherInterface {
    // NO STORAGE VARIABLES ALLOWED. ALL STORAGE VARIABLE SHOULD GO INTO BTOKEN
    
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

    function _addReserves(uint addAmount) external returns (uint) {}
}
