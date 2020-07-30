pragma solidity 0.5.16;

interface StakingInterface {
    function stake(uint _amount) external;
    function withdraw(uint _amount) external;
    function exit() external;
    function claimReward(address _account) external;
    function updateReward(address _account) external;
    function onRewardReceived(address _token, uint256 _amount) external;

    function rewardPerStake(address _token) external view returns (uint256);
    function earned(address _account, address _rewardToken) external view returns (uint256);
}
