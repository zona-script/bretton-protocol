pragma solidity 0.5.16;

/**
 * @title BTokenStorageV1
 * @notice Storage variable definition for BToken. Version 1
 * @author Bretton
 */
contract BTokenStorageV1 {
      /**
       * @notice Indicator that this is a CToken contract (for inspection)
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
}
