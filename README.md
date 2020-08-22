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
- BRETToken - `0xDD3caA4006a8cb16F2b3070E7C963280334cd049`
- nUSDMintRewardPool - `0x1a7E6671B8561e5fe29EA2eCf57aBe3EB36cc993`
- USDCEarningPool - `0x527362Ec7c8FC1425CA8d684b4398F70dB0aD8D9`
- USDTEarningPool - `0x1f18e01DC1A3fA08a72894F98b1770dEC67380FA`
- DAIEarningPool - `0xd38A5236C9430506e04EB1Edea27fBC75328ab2b`
- nUSD - `0x9fCed6a889696F4b43BDA52E9dc6601E805a31e8`

## Interacting with nToken
- create `secrets.json` based on `secrets.example.json` and populate with detail
- run desired scripts with `node scripts/...`
