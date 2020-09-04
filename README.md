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

## Mainnet Addresses
- BRETToken - `0x096dc18E816f3a39c84c42fE092658EBe57066d5`
- nUSDMintRewardPool - ``
- USDCEarningPool - ``
- USDTEarningPool - ``
- DAIEarningPool - ``
- nUSD - ``

## Testnet Addresses (Ropsten)
- BRETToken - `0xA0043FcEa3381D4f1a578BfB27e4c9D5329B76B9`
- nUSDMintRewardPool - `0x0eC4Bf5b4d73AfA21B1a3A3724dD995d9814Bdd2`
- USDCEarningPool - `0x627510E9F311DcB2975D50Ec3aa06e891FBDfd31`
- USDTEarningPool - `0x4cc84A87d8df2d29400B32Acdb6f440D11375920`
- DAIEarningPool - `0xbF419C2Cbc09B29957DA93A1cDccF51FE062D516`
- nUSD - `0x9f875730BC7046bC9Bb189c731E2eD97EDBaC3D5`

## Testnet Addresses (Kovan)
- BRETToken - `0x6C6d9d832ef4DDCba52eeDECbe7C27e3F268E3Fe`
- nUSDMintRewardPool - `0x06FEE7507024F852A9fB8f79034E0F6647B4E4e3`
- USDCEarningPool - `0xA25f8a60eBFb0733011Fbc8826bBCE066Dca7a62`
- USDTEarningPool - `0x938745759947d94dabc06e4565142441c27Fb577`
- DAIEarningPool - `0x34f64e707ec1A0474A2d0a34da22DB3A63F2eb91`
- nUSD - `0xddccD44c286910eDD9768Ec8663008b238adDf78`
- Referral - `0x1DA18F12111CfA7C9fB32A1062ACB3b76D9263d3`
- nUSD_BRET_Pool - `0x09F8628F9E337F59DBaCba6CcB30BFaEb2C9BCe2`
- Balancer Pool for nUSD/BRET pair - `https://kovan.pools.balancer.exchange/#/pool/0x030e5a54a997e60926f89772a092ec9b5caf1e60/`

## Interacting with nToken
- create `secrets.json` based on `secrets.example.json` and populate with detail
- run desired scripts with `node scripts/...`
