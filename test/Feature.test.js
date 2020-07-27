const { accounts, contract, web3 } = require('@openzeppelin/test-environment')
const { BN, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers')
const { expect } = require('chai')

// Load compiled artifacts
const ERC20Fake = contract.fromArtifact('ERC20Fake')
const CompoundFake = contract.fromArtifact('CompoundFake')
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
    this.compoundOne = await CompoundFake.new(
      'compoundOne',
      'CTO',
      '6',
      this.underlyingOne.address,
      '10000000000000000000', // exchange rate - 10
    )
    await this.underlyingOne.mint(this.compoundOne.address, '100000000') // 100
    this.compoundTwo = await CompoundFake.new(
      'compoundTwo',
      'CTT',
      '18',
      this.underlyingTwo.address,
      '10000000000000000000', // exchange rate - 10
    )
    await this.underlyingTwo.mint(this.compoundTwo.address, '100000000000000000000') // 100


    // deploy dPools
    this.dPoolOne = await dPool.new(
      'dPoolOne',
      'DPO',
      '6',
      this.underlyingOne.address,
      this.compoundOne.address
    )
    this.dPoolTwo = await dPool.new(
      'dPoolTwo',
      'DPT',
      '18',
      this.underlyingTwo.address,
      this.compoundTwo.address
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
    await this.dToken.mint(this.underlyingOne.address, new BN('100000000'), { from: user }) // mint with 100 of underlying one
    await this.dToken.mint(this.underlyingTwo.address, new BN('100000000000000000000'), { from: user }) // mint with 100 of underlying two

    // should deposit 100 of underingOne and underlyingTwo into dPools
    expect(await this.underlyingOne.balanceOf.call(user)).to.be.bignumber.equal(new BN('0'))
    expect(await this.underlyingTwo.balanceOf.call(user)).to.be.bignumber.equal(new BN('0'))
    expect(await this.dPoolOne.calcPoolValueInUnderlying()).to.be.bignumber.equal(new BN('100000000'))
    expect(await this.dPoolTwo.calcPoolValueInUnderlying()).to.be.bignumber.equal(new BN('100000000000000000000'))

    // should mint 200 dToken
    expect(await this.dToken.totalSupply.call()).to.be.bignumber.equal(new BN('200000000000000000000'))
    expect(await this.dToken.balanceOf.call(user)).to.be.bignumber.equal(new BN('200000000000000000000'))

    /*** REDEEM ***/

    // redeem dToken
    await this.dToken.redeem(this.underlyingOne.address, new BN('100000000'), { from: user }) // redeem into 100 of underlying one
    await this.dToken.redeem(this.underlyingTwo.address, new BN('100000000000000000000'), { from: user })  // redeem into 100 of underlying two

    // should withdraw 100 underlyingTwo from dPool
    expect(await this.underlyingOne.balanceOf.call(user)).to.be.bignumber.equal(new BN('100000000'))
    expect(await this.underlyingTwo.balanceOf.call(user)).to.be.bignumber.equal(new BN('100000000000000000000'))
    expect(await this.dPoolOne.calcPoolValueInUnderlying()).to.be.bignumber.equal(new BN('0'))
    expect(await this.dPoolTwo.calcPoolValueInUnderlying()).to.be.bignumber.equal(new BN('0'))

    // should burn 100 dToken
    expect(await this.dToken.totalSupply.call()).to.be.bignumber.equal(new BN('0'))
    expect(await this.dToken.balanceOf.call(user)).to.be.bignumber.equal(new BN('0'))
  })

  it('accure interest earnings from multiple dPools', async () => {
    // mint
    await this.dToken.mint(this.underlyingOne.address, new BN('100000000'), { from: user }) // mint with 100 of underlying one
    await this.dToken.mint(this.underlyingTwo.address, new BN('100000000000000000000'), { from: user }) // mint with 100 of underlying two

    // accrueInterest
    await this.compoundOne.accrueInterest('2') // increase compound token one exchange rate by 2x
    await this.compoundTwo.accrueInterest('4') // increase compound token two exchange rate by 3x

    // redeem
    // should still have left over compound cToken dPool from accured interest
    await this.dToken.redeem(this.underlyingOne.address, new BN('100000000'), { from: user }) // redeem into 100 of underlying one
    expect(await this.dPoolOne.calcEarningInUnderlying()).to.be.bignumber.equal(new BN('100000000')) // 100 of underlying one
    expect(await this.dPoolOne.calcPoolValueInUnderlying()).to.be.bignumber.equal(new BN('100000000')) // 200 of underlying two
    await this.dToken.redeem(this.underlyingTwo.address, new BN('100000000000000000000'), { from: user })  // redeem into 100 of underlying two
    expect(await this.dPoolTwo.calcEarningInUnderlying()).to.be.bignumber.equal(new BN('300000000000000000000')) // 100 of underlying one
    expect(await this.dPoolTwo.calcPoolValueInUnderlying()).to.be.bignumber.equal(new BN('300000000000000000000')) // 200 of underlying two
  })

  it.skip('collect provider token rewards from multiple dPools', async () => {
  })

  it.skip('mine delta token rewards from minting dToken', async () => {
  })
})
