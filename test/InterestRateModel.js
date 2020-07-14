const { accounts, contract, web3 } = require('@openzeppelin/test-environment')
const { BN, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai')

// Load compiled artifacts
const InterestRateModel = contract.fromArtifact('InterestRateModel')

describe('InterestRateModel', function () {
  const baseRatePerYear = 10
  const multiplierPerYear = 1
  const blocksPerYear = 10
  let interestRateModel

  beforeEach(async function () {
    // Deploy a new InterestRateModel contract for each test
    interestRateModel = await InterestRateModel.new(baseRatePerYear, multiplierPerYear, blocksPerYear)
  })

  it('isInterestRateModel', async () => {
    expect(await interestRateModel.isInterestRateModel()).to.equal(true)
  })

  it('should calculate correct utilizationRate', async function () {
    const cash = 10
    const borrows = 2
    const reserves = 4
    const expectedUtilizationRate = new BN('250000000000000000') // 0.25
    expect(await interestRateModel.utilizationRate(cash, borrows, reserves)).to.be.bignumber.equal(expectedUtilizationRate)
  })

  it('utilizationRate should be zero when there are no borrows', async function () {
    const cash = 10
    const borrows = 0
    const reserves = 4
    const expectedUtilizationRate = new BN('0')
    expect(await interestRateModel.utilizationRate(cash, borrows, reserves)).to.be.bignumber.equal(expectedUtilizationRate)
  })

  it('should calculate correct borrowRate', async function () {
    const cash = 10
    const borrows = 2
    const reserves = 4
    // baseRatePerBlock = 1
    // multiplierPerBlock = 0.1
    // UR = 0.25
    // borrowRate = 1 + UR * 0.1
    const expectedBorrowRate = new BN('1025000000000000000') // 1.025
    expect(await interestRateModel.getBorrowRate(cash, borrows, reserves)).to.be.bignumber.equal(expectedBorrowRate)
  })

  it('should calculate correct supplyRate', async function () {
    const cash = 10
    const borrows = 2
    const reserves = 4
    const reserveFactorMantissa = '500000000000000000' // 0.5
    // UR = 0.25
    // borrowRate = 1.025
    // supplyRate = UR * borrowRate * (1 - reserveFactor)`
    const expectedSupplyRate = new BN('128125000000000000') // 0.128125
    expect(await interestRateModel.getSupplyRate(cash, borrows, reserves, reserveFactorMantissa)).to.be.bignumber.equal(expectedSupplyRate)
  })
})
