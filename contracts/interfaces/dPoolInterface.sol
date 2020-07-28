pragma solidity 0.5.16;

interface dPoolInterface {
    function deposit(uint256 _amount) external;
    function withdraw(uint256 _amount) external;
    function underlying() external returns (address);
    function collectInterest() external returns (uint);
    function collectReward() external returns (uint);
    function calcPoolValueInUnderlying() external view returns (uint);
    function calcEarningInUnderlying() external view returns(uint256);
}
