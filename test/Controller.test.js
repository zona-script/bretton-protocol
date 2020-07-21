const { accounts, contract, web3 } = require('@openzeppelin/test-environment')
const { BN, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai')

// Load compiled artifacts
const Controller = contract.fromArtifact('Controller')
const BTokenFake = contract.fromArtifact('BTokenFake')
const OffChainPriceOracle = contract.fromArtifact('OffChainPriceOracle')
const PricingOracleFake = contract.fromArtifact('PricingOracleFake')

describe('Controller', function () {
  const [ admin, user, nonBToken, someAddress, liquidator, borrower, redeemer ] = accounts;
  let controller, oracle, listedToken

  beforeEach(async function () {
    // Deploy a new Controller contract for each test
    controller = await Controller.new({ from: admin })
    // Allow 10 market enters per user
    await controller._setMaxAssets(new BN('10'), {from: admin})

    // Deploy a new bToken contract for listing
    listedToken = await BTokenFake.new({from: admin})
    await controller._supportMarket(listedToken.address, {from: admin})
    await listedToken._setController(controller.address, {from: admin})

    // Deploy a new oracle and set price for listedToken
    oracle = await PricingOracleFake.new()
    oracle.setPrice(listedToken.address, new BN('431'))
    controller._setPriceOracle(oracle.address, {from: admin})
  })

  it('isController', async () => {
    expect(await controller.isController()).to.equal(true)
  })

  describe('listMarket', function () {
    let tokenToList
    beforeEach(async function () {
      // Deploy a new bToken contract for listing
      tokenToList = await BTokenFake.new()
    })

    it('only admin can list market', async () => {
      await expectRevert(
        controller._supportMarket(tokenToList.address, {from: user}),
        'Ownable: caller is not the owner'
      )
    })

    it('should not be able list non bToken markets', async () => {
      await expectRevert(
        controller._supportMarket(nonBToken, {from: admin}),
        'revert'
      )
    })

    it('should list a market', async () => {
      const receipt = await controller._supportMarket(tokenToList.address, {from: admin})
      // check market is listed
      const marketList = await controller.getAllMarkets.call()
      const marketInfo = await controller.markets.call(tokenToList.address)
      expect(marketList[1]).to.equal(tokenToList.address) // tokenToList is the second listed token
      expect(marketInfo[0]).to.equal(true)
      // check event
      expectEvent(receipt, 'MarketListed', {
        bToken: tokenToList.address,
      })
    })

    it('should return error listing market already listed', async () => {
      await controller._supportMarket(tokenToList.address, {from: admin})
      await expectRevert(
        controller._supportMarket(tokenToList.address, {from: admin}),
        'market already listed'
      )
    })
  })

  describe('enterMarkets', function () {
    let tokenOne, tokenTwo
    beforeEach(async function () {
      // Deploy and list a bTokens
      tokenOne = await BTokenFake.new()
      tokenTwo = await BTokenFake.new()
      await controller._supportMarket(tokenOne.address, {from: admin})
      await controller._supportMarket(tokenTwo.address, {from: admin})
    })

    it('should not be able to enter market that is not listed', async () => {
      const unListedToken = await BTokenFake.new()
      const rcode = await controller.enterMarket.call(unListedToken.address, {from: user})
      expect(rcode).to.be.bignumber.equal(new BN('8'))
      expect(await controller.checkMembership.call(user, unListedToken.address, {from: user})).to.equal(false)
    })

    it('should be able to enter market', async () => {
      // check rcode
      const rcode = await controller.enterMarket.call(tokenOne.address, {from: user})
      expect(rcode).to.be.bignumber.equal(new BN('0'))

      // check market entered
      const receipt = await controller.enterMarket(tokenOne.address, {from: user})
      expect(await controller.checkMembership.call(user, tokenOne.address)).to.equal(true)
      // check event
      expectEvent(receipt, 'MarketEntered', {
        bToken: tokenOne.address,
        account: user
      })
      // check assetsin
      const assetsIn = await controller.getAssetsIn(user)
      expect(assetsIn.length).to.equal(1)
    })

    it('should not return error entering market already entered', async () => {
      // Enter tokenOne
      await controller.enterMarket(tokenOne.address, {from: user})
      // Enter tokenOne again
      const rcode = await controller.enterMarket.call(tokenOne.address, {from: user})
      expect(rcode).to.be.bignumber.equal(new BN('0'))
    })

    it('should not be able to enter new market beyound maxAssets limit', async () => {
      // Set max to 1
      await controller._setMaxAssets(new BN('1'), {from: admin})
      // Enter tokenOne
      await controller.enterMarket(tokenOne.address, {from: user})
      // Enter tokenTwo should fail
      const rcode = await controller.enterMarket.call(tokenTwo.address, {from: user})
      expect(rcode).to.be.bignumber.equal(new BN('15'))
      expect(await controller.checkMembership.call(user, tokenTwo.address)).to.equal(false)
    })
  })

  describe('exitMarkets', function () {
    it('should not be able to exit market if user has borrow balance in that market', async () => {
      // give user some liquidity
      await liquiditySetup(controller, oracle, user)
      // give user some borrowed balance for the token to exit
      await tokenOne.setBorrowBalanceStored(new BN('1'), user)
      // try exit
      const rcode = await controller.exitMarket.call(tokenOne.address, {from: user})
      expect(rcode).to.be.bignumber.equal(new BN('11'))
    })

    it('should not be able to exit market if user is not allowed to redeem all their token in this market', async () => {
      // enter market to a new token
      await controller.enterMarket(listedToken.address, {from: user})
      // give user some shortfall to tokenOne and tokenTwo
      await shortfallSetup(controller, oracle, user)
      // try exit
      const rcode = await controller.exitMarket.call(listedToken.address, {from: user})
      expect(rcode).to.be.bignumber.equal(new BN('13'))
    })

    it('should be able to exit market', async () => {
      // enter market to a new token
      await controller.enterMarket(listedToken.address, {from: user})
      // try exit
      const receipt = await controller.exitMarket(listedToken.address, {from: user})
      // check market exited
      expect(await controller.checkMembership.call(user, listedToken.address)).to.equal(false)
      // check event
      expectEvent(receipt, 'MarketExited', {
        bToken: listedToken.address,
        account: user
      })
      // check assetsin
      const assetsIn = await controller.getAssetsIn(user)
      expect(assetsIn.length).to.equal(0)
    })

    it('should be able to exit market user is not in', async () => {
      // try exit
      const rcode = await controller.exitMarket.call(listedToken.address, {from: user})
      expect(rcode).to.be.bignumber.equal(new BN('0'))
    })
  })

  describe('mintAllowed', function () {
    it.skip('should not allow mint if mint is paused globally', async () => {

    })

    it.skip('should not allow mint if mint is paused for this market', async () => {

    })

    it('should not allow mint if market is not listed', async () => {
      // unlisted token should not allow mint
      const unlistedToken = await BTokenFake.new()
      const someMintAmount = 12123
      let rcode = await controller.mintAllowed.call(unlistedToken.address, user, someMintAmount)
      expect(rcode).to.be.bignumber.equal(new BN('8'))

      // listed token should allow mint
      rcode = await controller.mintAllowed.call(listedToken.address, user, someMintAmount)
      expect(rcode).to.be.bignumber.equal(new BN('0'))
    })
  })

  describe('mintVerify', function () {
    it('should pass always', async () => {})
  })

  describe('redeemAllowed', function () {
    it('should not allow redeem if market is not listed', async () => {
      const someRedeemAmount = new BN('123')
      const rcode = await controller.redeemAllowed.call(someAddress, user, someRedeemAmount)
      expect(rcode).to.be.bignumber.equal(new BN('8'))
    })

    it('should allow redeem if user did not enter market', async () => {
      // make sure user have shortfall for this test
      await shortfallSetup(controller, oracle, user)
      const someRedeemAmount = new BN('123')
      const rcode = await controller.redeemAllowed.call(listedToken.address, user, someRedeemAmount)
      expect(rcode).to.be.bignumber.equal(new BN('0'))
    })

    it('should not allow redeem if user has shortfall', async () => {
      // setup shortfall
      await shortfallSetup(controller, oracle, redeemer)
      const someRedeemAmount = new BN('123')
      const rcode = await controller.redeemAllowed.call(tokenOne.address, redeemer, someRedeemAmount)
      expect(rcode).to.be.bignumber.equal(new BN('4'))
    })

    it('should not allow redeem if redeem amount creates shortfall', async () => {
      // give user some liquidity
      await liquiditySetup(controller, oracle, redeemer)
      const someAmountOverLiquidity = new BN('30000000000000000001')
      const rcode = await controller.redeemAllowed.call(tokenOne.address, redeemer, someAmountOverLiquidity)
      expect(rcode).to.be.bignumber.equal(new BN('4'))
    })

    it('should allow redeem if user have liquidity', async () => {
      // give user some liquidity
      await liquiditySetup(controller, oracle, redeemer)
      const someRedeemAmount = 12123
      const rcode = await controller.redeemAllowed.call(tokenOne.address, redeemer, someRedeemAmount)
      expect(rcode).to.be.bignumber.equal(new BN('0'))
    })

    it('should allow redeem if user have exactly zero liquidity and shortfall after redeem', async () => {
      // give user some liquidity
      await liquiditySetup(controller, oracle, redeemer)
      const liquidityAmount = new BN('30000000000000000000')
      const rcode = await controller.redeemAllowed.call(tokenOne.address, redeemer, liquidityAmount)
      expect(rcode).to.be.bignumber.equal(new BN('0'))
    })
  })

  describe('redeemVerify', function () {
    it('should not be able use 0 bTokens to redeem >0 underlying', async () => {
      const zeroBTokens = 0
      const greaterThanZeroUnderlying = 1
      await expectRevert(
        controller.redeemVerify(someAddress, user, greaterThanZeroUnderlying, zeroBTokens),
        'redeemTokens zero'
      )
    })
  })

  describe('borrowAllowed', function () {
    it.skip('should not allow borrow if borrow is paused globally', async () => {

    })

    it.skip('should not allow borrow if borrow is paused for this market', async () => {

    })

    it('should not allow borrow if market is not listed', async () => {
      const unlistedToken = await BTokenFake.new()
      const someBorrowAmount = 12123
      let rcode = await controller.borrowAllowed.call(unlistedToken.address, borrower, someBorrowAmount)
      expect(rcode).to.be.bignumber.equal(new BN('8'))
    })

    it('caller must bToken if borrower not entered market, and enter market for borrower', async () => {
      const someBorrowAmount = 12123
      // call from borrower should revert
      await expectRevert(
        controller.borrowAllowed.call(listedToken.address, borrower, someBorrowAmount, {from: borrower}),
        'sender must be bToken'
      )

      // call from bToken should enter market for borrower
      const rcode = await listedToken.callBorrowAllowed.call(controller.address, borrower, someBorrowAmount, {from: borrower})
      expect(rcode).to.be.bignumber.equal(new BN('0'))
      await listedToken.callBorrowAllowed(controller.address, borrower, someBorrowAmount, {from: borrower})
      expect(await controller.checkMembership.call(borrower, listedToken.address)).to.equal(true)
    })

    it('should not allow borrow if no pricing info for market', async () => {
      // enter market
      await controller.enterMarket(listedToken.address, {from: borrower})
      // Set listedToken price to zero
      await oracle.setPrice(listedToken.address, new BN('0'), {from: admin})
      const someBorrowAmount = 12123
      let rcode = await controller.borrowAllowed.call(listedToken.address, borrower, someBorrowAmount)
      expect(rcode).to.be.bignumber.equal(new BN('12'))
    })

    it('should not allow borrow if user have shortfall', async () => {
      // setup shortfall
      await shortfallSetup(controller, oracle, borrower)
      const someBorrowAmount = 12123
      let rcode = await controller.borrowAllowed.call(tokenOne.address, borrower, someBorrowAmount)
      expect(rcode).to.be.bignumber.equal(new BN('4'))
    })

    it('should not allow borrow if borrow amount creates shortfall', async () => {
      // give user some liquidity
      await liquiditySetup(controller, oracle, borrower)
      const borrowAmountOverLiquidity = new BN('30000000000000000001')
      const rcode = await controller.borrowAllowed.call(tokenOne.address, borrower, borrowAmountOverLiquidity)
      expect(rcode).to.be.bignumber.equal(new BN('4'))
    })

    it('should allow borrow if user have liquidity', async () => {
      // should allow borrow if user have liquidity
      await liquiditySetup(controller, oracle, borrower)
      const someBorrowAmount = 12123
      const rcode = await controller.borrowAllowed.call(tokenOne.address, borrower, someBorrowAmount)
      expect(rcode).to.be.bignumber.equal(new BN('0'))
    })

    it('should allow borrow if user have exactly zero liquidity and shortfall after borrow', async () => {
      // give user some liquidity
      await liquiditySetup(controller, oracle, borrower)
      const borrowAmountExactlyEqualToLiquidity = new BN('30000000000000000000')
      const rcode = await controller.borrowAllowed.call(tokenOne.address, borrower, borrowAmountExactlyEqualToLiquidity)
      expect(rcode).to.be.bignumber.equal(new BN('4'))
    })
  })

  describe('borrowVerify', function () {
    it('should pass always', async () => {

    })
  })

  describe('repayBorrowAllowed', function () {
    it('should not allow repay if market is not listed', async () => {
      // unlisted token should repayBorrowAllowed
      const unlistedToken = await BTokenFake.new()
      const someRepayAmount = 12123
      let rcode = await controller.repayBorrowAllowed.call(unlistedToken.address, someAddress, someAddress, someRepayAmount)
      expect(rcode).to.be.bignumber.equal(new BN('8'))

      // listed token should repayBorrowAllowed
      rcode = await controller.repayBorrowAllowed.call(listedToken.address, someAddress, someAddress, someRepayAmount)
      expect(rcode).to.be.bignumber.equal(new BN('0'))
    })
  })

  describe('repayBorrowVerify', function () {
    it('should pass always', async () => {

    })
  })

  describe('liquidateBorrowAllowed', function () {
    let borrowToken, collateralToken
    beforeEach(async function () {
      // Deploy and list a bTokens
      borrowToken = await BTokenFake.new()
      collateralToken = await BTokenFake.new()
      await controller._supportMarket(borrowToken.address, {from: admin})
      await controller._supportMarket(collateralToken.address, {from: admin})
    })

    it('should not allow liquidate if borrowed market is not listed', async () => {
      const unlistedToken = await BTokenFake.new()
      const someRepayAmount = 12123
      let rcode = await controller.liquidateBorrowAllowed.call(unlistedToken.address, listedToken.address, someAddress, someAddress, someRepayAmount)
      expect(rcode).to.be.bignumber.equal(new BN('8'))
    })

    it('should not allow liquidate if collateral market is not listed', async () => {
      const unlistedToken = await BTokenFake.new()
      const someRepayAmount = 12123
      let rcode = await controller.liquidateBorrowAllowed.call(listedToken.address, unlistedToken.address, someAddress, someAddress, someRepayAmount)
      expect(rcode).to.be.bignumber.equal(new BN('8'))
    })

    it('should not allow liquidate if borrower does not have shortfall', async () => {
      // make sure borrower has liquidity
      await liquiditySetup(controller, oracle, borrower)

      const someRepayAmount = 12123
      const rcode = await controller.liquidateBorrowAllowed.call(borrowToken.address, collateralToken.address, someAddress, borrower, someRepayAmount)
      expect(rcode).to.be.bignumber.equal(new BN('3'))
    })

    it('should not allow liquidate beyound closing factor', async () => {
      // make sure borrower has shortfall
      await shortfallSetup(controller, oracle, borrower)

      // update borrowBalance of borrowedToken
      const borrowedAmount = new BN('100')
      await borrowToken.setBorrowBalanceStored(borrowedAmount, borrower)
      // set closeFactorMantissa for borrowToken
      const closeFactorMantissa = new BN('500000000000000000') // 0.5
      await controller._setCloseFactor(borrowToken.address, closeFactorMantissa, {from: admin})

      // assert fail
      const greaterThanMaxRepayAmount =  new BN('51') // max is 50
      let rcode = await controller.liquidateBorrowAllowed.call(borrowToken.address,
                                                               collateralToken.address,
                                                               liquidator,
                                                               borrower,
                                                               greaterThanMaxRepayAmount)
      expect(rcode).to.be.bignumber.equal(new BN('16'))

      // assert success
      const maxRepayAmount =  new BN('50')
      rcode = await controller.liquidateBorrowAllowed.call(borrowToken.address,
                                                           collateralToken.address,
                                                           liquidator,
                                                           borrower,
                                                           maxRepayAmount)
      expect(rcode).to.be.bignumber.equal(new BN('0'))
    })
  })

  describe('liquidateBorrowVerify', function () {
    it('should pass always', async () => {

    })
  })

  describe('seizeAllowed', function () {
    it.skip('should not allow seize if seize is paused globally', async () => {

    })

    it('should not allow seize if borrowed market is not listed', async () => {
      const unListedToken = await BTokenFake.new()
      const someAmount = new BN('123')
      const rcode = await controller.seizeAllowed.call(unListedToken.address, listedToken.address, someAddress, someAddress, someAmount)
      expect(rcode).to.be.bignumber.equal(new BN('8'))
    })

    it('should not allow seize if collateral market is not listed', async () => {
      const unListedToken = await BTokenFake.new()
      const someAmount = new BN('123')
      const rcode = await controller.seizeAllowed.call(listedToken.address, unListedToken.address, someAddress, someAddress, someAmount)
      expect(rcode).to.be.bignumber.equal(new BN('8'))
    })

    it('should not allow seize if borrowed market and collateral market have different controller instance', async () => {
      // create another listed token
      const anotherListedToken = await BTokenFake.new({from: admin})
      await controller._supportMarket(anotherListedToken.address, {from: admin})
      // create a different controllers for tokens
      const newController = await Controller.new()
      await anotherListedToken._setController(newController.address, {from: admin})
      // try seizeAllowed
      const someAmount = new BN('123')
      const rcode = await controller.seizeAllowed.call(listedToken.address, anotherListedToken.address, someAddress, someAddress, someAmount)
      expect(rcode).to.be.bignumber.equal(new BN('2'))
    })
  })

  describe('seizeVerify', function () {
    it('should pass always', async () => {

    })
  })

  describe('transferAllowed', function () {
    it.skip('should not allow transfer if transfer is paused globally', async () => {

    })

    it('should not allow transfer if user is not allowed to redeem the transfer amount', async () => {
      // give user some shortfall
      await shortfallSetup(controller, oracle, user)
      const someTransferAmount = new BN('123')
      const rcode = await controller.transferAllowed.call(tokenOne.address, user, someAddress, someTransferAmount)
      expect(rcode).to.be.bignumber.equal(new BN('4'))
    })

    it('should allow transfer if user is allowed to redeem the transfer amount', async () => {
      // give user some liquidity
      await liquiditySetup(controller, oracle, user)
      const someTransferAmount = new BN('123')
      const rcode = await controller.transferAllowed.call(tokenOne.address, user, someAddress, someTransferAmount)
      expect(rcode).to.be.bignumber.equal(new BN('0'))
    })
  })

  describe('transferVerify', function () {
    it('should pass always', async () => {

    })
  })

  describe('_setPriceOracle', function () {
    it('only admin can set oracle', async () => {
      const offChainOracle = await OffChainPriceOracle.new({from: admin})
      await expectRevert(
        controller._setPriceOracle(offChainOracle.address, {from: user}),
        'Ownable: caller is not the owner'
      )

      const receipt = await controller._setPriceOracle(offChainOracle.address, {from: admin})
      // check closeFactorMantissa is set
      const oracleAddress = await controller.oracle.call()
      expect(oracleAddress).to.be.bignumber.equal(offChainOracle.address)
      // check event
      expectEvent(receipt, 'NewPriceOracle', {
        oldPriceOracle: oracle.address,
        newPriceOracle: oracleAddress
      })
    })

    it('should not be able to set non-oracle', async () => {
      await expectRevert(
        controller._setPriceOracle(someAddress, {from: admin}),
        'revert'
      )
    })
  })

  describe('_setCloseFactor', function () {
    it('only admin can set closingFactor', async () => {
      const closeFactorMantissa = new BN('500000000000000000')
      await expectRevert(
        controller._setCloseFactor(someAddress, closeFactorMantissa, {from: user}),
        'Ownable: caller is not the owner'
      )

      const receipt = await controller._setCloseFactor(someAddress, closeFactorMantissa, {from: admin})
      // check closeFactorMantissa is set
      const marketInfo = await controller.markets.call(someAddress)
      expect(marketInfo[2]).to.be.bignumber.equal(closeFactorMantissa)
      // check event
      expectEvent(receipt, 'NewCloseFactor', {
        bToken: someAddress,
        oldCloseFactorMantissa: new BN('0'),
        newCloseFactorMantissa: closeFactorMantissa
      })
    })

    it('closingFactor cannot be higher than maxClosingFactor', async () => {
      const closeFactorMantissaTooLarge = new BN('900000000000000001')
      const rcode = await controller._setCloseFactor.call(someAddress, closeFactorMantissaTooLarge, {from: admin})
      expect(rcode).to.be.bignumber.equal(new BN('5'))
    })

    it('closingFactor cannot be lower than minClosingFactor', async () => {
      const closeFactorMantissaTooSmall = new BN('40000000000000000')
      const rcode = await controller._setCloseFactor.call(someAddress, closeFactorMantissaTooSmall, {from: admin})
      expect(rcode).to.be.bignumber.equal(new BN('5'))
    })
  })

  describe('_setMaxAssets', function () {
    it('only admin can set maxAssets', async () => {
      const maxAssets = new BN('5')
      await expectRevert(
        controller._setMaxAssets(maxAssets, {from: user}),
        'Ownable: caller is not the owner'
      )

      const receipt = await controller._setMaxAssets(maxAssets, {from: admin})
      // check new maxAsset
      const actualMaxAssets = await controller.maxAssets.call()
      expect(actualMaxAssets).to.be.bignumber.equal(maxAssets)
      // check event
      expectEvent(receipt, 'NewMaxAssets', {
        oldMaxAssets: new BN('10'),
        newMaxAssets: maxAssets
      })
    })
  })

  describe('_setLiquidationIncentive', function () {
    it('only admin can set liquidationIncentive', async () => {
      const liquidationIncentiveMantissa = new BN('1200000000000000000') // 1.2
      await expectRevert(
        controller._setLiquidationIncentive(someAddress, liquidationIncentiveMantissa, {from: user}),
        'Ownable: caller is not the owner'
      )

      const receipt = await controller._setLiquidationIncentive(someAddress, liquidationIncentiveMantissa, {from: admin})
      // check new liquidation incentive
      const marketInfo = await controller.markets.call(someAddress)
      expect(marketInfo[3]).to.be.bignumber.equal(liquidationIncentiveMantissa)
      // check event
      expectEvent(receipt, 'NewLiquidationIncentive', {
        bToken: someAddress,
        oldLiquidationIncentiveMantissa: new BN('0'),
        newLiquidationIncentiveMantissa: liquidationIncentiveMantissa
      })
    })

    it('liquidationIncentive cannot be higher than maxLiquidationIncentive', async () => {
      const liquidationIncentiveMantissaTooLarge = new BN('1500000000000000001') // max is 1.5
      const rcode = await controller._setLiquidationIncentive.call(someAddress, liquidationIncentiveMantissaTooLarge, {from: admin})
      expect(rcode).to.be.bignumber.equal(new BN('7'))
    })

    it('liquidationIncentive cannot be minLiquidationIncentive', async () => {
      const liquidationIncentiveMantissaTooSmall = new BN('900000000000000000') // min is 1
      const rcode = await controller._setLiquidationIncentive.call(someAddress, liquidationIncentiveMantissaTooSmall, {from: admin})
      expect(rcode).to.be.bignumber.equal(new BN('7'))
    })
  })

  describe('_setCollateralFactor', function () {
    it('only admin can set collateralFactor', async () => {
      const collateralFactorMantissa = new BN('500000000000000000')
      await expectRevert(
        controller._setCollateralFactor(listedToken.address, collateralFactorMantissa, {from: user}),
        'Ownable: caller is not the owner'
      )

      const receipt = await controller._setCollateralFactor(listedToken.address, collateralFactorMantissa, {from: admin})
      // check collateralFactorMantissa is set
      const marketInfo = await controller.markets.call(listedToken.address)
      expect(marketInfo[1]).to.be.bignumber.equal(collateralFactorMantissa)
      // check event
      expectEvent(receipt, 'NewCollateralFactor', {
        bToken: listedToken.address,
        oldCollateralFactorMantissa: new BN('0'),
        newCollateralFactorMantissa: collateralFactorMantissa
      })
    })

    it('cannot set collateral factor is market is not listed', async () => {
      const unListedToken = await BTokenFake.new()
      const rcode = await controller._setCollateralFactor.call(unListedToken.address, new BN('100000000000000000'), {from: admin})
      expect(rcode).to.be.bignumber.equal(new BN('8'))
    })

    it('collateralFactor cannot be higher than maxCollateralFactor', async () => {
      const collateralFactorMantissaTooLarge = new BN('900000000000000001')
      const rcode = await controller._setCollateralFactor.call(listedToken.address, collateralFactorMantissaTooLarge, {from: admin})
      expect(rcode).to.be.bignumber.equal(new BN('6'))
    })

    it('asset must have pricing if collateralFactor is non-zero', async () => {
      // Set oracle price to zero
      oracle.setPrice(listedToken.address, new BN('0'))

      // Set non-zero collateral factor
      const nonZeroCollateralFactorMantissa = new BN('100000000000000000')
      let rcode = await controller._setCollateralFactor.call(listedToken.address, nonZeroCollateralFactorMantissa, {from: admin})
      expect(rcode).to.be.bignumber.equal(new BN('12'))

      // Set zero collateral factor
      rcode = await controller._setCollateralFactor.call(listedToken.address, new BN('0'), {from: admin})
      expect(rcode).to.be.bignumber.equal(new BN('0'))
    })
  })

  describe('pauseActions', function () {
    // pause action
    it.skip('only owner can pause mint globally', async () => {

    })

    it.skip('only owner can pause borrow globally', async () => {

    })

    it.skip('only owner can pause transfer globally', async () => {

    })

    it.skip('only owner can pause seize globally', async () => {

    })

    it.skip('only owner can pause liquidate globally', async () => {

    })

    it.skip('only owner can pause mint for market', async () => {

    })

    it.skip('only owner can pause borrow for market', async () => {

    })
  })

  describe('getAccountLiquidity', function () {
    it('should calculate account liquidity with positive liquidity', async () => {
      await liquiditySetup(controller, oracle, user)

      const result = await controller.getAccountLiquidity.call(user)
      expect(result[0]).to.be.bignumber.equal(new BN('0')) // rcode
      expect(result[1]).to.be.bignumber.equal(new BN('30000000000000000000')) // liquidity
      expect(result[2]).to.be.bignumber.equal(new BN('0')) // shortfall
    })

    it('should calculate account liquidity with negative liquidity (shortfall)', async () => {
      await shortfallSetup(controller, oracle, user)

      const result = await controller.getAccountLiquidity.call(user)
      expect(result[0]).to.be.bignumber.equal(new BN('0')) // rcode
      expect(result[1]).to.be.bignumber.equal(new BN('0')) // liquidity
      expect(result[2]).to.be.bignumber.equal(new BN('30000000000000000000')) // shortfall
    })

    it('should return error if cannot get snapshot from token', async () => {
      // add asset without snapshot for user
      tokenOne = await BTokenFake.new()
      tokenOne.setSnapShotRcode(new BN('1'))
      await controller._supportMarket(tokenOne.address, {from: admin})
      // enter markets
      await controller.enterMarket(tokenOne.address, {from: user})

      const result = await controller.getAccountLiquidity.call(user)
      expect(result[0]).to.be.bignumber.equal(new BN('14')) // rcode
    })

    it('should return error if cannot get price info for token', async () => {
      // add asset for user
      tokenOne = await BTokenFake.new()
      await controller._supportMarket(tokenOne.address, {from: admin})
      // enter markets
      await controller.enterMarket(tokenOne.address, {from: user})
      // set up oracle without price
      const testOracle = await PricingOracleFake.new()
      await controller._setPriceOracle(testOracle.address, {from: admin})

      const result = await controller.getAccountLiquidity.call(user)
      expect(result[0]).to.be.bignumber.equal(new BN('12')) // rcode
    })
  })

  describe('liquidateCalculateSeizeTokens', function () {
    it('should fail if no price for collateral token', async () => {
      const amountRepay = new BN('123')
      const result = await controller.liquidateCalculateSeizeTokens.call(someAddress, listedToken.address, amountRepay)
      expect(result[0]).to.be.bignumber.equal(new BN('12')) // rcode
      expect(result[1]).to.be.bignumber.equal(new BN('0')) // number of collateral token
    })

    it('should fail if no price for borrowed token', async () => {
      const amountRepay = new BN('123')
      const result = await controller.liquidateCalculateSeizeTokens.call(listedToken.address, someAddress, amountRepay)
      expect(result[0]).to.be.bignumber.equal(new BN('12')) // rcode
      expect(result[1]).to.be.bignumber.equal(new BN('0')) // number of collateral token
    })

    it('should calculate collateral to seize given underlying amount', async () => {
      // setup 2 tokens with pricing and exchange rate
      const borrowToken = await BTokenFake.new()
      const collateralToken = await BTokenFake.new()
      await borrowToken.setExchangeRate(new BN('2000000000000000000')) // 2
      await collateralToken.setExchangeRate(new BN('3000000000000000000')) // 3
      await oracle.setPrice(borrowToken.address, new BN('4000000000000000000'), {from: admin}) // 4
      await oracle.setPrice(collateralToken.address, new BN('5000000000000000000'), {from: admin}) // 5
      // set liquidation incentive to 5% to borrow token
      const liquidationIncentiveMantissa = new BN('1050000000000000000') // 1.05
      const receipt = await controller._setLiquidationIncentive(borrowToken.address, liquidationIncentiveMantissa, {from: admin})
      // calculate
      const amountRepay = new BN('1000000000000000000') // 1
      const result = await controller.liquidateCalculateSeizeTokens.call(borrowToken.address, collateralToken.address, amountRepay)
      expect(result[0]).to.be.bignumber.equal(new BN('0')) // rcode
      // seizeAmount = amountRepay * liquidationIncentive * priceBorrowed / priceCollateral
      // seizeTokens = seizeAmount / exchangeRate
      // amountRepay * (liquidationIncentive * priceBorrowed) / (priceCollateral * exchangeRate)
      // = 1 * (1.05 * 4) / (5 * 3)
      // = 0.28
      expect(result[1]).to.be.bignumber.equal(new BN('280000000000000000')) // seizeTokens
    })
  })

  // Setup controller with a sample user that has some btoken and borrow balances
  // resulting in net positive liquidity of 30 ETH
  async function liquiditySetup(controller, oracle, testUser) {
    // add two assets for testUser
    tokenOne = await BTokenFake.new()
    tokenTwo = await BTokenFake.new()
    await controller._supportMarket(tokenOne.address, {from: admin})
    await controller._supportMarket(tokenTwo.address, {from: admin})

    // enter markets
    await controller.enterMarket(tokenOne.address, {from: testUser})
    expect(await controller.checkMembership.call(testUser, tokenOne.address, {from: testUser})).to.equal(true)
    await controller.enterMarket(tokenTwo.address, {from: testUser})
    expect(await controller.checkMembership.call(testUser, tokenTwo.address, {from: testUser})).to.equal(true)

    // set up pricing in oracle for assets
    tokenOneToEtherPriceMantissa = new BN('2000000000000000000') // 2 Token / ETH
    tokenTwoToEtherPriceMantissa = new BN('4000000000000000000') // 4 Token / ETh
    oracle.setPrice(tokenOne.address, tokenOneToEtherPriceMantissa)
    oracle.setPrice(tokenTwo.address, tokenTwoToEtherPriceMantissa)
    await controller._setPriceOracle(oracle.address, {from: admin})
    expect(await controller.oracle.call()).to.equal(oracle.address)

    // set up tokenBalance, borrowBalance, and exchangeRate for both tokens
    const tokenOneTokenBalance = new BN('10000000000000000000') // 10
    const tokenTwoTokenBalance = new BN('20000000000000000000') // 20
    tokenOne.setTokenBalance(tokenOneTokenBalance, testUser)
    tokenTwo.setTokenBalance(tokenTwoTokenBalance, testUser)
    const tokenOneBorrowBalance = new BN('2000000000000000000') // 2
    const tokenTwoBorrowBalance = new BN('4000000000000000000') // 4
    tokenOne.setBorrowBalanceStored(tokenOneBorrowBalance, testUser)
    tokenTwo.setBorrowBalanceStored(tokenTwoBorrowBalance, testUser)
    const exchangeRateMantissa = new BN('1000000000000000000') // 1:1 btoken exchange rate for simplicity
    tokenOne.setExchangeRate(exchangeRateMantissa)
    tokenTwo.setExchangeRate(exchangeRateMantissa)

    // set collateralFactor
    const collateralFactorMantissa = new BN('500000000000000000') // 0.5 or 50%
    await controller._setCollateralFactor(tokenOne.address, collateralFactorMantissa, {from: admin})
    await controller._setCollateralFactor(tokenTwo.address, collateralFactorMantissa, {from: admin})
    // check collateralFactorMantissa is set correctly
    let marketInfo = await controller.markets.call(tokenOne.address)
    expect(marketInfo[1]).to.be.bignumber.equal(collateralFactorMantissa)
    marketInfo = await controller.markets.call(tokenTwo.address)
    expect(marketInfo[1]).to.be.bignumber.equal(collateralFactorMantissa)

    // calculate liquidity
    // totalCollateralInETH = (10 * 2 + 20 * 4) * 0.5 = 50
    // totalBorrowInETH = 2 * 2 + 4 * 4 = 20
    // final liquidity should be 30 ETH
    const result = await controller.getAccountLiquidity.call(testUser)
    expect(result[0]).to.be.bignumber.equal(new BN('0')) // rcode
    expect(result[1]).to.be.bignumber.equal(new BN('30000000000000000000')) // liquidity
    expect(result[2]).to.be.bignumber.equal(new BN('0')) // shortfall
  }

  // Setup controller with a sample user that has some btoken and borrow balances
  // resulting in net negative liquidity of 30 ETH (shortfall)
  async function shortfallSetup(controller, oracle, testUser) {
    // add two assets for testUser
    tokenOne = await BTokenFake.new()
    tokenTwo = await BTokenFake.new()
    await controller._supportMarket(tokenOne.address, {from: admin})
    await controller._supportMarket(tokenTwo.address, {from: admin})

    // enter markets
    await controller.enterMarket(tokenOne.address, {from: testUser})
    expect(await controller.checkMembership.call(testUser, tokenOne.address, {from: testUser})).to.equal(true)
    await controller.enterMarket(tokenTwo.address, {from: testUser})
    expect(await controller.checkMembership.call(testUser, tokenTwo.address, {from: testUser})).to.equal(true)

    // set up pricing in oracle for assets
    tokenOneToEtherPriceMantissa = new BN('2000000000000000000') // 2 Token / ETH
    tokenTwoToEtherPriceMantissa = new BN('4000000000000000000') // 4 Token / ETh
    oracle.setPrice(tokenOne.address, tokenOneToEtherPriceMantissa)
    oracle.setPrice(tokenTwo.address, tokenTwoToEtherPriceMantissa)
    await controller._setPriceOracle(oracle.address, {from: admin})
    expect(await controller.oracle.call()).to.equal(oracle.address)

    // set up tokenBalance, borrowBalance, and exchangeRate for both tokens
    const tokenOneTokenBalance = new BN('10000000000000000000') // 10
    const tokenTwoTokenBalance = new BN('20000000000000000000') // 20
    tokenOne.setTokenBalance(tokenOneTokenBalance, testUser)
    tokenTwo.setTokenBalance(tokenTwoTokenBalance, testUser)
    const tokenOneBorrowBalance = new BN('20000000000000000000') // 20
    const tokenTwoBorrowBalance = new BN('10000000000000000000') // 10
    tokenOne.setBorrowBalanceStored(tokenOneBorrowBalance, testUser)
    tokenTwo.setBorrowBalanceStored(tokenTwoBorrowBalance, testUser)
    const exchangeRateMantissa = new BN('1000000000000000000') // 1:1 btoken exchange rate for simplicity
    tokenOne.setExchangeRate(exchangeRateMantissa)
    tokenTwo.setExchangeRate(exchangeRateMantissa)

    // set collateralFactor
    const collateralFactorMantissa = new BN('500000000000000000') // 0.5 or 50%
    await controller._setCollateralFactor(tokenOne.address, collateralFactorMantissa, {from: admin})
    await controller._setCollateralFactor(tokenTwo.address, collateralFactorMantissa, {from: admin})
    // check collateralFactorMantissa is set correctly
    let marketInfo = await controller.markets.call(tokenOne.address)
    expect(marketInfo[1]).to.be.bignumber.equal(collateralFactorMantissa)
    marketInfo = await controller.markets.call(tokenTwo.address)
    expect(marketInfo[1]).to.be.bignumber.equal(collateralFactorMantissa)

    // calculate liquidity
    // totalCollateralInETH = (10 * 2 + 20 * 4) * 0.5 = 50
    // totalBorrowInETH = 20 * 2 + 10 * 4 = 80
    // final shortfall should be 30 ETH
    const result = await controller.getAccountLiquidity.call(testUser)
    expect(result[0]).to.be.bignumber.equal(new BN('0')) // rcode
    expect(result[1]).to.be.bignumber.equal(new BN('0')) // liquidity
    expect(result[2]).to.be.bignumber.equal(new BN('30000000000000000000')) // shortfall
  }
})
