const { accounts, contract, web3 } = require('@openzeppelin/test-environment')
const { BN, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai')

// Load compiled artifacts
const Controller = contract.fromArtifact('Controller')

describe('Controller', function () {
  const [ owner, user ] = accounts;
  let controller

  beforeEach(async function () {
    // Deploy a new Controller contract for each test
    controller = await Controller.new({ from: owner })
  })

  it('isController', async () => {
    expect(await controller.isController()).to.equal(true)
  })
})
