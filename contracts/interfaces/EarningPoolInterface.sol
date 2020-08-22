pragma solidity 0.5.16;

interface EarningPoolInterface {
    function deposit(address _beneficiary, uint256 _amount) external;
    function withdraw(address _beneficiary, uint256 _amount) external returns (uint256);
    function dispenseEarning() external returns (uint);
    function dispenseReward() external returns (uint);
    function underlyingToken() external view returns (address);
    function rewardToken() external view returns (address);
    function calcPoolValueInUnderlying() external view returns (uint);
    function calcUndispensedEarningInUnderlying() external view returns(uint256);
    function calcUndispensedProviderReward() external view returns(uint256);
}
