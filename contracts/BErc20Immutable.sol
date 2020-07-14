pragma solidity 0.5.16;

import "./bases/BErc20.sol";

/**
 * @title Bretton's BErc20Immutable Contract
 * @notice BErc20 token implementation that is immutable
 * @author Bretton
 */
contract BErc20Immutable is BErc20 {

    /**
     * @notice Construct a new money market
     * @param underlying_ The address of the underlying asset
     * @param controller_ The address of the Controller
     * @param interestRateModel_ The address of the interest rate model
     * @param initialExchangeRateMantissa_ The initial exchange rate, scaled by 1e18
     * @param name_ ERC-20 name of this token
     * @param symbol_ ERC-20 symbol of this token
     * @param decimals_ ERC-20 decimal precision of this token
     * @param admin_ Address of the administrator of this token
     */
    constructor(address underlying_,
                ControllerInterface controller_,
                InterestRateModelInterface interestRateModel_,
                uint initialExchangeRateMantissa_,
                string memory name_,
                string memory symbol_,
                uint8 decimals_,
                address payable admin_) public {
        // Creator of the contract is admin during initialization
        admin = msg.sender;

        // Initialize the market
        initialize(underlying_, controller_, interestRateModel_, initialExchangeRateMantissa_, name_, symbol_, decimals_);

        // Set the proper admin now that initialization is done
        admin = admin_;
    }
}
