"use strict"

import { expect } from 'chai'
const EVMRevert = require("./helpers/EVMRevert.js")

require('chai')
  .use(require('chai-as-promised'))
  .should()

const ERC20 = artifacts.require("ERC20Interface.sol")

contract("BToken", accounts => {

    beforeEach(async () => {

    })

    it('Init', async () => {
      assert.equal(1, 1)

    })
})
