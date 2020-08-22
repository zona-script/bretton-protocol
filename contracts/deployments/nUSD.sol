pragma solidity 0.5.16;

import "../tokens/nToken.sol";

/**
 * @title nUSD
 * @dev nToken pegged to USD
 */
contract nUSD is nToken {
    constructor (
        address[] memory _initialEarningPools,
        address _rewardPool
    )
        nToken (
            "Bretton USD",
            "nUSD",
            18,
            _initialEarningPools,
            _rewardPool
        )
        public
    {
    }
}
