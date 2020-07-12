const { accounts, contract, web3 } = require('@openzeppelin/test-environment')
const { expect } = require('chai')

// Load compiled artifacts
const BToken = contract.fromArtifact('BToken')

describe('BToken', function () {

  beforeEach(async function () {
    // Deploy a new BToken contract for each test
    this.contract = await BToken.new()
  })

  it('Init', async function () {
    expect(1).to.equal(1)
  })
})
