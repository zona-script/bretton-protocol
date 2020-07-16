pragma solidity 0.5.16;

import "../interfaces/BTokenInterface.sol";
import "../interfaces/Erc20Interface.sol";
import "../storages/BTokenStorage.sol";

/**
 * @title Bretton's BToken Base Contract
 * @notice Abstract base for BTokens. Implements Erc20Interface and BTokenInterface
 * @author Bretton
 */
contract BTokenBase is Erc20Interface, BTokenInterface, BTokenStorageV1 {

    /*** ERC20 USER FUNCTIONS ***/

    function balanceOf(address tokenOwner) external view returns (uint balance) {}

    function allowance(address tokenOwner, address spender) external view returns (uint remaining) {}

    function approve(address spender, uint tokens) external returns (bool success) {}

    function transfer(address to, uint tokens) external nonReentrant returns (bool success) {}

    function transferFrom(address from, address to, uint tokens) external nonReentrant returns (bool success) {}

    /*** BTOKEN USER FUNCTIONS ***/

    function balanceOfUnderlying(address owner) external returns (uint) {}

    function getAccountSnapshot(address account) external view returns (uint, uint, uint, uint) {}

    function borrowRatePerBlock() external view returns (uint) {}

    function supplyRatePerBlock() external view returns (uint) {}

    function totalBorrowsCurrent() external nonReentrant returns (uint) {}

    function borrowBalanceCurrent(address account) external nonReentrant returns (uint) {}

    function borrowBalanceStored(address account) public view returns (uint) {}

    function exchangeRateCurrent() public nonReentrant returns (uint) {}

    function exchangeRateStored() public view returns (uint) {}

    function getCash() external view returns (uint) {}

    function accrueInterest() public returns (uint) {}

    function seize(address liquidator, address borrower, uint seizeTokens) external nonReentrant returns (uint) {}

    /*** BTOKEN INTERFACE ADMIN FUNCTIONS ***/

    function _setPendingAdmin(address payable newPendingAdmin) external returns (uint) {}

    function _acceptAdmin() external returns (uint) {}

    function _setController(ControllerInterface newController) public returns (uint) {}

    function _setReserveFactor(uint newReserveFactorMantissa) external nonReentrant returns (uint) {}

    function _reduceReserves(uint reduceAmount) external nonReentrant returns (uint) {}

    function _setInterestRateModel(InterestRateModelInterface newInterestRateModel) public returns (uint) {}

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
