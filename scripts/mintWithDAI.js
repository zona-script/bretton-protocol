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
  console.log(dUSDAddress)
  const dUSD = loader.fromArtifact('dUSD', dUSDAddress)

  const DAIAddress = '0xc2118d4d90b274016cB7a54c03EF52E6c537D957'
  const DAI = loader.fromArtifact('ERC20', DAIAddress)

  console.log('\n')

  console.log('=========MINT WITH DAI=========')
  console.log('Using account: ' + account.address)

  // balance before
  const DAIBalanceBefore = await DAI.methods.balanceOf(account.address).call() / 1e18 // DAI is 18 decimal place
  console.log('DAI balance before mint: ' + DAIBalanceBefore)
  const dUSDBalanceBefore = await dUSD.methods.balanceOf(account.address).call() / 1e18 // dUSD is 18 decimal place
  console.log('dUSD balance before mint: ' + dUSDBalanceBefore)

  const amountToMint = '1000000000000000000000' // 1 DAI
  // approve dUSD with 1 DAI
  console.log('Approving DAI...')
  await DAI.methods.approve(dUSDAddress, amountToMint).send({ from: account.address })
  // mint with 1 DAI
  console.log('Mint...')
  const receipt = await dUSD.methods.mint(account.address, DAIAddress, amountToMint).send({ from: account.address, gas: 500000 })

  // balance after
  const DAIBalanceAfter = await DAI.methods.balanceOf(account.address).call() / 1e18 // DAI is 18 decimal place
  console.log('DAI balance after mint: ' + DAIBalanceAfter)
  const dUSDBalanceAfter = await dUSD.methods.balanceOf(account.address).call() / 1e18 // dUSD is 18 decimal place
  console.log('dUSD balance after mint: ' + dUSDBalanceAfter)
  console.log('gasUsed: ' + receipt.gasUsed)

  console.log('\n')
}

main()
