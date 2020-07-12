const { accounts, contract } = require('@openzeppelin/test-environment')
const { expect } = require('chai')

// Use the different accounts, which are unlocked and funded with Ether
const [ admin, deployer, user ] = accounts

require('chai')
  .use(require('chai-as-promised'))
  .should()

describe("BToken", () => {

    beforeEach(async () => {

    })

    it('Init', async () => {
      expect(1).to.equal(1)
    })
})
