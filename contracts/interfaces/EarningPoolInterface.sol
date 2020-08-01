pragma solidity 0.5.16;

interface EarningPoolInterface {
    function deposit(uint256 _amount) external;
    function withdraw(uint256 _amount) external;
    function dispenseEarning() external returns (uint);
    function dispenseReward() external returns (uint);
    function underlyingToken() external view returns (address);
    function rewardToken() external view returns (address);
    function calcPoolValueInUnderlying() external view returns (uint);
    function calcUnclaimedEarningInUnderlying() external view returns(uint256);
    function calcUnclaimedProviderReward() external view returns(uint256);
}
