pragma solidity 0.5.16;

import "../interfaces/ControllerInterface.sol";
import "../interfaces/InterestRateModelInterface.sol";

/**
 * @title BTokenStorageV1
 * @notice Storage variable definition for BToken. Version 1
 * @author Bretton
 */
contract BTokenStorageV1 {
    /**
     * @notice Indicator that this is a BToken contract (for inspection)
     */
    bool public constant isBToken = true;

    /**
     * @notice Underlying asset for this BErc20 Token
     */
    address public underlying;

    /**
     * @notice EIP-20 token name for this token
     */
    string public name;

    /**
     * @notice EIP-20 token symbol for this token
     */
    string public symbol;

    /**
     * @notice EIP-20 token decimals for this token
     */
    uint8 public decimals;

    /**
     * @notice Total number of tokens in circulation
     */
    uint public totalSupply;

    /**
     * @notice Contract which oversees inter-bToken operations
     */
    ControllerInterface public controller;

    /**
     * @notice Model which tells what the current interest rate should be
     */
    InterestRateModelInterface public interestRateModel;

    /**
     * @notice Initial exchange rate used when minting the first BTokens (used when totalSupply = 0)
     */
    uint internal initialExchangeRateMantissa;

    /**
     * @notice Block number that interest was last accrued at
     */
    uint public accrualBlockNumber;

    /**
     * @notice Accumulator of the total earned interest rate since the opening of the market
     */
    uint public borrowIndex;
}
