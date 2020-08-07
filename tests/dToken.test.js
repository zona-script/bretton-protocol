const { accounts, contract, web3 } = require('@openzeppelin/test-environment')
const { BN, expectEvent, expectRevert } = require('@openzeppelin/test-helpers')
const { expect } = require('chai')

// Load compiled artifacts
const ERC20Fake = contract.fromArtifact('ERC20Fake')
const EarningPoolFake = contract.fromArtifact('EarningPoolFake')
const ManagedRewardPool = contract.fromArtifact('ManagedRewardPool')
const DToken = contract.fromArtifact('dToken')

describe('dToken', function () {
  const [ admin, manager, user, rewardTokenAddress, cTokenAddress ] = accounts

  let underlyingToken, managedRewardPool
  beforeEach(async () => {
      // deploy reward token
      underlyingToken = await ERC20Fake.new(
        'Reward Token',
        'RWD',
        '18',
        { from: admin }
      )

      // deploy earning pool
      earningPool = await EarningPoolFake.new(
        underlyingToken.address,
        rewardTokenAddress,
        cTokenAddress,
        { from: admin }
      )

      // deploy reward pool
      managedRewardPool = await ManagedRewardPool.new(
        rewardTokenAddress,
        new BN('100000000000000000000'), // 100 per block, reward token is 18 decimal place,
        { from: admin }
      )

      // deploy dToken
      dToken = await DToken.new(
        'dToken',
        'DTK',
        '18',
        [underlyingToken.address],
        [earningPool.address],
        { from: admin }
      )
  })

  describe('init', function () {
    it('should initialize states', async () => {
      expect(await dToken.underlyingToEarningPoolMap.call(underlyingToken.address)).to.be.equal(earningPool.address)
      const supportedUnderlyings = await dToken.getAllSupportedUnderlyings.call()
      expect(supportedUnderlyings.length).to.be.equal(1)
      expect(supportedUnderlyings[0]).to.be.equal(underlyingToken.address)
      expect(await dToken.managedRewardPool.call()).to.be.equal('0x0000000000000000000000000000000000000000')
      // should infinite approve
      expect(await underlyingToken.allowance.call(dToken.address, earningPool.address)).to.be.bignumber.equal('115792089237316195423570985008687907853269984665640564039457584007913129639935')
    })
  })

  describe('mint', function () {
    describe('when user have sufficient underlying tokens', function () {
    })

    describe('when user does not have sufficient underlying tokens', function () {
    })
  })

  describe('redeem', function () {
    describe('when user have sufficient minted tokens', function () {
    })

    describe('when user does not have sufficient minted tokens', function () {
    })
  })

  describe('swap', function () {
    describe('when user have sufficient underlying tokens', function () {
    })

    describe('when user does not have sufficient underlying tokens', function () {
    })
  })

  describe('transfer', function () {

  })

  describe('different decimal places', function () {

  })
})
