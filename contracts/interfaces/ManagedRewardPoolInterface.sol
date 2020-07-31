pragma solidity 0.5.16;

interface ManagedRewardPoolInterface {
    function claim(address _account) external;
    function updateReward() external;
    function increaseShares(address _account, uint256 _amount) external;
    function decreaseShares(address _account, uint256 _amount) external;
}
