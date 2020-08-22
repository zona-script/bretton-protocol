// ============ Contracts ============

const USDCPool = artifacts.require("USDCPool");
const USDTPool = artifacts.require("USDTPool");
const DAIPool = artifacts.require("DAIPool");
const nUSDMintRewardPool = artifacts.require("nUSDMintRewardPool");
const nUSD = artifacts.require("nUSD");

// ============ Main Migration ============

const migration = async (deployer, network, accounts) => {
  await Promise.all([
    deployNUSD(deployer, network),
  ]);
};

module.exports = migration;

// ============ Deploy Functions ============

async function deployNUSD(deployer, network) {
  const initialEarningPools = [USDCPool.address, USDTPool.address, DAIPool.address];
  await deployer.deploy(nUSD, initialEarningPools, nUSDMintRewardPool.address);
}
