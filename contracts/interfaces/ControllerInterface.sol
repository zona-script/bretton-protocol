pragma solidity 0.5.16;

import "../storages/ControllerStorage.sol";

contract ControllerInterface is ControllerStorageV1 {

    /*** Assets You Are In ***/

    function enterMarket(address bToken) external returns (uint);
    function exitMarket(address bToken) external returns (uint);

    /*** Policy Hooks ***/

    function mintAllowed(address bToken, address minter, uint mintAmount) external returns (uint);
    function mintVerify(address bToken, address minter, uint actualMintAmount, uint mintTokens) external;

    function redeemAllowed(address bToken, address redeemer, uint redeemTokens) external returns (uint);
    function redeemVerify(address bToken, address redeemer, uint redeemAmount, uint redeemTokens) external;

    function borrowAllowed(address bToken, address borrower, uint borrowAmount) external returns (uint);
    function borrowVerify(address bToken, address borrower, uint borrowAmount) external;

    function repayBorrowAllowed(
        address bToken,
        address payer,
        address borrower,
        uint repayAmount) external returns (uint);

    function repayBorrowVerify(
        address bToken,
        address payer,
        address borrower,
        uint actualRepayAmount,
        uint borrowerIndex) external;

    function liquidateBorrowAllowed(
        address bTokenBorrowed,
        address bTokenCollateral,
        address liquidator,
        address borrower,
        uint repayAmount) external returns (uint);

    function liquidateBorrowVerify(
        address bTokenBorrowed,
        address bTokenCollateral,
        address liquidator,
        address borrower,
        uint repayAmount,
        uint seizeTokens) external;

    function seizeAllowed(
        address bTokenCollateral,
        address bTokenBorrowed,
        address liquidator,
        address borrower,
        uint seizeTokens) external returns (uint);

    function seizeVerify(
        address bTokenCollateral,
        address bTokenBorrowed,
        address liquidator,
        address borrower,
        uint seizeTokens) external;

    function transferAllowed(address bToken, address src, address dst, uint transferTokens) external returns (uint);

    function transferVerify(address bToken, address src, address dst, uint transferTokens) external;

    /*** Liquidity/Liquidation Calculations ***/

    function liquidateCalculateSeizeTokens(
        address bTokenBorrowed,
        address bTokenCollateral,
        uint repayAmount) external view returns (uint, uint);

    /*** EVENTS  ***/

    /// @notice Emitted when an admin supports a market
    event MarketListed(address bToken);

    /// @notice Emitted when an account enters a market
    event MarketEntered(address bToken, address account);

    /// @notice Emitted when an account exits a market
    event MarketExited(address bToken, address account);

    /// @notice Emitted when a collateral factor is changed by admin
    event NewCollateralFactor(address bToken, uint oldCollateralFactorMantissa, uint newCollateralFactorMantissa);

    /// @notice Emitted when close factor is changed by admin
    event NewCloseFactor(address bToken, uint oldCloseFactorMantissa, uint newCloseFactorMantissa);

    /// @notice Emitted when liquidation incentive is changed by admin
    event NewLiquidationIncentive(address bToken, uint oldLiquidationIncentiveMantissa, uint newLiquidationIncentiveMantissa);

    /// @notice Emitted when maxAssets is changed by admin
    event NewMaxAssets(uint oldMaxAssets, uint newMaxAssets);

    /// @notice Emitted when price oracle is changed
    event NewPriceOracle(address oldPriceOracle, address newPriceOracle);

    /// @notice Emitted when an action is paused globally
    event ActionPaused(string action, bool pauseState);

    /// @notice Emitted when an action is paused on a market
    event ActionPaused(address bToken, string action, bool pauseState);
}
