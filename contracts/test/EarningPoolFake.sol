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
        // Transfer underlying from payer into pool
        IERC20(underlyingToken).safeTransferFrom(msg.sender, address(this), _amount);

        // increase pool shares for beneficiary
        _increaseShares(_beneficiary, _amount);
    }

    function withdraw(address _beneficiary, uint256 _amount)
        external
        nonReentrant
    {
        // Transfer underlying to beneficiary
        IERC20(underlyingToken).safeTransfer(_beneficiary, _amount);

        // decrease pool shares from payer
        _decreaseShares(msg.sender, _amount);
    }
}
