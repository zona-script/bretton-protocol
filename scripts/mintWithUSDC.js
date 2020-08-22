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

  console.log('\n')

  console.log('=========MINT WITH USDC=========')
  console.log('Using account: ' + account.address)

  // balance before
  const USDCBalanceBefore = await USDC.methods.balanceOf(account.address).call() / 1e6 // USDC is 6 decimal place
  console.log('USDC balance before mint: ' + USDCBalanceBefore)
  const dUSDBalanceBefore = await dUSD.methods.balanceOf(account.address).call() / 1e18 // dUSD is 18 decimal place
  console.log('dUSD balance before mint: ' + dUSDBalanceBefore)

  const amountToMint = '1000000' // 1 USDC
  // approve dUSD with 1 USDC
  console.log('Approving USDC...')
  await USDC.methods.approve(dUSDAddress, amountToMint).send({ from: account.address })
  // mint with 1 USDC
  console.log('Mint...')
  const receipt = await dUSD.methods.mint(account.address, USDCAddress, amountToMint).send({ from: account.address, gas: 500000 })

  // balance after
  const USDCBalanceAfter = await USDC.methods.balanceOf(account.address).call() / 1e6 // USDC is 6 decimal place
  console.log('USDC balance after mint: ' + USDCBalanceAfter)
  const dUSDBalanceAfter = await dUSD.methods.balanceOf(account.address).call() / 1e18 // dUSD is 18 decimal place
  console.log('dUSD balance after mint: ' + dUSDBalanceAfter)
  console.log('gasUsed: ' + receipt.gasUsed)

  console.log('\n')
}

main()
