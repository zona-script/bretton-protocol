pragma solidity 0.5.16;

import "../interfaces/ControllerInterface.sol";

/**
 * @title ControllerFake
 * @dev Fake Controller implementation for testing
 */
contract ControllerFake is ControllerInterface {
    constructor() public {

    }

    /*** Assets You Are In ***/

    function enterMarkets(address[] calldata bTokens) external returns (uint[] memory) {
        uint[] memory arr = new uint[](1);
        return arr;
    }
    function exitMarket(address bToken) external returns (uint) {
        return 0;
    }

    /*** Policy Hooks ***/

    function mintAllowed(address bToken, address minter, uint mintAmount) external returns (uint) {
        return 0;
    }
    function mintVerify(address bToken, address minter, uint mintAmount, uint mintTokens) external {

    }

    function redeemAllowed(address bToken, address redeemer, uint redeemTokens) external returns (uint) {
        return 0;
    }
    function redeemVerify(address bToken, address redeemer, uint redeemAmount, uint redeemTokens) external {

    }

    function borrowAllowed(address bToken, address borrower, uint borrowAmount) external returns (uint) {
        return 0;
    }
    function borrowVerify(address bToken, address borrower, uint borrowAmount) external {

    }

    function repayBorrowAllowed(
        address bToken,
        address payer,
        address borrower,
        uint repayAmount) external returns (uint) {

        return 0;
    }

    function repayBorrowVerify(
        address bToken,
        address payer,
        address borrower,
        uint repayAmount,
        uint borrowerIndex) external {

    }

    function liquidateBorrowAllowed(
        address bTokenBorrowed,
        address bTokenCollateral,
        address liquidator,
        address borrower,
        uint repayAmount) external returns (uint) {

        return 0;
    }

    function liquidateBorrowVerify(
        address bTokenBorrowed,
        address bTokenCollateral,
        address liquidator,
        address borrower,
        uint repayAmount,
        uint seizeTokens) external {

    }

    function seizeAllowed(
        address bTokenCollateral,
        address bTokenBorrowed,
        address liquidator,
        address borrower,
        uint seizeTokens) external returns (uint) {

        return 0;
    }

    function seizeVerify(
        address bTokenCollateral,
        address bTokenBorrowed,
        address liquidator,
        address borrower,
        uint seizeTokens) external {

    }

    function transferAllowed(address bToken, address src, address dst, uint transferTokens) external returns (uint) {
        return 0;
    }

    function transferVerify(address bToken, address src, address dst, uint transferTokens) external {

    }

    /*** Liquidity/Liquidation Calculations ***/
    
    function liquidateCalculateSeizeTokens(
        address bTokenBorrowed,
        address bTokenCollateral,
        uint repayAmount) external view returns (uint, uint) {

        return (0, 0);
    }
}
