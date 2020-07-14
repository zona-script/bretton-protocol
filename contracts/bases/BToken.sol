pragma solidity 0.5.16;

import "../interfaces/BTokenInterface.sol";
import "../interfaces/Erc20Interface.sol";
import "../utils/ErrorReporter.sol";
import "../math/Exponential.sol";

/**
 * @title Bretton's BToken Contract
 * @notice Abstract base for BTokens
 * @author Bretton
 */
contract BToken is BTokenInterface, Erc20Interface, TokenErrorReporter, Exponential {

    /**
     * @notice Initialize the money market
     * @param controller_ The address of the Controller
     * @param interestRateModel_ The address of the interest rate model
     * @param initialExchangeRateMantissa_ The initial exchange rate, scaled by 1e18
     * @param name_ EIP-20 name of this token
     * @param symbol_ EIP-20 symbol of this token
     * @param decimals_ EIP-20 decimal precision of this token
     */
    function initialize(ControllerInterface controller_,
                        InterestRateModelInterface interestRateModel_,
                        uint initialExchangeRateMantissa_,
                        string memory name_,
                        string memory symbol_,
                        uint8 decimals_) public {
        require(msg.sender == admin, "only admin may initialize the market");
        require(accrualBlockNumber == 0 && borrowIndex == 0, "market may only be initialized once");

        // Set initial exchange rate
        initialExchangeRateMantissa = initialExchangeRateMantissa_;
        require(initialExchangeRateMantissa > 0, "initial exchange rate must be greater than zero.");

        // Set the controller
        uint err = _setController(controller_);
        require(err == uint(Error.NO_ERROR), "setting controller failed");

        // Initialize block number and borrow index (block number mocks depend on controller being set)
        accrualBlockNumber = getBlockNumber();
        borrowIndex = mantissaOne;

        // Set the interest rate model (depends on block number / borrow index)
        err = _setInterestRateModelFresh(interestRateModel_);
        require(err == uint(Error.NO_ERROR), "setting interest rate model failed");

        name = name_;
        symbol = symbol_;
        decimals = decimals_;

        // The counter starts true to prevent changing it from zero to non-zero (i.e. smaller cost/refund)
        _notEntered = true;
    }

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

    /**
     * @dev Function to simply retrieve block number
     *  This exists mainly for inheriting test contracts to stub this result.
     */
    function getBlockNumber() internal view returns (uint) {
        return block.number;
    }

    /**
     * @notice updates the interest rate model (*requires fresh interest accrual)
     * @dev Admin function to update the interest rate model
     * @param newInterestRateModel the new interest rate model to use
     * @return uint 0=success, otherwise a failure (see ErrorReporter.sol for details)
     */
    function _setInterestRateModelFresh(InterestRateModelInterface newInterestRateModel) internal returns (uint) {

        // Used to store old model for use in the event that is emitted on success
        InterestRateModelInterface oldInterestRateModel;

        // Check caller is admin
        if (msg.sender != admin) {
            return fail(Error.UNAUTHORIZED, FailureInfo.SET_INTEREST_RATE_MODEL_OWNER_CHECK);
        }

        // We fail gracefully unless market's block number equals current block number
        if (accrualBlockNumber != getBlockNumber()) {
            return fail(Error.MARKET_NOT_FRESH, FailureInfo.SET_INTEREST_RATE_MODEL_FRESH_CHECK);
        }

        // Track the market's current interest rate model
        oldInterestRateModel = interestRateModel;

        // Ensure invoke newInterestRateModel.isInterestRateModel() returns true
        require(newInterestRateModel.isInterestRateModel(), "marker method returned false");

        // Set the interest rate model to newInterestRateModel
        interestRateModel = newInterestRateModel;

        // Emit NewMarketInterestRateModel(oldInterestRateModel, newInterestRateModel)
        emit NewMarketInterestRateModel(oldInterestRateModel, newInterestRateModel);

        return uint(Error.NO_ERROR);
    }

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
