// src/index.js
const Web3 = require('web3');
const { setupLoader } = require('@openzeppelin/contract-loader');

async function main() {
  // Set up web3 object, connected to the local development network, and a contract loader
  const web3 = new Web3('http://localhost:8545');
  const loader = setupLoader({ provider: web3 }).web3;

  // Set up a web3 contract, representing our deployed dUSD instance, using the contract loader
  const address = '0xCE61dA65F2718c6095481aB8c7f049481b297b17';
  const box = loader.fromArtifact('dUSD', address);
}

main();
