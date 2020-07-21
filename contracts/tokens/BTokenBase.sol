pragma solidity 0.5.16;

import "../interfaces/BTokenInterface.sol";
import "../interfaces/Erc20Interface.sol";
import "../utils/ErrorReporter.sol";

/**
 * @title Bretton's BToken Base Contract
 * @notice Abstract base for BTokens. Implements Erc20Interface and BTokenInterface
 * @author Bretton
 */
contract BTokenBase is Erc20Interface, TokenErrorReporter, BTokenInterface {

    /*** ERC20 USER FUNCTIONS ***/

    function balanceOf(address tokenOwner) external view returns (uint balance) {}

    function allowance(address tokenOwner, address spender) external view returns (uint remaining) {}

    function approve(address spender, uint tokens) external returns (bool success) {}

    function transfer(address to, uint tokens) external returns (bool success) {}

    function transferFrom(address from, address to, uint tokens) external returns (bool success) {}

    /*** BTOKEN USER FUNCTIONS ***/

    function balanceOfUnderlying(address owner) external returns (uint) {}

    function getAccountSnapshot(address account) external view returns (uint, uint, uint, uint) {}

    function borrowRatePerBlock() external view returns (uint) {}

    function supplyRatePerBlock() external view returns (uint) {}

    function totalBorrowsCurrent() external returns (uint) {}

    function borrowBalanceCurrent(address account) external returns (uint) {}

    function borrowBalanceStored(address account) public view returns (uint) {}

    function exchangeRateCurrent() public returns (uint) {}

    function exchangeRateStored() public view returns (uint) {}

    function getCash() external view returns (uint) {}

    function accrueInterest() public returns (uint) {
        // called on every action to accrue interest
        // get interest rate since last update:
            // borrowRate = interestRateModel.borrowRate() (this is rate per block)
            // simpleInterestFactor = numOfBlocksSinceLastUpdate * borrowRate
        // update borrow index:
            // borrowInterestIndex = borrowInterestIndex * (1 + simpleInterestFactor)
        // calculate interest  accured:
            // interestAccured = totalBorrow * (1 + simpleInterestFactor)
        // calculate new totalBorrowed and totalReserve:
            // totalBorrowed += interestAccured
            // totalReserved += interestAccured * (1 + reserveFactor)
    }

    function seize(address liquidator, address borrower, uint seizeTokens) external returns (uint) {}

    /*** BTOKEN INTERFACE ADMIN FUNCTIONS ***/

    function _setPendingAdmin(address payable newPendingAdmin) external returns (uint) {}

    function _acceptAdmin() external returns (uint) {}

    /**
     * @notice Sets a new controller for the market
     * @dev Admin function to set a new controller
     * @return uint 0=success, otherwise a failure (see ErrorReporter.sol for details)
     */
    function _setController(address newController) external returns (uint) {
        // Check caller is admin
        /* if (msg.sender != admin) {
            return fail(Error.UNAUTHORIZED, FailureInfo.SET_COMPTROLLER_OWNER_CHECK);
        } */

        ControllerInterface oldController = controller;
        // Ensure invoke controller.isController() returns true
        /* require(ControllerInterface(newController).isController(), "marker method returned false"); */

        // Set market's controller to newController
        controller = ControllerInterface(newController);

        // Emit NewController(oldController, newController)
        /* emit NewController(oldController, newController); */

        return uint(Error.NO_ERROR);
    }

    function _setReserveFactor(uint newReserveFactorMantissa) external returns (uint) {}

    function _reduceReserves(uint reduceAmount) external returns (uint) {}

    function _setInterestRateModel(address newInterestRateModel) public returns (uint) {}

    /*** INTERNAL FUNCTIONS ***/

    /**
     * @notice User supplies assets into the market and receives bTokens in exchange
     * @dev Assumes interest has already been accrued up to the current block
     * @param minter The address of the account which is supplying the assets
     * @param mintAmount The amount of the underlying asset to supply
     * @return (uint, uint) An error code (0=success, otherwise a failure, see ErrorReporter.sol), and the actual mint amount.
     */
    function mintFresh(address minter, uint mintAmount) internal returns (uint, uint) {
        // check controller
        // calculate numbers
        // transferIn underlying from minter
    }

    /**
     * @notice User redeems bTokens in exchange for the underlying asset
     * @dev Assumes interest has already been accrued up to the current block
     * @param redeemer The address of the account which is redeeming the tokens
     * @param redeemTokensIn The number of bTokens to redeem into underlying (only one of redeemTokensIn or redeemAmountIn may be non-zero)
     * @param redeemAmountIn The number of underlying tokens to receive from redeeming bTokens (only one of redeemTokensIn or redeemAmountIn may be non-zero)
     * @return uint 0=success, otherwise a failure (see ErrorReporter.sol for details)
     */
    function redeemFresh(address payable redeemer, uint redeemTokensIn, uint redeemAmountIn) internal returns (uint) {
        // check controller
        // calculate numbers
        // transferOut underlying to redeemer
    }

    /**
     * @notice Users borrow assets from the protocol to their own address
     * @param borrowAmount The amount of the underlying asset to borrow
     * @return uint 0=success, otherwise a failure (see ErrorReporter.sol for details)
     */
    function borrowFresh(address payable borrower, uint borrowAmount) internal returns (uint) {
        // check controller
        // calculate numbers
        // transferOut underlying to borrower
    }

    /**
     * @notice Borrows are repaid by another user (possibly the borrower).
     * @param payer the account paying off the borrow
     * @param borrower the account with the debt being payed off
     * @param repayAmount the amount of undelrying tokens being returned
     * @return (uint, uint) An error code (0=success, otherwise a failure, see ErrorReporter.sol), and the actual repayment amount.
     */
    function repayBorrowFresh(address payer, address borrower, uint repayAmount) internal returns (uint, uint) {
        // check controller
        // calculate numbers
        // transferIn underlying from payer
    }

    /**
     * @notice The liquidator liquidates the borrowers collateral.
     *  The collateral seized is transferred to the liquidator.
     * @param borrower The borrower of this bToken to be liquidated
     * @param liquidator The address repaying the borrow and seizing collateral
     * @param bTokenCollateral The market in which to seize collateral from the borrower
     * @param repayAmount The amount of the underlying borrowed asset to repay
     * @return (uint, uint) An error code (0=success, otherwise a failure, see ErrorReporter.sol), and the actual repayment amount.
     */
     function liquidateBorrowFresh(address liquidator, address borrower, uint repayAmount, address bTokenCollateral) internal returns (uint, uint) {
         // check controller
         // calculate numbers
         // transferIn collateral from liquidator
         // call repayBorrowFresh
     }
}
