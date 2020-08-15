const { accounts, contract, web3 } = require('@openzeppelin/test-environment')
const { BN, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers')
const { expect } = require('chai')

// Load compiled artifacts
const ERC20Fake = contract.fromArtifact('ERC20Fake')
const CompoundFake = contract.fromArtifact('CompoundFake')
const StakedRewardPool = contract.fromArtifact('StakedRewardPool')

describe('StakedRewardPool', function () {
  const [ admin, user, payer, beneficiary ] = accounts

  let rewardToken, stakedRewardPool
  beforeEach(async () => {
      // deploy reward token
      rewardToken = await ERC20Fake.new(
        'Reward Token',
        'RWD',
        '18',
        { from: admin }
      )

      // deploy staking token
      stakingToken = await ERC20Fake.new(
        'Staking Token',
        'RWD',
        '18',
        { from: admin }
      )

      // deploy reward pool
      stakedRewardPool = await StakedRewardPool.new(
        stakingToken.address,
        '100', // 100 seconds
        rewardToken.address,
        { from: admin }
      )
  })

  describe('init', function () {
    it('should initialize state', async () => {
      expect(await stakedRewardPool.stakingToken.call()).to.be.equal(stakingToken.address)
      expect(await stakedRewardPool.rewardToken.call()).to.be.equal(rewardToken.address)
      expect(await stakedRewardPool.DURATION.call()).to.be.bignumber.equal('100')
    })
  })

  describe('stake', function () {
    describe('when user do not have enough stake token', function () {
      it('should fail', async () => {
        await expectRevert(
          stakedRewardPool.stake(beneficiary, '100', { from: payer }),
          'SafeERC20: low-level call failed'
        )
      })
    })

    describe('when user have enough stake token', function () {
      beforeEach(async () => {
        // mint staking token for payer
        await stakingToken.mint(payer, '100000000000000000000') // 100
        // payer approve staking to pool
        await stakingToken.approve(stakedRewardPool.address, '100000000000000000000', { from: payer }) // 100
      })

      it('should stake for beneficiary', async () => {
        const stakeAmount = new BN('100000000000000000000')
        const receipt = await stakedRewardPool.stake(beneficiary, stakeAmount, { from: payer })

        expect(await stakedRewardPool.sharesOf(beneficiary)).to.be.bignumber.equal(stakeAmount)
        expect(await stakedRewardPool.sharesOf(payer)).to.be.bignumber.equal('0')
        expect(await stakingToken.balanceOf(payer)).to.be.bignumber.equal('0')
        expectEvent(receipt, 'Staked', {
          beneficiary: beneficiary,
          amount: stakeAmount,
          payer: payer
        })
      })
    })
  })

  describe('withdraw', function () {
    beforeEach(async () => {
      // populate pool with some stake from user to payer
      await stakingToken.mint(user, '100000000000000000000') // 100
      await stakingToken.approve(stakedRewardPool.address, '100000000000000000000', { from: user }) // 100
      await stakedRewardPool.stake(payer, '100000000000000000000', { from: user })
    })

    describe('when user do not have enough stake', function () {
      it('should fail', async () => {
        await expectRevert(
          stakedRewardPool.withdraw(beneficiary, '100', { from: user }),
          'STAKED_REWARD_POOL: withdraw insufficient stake'
        )
      })
    })

    describe('when user have enough stake', function () {
      it('should withdraw to beneficiary', async () => {
        const withdrawAmount = new BN('100000000000000000000')
        const receipt = await stakedRewardPool.withdraw(beneficiary, withdrawAmount, { from: payer })

        expect(await stakedRewardPool.sharesOf(beneficiary)).to.be.bignumber.equal('0')
        expect(await stakedRewardPool.sharesOf(payer)).to.be.bignumber.equal('0')
        expect(await stakedRewardPool.sharesOf(user)).to.be.bignumber.equal('0')
        expect(await stakingToken.balanceOf(payer)).to.be.bignumber.equal('0')
        expect(await stakingToken.balanceOf(user)).to.be.bignumber.equal('0')
        expect(await stakingToken.balanceOf(beneficiary)).to.be.bignumber.equal(withdrawAmount)
        expectEvent(receipt, 'Withdrawn', {
          beneficiary: beneficiary,
          amount: withdrawAmount,
          payer: payer
        })
      })
    })
  })

  describe('exit', function () {
    it('should withdraw all stake and unclaimed rewards', async () => {
      const timeBefore = await time.latest()

      // mint rewards to pool
      await rewardToken.mint(stakedRewardPool.address, '100000000000000000000') // 100
      // notify rewards
      await stakedRewardPool.notifyRewardAmount('100000000000000000000', { from: admin })

      // populate pool with some stake from user
      await stakingToken.mint(user, '100000000000000000000') // 100
      await stakingToken.approve(stakedRewardPool.address, '100000000000000000000', { from: user }) // 100
      await stakedRewardPool.stake(user, '100000000000000000000', { from: user })

      // increase 1 second block time
      await time.increaseTo(timeBefore + 1)

      await stakedRewardPool.exit({ from: user })

      expect(await stakedRewardPool.sharesOf(user)).to.be.bignumber.equal('0')
      expect(await stakingToken.balanceOf(user)).to.be.bignumber.equal('100000000000000000000')
      expect(await rewardToken.balanceOf(stakedRewardPool.address)).to.be.bignumber.equal('0')
      expect(await rewardToken.balanceOf(user)).to.be.bignumber.equal('100000000000000000000')
    })
  })
})
