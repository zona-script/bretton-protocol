pragma solidity 0.5.16;

import "../interfaces/BErc20Interface.sol";
import "./BToken.sol";

/**
 * @title Bretton's BErc20 Contract
 * @notice Abstract base for BErc20 (BToken which wrap an EIP-20 underlying)
 * @author Bretton
 */
contract BErc20 is BToken, BErc20Interface {
    /**
     * @notice Initialize the new money market
     * @param underlying_ The address of the underlying asset
     * @param controller_ The address of the Controller
     * @param interestRateModel_ The address of the interest rate model
     * @param initialExchangeRateMantissa_ The initial exchange rate, scaled by 1e18
     * @param name_ ERC-20 name of this token
     * @param symbol_ ERC-20 symbol of this token
     * @param decimals_ ERC-20 decimal precision of this token
     */
    function initialize(address underlying_,
                        ControllerInterface controller_,
                        InterestRateModelInterface interestRateModel_,
                        uint initialExchangeRateMantissa_,
                        string memory name_,
                        string memory symbol_,
                        uint8 decimals_) public {
        // CToken initialize does the bulk of the work
        super.initialize(controller_, interestRateModel_, initialExchangeRateMantissa_, name_, symbol_, decimals_);

        // Set underlying and sanity check it
        underlying = underlying_;
        Erc20Interface(underlying).totalSupply();
    }

    /*** BERC20 USER FUNCTIONS ***/

    function mint(uint mintAmount) external returns (uint) {
        // WIP
        return 0;
    }

    function redeem(uint redeemTokens) external returns (uint) {
        // WIP
        return 0;
    }

    function redeemUnderlying(uint redeemAmount) external returns (uint) {
        // WIP
        return 0;
    }

    function borrow(uint borrowAmount) external returns (uint) {
        // WIP
        return 0;
    }

    function repayBorrow(uint repayAmount) external returns (uint) {
        // WIP
        return 0;
    }

    function repayBorrowBehalf(address borrower, uint repayAmount) external returns (uint) {
        // WIP
        return 0;
    }

    function liquidateBorrow(address borrower, uint repayAmount, BTokenInterface bTokenCollateral) external returns (uint) {
        // WIP
        return 0;
    }

    /*** BERC20 ADMIN FUNCTIONS ***/

    function _addReserves(uint addAmount) external returns (uint) {
        return 0;
    }
}
