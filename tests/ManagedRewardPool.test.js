const { accounts, contract, web3 } = require('@openzeppelin/test-environment')
const { BN, expectEvent, expectRevert } = require('@openzeppelin/test-helpers')
const { expect } = require('chai')

// Load compiled artifacts
const ERC20Fake = contract.fromArtifact('ERC20Fake')
const ManagedRewardPool = contract.fromArtifact('ManagedRewardPool')

describe('ManagedRewardPool', function () {
  const [ admin, manager, user, rewardTokenAddress ] = accounts

  let rewardToken, managedRewardPool
  beforeEach(async () => {
      // deploy reward token
      rewardToken = await ERC20Fake.new(
        'Reward Token',
        'RWD',
        '18',
        { from: admin }
      )

      // deploy reward pool
      managedRewardPool = await ManagedRewardPool.new(
        'Managed Reward Pool',
        'MRP',
        '18',
        rewardToken.address,
        new BN('100000000000000000000'), // 100 per block, reward token is 18 decimal place,
        { from: admin }
      )
  })

  describe('promote and demote', function () {
    it('only admin can promote and demote', async () => {
      // promote
      await expectRevert(
        managedRewardPool.promote(manager, { from: manager }),
        'Ownable: caller is not the owner'
      )
      const promoteReceipt = await managedRewardPool.promote(manager, { from: admin })
      expectEvent(promoteReceipt, 'Promoted', {
        manager: manager,
      });
      expect(await managedRewardPool.isManager.call(manager)).to.be.true

      // demote
      await expectRevert(
        managedRewardPool.demote(manager, { from: manager }),
        'Ownable: caller is not the owner'
      )
      const demoteReceipt = await managedRewardPool.demote(manager, { from: admin })
      expectEvent(demoteReceipt, 'Demoted', {
        manager: manager,
      });
      expect(await managedRewardPool.isManager.call(manager)).to.be.false
    })
  })

  describe('mint and burn shares', function () {
    beforeEach(async () => {
      // promote manager
      await managedRewardPool.promote(manager, { from: admin })
    })

    it('only manager can mint shares', async () => {
      await expectRevert(
        managedRewardPool.mintShares(user, new BN('100'), { from: admin }),
        'MANAGED_REWARD_POOL: caller is not a manager'
      )

      await managedRewardPool.mintShares(user, new BN('100'), { from: manager })
      expect(await managedRewardPool.balanceOf(user)).to.be.bignumber.equal(new BN('100'))
    })

    it('only manager can burn shares', async () => {
      await managedRewardPool.mintShares(user, new BN('100'), { from: manager })

      await expectRevert(
        managedRewardPool.burnShares(user, new BN('100'), { from: admin }),
        'MANAGED_REWARD_POOL: caller is not a manager'
      )

      await managedRewardPool.burnShares(user, new BN('100'), { from: manager })
      expect(await managedRewardPool.balanceOf(user)).to.be.bignumber.equal(new BN('0'))
    })
  })
})
