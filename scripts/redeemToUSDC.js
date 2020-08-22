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

  const USDCAddress = '0x0D9C8723B343A8368BebE0B5E89273fF8D712e3C'
  const USDC = loader.fromArtifact('ERC20', USDCAddress)

  console.log('\n')

  console.log('=========REDEEM TO USDC=========')
  console.log('Using account: ' + account.address)

  // balance before
  const USDCBalanceBefore = await USDC.methods.balanceOf(account.address).call() / 1e6 // USDC is 6 decimal place
  console.log('USDC balance before mint: ' + USDCBalanceBefore)
  const nUSDBalanceBefore = await nUSD.methods.balanceOf(account.address).call() / 1e18 // nUSD is 18 decimal place
  console.log('nUSD balance before mint: ' + nUSDBalanceBefore)

  // redeem to 1 USDC
  console.log('Redeeming...')
  const receipt = await nUSD.methods.redeem(account.address, USDCAddress, '1000000').send({ from: account.address, gas: 500000 })

  // balance after
  const USDCBalanceAfter = await USDC.methods.balanceOf(account.address).call() / 1e6 // USDC is 6 decimal place
  console.log('USDC balance after mint: ' + USDCBalanceAfter)
  const nUSDBalanceAfter = await nUSD.methods.balanceOf(account.address).call() / 1e18 // nUSD is 18 decimal place
  console.log('nUSD balance after mint: ' + nUSDBalanceAfter)
  console.log('gasUsed: ' + receipt.gasUsed)

  console.log('\n')
}

main()
