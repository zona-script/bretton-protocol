const { accounts, contract, web3 } = require('@openzeppelin/test-environment')
const { BN, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers')
const { expect } = require('chai')

// Load compiled artifacts
const ERC20Fake = contract.fromArtifact('ERC20Fake')
const RewardPoolFake = contract.fromArtifact('RewardPoolFake')

describe('RewardPool', function () {
  const [ admin, user, user2, user3 ] = accounts

  let rewardToken, rewardPool
  const rewardsPerBlock = new BN('100000000000000000000') // 100 per block, reward token is 18 decimal place
  beforeEach(async () => {
      // deploy reward token
      rewardToken = await ERC20Fake.new(
        'Reward Token',
        'RWD',
        '18',
        { from: admin }
      )

      // deploy reward pool
      rewardPool = await RewardPoolFake.new(
        'Fake Reward Pool',
        'FRP',
        '18',
        rewardToken.address,
        rewardsPerBlock,
        { from: admin }
      )
  })

  describe('init', function () {
    it.skip("should set all initial state", async () => {

    })
  })

  describe('calculate reward earnings', function () {
    describe('when entering in a new pool with rewards already accrued', function () {
      const totalRewardsInPool = new BN('10000000000000000000000')  // 10000
      beforeEach(async () => {
        // mint reward tokens to pool
        await rewardToken.mint(rewardPool.address, totalRewardsInPool)

        // accrue some rewards
        await rewardPool.increaseBlockNumber('1')
      })

      describe('as a single share holder', async () => {
        beforeEach(async () => {
          // increase user shares
          await rewardPool.increaseShares(user, new BN('1000000000000000000')) // 1
        })

        it('should earns all rewards up to lastest block', async () => {
          // rewards per block = 100
          // user rewards = rewards per block * blocks = 100
          expect(await rewardPool.unclaimedRewards.call(user)).to.be.bignumber.equal(new BN('100000000000000000000'))
        })

        describe('after a block is mined', async () => {
          beforeEach(async () => {
            // increase block number
            await rewardPool.increaseBlockNumber('1')
          })

          it('should accumulate more rewards', async () => {
            // user rewards = rewards per block * blocks = 200
            expect(await rewardPool.unclaimedRewards.call(user)).to.be.bignumber.equal(new BN('200000000000000000000'))
          })

          describe('as more people enters pool', async () => {
            beforeEach(async () => {
              // increase user2 shares
              await rewardPool.increaseShares(user2, new BN('1000000000000000000')) // 1

              // increase user3 shares
              await rewardPool.increaseShares(user3, new BN('8000000000000000000')) // 8
            })

            it("should not dilute your rewards", async () => {
              // user1 rewards = rewards per block * blocks = 200
              expect(await rewardPool.unclaimedRewards.call(user)).to.be.bignumber.equal(new BN('200000000000000000000'))
              expect(await rewardPool.unclaimedRewards.call(user2)).to.be.bignumber.equal('0')
              expect(await rewardPool.unclaimedRewards.call(user3)).to.be.bignumber.equal('0')
            })

            describe('after a block is mined', async () => {
              beforeEach(async () => {
                // increase block number
                await rewardPool.increaseBlockNumber('1')
              })

              it("should accumulate rewards for all shareholders in pro rata fashion", async () => {
                // user1 rewards = 200 + 10 = 210
                // user2 rewards = 0 + 10 = 10
                // user3 rewards = 0 + 80 = 80
                expect(await rewardPool.unclaimedRewards.call(user)).to.be.bignumber.equal(new BN('210000000000000000000'))
                expect(await rewardPool.unclaimedRewards.call(user2)).to.be.bignumber.equal(new BN('10000000000000000000'))
                expect(await rewardPool.unclaimedRewards.call(user3)).to.be.bignumber.equal(new BN('80000000000000000000'))
              })
            })

            describe('after increase share holdings', async () => {
              beforeEach(async () => {
                // increase user1 shares
                await rewardPool.increaseShares(user, new BN('2000000000000000000')) // 2

                // increase user2 shares
                await rewardPool.increaseShares(user2, new BN('1000000000000000000')) // 1

                // increase user3 shares
                await rewardPool.increaseShares(user3, new BN('1000000000000000000')) // 1
              })

              it("should not accrue rewards without block mined", async () => {
                expect(await rewardPool.unclaimedRewards.call(user)).to.be.bignumber.equal(new BN('200000000000000000000'))
                expect(await rewardPool.unclaimedRewards.call(user2)).to.be.bignumber.equal(new BN('0'))
                expect(await rewardPool.unclaimedRewards.call(user3)).to.be.bignumber.equal(new BN('0'))
              })
            })
          })
        })
      })
    })

    describe('when entering a new pool without rewards accrued', function () {
      const totalRewardsInPool = new BN('10000000000000000000000')  // 10000
      beforeEach(async () => {
        // mint reward tokens to pool
        await rewardToken.mint(rewardPool.address, totalRewardsInPool)

        // increase user shares
        await rewardPool.increaseShares(user, new BN('1000000000000000000')) // 1
      })

      it('should not have any earning', async () => {
        // rewards per block = 100
        // user rewards = rewards per block * blocks = 100
        expect(await rewardPool.unclaimedRewards.call(user)).to.be.bignumber.equal(new BN('0'))
      })

      describe('after a block is mined', async () => {
        beforeEach(async () => {
          // increase block number
          await rewardPool.increaseBlockNumber('1')
        })

        it('should earn rewards in new block', async () => {
          // user rewards = rewards per block * 1 = 100
          expect(await rewardPool.unclaimedRewards.call(user)).to.be.bignumber.equal(new BN('100000000000000000000'))
        })
      })
    })

    describe('when entering a new pool without any rewards balance', function () {
      beforeEach(async () => {
        // increase user shares
        await rewardPool.increaseShares(user, new BN('1000000000000000000')) // 1

        // increase user2 shares
        await rewardPool.increaseShares(user2, new BN('1000000000000000000')) // 1

        // try to accrue some rewards
        await rewardPool.increaseBlockNumber('1')
      })

      it('should not have any earnings', async () => {
        expect(await rewardPool.unclaimedRewards.call(user)).to.be.bignumber.equal(new BN('0'))
        expect(await rewardPool.unclaimedRewards.call(user2)).to.be.bignumber.equal(new BN('0'))
      })

      describe('when rewards are added to pool', async () => {
        beforeEach(async () => {
          // mint reward tokens to pool
          await rewardToken.mint(rewardPool.address, new BN('100000000000000000000')) // 100
        })

        it('should retroactively assign earned rewards to shareholder', async () => {
          // total user rewards = rewards per block * 1 = 100
          // each user rewards = 100 / 2 = 50
          expect(await rewardPool.unclaimedRewards.call(user)).to.be.bignumber.equal(new BN('50000000000000000000'))
          expect(await rewardPool.unclaimedRewards.call(user2)).to.be.bignumber.equal(new BN('50000000000000000000'))
        })
      })
    })
  })

  describe('claim', function () {
    describe('when there are unclaimed rewards', function () {
      it.skip('should withdraw rewards', async () => {

      })

      describe('when there no new rewards left', function () {
        it.skip('should not be able to withdraw rewards', async () => {

        })
      })

      describe('when there new rewards accrued', function () {
        it.skip('should be able to withdraw new rewards', async () => {

        })
      })
    })

    describe('when there are no unclaimed rewards', function () {
      it.skip('should not be able to withdraw rewards', async () => {

      })
    })
  })

  describe('setRewardsPerBlock', function () {
    it.skip('only owner can set rewards per block', async () => {

    })

    it.skip('should not already issued rewards', async () => {

    })
  })

  describe('withdrawRemainingRewards', function () {
    it.skip('only owner can withdraw remaining reward tokens', async () => {

    })
  })
})
