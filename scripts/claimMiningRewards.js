const { ropstenProjectId, accountPrivateKey } = require('../secrets.json')
const RewardPoolABI = require('../build/contracts/nUSDMintRewardPool.json')
const BRETTokenABI = require('../build/contracts/BRETToken.json')

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
  const nUSDMintRewardPoolAddress = RewardPoolABI.networks[3].address
  const deltRewardPool = loader.fromArtifact('nUSDMintRewardPool', nUSDMintRewardPoolAddress)

  const BRETTokenAddress = BRETTokenABI.networks[3].address
  const BRET = loader.fromArtifact('BRETToken', BRETTokenAddress)

  console.log('\n')

  console.log('=========CLAIM BRET FROM MINE=========')
  console.log('Using account: ' + account.address)

  // balance before
  const BRETBalanceBefore = await BRET.methods.balanceOf(account.address).call() / 1e18 // BRET is 18 decimal place
  console.log('BRET balance before claim: ' + BRETBalanceBefore)

  // claim rewards
  console.log('Claiming...')
  const receipt = await deltRewardPool.methods.claim().send({ from: account.address, gas: 500000 }) // from address does not matter here, anyone can claim

  // balance after
  const BRETBalanceAfter = await BRET.methods.balanceOf(account.address).call() / 1e18 // BRET is 18 decimal place
  console.log('BRET balance after claim: ' + BRETBalanceAfter)
  console.log('gasUsed: ' + receipt.gasUsed)

  console.log('\n')
}

main()
