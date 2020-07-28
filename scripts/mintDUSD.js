const { ropstenProjectId, accountOnePrivateKey } = require('../secrets.json')
const Web3 = require('web3')
const { setupLoader } = require('@openzeppelin/contract-loader')

async function main() {
  // Set up web3 object, connected to the local development network, and a contract loader
  const web3 = new Web3(new Web3.providers.HttpProvider(`https://ropsten.infura.io/v3/${ropstenProjectId}`))
  web3.eth.accounts.wallet.add(accountOnePrivateKey)
  const loader = setupLoader({ provider: web3 }).web3
  // //
  const accounts = await web3.eth.getAccounts();
  console.log(accounts)
  // // Set up a web3 contract, representing our deployed dUSD instance, using the contract loader
  // const dUSDAddress = '0xdd4e3c7A3C093412E48A3Ca17Dc4521eCAc86E26'
  // const dUSD = loader.fromArtifact('dUSD', dUSDAddress)
  // const value = await dUSD.methods.totalSupply().call()
  // console.log(value)
}

main()
