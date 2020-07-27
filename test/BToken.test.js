const { accounts, contract, web3 } = require('@openzeppelin/test-environment')
const { BN, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers')
const { expect } = require('chai')

// Load compiled artifacts
const BErc20Impl = contract.fromArtifact('BErc20Impl')
const StandardToken = contract.fromArtifact('StandardToken')

describe('BToken', function () {
  const [ admin, user, someAddress ] = accounts
  const name = 'Some Name'
  const symbol = 'TTT'
  const decimal = new BN('18')
  const controller = someAddress
  const interestRateModel = someAddress
  const initialExchangeRateMantissa = new BN('1')

  describe.only('initialization', function () {
    beforeEach(async () => {
      this.underlying = await StandardToken.new(new BN('100'),
                                                'someUnderlying',
                                                new BN('18'),
                                                'SUT')

      this.token = await BErc20Impl.new(controller,
                                        interestRateModel,
                                        initialExchangeRateMantissa,
                                        this.underlying.address,
                                        name,
                                        symbol,
                                        decimal,
                                        {from: admin})
    })

    it('isBToken', async () => {
      expect(await this.token.isBToken()).to.equal(true)
    })

    it('has a name', async () => {
      expect(await this.token.name()).to.equal(name)
    })

    it('has a symbol', async () => {
      expect(await this.token.symbol()).to.equal(symbol)
    })

    it('has 18 decimals', async () => {
      expect(await this.token.decimals()).to.be.bignumber.equal(decimal)
    })

    it('has an underlying', async () => {
      expect(await this.token.underlying()).to.equal(this.underlying.address)
    })

    it.skip('has a controller', async () => {

    })

    it.skip('has an interest rate model', async () => {

    })

    it('initializes accrualBlockNumber to current block', async () => {
      const currentBlock = 12 // current block for ganache seems to be 12
      expect(await this.token.accrualBlockNumber()).to.be.bignumber.equal('12')
    })

    it('initializes borrowIndex to mantissa 1', async () => {
      expect(await this.token.borrowIndex()).to.be.bignumber.equal('1000000000000000000')
    })

    it.skip('only owner can initialize market', async () => {

    })

    it('market can only be initialized once', async () => {
      await expectRevert(
        this.token.initialize(controller,
                              interestRateModel,
                              initialExchangeRateMantissa,
                              this.underlying.address,
                              name,
                              symbol,
                              decimal,
                              {from: admin}),
        'market may only be initialized once'
      )
    })
  })

  /*** ERC20 Interface Tests ***/

  describe('total supply', function () {
  })

  describe('balanceOf', function () {
  })

  describe('allowance', function () {
    describe('decrease allowance', function () {
    })

    describe('increase allowance', function () {
    })
  })

  describe('transfer', function () {
  })

  describe('transfer from', function () {
  })

  describe('approve', function () {
  })

  /*** BToken Interface Tests ***/

  describe('mint', function () {
  })

  describe('redeem', function () {
  })

  describe('redeemUnderlying', function () {
  })

  describe('borrow', function () {
  })

  describe('repayBorrow', function () {
  })

  describe('repayBorrowBehalf', function () {
  })

  describe('liquidateBorrow', function () {
  })

  describe('accrue interest', function () {
  })

  /*** Admin Interface Tests ***/

  describe('admin functions', function () {
  })
})
