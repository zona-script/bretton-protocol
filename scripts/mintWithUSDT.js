const { ropstenProjectId, accountPrivateKey } = require('../secrets.json')
const Web3 = require('web3')
const { setupLoader } = require('@openzeppelin/contract-loader')

async function main() {
  // setup web3
  const web3 = new Web3(new Web3.providers.HttpProvider(`https://ropsten.infura.io/v3/${ropstenProjectId}`))
  const account = web3.eth.accounts.privateKeyToAccount(accountPrivateKey);
  web3.eth.accounts.wallet.add(account)
  web3.eth.defaultAccount = account.address;
  const loader = setupLoader({ provider: web3 }).web3

  const dUSDAddress = '0xdd4e3c7A3C093412E48A3Ca17Dc4521eCAc86E26'
  const dUSD = loader.fromArtifact('dUSD', dUSDAddress)

  const USDTAddress = '0x516de3a7A567d81737e3a46ec4FF9cFD1fcb0136'
  const USDT = loader.fromArtifact('ERC20', USDTAddress)

  console.log('=========MINT WITH USDT=========')
  console.log('Using account: ' + account.address)

  // balance before
  const USDTBalanceBefore = await USDT.methods.balanceOf(account.address).call() / 1e6 // USDT is 6 decimal place
  console.log('USDT balance before mint: ' + USDTBalanceBefore)
  const dUSDBalanceBefore = await dUSD.methods.balanceOf(account.address).call() / 1e18 // dUSD is 18 decimal place
  console.log('dUSD balance before mint: ' + dUSDBalanceBefore)

  const amountToMint = '900000000' // 1 USDT
  // approve dUSD with 1 USDT
  console.log('Approving USDT...')
  await USDT.methods.approve(dUSDAddress, amountToMint).send({ from: account.address })
  // mint with 1 USDT
  console.log('Mint...')
  await dUSD.methods.mint(USDTAddress, amountToMint).send({ from: account.address, gas: 500000 })

  // balance after
  const USDTBalanceAfter = await USDT.methods.balanceOf(account.address).call() / 1e6 // USDT is 6 decimal place
  console.log('USDT balance after mint: ' + USDTBalanceAfter)
  const dUSDBalanceAfter = await dUSD.methods.balanceOf(account.address).call() / 1e18 // dUSD is 18 decimal place
  console.log('dUSD balance after mint: ' + dUSDBalanceAfter)
}

main()
