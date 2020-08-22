// ============ Contracts ============

const USDCPool = artifacts.require("USDCPool");
const USDTPool = artifacts.require("USDTPool");
const DAIPool = artifacts.require("DAIPool");
const dUSDMintRewardPool = artifacts.require("dUSDMintRewardPool");
const dUSD = artifacts.require("dUSD");

// ============ Main Migration ============

const migration = async (deployer, network, accounts) => {
  await Promise.all([
    deployDUSD(deployer, network),
  ]);
};

module.exports = migration;

// ============ Deploy Functions ============

async function deployDUSD(deployer, network) {
  const initialEarningPools = [USDCPool.address, USDTPool.address, DAIPool.address];
  await deployer.deploy(dUSD, initialEarningPools, dUSDMintRewardPool.address);
}
