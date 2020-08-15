pragma solidity 0.5.16;

import "./abstract/RewardPool.sol";

/*
 * @title  ManagedRewardPool
 * @notice RewardPool with shares controlled by manager
 */
contract ManagedRewardPool is RewardPool {

    mapping(address => bool) public isManager;

    event Promoted(address indexed manager);
    event Demoted(address indexed manager);

    constructor(
        uint256 _DURATION,
        address _rewardToken
    )
        RewardPool (
            _DURATION,
            _rewardToken
        )
        public
    {
    }

    modifier onlyManager() {
        require(isManager[msg.sender], "MANAGED_REWARD_POOL: caller is not a manager");
        _;
    }

    /*** PUBLIC ***/

    function mintShares(address _account, uint256 _amount)
        external
        onlyManager
    {
        _mintShares(_account, _amount);
    }

    function burnShares(address _account, uint256 _amount)
        external
        onlyManager
    {
        _burnShares(_account, _amount);
    }

    /*** ADMIN ***/

    function promote(address _address)
        external
        onlyOwner
    {
        isManager[_address] = true;

        emit Promoted(_address);
    }

    function demote(address _address)
        external
        onlyOwner
    {
        isManager[_address] = false;

        emit Demoted(_address);
    }
}
