const { accounts, contract, web3 } = require('@openzeppelin/test-environment')
const { BN, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers')
const { expect } = require('chai')

// Load compiled artifacts
const ERC20Fake = contract.fromArtifact('ERC20Fake')
const CompoundFake = contract.fromArtifact('CompoundFake')
const EarningPool = contract.fromArtifact('EarningPool')
const Mine = contract.fromArtifact('Mine')
const MiningRewardPool = contract.fromArtifact('MiningRewardPool')
const dToken = contract.fromArtifact('dToken')

describe('Features', function () {
  const [ admin, user, stakingPool, rewardToken ] = accounts
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
    await this.underlyingOne.mint(this.compoundOne.address, '1000000000') // 1000
    this.compoundTwo = await CompoundFake.new(
      'compoundTwo',
      'CTT',
      '18',
      this.underlyingTwo.address,
      '10000000000000000000', // exchange rate - 10
    )
    await this.underlyingTwo.mint(this.compoundTwo.address, '1000000000000000000000') // 1000

    // deploy dPools
    this.EarningPoolOne = await EarningPool.new(
      this.underlyingOne.address,
      rewardToken,
      this.compoundOne.address,
      stakingPool
    )
    this.EarningPoolTwo = await EarningPool.new(
      this.underlyingTwo.address,
      rewardToken,
      this.compoundTwo.address,
      stakingPool
    )

    // deploy dTokens
    this.dToken = await dToken.new(
      'dToken',
      'DTK',
      '18',
      [this.underlyingOne.address, this.underlyingTwo.address],
      [this.EarningPoolOne.address, this.EarningPoolTwo.address],
      { from: admin }
    )
    // user approve underlying to dToken
    await this.underlyingOne.approve(this.dToken.address, '-1', { from: user }) // inifinite
    await this.underlyingTwo.approve(this.dToken.address, '-1', { from: user }) // inifinite


    // deploy mining token
    this.miningToken = await ERC20Fake.new(
      'DELTA Protocol Token',
      'DELTA',
      '18', // different decimal place as dToken
      { from: admin }
    )
  })

  it('mint and redeem dToken using multiple underlyings', async () => {
    /*** MINT ***/

    // mint dToken
    await this.dToken.mint(this.underlyingOne.address, new BN('100000000'), { from: user }) // mint with 100 of underlying one
    await this.dToken.mint(this.underlyingTwo.address, new BN('100000000000000000000'), { from: user }) // mint with 100 of underlying two

    // should deposit 100 of underingOne and underlyingTwo into dPools
    expect(await this.underlyingOne.balanceOf.call(user)).to.be.bignumber.equal(new BN('0'))
    expect(await this.underlyingTwo.balanceOf.call(user)).to.be.bignumber.equal(new BN('0'))
    expect(await this.EarningPoolOne.calcPoolValueInUnderlying()).to.be.bignumber.equal(new BN('100000000'))
    expect(await this.EarningPoolTwo.calcPoolValueInUnderlying()).to.be.bignumber.equal(new BN('100000000000000000000'))

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
    expect(await this.EarningPoolOne.calcPoolValueInUnderlying()).to.be.bignumber.equal(new BN('0'))
    expect(await this.EarningPoolTwo.calcPoolValueInUnderlying()).to.be.bignumber.equal(new BN('0'))

    // should burn 100 dToken
    expect(await this.dToken.totalSupply.call()).to.be.bignumber.equal(new BN('0'))
    expect(await this.dToken.balanceOf.call(user)).to.be.bignumber.equal(new BN('0'))
  })

  it('accure interest earnings in multiple dPools', async () => {
    // mint
    await this.dToken.mint(this.underlyingOne.address, new BN('100000000'), { from: user }) // mint with 100 of underlying one
    await this.dToken.mint(this.underlyingTwo.address, new BN('100000000000000000000'), { from: user }) // mint with 100 of underlying two

    // accrueInterest
    await this.compoundOne.accrueInterest('2') // increase compound token one exchange rate by 2x
    await this.compoundTwo.accrueInterest('4') // increase compound token two exchange rate by 4x
    expect(await this.EarningPoolOne.calcUnclaimedEarningInUnderlying()).to.be.bignumber.equal(new BN('100000000')) // 200 of underlying one
    expect(await this.EarningPoolTwo.calcUnclaimedEarningInUnderlying()).to.be.bignumber.equal(new BN('300000000000000000000')) // 400 of underlying two

    // redeem
    // should sent compound cToken earning to staking pool
    await this.dToken.redeem(this.underlyingOne.address, new BN('100000000'), { from: user }) // redeem into 100 of underlying one
    expect(await this.underlyingOne.balanceOf(stakingPool)).to.be.bignumber.equal(new BN('100000000')) // 100 of underlying one
    expect(await this.EarningPoolOne.calcPoolValueInUnderlying()).to.be.bignumber.equal(new BN('0'))
    await this.dToken.redeem(this.underlyingTwo.address, new BN('100000000000000000000'), { from: user })  // redeem into 100 of underlying two
    expect(await this.underlyingTwo.balanceOf(stakingPool)).to.be.bignumber.equal(new BN('300000000000000000000')) // 300 of underlying two
    expect(await this.EarningPoolTwo.calcPoolValueInUnderlying()).to.be.bignumber.equal(new BN('0')) // 300 of underlying two
  })

  it('collect earnings from dPool', async () => {
    // mint
    await this.dToken.mint(this.underlyingOne.address, new BN('10000000'), { from: user }) // mint with 10 of underlying one
    await this.dToken.mint(this.underlyingTwo.address, new BN('10000000000000000000'), { from: user }) // mint with 10 of underlying two

    // accrueInterest
    await this.compoundOne.accrueInterest('2') // increase compound token one exchange rate by 2x
    await this.compoundTwo.accrueInterest('4') // increase compound token two exchange rate by 4x

    // dispenseEarning should transfer earnings to staking contract
    await this.EarningPoolOne.dispenseEarning()
    await this.EarningPoolTwo.dispenseEarning()
    expect(await this.underlyingOne.balanceOf.call(stakingPool)).to.be.bignumber.equal(new BN('10000000')) // 10
    expect(await this.underlyingTwo.balanceOf.call(stakingPool)).to.be.bignumber.equal(new BN('30000000000000000000')) // 30
    expect(await this.EarningPoolOne.calcUnclaimedEarningInUnderlying()).to.be.bignumber.equal(new BN('0')) // 0 of underlying one
    expect(await this.EarningPoolOne.calcPoolValueInUnderlying()).to.be.bignumber.equal(new BN('10000000')) // 10 of underlying one
    expect(await this.EarningPoolTwo.calcUnclaimedEarningInUnderlying()).to.be.bignumber.equal(new BN('0')) // 0 of underlying two
    expect(await this.EarningPoolTwo.calcPoolValueInUnderlying()).to.be.bignumber.equal(new BN('10000000000000000000')) // 10 of underlying two

    // mint some more
    await this.dToken.mint(this.underlyingOne.address, new BN('10000000'), { from: user }) // mint with 10 of underlying one
    await this.dToken.mint(this.underlyingTwo.address, new BN('10000000000000000000'), { from: user }) // mint with 10 of underlying two

    // accrue more interest
    await this.compoundOne.accrueInterest('2') // increase compound token one exchange rate by 2x
    await this.compoundTwo.accrueInterest('2') // increase compound token two exchange rate by 2x

    // dispenseEarning should transfer earnings to staking contract
    await this.EarningPoolOne.dispenseEarning() // interest accrued on total of 20 underlying one
    await this.EarningPoolTwo.dispenseEarning() // interest accrued on total of 20 underlying two
    expect(await this.underlyingOne.balanceOf.call(stakingPool)).to.be.bignumber.equal(new BN('30000000')) // 10 first time interest + 20 second time interest
    expect(await this.underlyingTwo.balanceOf.call(stakingPool)).to.be.bignumber.equal(new BN('50000000000000000000'))  // 30 first time interest + 20 second time interest
    expect(await this.EarningPoolOne.calcUnclaimedEarningInUnderlying()).to.be.bignumber.equal(new BN('0')) // 0 of underlying one
    expect(await this.EarningPoolOne.calcPoolValueInUnderlying()).to.be.bignumber.equal(new BN('20000000')) // 20 of underlying one
    expect(await this.EarningPoolTwo.calcUnclaimedEarningInUnderlying()).to.be.bignumber.equal(new BN('0')) // 0 of underlying two
    expect(await this.EarningPoolTwo.calcPoolValueInUnderlying()).to.be.bignumber.equal(new BN('20000000000000000000')) // 20 of underlying two
  })

  it('swap between two underlyings', async () => {
    // mint underlyingTwo to seed pool
    await this.dToken.mint(this.underlyingTwo.address, new BN('100000000000000000000'), { from: user }) // mint with 100 of underlying two

    // swap
    await this.dToken.swap(this.underlyingOne.address, new BN('5000000'), this.underlyingTwo.address, { from: user }) // swap 5 underlyingOne to 5 underlyingTwo
    expect(await this.underlyingOne.balanceOf.call(user)).to.be.bignumber.equal(new BN('95000000')) // 100 - 5 from swap
    expect(await this.underlyingTwo.balanceOf.call(user)).to.be.bignumber.equal(new BN('5000000000000000000'))  // 5 from swap
  })

  it('mine delta token from minting dToken', async () => {
    const rewardPerBlock = new BN('10000000000000000000') // 10 reward per block
    // deploy mine
    this.miningRewardPool = await MiningRewardPool.new(
      this.miningToken.address,
      rewardPerBlock, // rewardPerBlock rate, 10 mining token distributed per block
      { from: admin }
    )
    // record the block of which mining calculation should start
    const miningStartBlock = await time.latestBlock()
    // mint miningToken for mine
    this.miningToken.mint(this.miningRewardPool.address, '10000000000000000000000') // 10000
    // register mine in dToken
    await this.dToken.setMiningPool(this.miningRewardPool.address, { from: admin })
    // promote dToken as sharesManager in pool
    await this.miningRewardPool.promote(this.dToken.address, { from: admin })

    // mint some dToken
    await this.dToken.mint(this.underlyingTwo.address, new BN('10000000000000000000'), { from: user }) // mint 10 dTokens

    // record the block of which mining calculation should end
    const miningEndBlock = await time.latestBlock()
    const expectedMiningReward = (miningEndBlock.sub(miningStartBlock)).mul(rewardPerBlock)
    // should have mined miningToken for minter, who has whole share of mine
    expect(await this.miningRewardPool.unclaimedRewards.call(user)).to.be.bignumber.equal(expectedMiningReward)
  })

  it.skip('collect provider token rewards from multiple dPools', async () => {
  })

  it.skip('deposit staking token into staking contract and collect earnings', async () => {

  })
})