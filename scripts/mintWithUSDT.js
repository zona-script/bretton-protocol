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
  const dUSDAddress = proxies['Delta Protocol/dUSD'][proxies['Delta Protocol/dUSD'].length - 1]['address']
  const dUSD = loader.fromArtifact('dUSD', dUSDAddress)

  const USDTAddress = '0x516de3a7A567d81737e3a46ec4FF9cFD1fcb0136'
  const USDT = loader.fromArtifact('ERC20', USDTAddress)

  console.log('\n')

  console.log('=========MINT WITH USDT=========')
  console.log('Using account: ' + account.address)

  // balance before
  const USDTBalanceBefore = await USDT.methods.balanceOf(account.address).call() / 1e6 // USDT is 6 decimal place
  console.log('USDT balance before mint: ' + USDTBalanceBefore)
  const dUSDBalanceBefore = await dUSD.methods.balanceOf(account.address).call() / 1e18 // dUSD is 18 decimal place
  console.log('dUSD balance before mint: ' + dUSDBalanceBefore)

  const amountToMint = '1000000' // 1 USDT
  // approve dUSD with 1 USDT
  console.log('Approving USDT...')
  await USDT.methods.approve(dUSDAddress, amountToMint).send({ from: account.address })
  // mint with 1 USDT
  console.log('Mint...')
  const receipt = await dUSD.methods.mint(account.address, USDTAddress, amountToMint).send({ from: account.address, gas: 500000 })

  // balance after
  const USDTBalanceAfter = await USDT.methods.balanceOf(account.address).call() / 1e6 // USDT is 6 decimal place
  console.log('USDT balance after mint: ' + USDTBalanceAfter)
  const dUSDBalanceAfter = await dUSD.methods.balanceOf(account.address).call() / 1e18 // dUSD is 18 decimal place
  console.log('dUSD balance after mint: ' + dUSDBalanceAfter)
  console.log('gasUsed: ' + receipt.gasUsed)

  console.log('\n')
}

main()
