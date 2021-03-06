const { accounts, contract, web3 } = require('@openzeppelin/test-environment')
const { BN, expectEvent, expectRevert } = require('@openzeppelin/test-helpers')
const { expect } = require('chai')

// Load compiled artifacts
const ERC20Fake = contract.fromArtifact('ERC20Fake')
const CompoundFake = contract.fromArtifact('CompoundFake')
const EarningPoolFake = contract.fromArtifact('EarningPoolFake')
const ManagedRewardPool = contract.fromArtifact('ManagedRewardPool')
const NToken = contract.fromArtifact('nToken')

describe('nToken', function () {
  const [ admin, user, beneficiary, recipient, fakeAddress ] = accounts

  let underlyingTokenOne, underlyingTokenTwo, rewardToken, managedRewardPool, earningPoolOne, earningPoolTwo
  beforeEach(async () => {
      // deploy underlying token
      underlyingTokenOne = await ERC20Fake.new(
        'Underlying Token One',
        'UTO',
        '6',
        { from: admin }
      )

      // deploy reward token
      underlyingTokenTwo = await ERC20Fake.new(
        'Underlying Token Two',
        'UTT',
        '6',
        { from: admin }
      )

      // deploy fake cToken
      cTokenOne = await CompoundFake.new(
        'Compound CToken One',
        'CTO',
        '18',
        underlyingTokenOne.address,
        '10000000', // exchange rate - 10
      )

      // deploy fake cToken
      cTokenTwo = await CompoundFake.new(
        'Compound CToken Two',
        'CTT',
        '18',
        underlyingTokenTwo.address,
        '10000000', // exchange rate - 10
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

      // deploy nToken with earning pool one
      nToken = await NToken.new(
        'nToken',
        'NTK',
        '18',
        [],
        managedRewardPool.address,
        { from: admin }
      )

      // add nToken as manager in mining pool
      await managedRewardPool.promote(nToken.address, { from: admin })
  })

  describe('init', function () {
    it('should initialize states', async () => {
      expect(await nToken.underlyingToEarningPoolMap.call(underlyingTokenOne.address)).to.be.equal('0x0000000000000000000000000000000000000000')
      const supportedUnderlyings = await nToken.getAllSupportedUnderlyings.call()
      expect(supportedUnderlyings.length).to.be.equal(0)
      expect(await nToken.managedRewardPool.call()).to.be.equal(managedRewardPool.address)
    })
  })

  describe('setName', function () {
    it('only owner can set name', async () => {
      const newName = "new token name"
      await expectRevert(
        nToken.setName(newName, { from: user }),
        'Ownable: caller is not the owner'
      )
      await nToken.setName(newName, { from: admin })
      expect(await nToken.name.call()).to.be.equal(newName)
    })

  })

  describe('setSymbol', function () {
    it('only owner can set symbol', async () => {
      const newSymbol = "new token symbol"
      await expectRevert(
        nToken.setSymbol(newSymbol, { from: user }),
        'Ownable: caller is not the owner'
      )
      await nToken.setSymbol(newSymbol, { from: admin })
      expect(await nToken.symbol.call()).to.be.equal(newSymbol)
    })
  })

  describe('pause', function () {
    it('only owner can pause/unpause', async () => {
      // only owner can pause
      await expectRevert(
        nToken.pause(underlyingTokenOne.address, { from: user }),
        'Ownable: caller is not the owner'
      )
      await nToken.pause(underlyingTokenOne.address, { from: admin })
      expect(await nToken.paused.call(underlyingTokenOne.address)).to.be.true

      // only owner can unpause
      await expectRevert(
        nToken.unpause(underlyingTokenOne.address, { from: user }),
        'Ownable: caller is not the owner'
      )
      await nToken.unpause(underlyingTokenOne.address, { from: admin })
      expect(await nToken.paused.call(underlyingTokenOne.address)).to.be.false
    })

    describe('when one underlying is paused', function () {
      beforeEach(async () => {
        // support underlying two
        await nToken.addEarningPool(earningPoolTwo.address, { from: admin })
        // mint underlying for user
        await underlyingTokenTwo.mint(user, '100000000') // 100
        // approve to nToken
        await underlyingTokenTwo.approve(nToken.address, '100000000', { from: user }) // 100

        // pause underlying one
        await nToken.pause(underlyingTokenOne.address, { from: admin })
      })

      it('mint should fail for paused underlying', async () => {
        await expectRevert(
          nToken.mint(user, underlyingTokenOne.address, '1', { from: user }),
          'NTOKEN: underlying is paused'
        )
      })

      it('swap should fail for paused underlying', async () => {
        await expectRevert(
          nToken.swap(user, underlyingTokenOne.address, '1000', underlyingTokenTwo.address, { from: user }),
          'NTOKEN: underlying is paused'
        )
      })

      it('redeem should work for paused underlying', async () => {
        await nToken.mint(user, underlyingTokenTwo.address, '100000000', { from: user })
        const receipt = await nToken.redeem(user, underlyingTokenTwo.address, '100000000', { from: user })
        expectEvent(receipt, 'Redeemed', {
          beneficiary: user,
          underlying: underlyingTokenTwo.address,
          amount: '100000000',
          payer: user
        })
      })
    })
  })

  describe('mint', function () {
    describe('when underlying is not supported', function () {
      it('should fail', async () => {
        await expectRevert(
          nToken.mint(user, underlyingTokenTwo.address, '1', { from: user }),
          'NTOKEN: mint underlying is not supported'
        )
      })
    })

    describe('when underlying is supported', function () {
      beforeEach(async () => {
        // support underlying
        await nToken.addEarningPool(earningPoolTwo.address, { from: admin })
      })

      describe('when user does not have sufficient underlying tokens', function () {
        it('should fail', async () => {
          await expectRevert(
            nToken.mint(user, underlyingTokenTwo.address, '1', { from: user }),
            'SafeERC20: low-level call failed'
          )
        })
      })

      describe('when user have sufficient underlying tokens', function () {
        beforeEach(async () => {
          // mint underlying for user
          await underlyingTokenTwo.mint(user, '100000000') // 100
          // approve to nToken
          await underlyingTokenTwo.approve(nToken.address, '100000000', { from: user }) // 100
        })

        it('should mint nToken for beneficiary, deposit in earning pool, and mint mining pool shares', async () => {
          // mint
          const underlyingAmount = new BN('100000000')
          const mintAmount = new BN('100000000000000000000')
          const receipt = await nToken.mint(beneficiary, underlyingTokenTwo.address, underlyingAmount, { from: user })

          const beneficiaryNTokenBalanceAfter = await nToken.balanceOf(beneficiary)
          const userNTokenBalanceAfter = await nToken.balanceOf(user)
          const earningPoolUnderlyingBalanceAfter = await underlyingTokenTwo.balanceOf(earningPoolTwo.address)
          const nTokenEarningPoolSharesAfter = await earningPoolTwo.sharesOf(nToken.address)
          const beneficiaryMiningPoolSharesAfter = await managedRewardPool.sharesOf(beneficiary)

          expect(beneficiaryNTokenBalanceAfter).to.be.bignumber.equal(mintAmount)
          expect(userNTokenBalanceAfter).to.be.bignumber.equal('0')
          expect(earningPoolUnderlyingBalanceAfter).to.be.bignumber.equal(underlyingAmount)
          expect(nTokenEarningPoolSharesAfter).to.be.bignumber.equal(underlyingAmount)
          expect(beneficiaryMiningPoolSharesAfter).to.be.bignumber.equal(mintAmount)

          // event
          expectEvent(receipt, 'Minted', {
            beneficiary: beneficiary,
            underlying: underlyingTokenTwo.address,
            amount: underlyingAmount,
            payer: user
          })
        })
      })
    })

    describe('when amount is zero', function () {
      it('should fail', async () => {
        await expectRevert(
          nToken.mint(user, underlyingTokenTwo.address, '0', { from: user }),
          'NTOKEN: mint must be greater than 0'
        )
      })
    })
  })

  describe('redeem', function () {
    describe('when underlying is not supported', function () {
      it('should fail', async () => {
        await expectRevert(
          nToken.redeem(user, underlyingTokenTwo.address, '1', { from: user }),
          'NTOKEN: redeem underlying is not supported'
        )
      })
    })

    describe('when underlying is supported', function () {
      beforeEach(async () => {
        // support underlying
        await nToken.addEarningPool(earningPoolTwo.address, { from: admin })
      })

      describe('when user does not have sufficient nTokens', function () {
        it('should fail', async () => {
          await expectRevert(
            nToken.redeem(user, underlyingTokenTwo.address, '1', { from: user }),
            'ERC20: burn amount exceeds balance'
          )
        })
      })

      describe('when user have sufficient nTokens', function () {
        beforeEach(async () => {
          // mint underlying for user
          await underlyingTokenTwo.mint(user, '100000000') // 100
          // approve to nToken
          await underlyingTokenTwo.approve(nToken.address, '100000000', { from: user }) // 100
          // mint nToken
          await nToken.mint(user, underlyingTokenTwo.address, '100000000', { from: user })
        })

        it('should redeem underlying to beneficiary, withdraw from earning pool, and burn mining pool shares', async () => {
          // redeem
          const redeemAmount = new BN('100000000')
          const nTokenAmount = new BN('100000000000000000000')
          const receipt = await nToken.redeem(beneficiary, underlyingTokenTwo.address, redeemAmount, { from: user })

          const beneficiaryUnderlyingBalanceAfter = await underlyingTokenTwo.balanceOf(beneficiary)
          const userUnderlyingBalanceAfter = await underlyingTokenTwo.balanceOf(user)
          const earningPoolUnderlyingBalanceAfter = await underlyingTokenTwo.balanceOf(earningPoolTwo.address)
          const userNTokenBalanceAfter = await nToken.balanceOf(user)
          const nTokenEarningPoolSharesAfter = await earningPoolTwo.sharesOf(nToken.address)
          const userMiningPoolSharesAfter = await managedRewardPool.sharesOf(user)

          expect(beneficiaryUnderlyingBalanceAfter).to.be.bignumber.equal(redeemAmount)
          expect(userUnderlyingBalanceAfter).to.be.bignumber.equal('0')
          expect(earningPoolUnderlyingBalanceAfter).to.be.bignumber.equal('0')
          expect(nTokenEarningPoolSharesAfter).to.be.bignumber.equal('0')
          expect(userMiningPoolSharesAfter).to.be.bignumber.equal('0')
          expect(userNTokenBalanceAfter).to.be.bignumber.equal('0')

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
          nToken.redeem(user, underlyingTokenTwo.address, '0', { from: user }),
          'NTOKEN: redeem must be greater than 0'
        )
      })
    })
  })

  describe('swap', function () {
    describe('when underlyingFrom is not supported', function () {
      beforeEach(async () => {
        // support underlyingFrom
        await nToken.addEarningPool(earningPoolTwo.address, { from: admin })
      })

      it('should fail', async () => {
        await expectRevert(
          nToken.swap(user, underlyingTokenOne.address, '1000', underlyingTokenTwo.address, { from: user }),
          'NTOKEN: swap underlyingFrom is not supported'
        )
      })
    })

    describe('when underlyingTo is not supported', function () {
      beforeEach(async () => {
        // support underlyingTo
        await nToken.addEarningPool(earningPoolOne.address, { from: admin })
      })

      it('should fail', async () => {
        await expectRevert(
          nToken.swap(user, underlyingTokenOne.address, '1000', underlyingTokenTwo.address, { from: user }),
          'NTOKEN: swap underlyingTo is not supported'
        )
      })
    })

    describe('when both underlyings are supported', function () {
      beforeEach(async () => {
        // support underlyingFrom
        await nToken.addEarningPool(earningPoolOne.address, { from: admin })
        // support underlyingTo
        await nToken.addEarningPool(earningPoolTwo.address, { from: admin })
      })

      describe('when there is not enough underlyingTo in pool', function () {
        it('should fail', async () => {
          await expectRevert(
            nToken.swap(user, underlyingTokenOne.address, '1000', underlyingTokenTwo.address, { from: user }),
            'NTOKEN: insufficient underlyingTo for swap'
          )
        })
      })

      describe('when there is enough underlyingTo in pool', function () {
        beforeEach(async () => {
          // mint underlyingTo for user
          await underlyingTokenTwo.mint(user, '100000000')
          // approve to nToken
          await underlyingTokenTwo.approve(nToken.address, '100000000', { from: user }) // 100
          // mint nToken for user
          await nToken.mint(user, underlyingTokenTwo.address, '100000000', { from: user })
        })

        describe('when user does not have sufficient underlyingFrom', function () {
          it('should fail', async () => {
            await expectRevert(
              nToken.swap(user, underlyingTokenOne.address, '1000', underlyingTokenTwo.address, { from: user }),
              'SafeERC20: low-level call failed'
            )
          })
        })

        describe('when user have sufficient underlyingFrom', function () {
          beforeEach(async () => {
            // mint underlyingFrom for user
            await underlyingTokenOne.mint(user, '100000000')
            // approve to nToken
            await underlyingTokenOne.approve(nToken.address, '100000000', { from: user }) // 100
          })

          it('should swap payer underlyingFrom to underlyingTo to beneficiary', async () => {
            const userMiningPoolSharesBefore = await managedRewardPool.sharesOf(user)
            const beneficiaryMiningPoolSharesBefore = await managedRewardPool.sharesOf(beneficiary)

            const swapAmount = new BN('100000000')
            const receipt = await nToken.swap(beneficiary, underlyingTokenOne.address, swapAmount, underlyingTokenTwo.address, { from: user })

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
                nToken.swap(user, underlyingTokenOne.address, '0', underlyingTokenTwo.address, { from: user }),
                'NTOKEN: swap amountFrom must be greater than 0'
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
      await underlyingTokenOne.mint(user, '100000000')
      // approve to nToken
      await underlyingTokenOne.approve(nToken.address, '100000000', { from: user })
      // support underlying in nToken
      await nToken.addEarningPool(earningPoolOne.address, { from: admin })
      // mint nToken for user
      await nToken.mint(user, underlyingTokenOne.address, '100000000', { from: user })
    })

    describe('on transfer', function () {
      it('should transfer nToken balance and mining pool shares', async () => {
        const transferAmount = new BN('100000000000000000000')
        await nToken.transfer(recipient, transferAmount, { from: user })

        const recipientBalanceAfter = await nToken.balanceOf(recipient)
        const recipientMiningPoolSharesAfter = await managedRewardPool.sharesOf(recipient)
        const userBalanceAfter = await nToken.balanceOf(user)
        const userMiningPoolSharesAfter = await managedRewardPool.sharesOf(user)

        expect(recipientBalanceAfter).to.be.bignumber.equal(transferAmount)
        expect(recipientMiningPoolSharesAfter).to.be.bignumber.equal(transferAmount)
        expect(userBalanceAfter).to.be.bignumber.equal('0')
        expect(userMiningPoolSharesAfter).to.be.bignumber.equal('0')
      })
    })

    describe('on transferFrom', function () {
      it('should transfer nToken balance and mining pool shares', async () => {
        const transferAmount = new BN('100000000000000000000')
        await nToken.approve(recipient, transferAmount, { from: user })
        await nToken.transferFrom(user, recipient, transferAmount, { from: recipient })

        const recipientBalanceAfter = await nToken.balanceOf(recipient)
        const recipientMiningPoolSharesAfter = await managedRewardPool.sharesOf(recipient)
        const userBalanceAfter = await nToken.balanceOf(user)
        const userMiningPoolSharesAfter = await managedRewardPool.sharesOf(user)

        expect(recipientBalanceAfter).to.be.bignumber.equal(transferAmount)
        expect(recipientMiningPoolSharesAfter).to.be.bignumber.equal(transferAmount)
        expect(userBalanceAfter).to.be.bignumber.equal('0')
        expect(userMiningPoolSharesAfter).to.be.bignumber.equal('0')
      })
    })
  })

  describe('addEarningPool', function () {
    let newNToken, newEarningPool, newUnderlying, newCToken, newRewardToken, newRewardPool
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

      // deploy nToken
      newNToken = await NToken.new(
        'new nToken',
        'NNTK',
        '18',
        [],
        newRewardPool.address,
        { from: admin }
      )
      // add nToken as manager in reward pool
      await newRewardPool.promote(newNToken.address, { from: admin })
    })

    it('only owner can add earning pool', async () => {
      await expectRevert(
        newNToken.addEarningPool(newEarningPool.address, { from: user }),
        'Ownable: caller is not the owner'
      )

      const receipt = await newNToken.addEarningPool(newEarningPool.address, { from: admin })

      expect(await newNToken.isUnderlyingSupported.call(newUnderlying.address)).to.be.true
      expectEvent(receipt, 'EarningPoolAdded', {
        earningPool: newEarningPool.address,
        underlying: newUnderlying.address
      })
      // should infinite approve
      expect(await newUnderlying.allowance.call(newNToken.address, newEarningPool.address)).to.be.bignumber.equal('115792089237316195423570985008687907853269984665640564039457584007913129639935')
    })

    it('new earning pool should allow mint', async () => {
      // mint underlying for user
      await newUnderlying.mint(user, '100000000000000000000')
      // approve to newNToken
      await newUnderlying.approve(newNToken.address, '100000000000000000000', { from: user })
      // support underlying in newNToken
      await newNToken.addEarningPool(newEarningPool.address, { from: admin })
      // mint newNToken for user
      await newNToken.mint(user, newUnderlying.address, '100000000000000000000', { from: user })

      const userBalanceAfterMint = await newNToken.balanceOf(user)
      expect(userBalanceAfterMint).to.be.bignumber.equal('100000000000000000000')
    })
  })

  describe('different decimal places', function () {
    let newNToken, fakeRewardToken, newRewardPool
    let underlying6, cToken6, earningPool6
    let underlying20, cToken20, earningPool20
    let underlying18, cToken18, earningPool18

    beforeEach(async () => {
      // deploy fake reward token
      fakeRewardToken = await ERC20Fake.new(
        'Reward Token',
        'RTT',
        '18',
        { from: admin }
      )

      // deploy reward pool
      newRewardPool = await ManagedRewardPool.new(
        '100',
        rewardToken.address,
        { from: admin }
      )

      /*** 6 DECIMAL ***/

      // deploy underlying token
      underlying6 = await ERC20Fake.new(
        'Underlying Token One',
        'UTO',
        '6',
        { from: admin }
      )

      // deploy fake cToken
      cToken6 = await CompoundFake.new(
        'Compound CToken One',
        'CTO',
        '6',
        underlying6.address,
        '10000000', // exchange rate - 10
      )

      // deploy earning pool
      earningPool6 = await EarningPoolFake.new(
        underlying6.address,
        fakeRewardToken.address,
        cToken6.address,
        { from: admin }
      )

      /*** 20 DECIMAL ***/

      // deploy underlying token
      underlying20 = await ERC20Fake.new(
        'Underlying Token One',
        'UTO',
        '20',
        { from: admin }
      )

      // deploy fake cToken
      cToken20 = await CompoundFake.new(
        'Compound CToken One',
        'CTO',
        '20',
        underlying20.address,
        '10000000', // exchange rate - 10
      )

      // deploy earning pool
      earningPool20 = await EarningPoolFake.new(
        underlying20.address,
        fakeRewardToken.address,
        cToken20.address,
        { from: admin }
      )

      /*** 18 DECIMAL ***/

      // deploy underlying token
      underlying18 = await ERC20Fake.new(
        'Underlying Token One',
        'UTO',
        '18',
        { from: admin }
      )

      // deploy fake cToken
      cToken18 = await CompoundFake.new(
        'Compound CToken One',
        'CTO',
        '18',
        underlying18.address,
        '10000000', // exchange rate - 10
      )

      // deploy earning pool
      earningPool18 = await EarningPoolFake.new(
        underlying18.address,
        fakeRewardToken.address,
        cToken18.address,
        { from: admin }
      )

      // deploy nToken
      newNToken = await NToken.new(
        'new nToken',
        'NNTK',
        '18',
        [earningPool6.address, earningPool20.address, earningPool18.address],
        newRewardPool.address,
        { from: admin }
      )
      // add nToken as manager in reward pool
      await newRewardPool.promote(newNToken.address, { from: admin })


      // mint underlying6 for user
      await underlying6.mint(user, '100000000') // 100
      // approve to newNToken
      await underlying6.approve(newNToken.address, '115792089237316195423570985008687907853269984665640564039457584007913129639935', { from: user }) // infinite

      // mint underlying20 for user
      await underlying20.mint(user, '10000000000000000000000') // 100
      // approve to newNToken
      await underlying20.approve(newNToken.address, '115792089237316195423570985008687907853269984665640564039457584007913129639935', { from: user }) // infinite

      // mint underlying18 for user
      await underlying18.mint(user, '100000000000000000000') // 100
      // approve to newNToken
      await underlying18.approve(newNToken.address, '115792089237316195423570985008687907853269984665640564039457584007913129639935', { from: user }) // infinite
    })

    it('should allow mint, swap and redeem for underlying with different decimal precision', async () => {
      /*** MINT ***/
      await newNToken.mint(user, underlying6.address, '100000000', { from: user })
      await newNToken.mint(user, underlying18.address, '100000000000000000000', { from: user })
      await newNToken.mint(user, underlying20.address, '10000000000000000000000', { from: user })
      // check balances
      expect(await newNToken.balanceOf(user)).to.be.bignumber.equal('300000000000000000000') // 300

      /*** REDEEM ***/
      await newNToken.redeem(user, underlying6.address, '100000000', { from: user })
      // check balances
      expect(await newNToken.balanceOf(user)).to.be.bignumber.equal('200000000000000000000') // 200
      expect(await underlying6.balanceOf(user)).to.be.bignumber.equal('100000000') // 100

      /*** SWAP ***/
      await newNToken.swap(user, underlying6.address, '100000000', underlying18.address, { from: user })
      // check balances
      expect(await newNToken.balanceOf(user)).to.be.bignumber.equal('200000000000000000000') // 200
      expect(await underlying6.balanceOf(user)).to.be.bignumber.equal('0')
      expect(await underlying18.balanceOf(user)).to.be.bignumber.equal('100000000000000000000') // 100

      /*** REDEEM ALL ***/
    })
  })
})
