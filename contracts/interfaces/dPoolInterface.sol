pragma solidity 0.5.16;

interface dPoolInterface {
    function underlying() external returns (address);
    function deposit(uint256 _amount) external;
    function withdraw(uint256 _amount) external;
    function collectEarnings() external returns (uint);
    function collectProviderRewards() external returns (uint);
}
