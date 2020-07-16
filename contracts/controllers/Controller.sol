pragma solidity 0.5.16;

import "../interfaces/ControllerInterface.sol";
import "../storages/ControllerStorage.sol";

/**
  * @title Bretton's Controller Implementation
  * @notice Risk model contract that control and permit BToken user actions
  * @author Controller
  */
contract Controller is ControllerInterface, ControllerStorageV1 {

    /**
     * @notice Construct an interest rate model
     */
    constructor() public {}

    /*** Assets You Are In ***/

    function enterMarkets(address[] calldata bTokens) external returns (uint[] memory) {}
    function exitMarket(address bToken) external returns (uint) {}

    /*** Policy Hooks ***/

    function mintAllowed(address bToken, address minter, uint mintAmount) external returns (uint) {}
    function mintVerify(address bToken, address minter, uint mintAmount, uint mintTokens) external {}

    function redeemAllowed(address bToken, address redeemer, uint redeemTokens) external returns (uint) {

    }
    function redeemVerify(address bToken, address redeemer, uint redeemAmount, uint redeemTokens) external {}

    function borrowAllowed(address bToken, address borrower, uint borrowAmount) external returns (uint) {

    }
    function borrowVerify(address bToken, address borrower, uint borrowAmount) external {}

    /*
    Liquidity Calculation:

    calculate sumCollateral and sumBorrow, and return liquidity or shortfall values

    EnterMarket - A market which the user has enabled borrowing for, i.e the user can borrow
                  from this market

    SumCollateral - The total amount (in ETH) the user is allowed to borrow based on the user's
                    supplied collateral across all markets the user has entered

    SumBorrow - The total amount (in ETH) the user has borrowed across all markets the user has entered

    for each asset in userAssets:
        get: bTokenBalance, underlyingBorrowedBalance, bTokenToUnderlyingExchangeRate, collateralRate, and underlyingToETHoraclePrice
        tokenToEtherFactor = underlyingToETHoraclePrice * bTokenToUnderlyingExchangeRate * collateralRate
        sumCollateral += tokenToETHFactor * bTokenBalance
        sumBorrowed += underlyingToETHoraclePrice * underlyingBorrowedBalance
        if asset is asset to borrow/redeem:
            need to consider borrow/redeem effect on sum
            sumBorrowed += tokenToEtherFactor * amountToRedeem
            sumBorrowed += underlyingToETHoraclePrice * amountToBorrow


    if sumCollateral > sumBorrowed:
        liquidity = sumCollateral - sumBorrowed;
    else:
        shortfall = sumBorrowed - sumCollateral;
    */


    function repayBorrowAllowed(
        address bToken,
        address payer,
        address borrower,
        uint repayAmount) external returns (uint) {}

    function repayBorrowVerify(
        address bToken,
        address payer,
        address borrower,
        uint repayAmount,
        uint borrowerIndex) external {}

    function liquidateBorrowAllowed(
        address bTokenBorrowed,
        address bTokenCollateral,
        address liquidator,
        address borrower,
        uint repayAmount) external returns (uint) {}

    function liquidateBorrowVerify(
        address bTokenBorrowed,
        address bTokenCollateral,
        address liquidator,
        address borrower,
        uint repayAmount,
        uint seizeTokens) external {}

    function seizeAllowed(
        address bTokenCollateral,
        address bTokenBorrowed,
        address liquidator,
        address borrower,
        uint seizeTokens) external returns (uint) {}

    function seizeVerify(
        address bTokenCollateral,
        address bTokenBorrowed,
        address liquidator,
        address borrower,
        uint seizeTokens) external {}

    function transferAllowed(address bToken, address src, address dst, uint transferTokens) external returns (uint) {}

    function transferVerify(address bToken, address src, address dst, uint transferTokens) external {}

    /*** Liquidity/Liquidation Calculations ***/

    function liquidateCalculateSeizeTokens(
        address bTokenBorrowed,
        address bTokenCollateral,
        uint repayAmount) external view returns (uint, uint) {}
}
