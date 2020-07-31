const { accounts, contract, web3 } = require('@openzeppelin/test-environment')
const { BN, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers')
const { expect } = require('chai')

// Load compiled artifacts
const ERC20Fake = contract.fromArtifact('ERC20Fake')

describe('RewardPool', function () {
  const [ admin, user ] = accounts
  beforeEach(async () => {

  })

  describe('different decimal places', function () {
  })

  describe('claim', function () {
    it.skip('should claim outstanding rewards', async () => {

    })

    it.skip('should not fail when there are no outstanding rewards', async () => {

    })
  })

  describe('updateReward', function () {
    it.skip('should update rewards per share stored, lasted update block, and total rewards issued stored', async () => {

    })
  })

  describe('rewardsPerShare', function () {
    it.skip('rewards per share should be zero when there are no shares', async () => {

    })

    it.skip('rewards per share should be calculated with max of rewards per block and rewards left in pool', async () => {

    })

    it.skip('should increase rewards per share when block number increase', async () => {

    })

    it.skip('should decrease rewards per share when total shares increase while block number remains constant', async () => {

    })
  })

  describe('unclaimedRewards', function () {
    it.skip('should get unclaimed rewards', async () => {

    })
  })

  describe('totalRewardsIssued', function () {
    it.skip('should get total rewards issued', async () => {

    })
  })

  describe('admin', function () {
    it.skip('only owner can set rewards per block', async () => {

    })

    it.skip('only owner can withdraw unissued reward tokens', async () => {

    })

    it.skip('cannot withdraw tokens already issued but not claimed', async () => {

    })
  })
})
