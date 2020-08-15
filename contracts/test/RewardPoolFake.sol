pragma solidity 0.5.16;

import "../pools/abstract/RewardPool.sol";

// Fake RewardPool with adjustable shares
contract RewardPoolFake is RewardPool {
    uint256 fakeTimestamp;

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

    function increaseShares(address _account, uint256 _amount) public {
        _mintShares(_account, _amount);
    }

    function decreaseShares(address _account, uint256 _amount) public {
        _burnShares(_account, _amount);
    }

    function increaseCurrentTime(uint256 _seconds) public {
        fakeTimestamp += _seconds;
    }

    function getCurrentTimestamp() public view returns (uint256){
        return fakeTimestamp;
    }
}
