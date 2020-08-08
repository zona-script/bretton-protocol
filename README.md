# Delta Protocol

## Run Test
- `npm test`

## dToken ABI
- `mint(address _beneficiary, address _underlying, uint _amount)`
- `redeem(address _beneficiary, address _underlying, uint _amount)`
- `swap(address _beneficiary, address _underlyingFrom, uint _amountFrom, address _underlyingTo)`

## Mining Reward Pool ABI
- `claim(address _account)` - claim outstanding rewards for an account
- `rewardsPerBlock()` - get rewards distributed per block
- `unclaimedRewards(address _account)` - get outstanding rewards available to claim for an account

## Testnet Addresses (Ropsten)
- DETL - `0x1dA02F7abbD841C1BaFE9eFe987a72D9008CbB1E`
- DELTRewardPool - `0x4e491B012B7E7aAEBe83Fd1788ca97a20f234947`
- USDCEarningPool - `0xbF37bC6226A44d2017971d5dBa404f34cDc40048`
- USDTEarningPool - `0x47842daB6819F6B70fA959d5E3F06C7C60218695`
- dUSD - `0xB1D4d6Df0F7f3EA5B763Be95366e47BC6A562Ff5`

## Interacting with dToken
- create `secrets.json` based on `secrets.example.json` and populate with detail
- run desired scripts with `node scripts/...`

## Deployment Steps
1. Deploy DELT Token
2. Deploy MiningPool
3. Mint DELT to MiningPool
4. Earning Pools
5. dToken
6. promote dToken as MiningPool manager
