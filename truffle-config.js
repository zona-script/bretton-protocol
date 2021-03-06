require('dotenv-flow').config();
const HDWalletProvider = require("@truffle/hdwallet-provider");
var Web3 = require('web3');

module.exports = {
  compilers: {
    solc: {
      version: '0.5.16',
      parser: 'solcjs',
      settings: {
        optimizer: {
          enabled: true,
          runs: 50000
        },
        evmVersion: 'istanbul',
      },
    },
  },
  plugins: [
    'truffle-plugin-verify'
  ],
  api_keys: {
    etherscan: process.env.ETHERSCAN_API_KEY
  },
  networks: {
    mainnet: {
      network_id: '1',
      provider: () => new HDWalletProvider(
        [process.env.DEPLOYER_PRIVATE_KEY],
        "https://mainnet.infura.io/v3/7244e42d02b744158c1c48c484262744",
        0,
        1,
      ),
      gasPrice: process.env.GAS_PRICE,
      gas: 8000000,
      from: process.env.DEPLOYER_ACCOUNT,
      timeoutBlocks: 8000,
    },
    ropsten: {
      network_id: '3',
      provider: () => new HDWalletProvider(
        [process.env.DEPLOYER_PRIVATE_KEY],
        'https://ropsten.infura.io/v3/7244e42d02b744158c1c48c484262744',
        0,
        1,
      ),
      gasPrice: Number(process.env.GAS_PRICE),
      gas: 6900000,
      from: process.env.DEPLOYER_ACCOUNT,
      timeoutBlocks: 500,
    },
    kovan: {
      network_id: '42',
      provider: () => new HDWalletProvider(
        [process.env.DEPLOYER_PRIVATE_KEY],
        'https://kovan.infura.io/v3/04c5f76635f24c70b28488be34dbd838',
        0,
        1,
      ),
      gasPrice: 1000000000, // 1 gwei
      gas: 6900000,
      from: process.env.DEPLOYER_ACCOUNT,
      timeoutBlocks: 500,
    },
  },
};
