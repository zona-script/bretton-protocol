// ============ Contracts ============

const BRETToken = artifacts.require("BRETToken");
const nUSDMintRewardPool = artifacts.require("nUSDMintRewardPool");

// ============ Main Migration ============

const migration = async (deployer, network, accounts) => {
  await Promise.all([
    deployRewardPool(deployer, network),
  ]);
};

module.exports = migration;

// ============ Deploy Functions ============

async function deployRewardPool(deployer, network) {
  await deployer.deploy(nUSDMintRewardPool, BRETToken.address);
}
