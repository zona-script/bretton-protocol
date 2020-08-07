pragma solidity 0.5.16;

import "../pools/EarningPool.sol";

// Fake implementation of EarningPool for testing
contract EarningPoolFake is EarningPool {

    constructor (
        address _underlyingToken,
        address _rewardToken,
        address _compound
    )
        EarningPool(
          _underlyingToken,
          _rewardToken,
          _compound
        )
        public
    {
    }

    function deposit(address _beneficiary, uint256 _amount)
        external
        nonReentrant
    {

    }

    function withdraw(address _beneficiary, uint256 _amount)
        external
        nonReentrant
    {

    }
}
