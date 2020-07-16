pragma solidity 0.5.16;

import "../interfaces/InterestRateModelInterface.sol";
import "../interfaces/ControllerInterface.sol";

/**
 * @title BTokenStorageV1
 * @notice Storage variable definition for BToken. Version 1
 * @author Bretton
 */
contract BTokenStorageV1 {
      /**
       * @notice Indicator that this is a CToken contract (for inspection)
       */
      bool public constant isCToken = true;

      /**
       * @dev Guard variable for re-entrancy checks
       */
      bool internal _notEntered;

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
      * @notice Underlying asset for this BErc20 Token
      */
      address public underlying;

      /**
       * @notice Maximum borrow rate that can ever be applied (.0005% / block)
       */
      uint internal constant borrowRateMaxMantissa = 0.0005e16;

      /**
       * @notice Maximum fraction of interest that can be set aside for reserves
       */
      uint internal constant reserveFactorMaxMantissa = 1e18;

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
       * @notice Fraction of interest currently set aside for reserves
       */
      uint public reserveFactorMantissa;

      /**
       * @notice Block number that interest was last accrued at
       */
      uint public accrualBlockNumber;

      /**
       * @notice Accumulator of the total earned interest rate since the opening of the market
       */
      uint public borrowIndex;

      /**
       * @notice Total amount of outstanding borrows of the underlying in this market
       */
      uint public totalBorrows;

      /**
       * @notice Total amount of reserves of the underlying held in this market
       */
      uint public totalReserves;

      /**
       * @notice Total number of tokens in circulation
       */
      uint public totalSupply;

      /**
       * @notice Official record of token balances for each account
       */
      mapping (address => uint) internal accountTokens;

      /**
       * @notice Approved token transfer amounts on behalf of others
       */
      mapping (address => mapping (address => uint)) internal transferAllowances;

      /**
       * @notice Container for borrow balance information
       * @member principal Total balance (with accrued interest), after applying the most recent balance-changing action
       * @member interestIndex Global borrowIndex as of the most recent balance-changing action
       */
      struct BorrowSnapshot {
          uint principal;
          uint interestIndex;
      }

      /**
       * @notice Mapping of account addresses to outstanding borrow balances
       */
      mapping(address => BorrowSnapshot) internal accountBorrows;
}
