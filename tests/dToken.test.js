const { accounts, contract, web3 } = require('@openzeppelin/test-environment')
const { BN, expectEvent, expectRevert } = require('@openzeppelin/test-helpers')
const { expect } = require('chai')

// Load compiled artifacts
const ERC20Fake = contract.fromArtifact('ERC20Fake')
const CompoundFake = contract.fromArtifact('CompoundFake')
const EarningPoolFake = contract.fromArtifact('EarningPoolFake')
const ManagedRewardPool = contract.fromArtifact('ManagedRewardPool')
const DToken = contract.fromArtifact('dToken')

describe('dToken', function () {
  const [ admin, user, beneficiary, recipient, fakeAddress ] = accounts

  let underlyingTokenOne, underlyingTokenTwo, rewardToken, managedRewardPool, earningPoolOne, earningPoolTwo
  beforeEach(async () => {
      // deploy underlying token
      underlyingTokenOne = await ERC20Fake.new(
        'Underlying Token One',
        'UTO',
        '18',
        { from: admin }
      )

      // deploy reward token
      underlyingTokenTwo = await ERC20Fake.new(
        'Underlying Token Two',
        'UTT',
        '18',
        { from: admin }
      )

      // deploy fake cToken
      cTokenOne = await CompoundFake.new(
        'Compound CToken One',
        'CTO',
        '18',
        underlyingTokenOne.address,
        '10000000000000000000', // exchange rate - 10
      )

      // deploy fake cToken
      cTokenTwo = await CompoundFake.new(
        'Compound CToken Two',
        'CTT',
        '18',
        underlyingTokenTwo.address,
        '10000000000000000000', // exchange rate - 10
      )

      // deploy reward token
      rewardToken = await ERC20Fake.new(
        'Reward Token',
        'RTT',
        '18',
        { from: admin }
      )

      // deploy earning pool
      earningPoolOne = await EarningPoolFake.new(
        underlyingTokenOne.address,
        rewardToken.address,
        cTokenOne.address,
        { from: admin }
      )

      // deploy earning pool
      earningPoolTwo = await EarningPoolFake.new(
        underlyingTokenTwo.address,
        rewardToken.address,
        cTokenTwo.address,
        { from: admin }
      )

      // deploy reward pool
      managedRewardPool = await ManagedRewardPool.new(
        '100',
        rewardToken.address,
        { from: admin }
      )

      // deploy dToken with earning pool one
      dToken = await DToken.new(
        'dToken',
        'DTK',
        '18',
        [],
        managedRewardPool.address,
        { from: admin }
      )

      // add dToken as manager in mining pool
      await managedRewardPool.promote(dToken.address, { from: admin })
  })

  describe('init', function () {
    it('should initialize states', async () => {
      expect(await dToken.underlyingToEarningPoolMap.call(underlyingTokenOne.address)).to.be.equal('0x0000000000000000000000000000000000000000')
      const supportedUnderlyings = await dToken.getAllSupportedUnderlyings.call()
      expect(supportedUnderlyings.length).to.be.equal(0)
      expect(await dToken.managedRewardPool.call()).to.be.equal(managedRewardPool.address)
    })
  })

  describe('setName', function () {
    it('only owner can set name', async () => {
      const newName = "new token name"
      await expectRevert(
        dToken.setName(newName, { from: user }),
        'Ownable: caller is not the owner'
      )
      await dToken.setName(newName, { from: admin })
      expect(await dToken.name.call()).to.be.equal(newName)
    })

  })

  describe('setSymbol', function () {
    it('only owner can set symbol', async () => {
      const newSymbol = "new token symbol"
      await expectRevert(
        dToken.setSymbol(newSymbol, { from: user }),
        'Ownable: caller is not the owner'
      )
      await dToken.setSymbol(newSymbol, { from: admin })
      expect(await dToken.symbol.call()).to.be.equal(newSymbol)
    })
  })

  describe('pause', function () {
    it('only owner can pause/unpause', async () => {
      // only owner can pause
      await expectRevert(
        dToken.pause(underlyingTokenOne.address, { from: user }),
        'Ownable: caller is not the owner'
      )
      await dToken.pause(underlyingTokenOne.address, { from: admin })
      expect(await dToken.paused.call(underlyingTokenOne.address)).to.be.true

      // only owner can unpause
      await expectRevert(
        dToken.unpause(underlyingTokenOne.address, { from: user }),
        'Ownable: caller is not the owner'
      )
      await dToken.unpause(underlyingTokenOne.address, { from: admin })
      expect(await dToken.paused.call(underlyingTokenOne.address)).to.be.false
    })

    describe('when one underlying is paused', function () {
      beforeEach(async () => {
        // support underlying two
        await dToken.addEarningPool(earningPoolTwo.address, { from: admin })
        // mint underlying for user
        await underlyingTokenTwo.mint(user, '100000000000000000000') // 100
        // approve to dToken
        await underlyingTokenTwo.approve(dToken.address, '100000000000000000000', { from: user }) // 100

        // pause underlying one
        await dToken.pause(underlyingTokenOne.address, { from: admin })
      })

      it('mint should fail for paused underlying', async () => {
        await expectRevert(
          dToken.mint(user, underlyingTokenOne.address, '1', { from: user }),
          'DTOKEN: underlying is paused'
        )
      })

      it('swap should fail for paused underlying', async () => {
        await expectRevert(
          dToken.swap(user, underlyingTokenOne.address, '1000', underlyingTokenTwo.address, { from: user }),
          'DTOKEN: underlying is paused'
        )
      })

      it('redeem should work for paused underlying', async () => {
        await dToken.mint(user, underlyingTokenTwo.address, '100000000000000000000', { from: user })
        const receipt = await dToken.redeem(user, underlyingTokenTwo.address, '100000000000000000000', { from: user })
        expectEvent(receipt, 'Redeemed', {
          beneficiary: user,
          underlying: underlyingTokenTwo.address,
          amount: '100000000000000000000',
          payer: user
        })
      })
    })
  })

  describe('mint', function () {
    describe('when underlying is not supported', function () {
      it('should fail', async () => {
        await expectRevert(
          dToken.mint(user, underlyingTokenTwo.address, '1', { from: user }),
          'DTOKEN: mint underlying is not supported'
        )
      })
    })

    describe('when underlying is supported', function () {
      beforeEach(async () => {
        // support underlying
        await dToken.addEarningPool(earningPoolTwo.address, { from: admin })
      })

      describe('when user does not have sufficient underlying tokens', function () {
        it('should fail', async () => {
          await expectRevert(
            dToken.mint(user, underlyingTokenTwo.address, '1', { from: user }),
            'SafeERC20: low-level call failed'
          )
        })
      })

      describe('when user have sufficient underlying tokens', function () {
        beforeEach(async () => {
          // mint underlying for user
          await underlyingTokenTwo.mint(user, '100000000000000000000') // 100
          // approve to dToken
          await underlyingTokenTwo.approve(dToken.address, '100000000000000000000', { from: user }) // 100
        })

        it('should mint dToken for beneficiary, deposit in earning pool, and mint mining pool shares', async () => {
          // mint
          const mintAmount = new BN('100000000000000000000')
          const receipt = await dToken.mint(beneficiary, underlyingTokenTwo.address, mintAmount, { from: user })

          const beneficiaryDTokenBalanceAfter = await dToken.balanceOf(beneficiary)
          const userDTokenBalanceAfter = await dToken.balanceOf(user)
          const earningPoolUnderlyingBalanceAfter = await underlyingTokenTwo.balanceOf(earningPoolTwo.address)
          const dTokenEarningPoolSharesAfter = await earningPoolTwo.sharesOf(dToken.address)
          const beneficiaryMiningPoolSharesAfter = await managedRewardPool.sharesOf(beneficiary)

          expect(beneficiaryDTokenBalanceAfter).to.be.bignumber.equal(mintAmount)
          expect(userDTokenBalanceAfter).to.be.bignumber.equal('0')
          expect(earningPoolUnderlyingBalanceAfter).to.be.bignumber.equal(mintAmount)
          expect(dTokenEarningPoolSharesAfter).to.be.bignumber.equal(mintAmount)
          expect(beneficiaryMiningPoolSharesAfter).to.be.bignumber.equal(mintAmount)

          // event
          expectEvent(receipt, 'Minted', {
            beneficiary: beneficiary,
            underlying: underlyingTokenTwo.address,
            amount: mintAmount,
            payer: user
          })
        })
      })
    })

    describe('when amount is zero', function () {
      it('should fail', async () => {
        await expectRevert(
          dToken.mint(user, underlyingTokenTwo.address, '0', { from: user }),
          'DTOKEN: mint must be greater than 0'
        )
      })
    })
  })

  describe('redeem', function () {
    describe('when underlying is not supported', function () {
      it('should fail', async () => {
        await expectRevert(
          dToken.redeem(user, underlyingTokenTwo.address, '1', { from: user }),
          'DTOKEN: redeem underlying is not supported'
        )
      })
    })

    describe('when underlying is supported', function () {
      beforeEach(async () => {
        // support underlying
        await dToken.addEarningPool(earningPoolTwo.address, { from: admin })
      })

      describe('when user does not have sufficient dTokens', function () {
        it('should fail', async () => {
          await expectRevert(
            dToken.redeem(user, underlyingTokenTwo.address, '1', { from: user }),
            'ERC20: burn amount exceeds balance'
          )
        })
      })

      describe('when user have sufficient dTokens', function () {
        beforeEach(async () => {
          // mint underlying for user
          await underlyingTokenTwo.mint(user, '100000000000000000000') // 100
          // approve to dToken
          await underlyingTokenTwo.approve(dToken.address, '100000000000000000000', { from: user }) // 100
          // mint dToken
          await dToken.mint(user, underlyingTokenTwo.address, '100000000000000000000', { from: user })
        })

        it('should redeem underlying to beneficiary, withdraw from earning pool, and burn mining pool shares', async () => {
          // redeem
          const redeemAmount = new BN('100000000000000000000')
          const receipt = await dToken.redeem(beneficiary, underlyingTokenTwo.address, redeemAmount, { from: user })

          const beneficiaryUnderlyingBalanceAfter = await underlyingTokenTwo.balanceOf(beneficiary)
          const userUnderlyingBalanceAfter = await underlyingTokenTwo.balanceOf(user)
          const earningPoolUnderlyingBalanceAfter = await underlyingTokenTwo.balanceOf(earningPoolTwo.address)
          const userDTokenBalanceAfter = await dToken.balanceOf(user)
          const dTokenEarningPoolSharesAfter = await earningPoolTwo.sharesOf(dToken.address)
          const userMiningPoolSharesAfter = await managedRewardPool.sharesOf(user)

          expect(beneficiaryUnderlyingBalanceAfter).to.be.bignumber.equal(redeemAmount)
          expect(userUnderlyingBalanceAfter).to.be.bignumber.equal('0')
          expect(earningPoolUnderlyingBalanceAfter).to.be.bignumber.equal('0')
          expect(dTokenEarningPoolSharesAfter).to.be.bignumber.equal('0')
          expect(userMiningPoolSharesAfter).to.be.bignumber.equal('0')
          expect(userDTokenBalanceAfter).to.be.bignumber.equal('0')

          // event
          expectEvent(receipt, 'Redeemed', {
            beneficiary: beneficiary,
            underlying: underlyingTokenTwo.address,
            amount: redeemAmount,
            payer: user
          })
        })
      })
    })

    describe('when amount is zero', function () {
      it('should fail', async () => {
        await expectRevert(
          dToken.redeem(user, underlyingTokenTwo.address, '0', { from: user }),
          'DTOKEN: redeem must be greater than 0'
        )
      })
    })
  })

  describe('swap', function () {
    describe('when underlyingFrom is not supported', function () {
      beforeEach(async () => {
        // support underlyingFrom
        await dToken.addEarningPool(earningPoolTwo.address, { from: admin })
      })

      it('should fail', async () => {
        await expectRevert(
          dToken.swap(user, underlyingTokenOne.address, '1000', underlyingTokenTwo.address, { from: user }),
          'DTOKEN: swap underlyingFrom is not supported'
        )
      })
    })

    describe('when underlyingTo is not supported', function () {
      beforeEach(async () => {
        // support underlyingTo
        await dToken.addEarningPool(earningPoolOne.address, { from: admin })
      })

      it('should fail', async () => {
        await expectRevert(
          dToken.swap(user, underlyingTokenOne.address, '1000', underlyingTokenTwo.address, { from: user }),
          'DTOKEN: swap underlyingTo is not supported'
        )
      })
    })

    describe('when both underlyings are supported', function () {
      beforeEach(async () => {
        // support underlyingFrom
        await dToken.addEarningPool(earningPoolOne.address, { from: admin })
        // support underlyingTo
        await dToken.addEarningPool(earningPoolTwo.address, { from: admin })
      })

      describe('when there is not enough underlyingTo in pool', function () {
        it('should fail', async () => {
          await expectRevert(
            dToken.swap(user, underlyingTokenOne.address, '1000', underlyingTokenTwo.address, { from: user }),
            'DTOKEN: insufficient underlyingTo for swap'
          )
        })
      })

      describe('when there is enough underlyingTo in pool', function () {
        beforeEach(async () => {
          // mint underlyingTo for user
          await underlyingTokenTwo.mint(user, '100000000000000000000')
          // approve to dToken
          await underlyingTokenTwo.approve(dToken.address, '100000000000000000000', { from: user }) // 100
          // mint dToken for user
          await dToken.mint(user, underlyingTokenTwo.address, '100000000000000000000', { from: user })
        })

        describe('when user does not have sufficient underlyingFrom', function () {
          it('should fail', async () => {
            await expectRevert(
              dToken.swap(user, underlyingTokenOne.address, '1000', underlyingTokenTwo.address, { from: user }),
              'SafeERC20: low-level call failed'
            )
          })
        })

        describe('when user have sufficient underlyingFrom', function () {
          beforeEach(async () => {
            // mint underlyingFrom for user
            await underlyingTokenOne.mint(user, '100000000000000000000')
            // approve to dToken
            await underlyingTokenOne.approve(dToken.address, '100000000000000000000', { from: user }) // 100
          })

          it('should swap payer underlyingFrom to underlyingTo to beneficiary', async () => {
            const userMiningPoolSharesBefore = await managedRewardPool.sharesOf(user)
            const beneficiaryMiningPoolSharesBefore = await managedRewardPool.sharesOf(beneficiary)

            const swapAmount = new BN('100000000000000000000')
            const receipt = await dToken.swap(beneficiary, underlyingTokenOne.address, swapAmount, underlyingTokenTwo.address, { from: user })

            const userUnderlyingFromAfter = await underlyingTokenOne.balanceOf(user)
            const beneficiaryUnderlyingToAfter = await underlyingTokenTwo.balanceOf(beneficiary)
            const userMiningPoolSharesAfter = await managedRewardPool.sharesOf(user)
            const beneficiaryMiningPoolSharesAfter = await managedRewardPool.sharesOf(beneficiary)

            expect(userUnderlyingFromAfter).to.be.bignumber.equal('0')
            expect(beneficiaryUnderlyingToAfter).to.be.bignumber.equal(swapAmount)
            // should not affect mining pool shares
            expect(userMiningPoolSharesAfter).to.be.bignumber.equal(userMiningPoolSharesBefore)
            expect(beneficiaryMiningPoolSharesAfter).to.be.bignumber.equal(beneficiaryMiningPoolSharesBefore)

            // event
            expectEvent(receipt, 'Swapped', {
              beneficiary: beneficiary,
              underlyingFrom: underlyingTokenOne.address,
              amountFrom: swapAmount,
              underlyingTo: underlyingTokenTwo.address,
              amountTo: swapAmount,
              payer: user
            })
          })

          describe('when amountFrom is zero', function () {
            it('should fail', async () => {
              await expectRevert(
                dToken.swap(user, underlyingTokenOne.address, '0', underlyingTokenTwo.address, { from: user }),
                'DTOKEN: swap amountFrom must be greater than 0'
              )
            })
          })
        })
      })
    })
  })

  describe('transfer', function () {
    beforeEach(async () => {
      // mint underlying for user
      await underlyingTokenOne.mint(user, '100000000000000000000')
      // approve to dToken
      await underlyingTokenOne.approve(dToken.address, '100000000000000000000', { from: user })
      // support underlying in dToken
      await dToken.addEarningPool(earningPoolOne.address, { from: admin })
      // mint dToken for user
      await dToken.mint(user, underlyingTokenOne.address, '100000000000000000000', { from: user })
    })

    it('should transfer dToken balance and mining pool shares', async () => {
      const transferAmount = new BN('100000000000000000000')
      await dToken.transfer(recipient, transferAmount, { from: user })

      const recipientBalanceAfter = await dToken.balanceOf(recipient)
      const recipientMiningPoolSharesAfter = await managedRewardPool.sharesOf(recipient)
      const userBalanceAfter = await dToken.balanceOf(user)
      const userMiningPoolSharesAfter = await managedRewardPool.sharesOf(user)

      expect(recipientBalanceAfter).to.be.bignumber.equal(transferAmount)
      expect(recipientMiningPoolSharesAfter).to.be.bignumber.equal(transferAmount)
      expect(userBalanceAfter).to.be.bignumber.equal('0')
      expect(userMiningPoolSharesAfter).to.be.bignumber.equal('0')
    })
  })

  describe('addEarningPool', function () {
    let newDToken, newEarningPool, newUnderlying, newCToken, newRewardToken, newRewardPool
    beforeEach(async () => {
      // deploy underlying token
      newUnderlying = await ERC20Fake.new(
        'Underlying Token One',
        'UTO',
        '18',
        { from: admin }
      )

      // deploy fake cToken
      newCToken = await CompoundFake.new(
        'Compound CToken One',
        'CTO',
        '18',
        newUnderlying.address,
        '10000000000000000000', // exchange rate - 10
      )

      // deploy fake reward token
      newRewardToken = await ERC20Fake.new(
        'Reward Token',
        'RTT',
        '18',
        { from: admin }
      )

      // deploy earning pool
      newEarningPool = await EarningPoolFake.new(
        newUnderlying.address,
        newRewardToken.address,
        newCToken.address,
        { from: admin }
      )

      // deploy reward pool
      newRewardPool = await ManagedRewardPool.new(
        '100',
        rewardToken.address,
        { from: admin }
      )

      // deploy dToken
      newDToken = await DToken.new(
        'new dToken',
        'NDTK',
        '18',
        [],
        newRewardPool.address,
        { from: admin }
      )
      // add dToken as manager in reward pool
      await newRewardPool.promote(newDToken.address, { from: admin })
    })

    it('only owner can add earning pool', async () => {
      await expectRevert(
        newDToken.addEarningPool(newEarningPool.address, { from: user }),
        'Ownable: caller is not the owner'
      )

      const receipt = await newDToken.addEarningPool(newEarningPool.address, { from: admin })

      expect(await newDToken.isUnderlyingSupported.call(newUnderlying.address)).to.be.true
      expectEvent(receipt, 'EarningPoolAdded', {
        earningPool: newEarningPool.address,
        underlying: newUnderlying.address
      })
      // should infinite approve
      expect(await newUnderlying.allowance.call(newDToken.address, newEarningPool.address)).to.be.bignumber.equal('115792089237316195423570985008687907853269984665640564039457584007913129639935')
    })

    it('new earning pool should allow mint', async () => {
      // mint underlying for user
      await newUnderlying.mint(user, '100000000000000000000')
      // approve to newDToken
      await newUnderlying.approve(newDToken.address, '100000000000000000000', { from: user })
      // support underlying in newDToken
      await newDToken.addEarningPool(newEarningPool.address, { from: admin })
      // mint newDToken for user
      await newDToken.mint(user, newUnderlying.address, '100000000000000000000', { from: user })

      const userBalanceAfterMint = await newDToken.balanceOf(user)
      expect(userBalanceAfterMint).to.be.bignumber.equal('100000000000000000000')
    })
  })

  describe.skip('different decimal places', function () {

  })
})
