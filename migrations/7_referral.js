// ============ Contracts ============

const Referral = artifacts.require("Referral");

// ============ Main Migration ============

const migration = async (deployer, network, accounts) => {
  await Promise.all([
    deployReferral(deployer, network),
  ]);
};

module.exports = migration;

// ============ Deploy Functions ============

async function deployReferral(deployer, network) {
  await deployer.deploy(Referral)
}
