pragma solidity 0.5.16;

import "../interfaces/BTokenInterface.sol";
import "../interfaces/Erc20Interface.sol";

/**
 * @title Bretton's BToken Contract
 * @notice Abstract base for BTokens
 * @author Bretton
 */
contract BTokenBase is BTokenInterface, Erc20Interface {

    /*** ERC20 USER FUNCTIONS ***/

    function balanceOf(address tokenOwner) external view returns (uint balance) {
        // WIP
        return 0;
    }

    function allowance(address tokenOwner, address spender) external view returns (uint remaining) {
        // WIP
        return 0;
    }

    function approve(address spender, uint tokens) external returns (bool success) {
        // WIP
        return false;
    }

    function transfer(address to, uint tokens) external nonReentrant returns (bool success) {
        // WIP
        return false;
    }

    function transferFrom(address from, address to, uint tokens) external nonReentrant returns (bool success) {
        // WIP
        return false;
    }


    /*** BTOKEN USER FUNCTIONS ***/

    function balanceOfUnderlying(address owner) external returns (uint) {
        // WIP
        return 0;
    }

    function getAccountSnapshot(address account) external view returns (uint, uint, uint, uint) {
        // WIP
        return (0,0,0,0);
    }

    function borrowRatePerBlock() external view returns (uint) {
        // WIP
        return 0;
    }

    function supplyRatePerBlock() external view returns (uint) {
        // WIP
        return 0;
    }

    function totalBorrowsCurrent() external nonReentrant returns (uint) {
        // WIP
        return 0;
    }

    function borrowBalanceCurrent(address account) external nonReentrant returns (uint) {
        // WIP
        return 0;
    }

    function borrowBalanceStored(address account) public view returns (uint) {
        // WIP
        return 0;
    }

    function exchangeRateCurrent() public nonReentrant returns (uint) {
        // WIP
        return 0;
    }

    function exchangeRateStored() public view returns (uint) {
        // WIP
        return 0;
    }

    function getCash() external view returns (uint) {
        // WIP
        return 0;
    }

    function accrueInterest() public returns (uint) {
        // WIP
        return 0;
    }

    function seize(address liquidator, address borrower, uint seizeTokens) external nonReentrant returns (uint) {
        // WIP
        return 0;
    }


    /*** BTOKEN INTERFACE ADMIN FUNCTIONS ***/

    function _setPendingAdmin(address payable newPendingAdmin) external returns (uint) {
        // WIP
        return 0;
    }

    function _acceptAdmin() external returns (uint) {
        // WIP
        return 0;
    }

    function _setController(ControllerInterface newController) public returns (uint) {
        // WIP
        return 0;
    }

    function _setReserveFactor(uint newReserveFactorMantissa) external nonReentrant returns (uint) {
        // WIP
        return 0;
    }

    function _reduceReserves(uint reduceAmount) external nonReentrant returns (uint) {
        // WIP
        return 0;
    }

    function _setInterestRateModel(InterestRateModelInterface newInterestRateModel) public returns (uint) {
        // WIP
        return 0;
    }


    /*** INTERNAL FUNCTIONS ***/

    /*** MODIFIERS ***/

    /**
     * @dev Prevents a contract from calling itself, directly or indirectly.
     */
    modifier nonReentrant() {
        require(_notEntered, "re-entered");
        _notEntered = false;
        _;
        _notEntered = true; // get a gas-refund post-Istanbul
    }
}
