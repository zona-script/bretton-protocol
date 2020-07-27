const { accounts, contract, web3 } = require('@openzeppelin/test-environment')
const { BN, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers')
const { expect } = require('chai')

// Load compiled artifacts
const ERC20Fake = contract.fromArtifact('ERC20Fake')
const cTokenFake = contract.fromArtifact('cTokenFake')
const dPool = contract.fromArtifact('dPool')
const dToken = contract.fromArtifact('dToken')

describe('Feature', function () {
  const [ admin, user, someAddress ] = accounts
  beforeEach(async () => {
    // deploy underlying tokens and mint for user
    this.underlyingOne = await ERC20Fake.new(
      'underlyingOne',
      'UDO',
      '6' // different decimal place as dToken
    )
    await this.underlyingOne.mint(user, '100000000') // 100
    this.underlyingTwo = await ERC20Fake.new(
      'underlyingTwo',
      'UDT',
      '18' // same decimal place as dToken
    )
    await this.underlyingTwo.mint(user, '100000000000000000000') // 100

    // deploy cTokens, and seed with some underlyings
    this.cTokenOne = await cTokenFake.new(
      'cTokenOne',
      'CTO',
      '6',
      this.underlyingOne.address,
      '10000000000000000000', // exchange rate - 10
    )
    await this.underlyingOne.mint(this.cTokenOne.address, '100000000') // 100
    this.cTokenTwo = await cTokenFake.new(
      'cTokenTwo',
      'CTT',
      '18',
      this.underlyingTwo.address,
      '10000000000000000000', // exchange rate - 10
    )
    await this.underlyingTwo.mint(this.cTokenTwo.address, '100000000000000000000') // 100


    // deploy dPools
    this.dPoolOne = await dPool.new(
      'dPoolOne',
      'DPO',
      '6',
      this.underlyingOne.address,
      this.cTokenOne.address
    )
    this.dPoolTwo = await dPool.new(
      'dPoolTwo',
      'DPT',
      '18',
      this.underlyingTwo.address,
      this.cTokenTwo.address
    )

    // deploy dTokens
    this.dToken = await dToken.new(
      'dToken',
      'DTK',
      '18',
      [this.underlyingOne.address, this.underlyingTwo.address],
      [this.dPoolOne.address, this.dPoolTwo.address]
    )

    // user approve underlying to dToken
    await this.underlyingOne.approve(this.dToken.address, '-1', { from: user }) // inifinite
    await this.underlyingTwo.approve(this.dToken.address, '-1', { from: user }) // inifinite
  })

  it('mint and redeem dToken using multiple underlyings', async () => {
    /*** MINT ***/

    // mint dToken
    const underlyingAmountToMint = new BN('100000000000000000000') // 100
    await this.dToken.mint(this.underlyingTwo.address, underlyingAmountToMint, { from: user })

    // should deposit 100 underlyingTwo into dPool
    expect(await this.underlyingTwo.balanceOf.call(user)).to.be.bignumber.equal(new BN('0'))
    expect(await this.dPoolTwo.calcPoolValueInUnderlying()).to.be.bignumber.equal(underlyingAmountToMint)

    // should mint 100 dToken
    expect(await this.dToken.totalSupply.call()).to.be.bignumber.equal(underlyingAmountToMint)
    expect(await this.dToken.balanceOf.call(user)).to.be.bignumber.equal(underlyingAmountToMint)

    /*** REDEEM ***/

    // redeem dToken
    const underlyingAmountToRedeem = new BN('100000000000000000000') // 100
    await this.dToken.redeem(this.underlyingTwo.address, underlyingAmountToRedeem, { from: user })

    // should withdraw 100 underlyingTwo from dPool
    expect(await this.underlyingTwo.balanceOf.call(user)).to.be.bignumber.equal(underlyingAmountToRedeem)
    expect(await this.dPoolTwo.calcPoolValueInUnderlying()).to.be.bignumber.equal(new BN('0'))

    // should burn 100 dToken
    expect(await this.dToken.totalSupply.call()).to.be.bignumber.equal(new BN('0'))
    expect(await this.dToken.balanceOf.call(user)).to.be.bignumber.equal(new BN('0'))
  })

  it('claim interest earnings from multiple dPools', async () => {
    // mint
    const underlyingAmountToMint = new BN('100000000000000000000')
    await this.dToken.mint(this.underlyingTwo.address, underlyingAmountToMint, { from: user })

    // accrueInterest
    const interest = 2
    await this.cTokenTwo.accrueInterest(interest) // increase exchange rate by 2x

    // redeem
    const underlyingAmountToRedeem = new BN('100000000000000000000') // 100
    await this.dToken.redeem(this.underlyingTwo.address, underlyingAmountToRedeem, { from: user })

    // should still have half of compound cToken accured in dPool in interest earning
    expect(await this.dPoolTwo.calcEarningInUnderlying()).to.be.bignumber.equal(new BN('100000000000000000000'))
    expect(await this.dPoolTwo.calcPoolValueInUnderlying()).to.be.bignumber.equal(new BN('100000000000000000000'))
  })

  it.skip('collect provider token rewards from multiple dPools', async () => {
  })

  it.skip('mine delta token rewards from minting dToken', async () => {
  })
})
