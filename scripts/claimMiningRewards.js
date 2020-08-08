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
  const DELTRewardPoolAddress = proxies['Delta Protocol/DELTRewardPool'][proxies['Delta Protocol/DELTRewardPool'].length - 1]['address']
  const deltRewardPool = loader.fromArtifact('DELTRewardPool', DELTRewardPoolAddress)

  const DELTTokenAddress = proxies['Delta Protocol/ERC20Fake'][proxies['Delta Protocol/ERC20Fake'].length - 1]['address']
  const DELT = loader.fromArtifact('ERC20Fake', DELTTokenAddress)

  console.log('\n')

  console.log('=========CLAIM DELT FROM MINE=========')
  console.log('Using account: ' + account.address)

  // balance before
  const DELTBalanceBefore = await DELT.methods.balanceOf(account.address).call() / 1e18 // DELT is 18 decimal place
  console.log('DELT balance before claim: ' + DELTBalanceBefore)

  // claim rewards
  console.log('Claiming...')
  const receipt = await deltRewardPool.methods.claim(account.address).send({ from: account.address, gas: 500000 }) // from address does not matter here, anyone can claim

  // balance after
  const DELTBalanceAfter = await DELT.methods.balanceOf(account.address).call() / 1e18 // DELT is 18 decimal place
  console.log('DELT balance after claim: ' + DELTBalanceAfter)
  console.log('gasUsed: ' + receipt.gasUsed)

  console.log('\n')
}

main()
