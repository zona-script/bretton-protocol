const { ropstenProjectId, accountPrivateKey } = require('../secrets.json')
const nUSDABI = require('../build/contracts/nUSD.json')

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
  const nUSDAddress = nUSDABI.networks[3].address
  const nUSD = loader.fromArtifact('nUSD', nUSDAddress)

  const DAIAddress = '0xc2118d4d90b274016cB7a54c03EF52E6c537D957'
  const DAI = loader.fromArtifact('ERC20', DAIAddress)

  console.log('\n')

  console.log('=========REDEEM TO DAI=========')
  console.log('Using account: ' + account.address)

  // balance before
  const DAIBalanceBefore = await DAI.methods.balanceOf(account.address).call() / 1e18 // DAI is 18 decimal place
  console.log('DAI balance before mint: ' + DAIBalanceBefore)
  const nUSDBalanceBefore = await nUSD.methods.balanceOf(account.address).call() / 1e18 // nUSD is 18 decimal place
  console.log('nUSD balance before mint: ' + nUSDBalanceBefore)

  // redeem to 1 DAI
  console.log('Redeeming...')
  const receipt = await nUSD.methods.redeem(account.address, DAIAddress, '1000000000000000000').send({ from: account.address, gas: 500000 })

  // balance after
  const DAIBalanceAfter = await DAI.methods.balanceOf(account.address).call() / 1e18 // DAI is 18 decimal place
  console.log('DAI balance after mint: ' + DAIBalanceAfter)
  const nUSDBalanceAfter = await nUSD.methods.balanceOf(account.address).call() / 1e18 // nUSD is 18 decimal place
  console.log('nUSD balance after mint: ' + nUSDBalanceAfter)
  console.log('gasUsed: ' + receipt.gasUsed)

  console.log('\n')
}

main()
