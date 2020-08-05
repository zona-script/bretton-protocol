pragma solidity 0.5.16;

interface ManagedRewardPoolInterface {
    function claim(address _account) external;
    function mintShares(address _account, uint256 _amount) external;
    function burnShares(address _account, uint256 _amount) external;
}
