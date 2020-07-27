pragma solidity 0.5.16;

interface dPoolInterface {
    function underlying() external returns (address);
    function deposit(uint256 _amount) external;
    function withdraw(uint256 _amount) external;
    function collectInterest() external returns (uint);
    function collectReward() external returns (uint);
}
