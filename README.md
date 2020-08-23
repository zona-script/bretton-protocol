# Bretton Protocol

## Run Test
- `npm test`

## nToken ABI
- `mint(address _beneficiary, address _underlying, uint _amount)`
- `redeem(address _beneficiary, address _underlying, uint _amount)`
- `swap(address _beneficiary, address _underlyingFrom, uint _amountFrom, address _underlyingTo)`

## Earning Pool ABI
- `withdrawFeeFactorMantissa()` - withdraw fee mantissa
- `underlyingToken()` - underlying token of earning pool

## Reward Pool ABI
- `claim()` - claim outstanding rewards for msg.sender
- `rewardPerSecond()` - get rewards distributed per second
- `rewardPerShare()` - get rewards distributed per share
- `earned(address _account)` - get outstanding rewards available to claim for an account

## Testnet Addresses (Ropsten)
- BRETToken - `0xA0043FcEa3381D4f1a578BfB27e4c9D5329B76B9`
- nUSDMintRewardPool - `0x0eC4Bf5b4d73AfA21B1a3A3724dD995d9814Bdd2`
- USDCEarningPool - `0x627510E9F311DcB2975D50Ec3aa06e891FBDfd31`
- USDTEarningPool - `0x4cc84A87d8df2d29400B32Acdb6f440D11375920`
- DAIEarningPool - `0xbF419C2Cbc09B29957DA93A1cDccF51FE062D516`
- nUSD - `0x9f875730BC7046bC9Bb189c731E2eD97EDBaC3D5`

## Interacting with nToken
- create `secrets.json` based on `secrets.example.json` and populate with detail
- run desired scripts with `node scripts/...`
