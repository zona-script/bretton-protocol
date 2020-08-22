pragma solidity 0.5.16;

import "../tokens/dToken.sol";

/**
 * @title dUSD
 * @dev dToken pegged to USD
 */
contract dUSD is dToken {
    constructor (
        address[] memory _initialEarningPools,
        address _rewardPool
    )
        dToken (
            "Delta USD",
            "dUSD",
            18,
            _initialEarningPools,
            _rewardPool
        )
        public
    {
    }
}
