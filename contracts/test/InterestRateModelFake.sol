pragma solidity 0.5.16;

import "../interfaces/InterestRateModelInterface.sol";

/**
 * @title InterestRateModelFake
 * @dev Fake InterestRateModel implementation for testing
 */
contract InterestRateModelFake is InterestRateModelInterface {
    uint public borrowRate;
    uint public supplyRate;

    constructor(uint borrowRate_, uint supplyRate_) public {
        borrowRate = borrowRate_;
        supplyRate = supplyRate_;
    }

    function setBorrowRate(uint borrowRate_) external {
        borrowRate = borrowRate_;
    }

    function setSupplyRate(uint supplyRate_) external {
        supplyRate = supplyRate_;
    }

    function getBorrowRate(uint /* cash */, uint /* borrows */, uint /* reserves */) external view returns (uint) {
        return borrowRate;
    }

    function getSupplyRate(uint /* cash */, uint /* borrows */, uint /* reserves */, uint /* reserveFactorMantissa */) external view returns (uint) {
        return supplyRate;
    }
}
