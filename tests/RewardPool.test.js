const { accounts, contract, web3 } = require('@openzeppelin/test-environment')
const { BN, expectEvent, expectRevert } = require('@openzeppelin/test-helpers')
const { expect } = require('chai')

// Load compiled artifacts
const ERC20Fake = contract.fromArtifact('ERC20Fake')
const RewardPoolFake = contract.fromArtifact('RewardPoolFake')

describe('RewardPool', function () {
  const [ admin, user, user2, user3 ] = accounts

  let rewardToken, rewardPool
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
        '100',
        rewardToken.address,
        { from: admin }
      )
  })

  describe('init', function () {
    it('should initialize states', async () => {
      expect(await rewardPool.DURATION.call()).to.be.bignumber.equal('100')
      expect(await rewardPool.rewardToken.call()).to.be.equal(rewardToken.address)
    })
  })

  describe('calculate reward earnings', function () {
    describe('when entering in a new pool with rewards already accrued', function () {
      const totalRewardsInPool = new BN('10000000000000000000000')  // 10000
      beforeEach(async () => {
        // mint reward tokens to pool
        await rewardToken.mint(rewardPool.address, totalRewardsInPool)

        // notify rewards
        await rewardPool.notifyRewardAmount(totalRewardsInPool, { from: admin })

        // accrue some rewards
        await rewardPool.increaseCurrentTime('1')
      })

      describe('as a single share holder', async () => {
        beforeEach(async () => {
          // increase user shares
          await rewardPool.increaseShares(user, new BN('1000000000000000000')) // 1
        })

        it('should earns all rewards up to current time', async () => {
          // user rewards = rewardRate * seconds passed = 100
          expect(await rewardPool.earned.call(user)).to.be.bignumber.equal(new BN('100000000000000000000'))
        })

        describe('after time pass', async () => {
          beforeEach(async () => {
            // increase time by 1 second
            await rewardPool.increaseCurrentTime('1')
          })

          it('should accumulate more rewards', async () => {
            expect(await rewardPool.earned.call(user)).to.be.bignumber.equal(new BN('200000000000000000000'))
          })

          describe('as more people enters pool', async () => {
            beforeEach(async () => {
              // increase user2 shares
              await rewardPool.increaseShares(user2, new BN('1000000000000000000')) // 1

              // increase user3 shares
              await rewardPool.increaseShares(user3, new BN('8000000000000000000')) // 8
            })

            it("should not dilute your rewards", async () => {
              expect(await rewardPool.earned.call(user)).to.be.bignumber.equal(new BN('200000000000000000000'))
              expect(await rewardPool.earned.call(user2)).to.be.bignumber.equal('0')
              expect(await rewardPool.earned.call(user3)).to.be.bignumber.equal('0')
            })

            describe('after time pass', async () => {
              beforeEach(async () => {
                // increase by 1 second
                await rewardPool.increaseCurrentTime('1')
              })

              it("should accumulate rewards for all shareholders in pro rata fashion", async () => {
                // user1 rewards = 200 + 10 = 210
                // user2 rewards = 0 + 10 = 10
                // user3 rewards = 0 + 80 = 80
                expect(await rewardPool.earned.call(user)).to.be.bignumber.equal(new BN('210000000000000000000'))
                expect(await rewardPool.earned.call(user2)).to.be.bignumber.equal(new BN('10000000000000000000'))
                expect(await rewardPool.earned.call(user3)).to.be.bignumber.equal(new BN('80000000000000000000'))
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

              it("should not accrue rewards without time passage", async () => {
                expect(await rewardPool.earned.call(user)).to.be.bignumber.equal(new BN('200000000000000000000'))
                expect(await rewardPool.earned.call(user2)).to.be.bignumber.equal(new BN('0'))
                expect(await rewardPool.earned.call(user3)).to.be.bignumber.equal(new BN('0'))
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

        // notify rewards
        await rewardPool.notifyRewardAmount(totalRewardsInPool, { from: admin })

        // increase user shares
        await rewardPool.increaseShares(user, new BN('1000000000000000000')) // 1
      })

      it('should not have any earning', async () => {
        expect(await rewardPool.earned.call(user)).to.be.bignumber.equal(new BN('0'))
      })

      describe('after time pass', async () => {
        beforeEach(async () => {
          // increase time by 1 second
          await rewardPool.increaseCurrentTime('1')
        })

        it('should earn rewards', async () => {
          // user rewards = rewardRate * 1 second = 100
          expect(await rewardPool.earned.call(user)).to.be.bignumber.equal(new BN('100000000000000000000'))
        })
      })
    })

    describe('when entering a new pool without any rewards balance', function () {
      beforeEach(async () => {
        // increase user shares
        await rewardPool.increaseShares(user, new BN('1000000000000000000')) // 1

        // increase user2 shares
        await rewardPool.increaseShares(user2, new BN('1000000000000000000')) // 1

        // accrue rewards
        await rewardPool.increaseCurrentTime('1')
      })

      it('should not have any earnings', async () => {
        expect(await rewardPool.earned.call(user)).to.be.bignumber.equal(new BN('0'))
        expect(await rewardPool.earned.call(user2)).to.be.bignumber.equal(new BN('0'))
      })
    })
  })

  describe('claim rewards', function () {
    describe('when user has unclaimed rewards', function () {
      beforeEach(async () => {
        // mint reward tokens to pool
        await rewardToken.mint(rewardPool.address, new BN('10000000000000000000000')) //10000

        // notify rewards
        await rewardPool.notifyRewardAmount(new BN('10000000000000000000000'), { from: admin })

        // increase user shares
        await rewardPool.increaseShares(user, new BN('1000000000000000000')) // 1

        // accrue rewards
        await rewardPool.increaseCurrentTime('1')
      })

      it('should withdraw rewards', async () => {
        const userRewardBalanceBefore = await rewardToken.balanceOf.call(user)

        const receipt = await rewardPool.claim({from: user})

        const userRewardBalanceAfter = await rewardToken.balanceOf.call(user)
        expectEvent(receipt, 'RewardPaid', {
          user: user,
          amount: new BN('100000000000000000000')
        });
        expect(userRewardBalanceAfter.sub(userRewardBalanceBefore)).to.be.bignumber.equal(new BN('100000000000000000000')) // 100
      })

      describe('when all rewards are claimed', function () {
        beforeEach(async () => {
          // claim all outstanding rewards
          await rewardPool.claim({from: user})
        })

        it('should not be able to withdraw more rewards', async () => {
          const userRewardBalanceBefore = await rewardToken.balanceOf.call(user)

          const receipt = await rewardPool.claim({from: user})

          const userRewardBalanceAfter = await rewardToken.balanceOf.call(user)
          expect(userRewardBalanceAfter).to.be.bignumber.equal(userRewardBalanceBefore)
        })

        describe('when there are new rewards accrued', function () {
          beforeEach(async () => {
            // increase time
            await rewardPool.increaseCurrentTime('1')
          })

          it('should be able to withdraw new rewards', async () => {
            const userRewardBalanceBefore = await rewardToken.balanceOf.call(user)

            const receipt = await rewardPool.claim({from: user})

            const userRewardBalanceAfter = await rewardToken.balanceOf.call(user)
            expectEvent(receipt, 'RewardPaid', {
              user: user,
              amount: new BN('100000000000000000000')
            });
            expect(userRewardBalanceAfter.sub(userRewardBalanceBefore)).to.be.bignumber.equal(new BN('100000000000000000000')) // 100
          })
        })
      })
    })

    describe('when user has no shares', function () {
      beforeEach(async () => {
        // mint reward tokens to pool
        await rewardToken.mint(rewardPool.address, new BN('10000000000000000000000')) //10000

        // notify rewards
        await rewardPool.notifyRewardAmount(new BN('10000000000000000000000'), { from: admin })

        // increase time
        await rewardPool.increaseCurrentTime('1')
      })

      it('should not be able to claim rewards', async () => {
        const userRewardBalanceBefore = await rewardToken.balanceOf.call(user)

        const receipt = await rewardPool.claim({from: user})

        const userRewardBalanceAfter = await rewardToken.balanceOf.call(user)
        expect(userRewardBalanceAfter).to.be.bignumber.equal(userRewardBalanceBefore)
      })
    })

    describe('when user has shares but there are no rewards in pool', function () {
      beforeEach(async () => {
        // increase user shares
        await rewardPool.increaseShares(user, new BN('1000000000000000000')) // 1

        // increase time
        await rewardPool.increaseCurrentTime('1')
      })

      it('should not be able to claim rewards', async () => {
        const userRewardBalanceBefore = await rewardToken.balanceOf.call(user)

        const receipt = await rewardPool.claim({from: user})

        const userRewardBalanceAfter = await rewardToken.balanceOf.call(user)
        expect(userRewardBalanceAfter).to.be.bignumber.equal(userRewardBalanceBefore)
      })
    })
  })

  describe("using reward tokens with diff decimals as pool shares", () => {
    let rewardToken6Decimal, rewardPool18Decimal
    beforeEach(async () => {
      // deploy reward token
      rewardToken6Decimal = await ERC20Fake.new(
        'Reward Token',
        'RWD',
        '6',
        { from: admin }
      )

      // deploy reward pool
      rewardPool18Decimal = await RewardPoolFake.new(
        '100', // 100 seconds
        rewardToken6Decimal.address,
        { from: admin }
      )
    })

    it("should not affect the pro rata payouts", async () => {
      const totalRewardsInPool = new BN('10000000000')  // 10000
      // rwardRatePerSecond = 100 / second

      // mint reward tokens to pool
      await rewardToken6Decimal.mint(rewardPool18Decimal.address, totalRewardsInPool)

      // notify rewards
      await rewardPool18Decimal.notifyRewardAmount(totalRewardsInPool, { from: admin })

      // increase user shares
      await rewardPool18Decimal.increaseShares(user, new BN('1000000000000000000')) // 1

      // increase time
      await rewardPool18Decimal.increaseCurrentTime('1')

      // user rewards = rwardRatePerSecond * 1 second = 100 rewards
      expect(await rewardPool18Decimal.earned.call(user)).to.be.bignumber.equal(new BN('100000000'))

      // increase time
      await rewardPool18Decimal.increaseCurrentTime('1')

      // user rewards = rwardRatePerSecond * 2 second = 200 rewards
      expect(await rewardPool18Decimal.earned.call(user)).to.be.bignumber.equal(new BN('200000000'))

      // user2 enters pool
      await rewardPool18Decimal.increaseShares(user2, new BN('1000000000000000000')) // 1

      // user3 enters pool
      await rewardPool18Decimal.increaseShares(user3, new BN('8000000000000000000')) // 8

      /*
        ========
        user 1 shares = 1
        user 2 shares = 1
        user 3 shares = 8
        ========
      */

      // should not dilute user1 rewards
      // user1 rewards = 100 rewards per block * 2 blocks = 200
      expect(await rewardPool18Decimal.earned.call(user)).to.be.bignumber.equal(new BN('200000000'))
      expect(await rewardPool18Decimal.earned.call(user2)).to.be.bignumber.equal('0')
      expect(await rewardPool18Decimal.earned.call(user3)).to.be.bignumber.equal('0')

      // increase time
      await rewardPool18Decimal.increaseCurrentTime('1')

      // user1 rewards = 200 + 10 = 210
      // user2 rewards = 0 + 10 = 10
      // user3 rewards = 0 + 80 = 80
      expect(await rewardPool18Decimal.earned.call(user)).to.be.bignumber.equal(new BN('210000000'))
      expect(await rewardPool18Decimal.earned.call(user2)).to.be.bignumber.equal(new BN('10000000'))
      expect(await rewardPool18Decimal.earned.call(user3)).to.be.bignumber.equal(new BN('80000000'))

      // user 3 exit pool
      await rewardPool18Decimal.decreaseShares(user3, new BN('8000000000000000000'))

      /*
        ========
        user 1 shares = 1
        user 2 shares = 1
        user 3 shares = 0
        ========
      */

      // increase time
      await rewardPool18Decimal.increaseCurrentTime('1')

      // user1 rewards = 200 + 10 + 50 = 260
      // user2 rewards = 0 + 10 + 50 = 60
      // user3 rewards = 0 + 80 + 0 = 80
      expect(await rewardPool18Decimal.earned.call(user)).to.be.bignumber.equal(new BN('260000000'))
      expect(await rewardPool18Decimal.earned.call(user2)).to.be.bignumber.equal(new BN('60000000'))
      expect(await rewardPool18Decimal.earned.call(user3)).to.be.bignumber.equal(new BN('80000000'))
    })
  })
})
