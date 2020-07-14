pragma solidity 0.5.16;

import "../tokens/BTokenBase.sol";

contract PriceOracleInterface {

    /// @notice Indicator that this is a PriceOracle contract (for inspection)
    bool public constant isPriceOracle = true;

    /**
      * @notice Get the underlying price of a bToken asset
      * @param  bToken The bToken to get the underlying price of
      * @return The underlying asset price mantissa (scaled by 1e18).
      *         Zero means the price is unavailable.
      */
    function getUnderlyingPrice(BTokenBase bToken) external view returns (uint);
}
