pragma solidity 0.5.16;

import "../interfaces/BTokenInterface.sol";
import "../interfaces/PriceOracleInterface.sol";

/**
 * @title ControllerStorageV1
 * @notice Storage variable definition for Controller. Version 1
 * @author Bretton
 */
contract ControllerStorageV1 {

    /**
     * @notice Indicator that this is a Controller contract (for inspection)
     */
    bool public constant isController = true;

    // closeFactorMantissa must be strictly greater than this value
    uint internal constant closeFactorMinMantissa = 0.05e18; // 0.05

    // closeFactorMantissa must not exceed this value
    uint internal constant closeFactorMaxMantissa = 0.9e18; // 0.9

    // No collateralFactorMantissa may exceed this value
    uint internal constant collateralFactorMaxMantissa = 0.9e18; // 0.9

    // liquidationIncentiveMantissa must be no less than this value
    uint internal constant liquidationIncentiveMinMantissa = 1.0e18; // 1.0

    // liquidationIncentiveMantissa must be no greater than this value
    uint internal constant liquidationIncentiveMaxMantissa = 1.5e18; // 1.5

    /**
     * @notice Oracle which gives the price of any given asset
     */
    PriceOracleInterface public oracle;

    /// @notice A list of all markets
    BTokenInterface[] public allMarkets;

    struct Market {
        /**
         * @notice Whether or not this market is listed
         */
        bool isListed;

        /**
         * @notice Multiplier representing the most one can borrow against their collateral in this market.
         *  For instance, 0.9 to allow borrowing 90% of collateral value.
         *  Must be between 0 and 1, and stored as a mantissa.
         */
        uint collateralFactorMantissa;

        /**
         * @notice Multiplier used to calculate the maximum repayAmount when liquidating a borrow
         */
        uint closeFactorMantissa;

        /**
         * @notice Multiplier representing the discount on collateral that a liquidator receives
         */
        uint liquidationIncentiveMantissa;

        /**
         * @notice Per-market mapping of "accounts in this asset"
         */
        mapping(address => bool) accountMembership;
    }

    /**
     * @notice Official mapping of bTokens -> Market metadata
     * @dev Used e.g. to determine if a market is supported
     */
    mapping(address => Market) public markets;

    /**
     * @notice Max number of assets a single account can participate in (borrow or use as collateral)
     */
    uint public maxAssets;

    /**
     * @notice Per-account mapping of "assets you are in", capped by maxAssets
     */
    mapping(address => BTokenInterface[]) public accountAssets;

    /**
     * @notice Flag to pause certain actions as a safety mechanism.
     *  Actions which allow users to remove their own assets cannot be paused.
     *  Liquidation / seizing / transfer can only be paused globally, not by market.
     */
    bool public mintPausedGlobally;
    bool public borrowPausedGlobally;
    bool public transferPausedGlobally;
    bool public seizePausedGlobally;
    bool public liquidationPausedGlobally;
    mapping(address => bool) public mintPausedFor;
    mapping(address => bool) public borrowPausedFor;
}
