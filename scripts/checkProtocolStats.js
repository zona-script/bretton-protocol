const { ropstenProjectId, accountPrivateKey } = require('../secrets.json')
const { proxies } = require('../.openzeppelin/ropsten.json')

const Web3 = require('web3')
const { setupLoader } = require('@openzeppelin/contract-loader')

async function main() {
  // setup web3
  const web3 = new Web3(new Web3.providers.HttpProvider(`https://ropsten.infura.io/v3/${ropstenProjectId}`))
  const account = web3.eth.accounts.privateKeyToAccount(accountPrivateKey);
  web3.eth.accounts.wallet.add(account)
  web3.eth.defaultAccount = account.address;
  const loader = setupLoader({ provider: web3 }).web3

  // load addresses and contract from oz deployed project
  const USDCPoolAddress = proxies['Delta Protocol/USDCPool'][proxies['Delta Protocol/USDCPool'].length - 1]['address']
  const USDCPool = loader.fromArtifact('EarningPool', USDCPoolAddress)

  const USDTPoolAddress = proxies['Delta Protocol/USDTPool'][proxies['Delta Protocol/USDCPool'].length - 1]['address']
  const USDTPool = loader.fromArtifact('EarningPool', USDTPoolAddress)

  const dUSDAddress = proxies['Delta Protocol/dUSD'][proxies['Delta Protocol/dUSD'].length - 1]['address']
  const dUSD = loader.fromArtifact('dUSD', dUSDAddress)

  const DELTRewardPoolAddress = proxies['Delta Protocol/DELTRewardPool'][proxies['Delta Protocol/DELTRewardPool'].length - 1]['address']
  const deltRewardPool = loader.fromArtifact('DELTRewardPool', DELTRewardPoolAddress)


  console.log('\n')

  /***************************************
                EARNING POOLs
  ****************************************/

  // USDC Pool
  console.log('=========USDC Pool Stats=========')
  // get total supply
  const USDCPoolTotalSupply = await USDCPool.methods.totalShares().call() / 1e6 // USDC is 6 decimal place
  console.log('Total USDCPool supply is: ' + USDCPoolTotalSupply)
  // get total pool value
  const USDCPoolValue = await USDCPool.methods.calcPoolValueInUnderlying().call() / 1e6 // USDC is 6 decimal place
  console.log('Total USDC value in USDCPool is: ' + USDCPoolValue)
  // get interest accured
  const USDCInterestEarned = await USDCPool.methods.calcUnclaimedEarningInUnderlying().call() // don't scale decimal as the number can be very small
  console.log('Total unclaimed USDC interest * 1e6 in USDCPool is: ' + USDCInterestEarned)


  // USDT Pool
  console.log('=========USDT POOL STATS=========')
  // get total supply
  const USDTPoolTotalSupply = await USDTPool.methods.totalShares().call() / 1e6 // USDT is 6 decimal place
  console.log('Total USDTPool supply is: ' + USDTPoolTotalSupply)
  // get total pool value
  const USDTPoolValue = await USDTPool.methods.calcPoolValueInUnderlying().call() / 1e6 // USDT is 6 decimal place
  console.log('Total USDT value in USDTPool is: ' + USDTPoolValue)
  // get interest accured
  const USDTInterestEarned = await USDTPool.methods.calcUnclaimedEarningInUnderlying().call() // don't scale decimal as the number can be very small
  console.log('Total unclaimed USDT interest * 1e6 in USDTPool is: ' + USDTInterestEarned)


  /***************************************
                DTOKENS
  ****************************************/

  // dUSD
  console.log('=========dUSD STATS=========')
  // get total supply
  const dUSDTotalSupply = await dUSD.methods.totalSupply().call() / 1e18 // dUSD is 18 decimal place
  console.log('Total dUSD supply is: ' + dUSDTotalSupply)

  /***************************************
                DELT Reward Pool
  ****************************************/

  console.log('=========DELT REWARD POOL STATS=========')
  const rewardsPerBlock = await deltRewardPool.methods.rewardsPerBlock().call() / 1e18 // 18 decimal place
  console.log('Pool current rewardsPerBlock is: ' + rewardsPerBlock)
  const rewardsPerShare = await deltRewardPool.methods.rewardsPerShare().call() / 1e18 // scaled
  console.log('Pool current rewardsPerShare is: ' + rewardsPerShare)
  const unclaimed = await deltRewardPool.methods.unclaimedRewards(account.address).call() / 1e18 // 18 decimal place
  console.log('My current unclaimed reward balance is: ' + unclaimed)

  console.log('\n')
}


main()
