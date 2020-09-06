// ============ Contracts ============

const BRETToken = artifacts.require("BRETToken");
const nUSD_BRET_Pool = artifacts.require("nUSD_BRET_Pool");
const Referral = artifacts.require("Referral");

// ============ Main Migration ============

const migration = async (deployer, network, accounts) => {
  await Promise.all([
    deployLPPools(deployer, network),
  ]);
};

module.exports = migration;

// ============ Deploy Functions ============

async function deployLPPools(deployer, network) {
  let referral = await Referral.deployed()
  let bretToken = await BRETToken.deployed()

  let nUSD_BRET_Pool_with_bonus = await deployer.deploy(
    nUSD_BRET_Pool,
    '0x6C6d9d832ef4DDCba52eeDECbe7C27e3F268E3Fe', // BRET on kovan
    referral.address,
    '1000000000000000000000000',
    '1599279245', // 09/05/2020 @ 4:14am (UTC)
    '0x3d42836AB7Dd6912D4512bE51Ee01D4bD2Ce18a7'
  )
  await bretToken.addMinter(nUSD_BRET_Pool_with_bonus.address)
  await referral.setAdminStatus(nUSD_BRET_Pool_with_bonus.address, true)
  await nUSD_BRET_Pool_with_bonus.notifyRewardAmount(0)
}
