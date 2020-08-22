// ============ Contracts ============

const DELTToken = artifacts.require("DELTToken");
const dUSDMintRewardPool = artifacts.require("dUSDMintRewardPool");
const dUSD = artifacts.require("dUSD");

// ============ Main Migration ============

const migration = async (deployer, network, accounts) => {
  await Promise.all([
    deploySetup(deployer, network),
  ]);
};

module.exports = migration;

// ============ Deploy Functions ============

async function deploySetup(deployer, network) {
  let rewardPool = await dUSDMintRewardPool.deployed();
  await rewardPool.promote(dUSD.address)
  let delt = await DELTToken.deployed();
  let oneMillion = web3.utils.toBN(10**6).mul(web3.utils.toBN(1)).mul(web3.utils.toBN(10**18));
  await delt.mint(rewardPool.address, oneMillion)
  await rewardPool.notifyRewardAmount(oneMillion)
}
