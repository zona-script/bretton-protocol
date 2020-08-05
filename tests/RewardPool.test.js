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
        'Fake Reward Pool',
        'FRP',
        '18',
        rewardToken.address,
        new BN('100000000000000000000'), // 100 per block, reward token is 18 decimal place,
        { from: admin }
      )
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

  describe('claim rewards', function () {
    describe('when user has unclaimed rewards', function () {
      beforeEach(async () => {
        // mint reward tokens to pool
        await rewardToken.mint(rewardPool.address, new BN('10000000000000000000000')) //10000

        // increase user shares
        await rewardPool.increaseShares(user, new BN('1000000000000000000')) // 1

        // mine a block
        await rewardPool.increaseBlockNumber('1')
      })

      it('should withdraw rewards', async () => {
        const userRewardBalanceBefore = await rewardToken.balanceOf.call(user)

        const receipt = await rewardPool.claim(user)

        const userRewardBalanceAfter = await rewardToken.balanceOf.call(user)
        expectEvent(receipt, 'RewardPaid', {
          user: user,
          amount: new BN('100000000000000000000')
        });
        expect(userRewardBalanceAfter.sub(userRewardBalanceBefore)).to.be.bignumber.equal(new BN('100000000000000000000')) // 100
        expect(await rewardPool.totalRewardsClaimed.call()).to.be.bignumber.equal(new BN('100000000000000000000')) // 100
      })

      describe('when all rewards are claimed', function () {
        beforeEach(async () => {
          // claim all outstanding rewards
          await rewardPool.claim(user)
        })

        it('should not be able to withdraw more rewards', async () => {
          const userRewardBalanceBefore = await rewardToken.balanceOf.call(user)

          const receipt = await rewardPool.claim(user)

          const userRewardBalanceAfter = await rewardToken.balanceOf.call(user)
          expect(userRewardBalanceAfter).to.be.bignumber.equal(userRewardBalanceBefore)
        })

        describe('when there are new rewards accrued', function () {
          beforeEach(async () => {
            // mine a block
            await rewardPool.increaseBlockNumber('1')
          })

          it('should be able to withdraw new rewards', async () => {
            const userRewardBalanceBefore = await rewardToken.balanceOf.call(user)

            const receipt = await rewardPool.claim(user)

            const userRewardBalanceAfter = await rewardToken.balanceOf.call(user)
            expectEvent(receipt, 'RewardPaid', {
              user: user,
              amount: new BN('100000000000000000000')
            });
            expect(userRewardBalanceAfter.sub(userRewardBalanceBefore)).to.be.bignumber.equal(new BN('100000000000000000000')) // 100
            expect(await rewardPool.totalRewardsClaimed.call()).to.be.bignumber.equal(new BN('200000000000000000000')) // 200
          })
        })
      })
    })

    describe('when user has no shares', function () {
      beforeEach(async () => {
        // mint reward tokens to pool
        await rewardToken.mint(rewardPool.address, new BN('10000000000000000000000')) //10000

        // mine a block
        await rewardPool.increaseBlockNumber('1')
      })

      it('should not be able to withdraw rewards', async () => {
        const userRewardBalanceBefore = await rewardToken.balanceOf.call(user)

        const receipt = await rewardPool.claim(user)

        const userRewardBalanceAfter = await rewardToken.balanceOf.call(user)
        expect(userRewardBalanceAfter).to.be.bignumber.equal(userRewardBalanceBefore)
        expect(await rewardPool.totalRewardsClaimed.call()).to.be.bignumber.equal(new BN('0'))
      })
    })

    describe('when user has shares but there are no rewards in pool', function () {
      beforeEach(async () => {
        // increase user shares
        await rewardPool.increaseShares(user, new BN('1000000000000000000')) // 1

        // mine a block
        await rewardPool.increaseBlockNumber('1')
      })

      it('should not be able to withdraw rewards', async () => {
        const userRewardBalanceBefore = await rewardToken.balanceOf.call(user)

        const receipt = await rewardPool.claim(user)

        const userRewardBalanceAfter = await rewardToken.balanceOf.call(user)
        expect(userRewardBalanceAfter).to.be.bignumber.equal(userRewardBalanceBefore)
        expect(await rewardPool.totalRewardsClaimed.call()).to.be.bignumber.equal(new BN('0'))
      })
    })
  })

  describe('setRewardsPerBlock', function () {
    it('only owner can set rewards per block', async () => {
      await expectRevert(
        rewardPool.setRewardsPerBlock(new BN('10'), { from: user }),
        'Ownable: caller is not the owner'
      )

      const newRewardsPerBlock = new BN('10')
      await rewardPool.setRewardsPerBlock(newRewardsPerBlock, { from: admin })
      expect(await rewardPool.rewardsPerBlock.call()).to.be.bignumber.equal(newRewardsPerBlock)
    })

    it('should affect all unclaimed rewards', async () => {
      // mint reward tokens to pool
      await rewardToken.mint(rewardPool.address, new BN('10000000000000000000000')) //10000

      // increase user shares
      await rewardPool.increaseShares(user, new BN('1000000000000000000')) // 1

      // mine a block
      await rewardPool.increaseBlockNumber('1')

      // user should have 100 rewards
      expect(await rewardPool.unclaimedRewards.call(user)).to.be.bignumber.equal(new BN('100000000000000000000'))

      // set new rewards per block
      const newRewardsPerBlock = new BN('10000000000000000000')
      await rewardPool.setRewardsPerBlock(newRewardsPerBlock, { from: admin })

      // user should now have 10 rewards
      expect(await rewardPool.unclaimedRewards.call(user)).to.be.bignumber.equal(new BN('10000000000000000000'))

      // mine a block
      await rewardPool.increaseBlockNumber('1')

      // user should still have 20 rewards
      expect(await rewardPool.unclaimedRewards.call(user)).to.be.bignumber.equal(new BN('20000000000000000000'))
    })
  })

  describe('withdrawRemainingRewards', function () {
    beforeEach(async () => {
      // mint reward tokens to pool
      await rewardToken.mint(rewardPool.address, new BN('10000000000000000000000')) //10000
    })

    it('only owner can withdraw remaining reward tokens', async () => {
      await expectRevert(
        rewardPool.withdrawRemainingRewards({ from: user }),
        'Ownable: caller is not the owner'
      )

      await rewardPool.withdrawRemainingRewards({ from: admin })
      const adminRewardBalanceAfter = await rewardToken.balanceOf.call(admin)
      const poolRewardBalanceAfter = await rewardToken.balanceOf.call(rewardPool.address)
      expect(adminRewardBalanceAfter).to.be.bignumber.equal(new BN('10000000000000000000000'))
      expect(poolRewardBalanceAfter).to.be.bignumber.equal(new BN('0'))
    })
  })
})
