pragma solidity 0.5.16;

import "../pools/abstract/RewardPool.sol";

// Fake RewardPool with adjustable shares
contract RewardPoolFake is RewardPool {
    uint256 fakeBlockNumber = 0;

    constructor(
        string memory _name,
        string memory _symbol,
        uint8 _decimals,
        address _rewardToken,
        uint256 _rewardsPerBlock
    )
        RewardPool (
            _name,
            _symbol,
            _decimals,
            _rewardToken,
            _rewardsPerBlock
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

    function increaseBlockNumber(uint256 _blockNumber) public {
        fakeBlockNumber += _blockNumber;
    }

    function getBlockNumber() public view returns (uint256){
        return fakeBlockNumber;
    }
}
