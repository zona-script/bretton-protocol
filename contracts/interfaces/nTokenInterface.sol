pragma solidity 0.5.16;

interface nTokenInterface {
    function mint(address _beneficiary, address _underlying, uint _amount) external;
    function redeem(address _beneficiary, address _underlying, uint _amount) external;
    function swap(address _underlyingFrom, uint _amountFrom, address _underlyingTo) external;
    function isUnderlyingSupported() external returns (bool);
    function getAllSupportedUnderlyings() external returns (address[] memory);
}
