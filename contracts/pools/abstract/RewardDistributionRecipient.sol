pragma solidity 0.5.16;

import "../../externals/Ownable.sol";

contract RewardDistributionRecipient is Ownable {
    address public rewardDistributor;

    constructor (address _rewardDistributor) internal {
        rewardDistributor = _rewardDistributor;
    }

    function notifyRewardAmount(uint256 _reward) external;

    modifier onlyRewardDistributor() {
        require(_msgSender() == rewardDistributor, "Caller is not reward distributor");
        _;
    }

    function setRewardDistributor(address _rewardDistributor)
        external
        onlyOwner
    {
        rewardDistributor = _rewardDistributor;
    }
}
