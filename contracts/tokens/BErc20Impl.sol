pragma solidity 0.5.16;

import "./BErc20Base.sol";

/**
 * @title Bretton's BErc20 Token Contract
 * @notice Contract to initializes a BErc20 token instance. Contains no functional logic.
 * @author Bretton
 */
contract BErc20Impl is BErc20Base {

    constructor(ControllerInterface controller_,
                InterestRateModelInterface interestRateModel_,
                uint initialExchangeRateMantissa_,
                address underlying_,
                string memory name_,
                string memory symbol_,
                uint8 decimals_) public {
        super.initialize(controller_,
                         interestRateModel_,
                         initialExchangeRateMantissa_,
                         underlying_,
                         name_,
                         symbol_,
                         decimals_);
    }

}
