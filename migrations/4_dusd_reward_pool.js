// ============ Contracts ============

const DELTToken = artifacts.require("DELTToken");
const dUSDMintRewardPool = artifacts.require("dUSDMintRewardPool");

// ============ Main Migration ============

const migration = async (deployer, network, accounts) => {
  await Promise.all([
    deployRewardPool(deployer, network),
  ]);
};

module.exports = migration;

// ============ Deploy Functions ============

async function deployRewardPool(deployer, network) {
  await deployer.deploy(dUSDMintRewardPool, DELTToken.address);
}
