// ============ Contracts ============

const BRETToken = artifacts.require("BRETToken");
const nUSDMintRewardPool = artifacts.require("nUSDMintRewardPool");
const nUSD = artifacts.require("nUSD");

// ============ Main Migration ============

const migration = async (deployer, network, accounts) => {
  await Promise.all([
    deploySetup(deployer, network),
  ]);
};

module.exports = migration;

// ============ Deploy Functions ============

async function deploySetup(deployer, network) {
  let rewardPool = await nUSDMintRewardPool.deployed();
  await rewardPool.promote(nUSD.address)
  // let bret = await BRETToken.deployed();
  // let oneMillion = web3.utils.toBN(10**6).mul(web3.utils.toBN(1)).mul(web3.utils.toBN(10**18));
  // console.log(accounts[0])
  // await bretToken.addMinter(accounts[0])
  // await bret.mint(rewardPool.address, oneMillion)
  // await rewardPool.notifyRewardAmount(oneMillion)
}
