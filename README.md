# Delta Protocol

## Run Test
- `npm test`

## dToken ABI
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
- DETLToken - `0xBa4f8fCf70085594124D0704C227C2B92d6a7895`
- dUSDMintRewardPool - `0x8b7bfe20BBa5CcaE9fA7796357263a658c61e892`
- USDCEarningPool - `0x28f7E2472B74C5F0d8df40c6EB308B3A9334DbfE`
- USDTEarningPool - `0x37C8D49E6800729db3f63c8dA086cBE7Ea1B7Bae`
- DAIEarningPool - `0x6075dAfAd453e9002A216cc9c67F9e8B92DfCc66`
- dUSD - `0xC1a43135d21C3ce061D180017E4F69797CF776e1`

## Interacting with dToken
- create `secrets.json` based on `secrets.example.json` and populate with detail
- run desired scripts with `node scripts/...`

## Deployment Steps
1. Deploy DELT Token
2. Deploy dUSDMintRewardPool (update DELT token reference)
3. Deploy Earning Pools
4. Deploy dUSD (update reward pool and earning pool reference)
5. Promote dUSD as dUSDMintRewardPool manager
6. Mint and notify DELT to dUSDMintRewardPool
