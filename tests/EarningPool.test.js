const { accounts, contract, web3 } = require('@openzeppelin/test-environment')
const { BN, expectEvent, expectRevert } = require('@openzeppelin/test-helpers')
const { expect } = require('chai')

// Load compiled artifacts
const ERC20Fake = contract.fromArtifact('ERC20Fake')
const CompoundFake = contract.fromArtifact('CompoundFake')
const EarningPool = contract.fromArtifact('EarningPool')

describe('EarningPool', function () {
  const [ admin, payer, beneficiary, earningRecipient, rewardRecipient ] = accounts

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
      expect(await earningPool.earningRecipient.call()).to.be.equal('0x0000000000000000000000000000000000000000')
      expect(await earningPool.rewardRecipient.call()).to.be.equal('0x0000000000000000000000000000000000000000')
      expect(await earningPool.withdrawFeeFactorMantissa.call()).to.be.bignumber.equal(new BN('0'))
      expect(await earningPool.earningDispenseThreshold.call()).to.be.bignumber.equal(new BN('0'))
      expect(await earningPool.rewardDispenseThreshold.call()).to.be.bignumber.equal(new BN('0'))
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
      expect(await earningPool.sharesOf.call(beneficiary)).to.be.bignumber.equal(depositAmount)
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
        expect(await earningPool.sharesOf.call(payer)).to.be.bignumber.equal('0')
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
        // set withdraw fee to 0.1%
        const withdrawFeeFactorMantissa = '1000000000000000'
        await earningPool.setWithdrawFeeFactor(withdrawFeeFactorMantissa, { from: admin })
      })

      it('should withdraw to beneficiary and collect fee in pool', async () => {
        const withdrawAmount = new BN('100000000') // 100
        const withdrawFee = new BN('100000') // 0.1
        await earningPool.withdraw(beneficiary, withdrawAmount, { from: payer })

        // should withdraw from provider
        expect(await underlyingToken.balanceOf.call(cToken.address)).to.be.bignumber.equal('0')
        // should transfer withdraw amount less fee to beneficiary
        expect(await underlyingToken.balanceOf.call(beneficiary)).to.be.bignumber.equal(withdrawAmount.sub(withdrawFee))
        // burn from payer
        expect(await earningPool.sharesOf.call(payer)).to.be.bignumber.equal('0')
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
        // accrueInterest 2x
        await cToken.accrueInterest('2')
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
          // should have 100 + 50 + 5 = 155 total value left in pool
          expect(await earningPool.calcPoolValueInUnderlying.call()).to.be.bignumber.equal('155000000')
        })
      })

      describe('calcUndispensedEarningInUnderlying', function () {
        it('should get total earning balance in pool ', async () => {
          // should have 100 earning in pool
          expect(await earningPool.calcUndispensedEarningInUnderlying.call()).to.be.bignumber.equal('100000000')
        })
      })

      describe('balanceInUnderlying', function () {
        it('should get total withdraw fee as balance in pool ', async () => {
          // should have 5 withdraw fee in pool
          expect(await earningPool.balanceInUnderlying.call()).to.be.bignumber.equal('5000000')
        })
      })

      describe('calcUndispensedProviderReward', function () {
        it('should get total reward token balance in pool ', async () => {
          // should have 1 earning in pool
          expect(await earningPool.calcUndispensedProviderReward.call()).to.be.bignumber.equal('1000000000000000000')
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

  describe('setEarningRecipient', function () {
    it('only owner can set reward pool', async () => {
      await expectRevert(
        earningPool.setEarningRecipient(earningRecipient, { from: payer }),
        'Ownable: caller is not the owner'
      )

      await earningPool.setEarningRecipient(earningRecipient, { from: admin })
      expect(await earningPool.earningRecipient.call()).to.be.bignumber.equal(earningRecipient)
    })
  })

  describe('setRewardRecipient', function () {
    it('only owner can set reward pool', async () => {
      await expectRevert(
        earningPool.setRewardRecipient(rewardRecipient, { from: payer }),
        'Ownable: caller is not the owner'
      )

      await earningPool.setRewardRecipient(rewardRecipient, { from: admin })
      expect(await earningPool.rewardRecipient.call()).to.be.bignumber.equal(rewardRecipient)
    })
  })

  describe('setEarningDispenseThreshold', function () {
    it('only owner can set earningDispenseThreshold', async () => {
      const threshold = new BN('100000000')

      await expectRevert(
        earningPool.setEarningDispenseThreshold(threshold, { from: payer }),
        'Ownable: caller is not the owner'
      )

      await earningPool.setEarningDispenseThreshold(threshold, { from: admin })
      expect(await earningPool.earningDispenseThreshold.call()).to.be.bignumber.equal(threshold)
    })
  })

  describe('setRewardDispenseThreshold', function () {
    it('only owner can set rewardDispenseThreshold', async () => {
      const threshold = new BN('100000000')

      await expectRevert(
        earningPool.setRewardDispenseThreshold(threshold, { from: payer }),
        'Ownable: caller is not the owner'
      )

      await earningPool.setRewardDispenseThreshold(threshold, { from: admin })
      expect(await earningPool.rewardDispenseThreshold.call()).to.be.bignumber.equal(threshold)
    })
  })

  describe('dispenseEarning/dispenseReward', function () {
    beforeEach(async () => {
      // mint 100 underlying to payer
      await underlyingToken.mint(payer, '100000000')
      // payer approve underlying to pool
      await underlyingToken.approve(earningPool.address, '100000000', { from: payer })
      // payer deposit for self
      await earningPool.deposit(payer, '100000000', { from: payer })
      // accrueInterest 2x
      await cToken.accrueInterest('2')

      // mint 100 reward token to pool as rewards
      await rewardToken.mint(earningPool.address, '100000000')
    })

    describe('when recipients is not set', function () {
      it('should not dispense anything', async () => {
        const earningsBefore = await earningPool.calcUndispensedEarningInUnderlying.call()
        await earningPool.dispenseEarning()
        const earningsAfter = await earningPool.calcUndispensedEarningInUnderlying.call()
        expect(earningsBefore).to.be.bignumber.equal(earningsAfter)
      })
    })

    describe('when recipients is set', function () {
      beforeEach(async () => {
        // set earning recipient address
        await earningPool.setEarningRecipient(earningRecipient, { from: admin })
        // set reward recipient address
        await earningPool.setRewardRecipient(rewardRecipient, { from: admin })
      })

      describe('when earning is less than threshold', function () {
        beforeEach(async () => {
          // set earning dispense threshold to 100.000001
          await earningPool.setEarningDispenseThreshold('100000001', { from: admin })
        })

        it('should not dispense any earnings', async () => {
          await earningPool.dispenseEarning()
          const earningsAfter = await earningPool.calcUndispensedEarningInUnderlying.call()
          expect(earningsAfter).to.be.bignumber.equal('100000000')
        })
      })

      describe('when reward is less than threshold', function () {
        beforeEach(async () => {
          // set reward dispense threshold to 100.000001
          await earningPool.setRewardDispenseThreshold('100000001', { from: admin })
        })

        it('should not dispense any rewards', async () => {
          await earningPool.dispenseReward()
          const rewardsAfter = await earningPool.calcUndispensedProviderReward.call()
          expect(rewardsAfter).to.be.bignumber.equal('100000000')
        })
      })

      describe('when earning is more than threshold', function () {
        beforeEach(async () => {
          // set earning dispense threshold to 100
          await earningPool.setEarningDispenseThreshold('100000000', { from: admin })
        })

        it('should dispense all earnings', async () => {
          const receipt = await earningPool.dispenseEarning()
          const earningPoolAfter = await earningPool.calcUndispensedEarningInUnderlying.call()
          const earningRecipientBalanceAfter = await underlyingToken.balanceOf.call(earningRecipient)
          expect(earningPoolAfter).to.be.bignumber.equal('0')
          expect(earningRecipientBalanceAfter).to.be.bignumber.equal('100000000')
          expectEvent(receipt, 'Dispensed', {
            token: underlyingToken.address,
            amount: '100000000'
          })
        })
      })

      describe('when reward is more than threshold', function () {
        beforeEach(async () => {
          // set reward dispense threshold to 100
          await earningPool.setEarningDispenseThreshold('100000000', { from: admin })
        })

        it('should dispense all rewards', async () => {
          const receipt = await earningPool.dispenseReward()
          const earningPoolAfter = await earningPool.calcUndispensedProviderReward.call()
          const rewardRecipientBalanceAfter = await rewardToken.balanceOf.call(rewardRecipient)
          expect(earningPoolAfter).to.be.bignumber.equal('0')
          expect(rewardRecipientBalanceAfter).to.be.bignumber.equal('100000000')
          expectEvent(receipt, 'Dispensed', {
            token: rewardToken.address,
            amount: '100000000'
          })
        })
      })
    })
  })
})
