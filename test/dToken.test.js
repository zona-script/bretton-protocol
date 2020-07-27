const { accounts, contract, web3 } = require('@openzeppelin/test-environment')
const { BN, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers')
const { expect } = require('chai')

// Load compiled artifacts

describe('dToken', function () {
  const [ admin, user, someAddress ] = accounts
  beforeEach(async () => {

    // this.token = await BErc20Impl.new()
  })

  it('should be able to mint', async () => {
  })

  it('should be able to redeem', async () => {
  })
})
