# Delta Protocol

## Run Test
- `npm test`

## dToken ABI
- `mint(address _underlying, uint _amount)`
- `redeem(address _underlying, uint _amount)`
- `swap(address _underlyingFrom, uint _amountFrom, address _underlyingTo)`

## Mine ABI
- `claim(address _account)` - claim outstanding rewards for an account
- `rewardsPerBlock()` - get rewards distributed per block
- `unclaimedRewards(address _account)` - get outstanding rewards available to claim for an account

## Testnet Addresses (Ropsten)
- dUSD - `0x2fdea53f3689C3310453A69c10226FaC2e6bC172`
- dUSDCp - `0xE9A8b9A96E6bC629B19305a6251ebFC0E69Bb3d6`
- dUSDTp - `0xAcfB5be533836380Bdb8e42783998C6382E22527`

## Interacting with dToken
- create `secrets.json` based on `secrets.example.json` and populate with detail
- run desired scripts with `node scripts/...`
