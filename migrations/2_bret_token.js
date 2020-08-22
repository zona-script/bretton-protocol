// ============ Contracts ============

const BRETToken = artifacts.require("BRETToken");

// ============ Main Migration ============

const migration = async (deployer, network, accounts) => {
  await Promise.all([
    deployToken(deployer, network),
  ]);
};

module.exports = migration;

// ============ Deploy Functions ============

async function deployToken(deployer, network) {
  await deployer.deploy(BRETToken);
}
