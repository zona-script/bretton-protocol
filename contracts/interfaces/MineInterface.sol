pragma solidity 0.5.16;

interface MineInterface {
    function claim(address _account) external;
    function updateReward() external;
}
