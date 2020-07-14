const { accounts, contract, web3 } = require('@openzeppelin/test-environment')
const { BN, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai')

// Load compiled artifacts
const OffChainPriceOracle = contract.fromArtifact('OffChainPriceOracle')
const BErc20TokenFake = contract.fromArtifact('BErc20TokenFake')
const BEtherTokenFake = contract.fromArtifact('BEtherTokenFake')

describe('OffChainPriceOracle', function () {
  const [ owner, user ] = accounts;
  let offChainPriceOracle

  beforeEach(async function () {
    // Deploy a new OffChainPriceOracle contract for each test
    offChainPriceOracle = await OffChainPriceOracle.new({ from: owner })
  })

  it('isPriceOracle', async () => {
    expect(await offChainPriceOracle.isPriceOracle()).to.equal(true)
  })

  it('only owner can set price', async () => {
    const tokenAddress = '0x1111111111111111111111111111111111111111'
    const price = 1
    await expectRevert(
      offChainPriceOracle.setPrice(tokenAddress, price, { from: user }),
      'Ownable: caller is not the owner'
    )
  })

  it('should setPrice for asset', async () => {
    const tokenAddress = '0x1111111111111111111111111111111111111111'

    // Set price
    const oldPrice = new BN('1')
    await offChainPriceOracle.setPrice(tokenAddress, oldPrice, { from: owner })
    expect(await offChainPriceOracle.prices(tokenAddress)).to.be.bignumber.equal(oldPrice)

    // Set new price
    const newPrice = new BN('2')
    const receipt = await offChainPriceOracle.setPrice(tokenAddress, newPrice, { from: owner })
    expectEvent(receipt, 'PricePosted', { asset: tokenAddress, previousPriceMantissa: oldPrice, newPriceMantissa: newPrice })
  })

  it('should getUnderlyingPrice for BErc20 token', async () => {
    const underlying = '0x1111111111111111111111111111111111111111'
    const bErc20Token = await BErc20TokenFake.new()
    await bErc20Token.setUnderlying(underlying)

    // Set price
    const price = new BN('1')
    await offChainPriceOracle.setPrice(underlying, price, { from: owner })

    // Get underlying price
    expect(await offChainPriceOracle.getUnderlyingPrice(bErc20Token.address)).to.be.bignumber.equal(price)
  })

  it('should always return 1e18 for BEther token', async () => {
    const bEtherToken = await BEtherTokenFake.new()
    await bEtherToken.setSymbol('bETH')
    expect(await offChainPriceOracle.getUnderlyingPrice(bEtherToken.address)).to.be.bignumber.equal(new BN('1000000000000000000'))
  })

  it('should return 0 for asset without price set', async () => {
    const underlying = '0x1111111111111111111111111111111111111111'
    const bErc20Token = await BErc20TokenFake.new()
    await bErc20Token.setUnderlying(underlying)
    expect(await offChainPriceOracle.getUnderlyingPrice(bErc20Token.address)).to.be.bignumber.equal(new BN('0'))
  })
})
