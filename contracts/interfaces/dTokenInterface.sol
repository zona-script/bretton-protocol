pragma solidity 0.5.16;

interface dTokenInterface {
    function mint(address _underlying, uint _amount) external;
    function redeem(address _underlying, uint _amount) external;
    function isUnderlyingSupported() external returns (bool);
    function getAllSupportedUnderlyings() external returns (address[] memory);
}
