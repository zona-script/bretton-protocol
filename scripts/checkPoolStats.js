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

  const dUSDCpAddress = '0x6968E171E85D325e017173a8ee0ebF633261F970'
  const dUSDCp = loader.fromArtifact('dPool', dUSDCpAddress)

  const dUSDTpAddress = '0xFf687af06ef7a52A7e95c0739b832d3A5FD04946'
  const dUSDTp = loader.fromArtifact('dPool', dUSDTpAddress)

  // USDC Pool
  console.log('=========USDC Pool Stats=========')
  // get total supply
  const USDCPoolTotalSupply = await dUSDCp.methods.totalSupply().call() / 1e6 // USDC is 6 decimal place
  console.log('Total dUSDCp supply is: ' + USDCPoolTotalSupply)
  // get total pool value
  const USDCPoolValue = await dUSDCp.methods.calcPoolValueInUnderlying().call() / 1e6 // USDC is 6 decimal place
  console.log('Total USDC value in dUSDCp is: ' + USDCPoolValue)
  // get interest accured
  const USDCInterestEarned = await dUSDCp.methods.calcEarningInUnderlying().call() // don't scale decimal as the number can be very small
  console.log('Total USDC interest earned * 1e6 in dUSDCp is: ' + USDCInterestEarned)


  // USDT Pool
  console.log('=========USDT POOL STATS=========')
  // get total supply
  const USDTPoolTotalSupply = await dUSDTp.methods.totalSupply().call() / 1e6 // USDT is 6 decimal place
  console.log('Total dUSDTp supply is: ' + USDTPoolTotalSupply)
  // get total pool value
  const USDTPoolValue = await dUSDTp.methods.calcPoolValueInUnderlying().call() / 1e6 // USDT is 6 decimal place
  console.log('Total USDT value in dUSDTp is: ' + USDTPoolValue)
  // get interest accured
  const USDTInterestEarned = await dUSDTp.methods.calcEarningInUnderlying().call() // don't scale decimal as the number can be very small
  console.log('Total USDT interest earned * 1e6 in dUSDTp is: ' + USDTInterestEarned)
}


main()
