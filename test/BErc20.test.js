const { accounts, contract, web3 } = require('@openzeppelin/test-environment')
const { expect } = require('chai')

// Load compiled artifacts
const StandardToken = contract.fromArtifact('StandardToken')
const ControllerFake = contract.fromArtifact('ControllerFake')
const InterestRateModelFake = contract.fromArtifact('InterestRateModelFake')
const BErc20Token = contract.fromArtifact('BErc20Token')

describe('BToken', function () {
  const [ admin ] = accounts;
  let controller, interestRateModel, bErc20Token

  beforeEach(async function () {
    // Deploy a new BErc20Token contract for each test
    underlying = await StandardToken.new(1,
                                         "underlying token",
                                         "18",
                                         "utk")
    controller = await ControllerFake.new()
    interestRateModel = await InterestRateModelFake.new(1, 1)
    bErc20Token = await BErc20Token.new(underlying.address,
                                            controller.address,
                                            interestRateModel.address,
                                            1,
                                            'bToken',
                                            'btk',
                                            18,
                                            admin,
                                            { from: admin })
  })

  it('Init', async function () {
    expect(1).to.equal(1)
  })
})
