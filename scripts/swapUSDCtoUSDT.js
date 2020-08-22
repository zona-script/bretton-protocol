const { ropstenProjectId, accountPrivateKey } = require('../secrets.json')
const dUSDABI = require('../build/contracts/dUSD.json')

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
  const dUSDAddress = dUSDABI.networks[3].address
  const dUSD = loader.fromArtifact('dUSD', dUSDAddress)

  const USDCAddress = '0x0D9C8723B343A8368BebE0B5E89273fF8D712e3C'
  const USDC = loader.fromArtifact('ERC20', USDCAddress)

  const USDTAddress = '0x516de3a7A567d81737e3a46ec4FF9cFD1fcb0136'
  const USDT = loader.fromArtifact('ERC20', USDTAddress)

  console.log('\n')

  console.log('=========SWAP USDC TO USDT=========')
  console.log('Using account: ' + account.address)

  // balance before
  const USDCBalanceBefore = await USDC.methods.balanceOf(account.address).call() / 1e6 // USDC is 6 decimal place
  console.log('USDC balance before swap: ' + USDCBalanceBefore)
  const USDTBalanceBefore = await USDT.methods.balanceOf(account.address).call() / 1e6 // USDT is 6 decimal place
  console.log('USDT balance before swap: ' + USDTBalanceBefore)

  const amountToSwap = '1000000'
  // approve dUSD with 1 USDC
  console.log('Approving USDC...')
  await USDC.methods.approve(dUSDAddress, amountToSwap).send({ from: account.address })
  // swap from 1 USDC to 1 USDT
  console.log('Swapping...')
  const receipt = await dUSD.methods.swap(account.address, USDCAddress, amountToSwap, USDTAddress).send({ from: account.address, gas: 700000 })

  // balance after
  const USDCBalanceAfter = await USDC.methods.balanceOf(account.address).call() / 1e6 // USDC is 6 decimal place
  console.log('USDC balance after swap: ' + USDCBalanceAfter)
  const USDTBalanceAfter = await USDT.methods.balanceOf(account.address).call() / 1e6 // USDT is 6 decimal place
  console.log('USDT balance after swap: ' + USDTBalanceAfter)
  console.log('gasUsed: ' + receipt.gasUsed)

  console.log('\n')
}

main()
