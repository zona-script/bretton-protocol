// ============ Contracts ============

const USDCPool = artifacts.require("USDCPool");
const USDTPool = artifacts.require("USDTPool");
const DAIPool = artifacts.require("DAIPool");

// ============ Main Migration ============

const migration = async (deployer, network, accounts) => {
  await Promise.all([
    deployEarningPools(deployer, network),
  ]);
};

module.exports = migration;

// ============ Deploy Functions ============

async function deployEarningPools(deployer, network) {
  await deployer.deploy(USDCPool);
  await deployer.deploy(USDTPool);
  await deployer.deploy(DAIPool);
}
