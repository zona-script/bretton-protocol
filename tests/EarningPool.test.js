const { accounts, contract, web3 } = require('@openzeppelin/test-environment')
const { BN, expectEvent, expectRevert } = require('@openzeppelin/test-helpers')
const { expect } = require('chai')

// Load compiled artifacts
const ERC20Fake = contract.fromArtifact('ERC20Fake')
const CompoundFake = contract.fromArtifact('CompoundFake')
const EarningPool = contract.fromArtifact('EarningPool')

describe('EarningPool', function () {
  const [ admin, payer, beneficiary, rewardPoolAddress ] = accounts

  let underlyingToken, rewardToken, cToken, earningPool
  beforeEach(async () => {
      // underlyingToken
      underlyingToken = await ERC20Fake.new(
        'USDC',
        'USDC',
        '6',
        { from: admin }
      )

      // underlyingToken
      rewardToken = await ERC20Fake.new(
        'Reward Token',
        'RDT',
        '18',
        { from: admin }
      )

      // deploy fake cToken
      cToken = await CompoundFake.new(
        'Compound CToken',
        'cToken',
        '6',
        underlyingToken.address,
        '10000000000000000000', // exchange rate - 10
      )

      // deploy earning pool
      earningPool = await EarningPool.new(
        'Managed Reward Pool',
        'MRP',
        '18',
        underlyingToken.address,
        rewardToken.address,
        cToken.address,
        { from: admin }
      )
  })

  describe('init', function () {
    it('should initialize states', async () => {
      expect(await earningPool.underlyingToken.call()).to.be.equal(underlyingToken.address)
      expect(await earningPool.rewardToken.call()).to.be.equal(rewardToken.address)
      expect(await earningPool.compound.call()).to.be.equal(cToken.address)
      // should infinite approve
      expect(await underlyingToken.allowance.call(earningPool.address, cToken.address)).to.be.bignumber.equal('115792089237316195423570985008687907853269984665640564039457584007913129639935')
      expect(await earningPool.rewardPool.call()).to.be.equal('0x0000000000000000000000000000000000000000')
      expect(await earningPool.withdrawFeeFactorMantissa.call()).to.be.bignumber.equal(new BN('0'))
    })
  })

  describe('deposit', function () {
    beforeEach(async () => {
      // mint underlying for payer
      await underlyingToken.mint(payer, '100000000') // 100
      // payer approve underlying to pool
      await underlyingToken.approve(earningPool.address, '100000000', { from: payer }) // 100
    })

    it('cannot deposit 0 amount', async () => {
      await expectRevert(
        earningPool.deposit(beneficiary, '0', { from: payer }),
        'EARNING_POOL: deposit must be greater than 0'
      )
    })

    it('should deposit for beneficiary', async () => {
      const depositAmount = new BN('100000000') // 100
      const receipt = await earningPool.deposit(beneficiary, depositAmount, { from: payer })

      // should transferFrom payer
      expect(await underlyingToken.balanceOf.call(payer)).to.be.bignumber.equal('0')
      // should supply provider
      expect(await underlyingToken.balanceOf.call(cToken.address)).to.be.bignumber.equal(depositAmount)
      // should receive cToken in pool, 100 / 10 = 10
      expect(await cToken.balanceOf.call(earningPool.address)).to.be.bignumber.equal('10000000')
      // mint for beneficiary
      expect(await earningPool.balanceOf.call(beneficiary)).to.be.bignumber.equal(depositAmount)
      // expect DEPOSITED event
      expectEvent(receipt, 'Deposited', {
        beneficiary: beneficiary,
        amount: depositAmount,
        payer: payer
      });
    })

    describe('when depositer does not have sufficient underlying token balance', function () {
      it('should fail', async () => {
        const amountGreaterThanBalance = '9999999999999999'
        await expectRevert(
          earningPool.deposit(payer, amountGreaterThanBalance, { from: payer }),
          'SafeERC20: low-level call failed'
        )
      })
    })
  })

  describe('withdraw', function () {
    beforeEach(async () => {
      // mint underlying for payer
      await underlyingToken.mint(payer, '100000000') // 100
      // payer approve underlying to pool
      await underlyingToken.approve(earningPool.address, '100000000', { from: payer }) // 100
      // payer deposit for self
      await earningPool.deposit(payer, '100000000', { from: payer })
    })

    it('cannot withdraw 0 amount', async () => {
      await expectRevert(
        earningPool.withdraw(beneficiary, '0', { from: payer }),
        'EARNING_POOL: withdraw must be greater than 0'
      )
    })

    describe('when there is no withdraw fee', function () {
      it('should withdraw to beneficiary', async () => {
        const withdrawAmount = '100000000' // 100
        const receipt = await earningPool.withdraw(beneficiary, withdrawAmount, { from: payer })

        // should withdraw from provider
        expect(await underlyingToken.balanceOf.call(cToken.address)).to.be.bignumber.equal('0')
        // should transferTo beneficiary
        expect(await underlyingToken.balanceOf.call(beneficiary)).to.be.bignumber.equal(withdrawAmount)
        // burn from payer
        expect(await earningPool.balanceOf.call(payer)).to.be.bignumber.equal('0')
        // expect WITHDRAWN event
        expectEvent(receipt, 'Withdrawn', {
          beneficiary: beneficiary,
          amount: withdrawAmount,
          payer: payer
        });
      })
    })

    describe('when there is withdraw fee', function () {
      beforeEach(async () => {
        // set withdraw fee to 10%
        const withdrawFeeFactorMantissa = '100000000000000000'
        await earningPool.setWithdrawFeeFactor(withdrawFeeFactorMantissa, { from: admin })
      })

      it('should withdraw to beneficiary and collect fee in pool', async () => {
        const withdrawAmount = new BN('100000000') // 100
        const withdrawFee = new BN('10000000') // 10
        await earningPool.withdraw(beneficiary, withdrawAmount, { from: payer })

        // should withdraw from provider
        expect(await underlyingToken.balanceOf.call(cToken.address)).to.be.bignumber.equal('0')
        // should transfer withdraw amount less fee to beneficiary
        expect(await underlyingToken.balanceOf.call(beneficiary)).to.be.bignumber.equal(withdrawAmount.sub(withdrawFee))
        // burn from payer
        expect(await earningPool.balanceOf.call(payer)).to.be.bignumber.equal('0')
        // should collect fee in pool
        expect(await underlyingToken.balanceOf.call(earningPool.address)).to.be.bignumber.equal(withdrawFee)
      })
    })

    describe('when withdrawer does not have sufficient shares in pool', function () {
      it('should fail', async () => {
        const amountGreaterThanDeposit = '9999999999999999'
        await expectRevert(
          earningPool.withdraw(payer, amountGreaterThanDeposit, { from: payer }),
          'EARNING_POOL: withdraw insufficient shares'
        )
      })
    })
  })

  describe('calculate pool values', function () {
    describe('when there are balance in provider, balance in pool fees, and reward tokens', function () {
      beforeEach(async () => {
        // mint underlying for payer
        await underlyingToken.mint(payer, '100000000') // 100
        // payer approve underlying to pool
        await underlyingToken.approve(earningPool.address, '100000000', { from: payer }) // 100
        // payer deposit for self
        await earningPool.deposit(payer, '100000000', { from: payer })
        // set withdraw fee to 10%
        const withdrawFeeFactorMantissa = '100000000000000000'
        await earningPool.setWithdrawFeeFactor(withdrawFeeFactorMantissa, { from: admin })
        // payer withdraw some and leaves some fee amount in pool
        await earningPool.withdraw(payer, '50000000', { from: payer })
        // mint some reward tokens to pool
        await rewardToken.mint(earningPool.address, '1000000000000000000')
      })

      describe('calcPoolValueInUnderlying', function () {
        it('should get total underlying balance in pool', async () => {
          // should have 50 + 5 = 55 total value left in pool
          expect(await earningPool.calcPoolValueInUnderlying.call()).to.be.bignumber.equal('55000000')
        })
      })

      describe('calcUnclaimedEarningInUnderlying', function () {
        it('should get total earning balance in pool ', async () => {
          // should have 5 earning in pool
          expect(await earningPool.calcUnclaimedEarningInUnderlying.call()).to.be.bignumber.equal('5000000')
        })
      })

      describe('calcUnclaimedProviderReward', function () {
        it('should get total reward token balance in pool ', async () => {
          // should have 1 earning in pool
          expect(await earningPool.calcUnclaimedProviderReward.call()).to.be.bignumber.equal('1000000000000000000')
        })
      })
    })
  })

  describe('setWithdrawFeeFactor', function () {
    it('only owner can set withdraw fee', async () => {
      const withdrawFeeFactorMantissa = '100000000000000000'

      await expectRevert(
        earningPool.setWithdrawFeeFactor(withdrawFeeFactorMantissa, { from: payer }),
        'Ownable: caller is not the owner'
      )

      await earningPool.setWithdrawFeeFactor(withdrawFeeFactorMantissa, { from: admin })
      expect(await earningPool.withdrawFeeFactorMantissa.call()).to.be.bignumber.equal(withdrawFeeFactorMantissa)
    })
  })

  describe('setRewardPoolAddress', function () {
    it('only owner can set reward pool', async () => {
      await expectRevert(
        earningPool.setRewardPoolAddress(rewardPoolAddress, { from: payer }),
        'Ownable: caller is not the owner'
      )

      await earningPool.setRewardPoolAddress(rewardPoolAddress, { from: admin })
      expect(await earningPool.rewardPool.call()).to.be.bignumber.equal(rewardPoolAddress)
    })
  })

  describe('dispenseEarning', function () {
    beforeEach(async () => {
      // mint 100 underlying to pool as earnings
      await underlyingToken.mint(payer, '100000000')
    })

    describe('when reward pool address is not set', function () {
      it('should not dispense anything', async () => {
        const earningsBefore = await earningPool.calcUnclaimedEarningInUnderlying.call()
        await earningPool.dispenseEarning()
        const earningsAfter = await earningPool.calcUnclaimedEarningInUnderlying.call()
        expect(earningsBefore).to.be.bignumber.equal(earningsAfter)
      })
    })

    describe('when reward pool address is set', function () {
      beforeEach(async () => {
        // set reward pool address
        await earningPool.setRewardPoolAddress(rewardPoolAddress, { from: admin })
      })

      it('should dispense all earnings', async () => {
        const earningsBefore = await earningPool.calcUnclaimedEarningInUnderlying.call()
        await earningPool.dispenseEarning()
        const earningPoolAfter = await earningPool.calcUnclaimedEarningInUnderlying.call()
        const rewardPoolBalanceAfter = await underlyingToken.balanceOf.call(rewardPoolAddress)
        expect(earningPoolAfter).to.be.bignumber.equal('0')
        expect(rewardPoolBalanceAfter).to.be.bignumber.equal(earningsBefore)
      })
    })
  })

  describe('dispenseReward', function () {
    beforeEach(async () => {
      // mint 100 reward tokens to pool as rewards
      await rewardToken.mint(earningPool.address, '100000000000000000000')
    })

    describe('when reward pool address is not set', function () {
      it('should not dispense anything', async () => {
        const rewardsBefore = await earningPool.calcUnclaimedProviderReward.call()
        await earningPool.dispenseReward()
        const rewardsAfter = await earningPool.calcUnclaimedProviderReward.call()
        expect(rewardsBefore).to.be.bignumber.equal(rewardsAfter)
      })
    })

    describe('when reward pool address is set', function () {
      beforeEach(async () => {
        // set reward pool address
        await earningPool.setRewardPoolAddress(rewardPoolAddress, { from: admin })
      })

      it('should dispense all rewards', async () => {
        const rewardsBefore = await earningPool.calcUnclaimedProviderReward.call()
        await earningPool.dispenseReward()
        const rewardsAfter = await earningPool.calcUnclaimedProviderReward.call()
        const rewardPoolBalanceAfter = await rewardToken.balanceOf.call(rewardPoolAddress)
        expect(rewardsAfter).to.be.bignumber.equal('0')
        expect(rewardPoolBalanceAfter).to.be.bignumber.equal(rewardsBefore)
      })
    })
  })
})
