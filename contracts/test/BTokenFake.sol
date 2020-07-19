pragma solidity 0.5.16;

import "../tokens/BTokenBase.sol";
import "../interfaces/ControllerInterface.sol";

/**
 * @title BTokenFake
 * @dev Fake Btoken implementation for testing
 */
contract BTokenFake is BTokenBase {
    mapping(address => uint) internal accountTokens;
    mapping(address => uint) internal accountBorrowed;
    uint internal exchangeRateMantissa;
    uint internal snapshotRcode;

    constructor() public {
        exchangeRateMantissa = 0;
        snapshotRcode = 0;
    }

    /*** TEST FUNCTIONS ***/
    function setTokenBalance(uint tokenBalance, address account) public {
        accountTokens[account] = tokenBalance;
    }

    function borrowBalanceStored(address account) public view returns (uint) {
        return accountBorrowed[account];
    }

    function setBorrowBalanceStored(uint borrowedBalance, address account) public {
        accountBorrowed[account] = borrowedBalance;
    }

    function setExchangeRate(uint _exchangeRateMantissa) public {
        exchangeRateMantissa = _exchangeRateMantissa;
    }

    function getAccountSnapshot(address account) external view returns (uint, uint, uint, uint) {
        uint bTokenBalance = accountTokens[account];
        uint borrowBalance = accountBorrowed[account];

        return (snapshotRcode, bTokenBalance, borrowBalance, exchangeRateMantissa);
    }

    function setSnapShotRcode(uint _snapshotRcode) public {
        snapshotRcode = _snapshotRcode;
    }

    function callBorrowAllowed(address controller, address borrower, uint borrowAmount) public returns (uint){
        return ControllerInterface(controller).borrowAllowed(address(this), borrower, borrowAmount);
    }
}
