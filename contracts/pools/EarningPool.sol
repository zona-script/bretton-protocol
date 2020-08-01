pragma solidity 0.5.16;

import "../externals/SafeMath.sol";
import "../externals/SafeERC20.sol";
import "../externals/ReentrancyGuard.sol";
import "../externals/Ownable.sol";
import "../externals/IERC20.sol";
import "../externals/ERC20.sol";
import "../externals/ERC20Detailed.sol";

import "../providers/CompoundInterface.sol";

import "./abstract/Pool.sol";

/**
 * @title EarningPool
 * @dev Pool that tracks shares of an underlying token, of which are deposited into COMPOUND.
        Earnings from provider is sent to a RewardPool
 */
contract EarningPool is ReentrancyGuard, Pool {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    address public underlyingToken;

    // Compound cToken address (provider)
    address public compound;

    // Provider reward token address
    address public rewardToken;

    // Address of rewardPool where earning and rewards are dispensed to
    address public rewardPool;


    event Deposited(address indexed user, uint256 amount, address payer);
    event Withdrawn(address indexed user, uint256 amount);
    event Dispensed(address indexed token, uint256 amount);

    /**
     * @dev EarningPool constructor
     * @param _underlyingToken The underlying token thats is earning interest from provider
     * @param _rewardToken Provider reward token
     * @param _compound Compound cToken address for underlying token
     * @param _rewardPool Address of reward pool
     */
    constructor (
        address _underlyingToken,
        address _rewardToken,
        address _compound,
        address _rewardPool
    )
        Pool ()
        public
    {
        underlyingToken = _underlyingToken;
        rewardToken = _rewardToken;
        compound = _compound;
        rewardPool = _rewardPool;

        _approveUnderlyingToProvider();
    }

    /*** USER FUNCTIONS ***/

    /**
     * @dev Deposit underlying into pool
     * @param _amount Amount of underlying to deposit
     */
    function deposit(uint256 _amount)
        external
        nonReentrant
    {
        _deposit(msg.sender, _amount);
    }

    function depositFor(address _beneficiary, uint256 _amount)
        external
        nonReentrant
    {
        _deposit(_beneficiary, _amount);
    }

    /**
     * @dev Withdraw underlying from pool
     * @param _amount Amount of underlying to withdraw
     */
    function withdraw(uint256 _amount)
        external
        nonReentrant
    {
        _withdraw(_amount);
    }

    /**
     * @dev Transfer underlying token interest earned to reward pool
     * @return uint256 Amount dispensed
     */
    function dispenseEarning() public returns (uint256) {
        if (rewardPool == address(0)) {
           // Do not dispense earning if reward pool is not set
           return 0;
        }

        uint256 earnings = calcUnclaimedEarningInUnderlying();
        if (earnings > 0) {
            // Withdraw earning from provider
            _withdrawFromProvider(earnings);
            // Transfer earning to reward pool
            IERC20(underlyingToken).safeTransfer(rewardPool, earnings);

            emit Dispensed(underlyingToken, earnings);
        }

        return earnings;
    }

    /**
     * @dev Transfer reward token earned to reward pool
     * @return uint256 Amount dispensed
     */
    function dispenseReward() public returns (uint256) {
        if (rewardPool == address(0)) {
            // Do not dispense rewards if reward pool is not set
           return 0;
        }

        uint256 rewards = calcUnclaimedProviderReward();
        if (rewards > 0) {
            // Transfer COMP rewards to reward pool
            IERC20(rewardToken).safeTransfer(rewardPool, rewards);

            emit Dispensed(rewardToken, rewards);
        }

        return rewards;
    }

    /*** VIEW FUNCTIONS ***/

    /**
     * @dev Get balance of underlying token in this pool
     * @return uint256 Underlying token balance
     */
    function balanceInUnderlying() public view returns (uint256) {
        return IERC20(underlyingToken).balanceOf(address(this));
    }

    /**
     * @dev Get balance of COMP cToken in this pool
     * @return uint256 COMP cToken balance
     */
    function balanceCompound() public view returns (uint256) {
        return IERC20(compound).balanceOf(address(this));
    }

    /**
     * @dev Get balance of compound token in this pool converted to underlying
     * @return uint256 Underlying token balance
     */
    function balanceCompoundInUnderlying() public view returns (uint256) {
        // Mantisa 1e18 to decimals
        uint256 b = balanceCompound();
        if (b > 0) {
          b = b.mul(CompoundInterface(compound).exchangeRateStored()).div(1e18);
        }
        return b;
    }

    /**
     * @dev Calculate total underlying balance of this pool
     *      Total balance of underlying = total deposit + interest accrued
     * @return uint256 Underlying token balance
     */
    function calcPoolValueInUnderlying() public view returns (uint256) {
        return balanceCompoundInUnderlying()
               .add(balanceInUnderlying());
    }

    /**
     * @dev Calculate outstanding interest earning of underlying token in this pool
     *      Earning = total pool underlying value - total deposit
     * @return uint256 Underlying token balance
     */
    function calcUnclaimedEarningInUnderlying() public view returns(uint256) {
        return calcPoolValueInUnderlying().sub(totalShares());
    }

    /**
     * @dev Get outstanding reward token in pool
     * @return uint256 Reward token balance
     */
    function calcUnclaimedProviderReward() public view returns(uint256) {
        return IERC20(rewardToken).balanceOf(address(this));
    }

    /*** INTERNAL FUNCTIONS ***/

    function _deposit(address _beneficiary, uint256 _amount)
        internal
    {
        require(_amount > 0, "EARNING_POOL: deposit must be greater than 0");

        // Transfer underlying into this pool, increase pool value in underlying
        IERC20(underlyingToken).safeTransferFrom(msg.sender, address(this), _amount);

        // Supply underlying to provider
        _supplyToProvider(_amount);

        // increase EarningPool shares for beneficiary
        _increaseShares(_beneficiary, _amount);

        emit Deposited(_beneficiary, _amount, msg.sender);

        // dispense outstanding rewards to rewardPool
        dispenseEarning();
        dispenseReward();
    }

    function _withdraw(uint256 _amount)
        internal
    {
        require(_amount > 0, "EARNING_POOL: withdraw must be greater than 0");
        require(_amount <= sharesOf(msg.sender), "EARNING_POOL: withdraw insufficient shares");

        // withdraw some from provider into pool
        _withdrawFromProvider(_amount);

        // Transfer underlying to withdrawer
        IERC20(underlyingToken).safeTransfer(msg.sender, _amount);

        // decrase earningPool shares for withdrawer
        _decreaseShares(msg.sender, _amount);

        emit Withdrawn(msg.sender, _amount);

        // dispense outstanding rewards to rewardPool
        dispenseEarning();
        dispenseReward();
    }

    /**
     * @dev Approve underlying token to providers
     */
    function _approveUnderlyingToProvider() internal {
        IERC20(underlyingToken).safeApprove(compound, uint256(-1));
    }

    /**
     * @dev Withdraw some underlying from Compound
     * @param _amount Amount of underlying to withdraw
     */
    function _withdrawFromProvider(uint256 _amount) internal {
        require(balanceCompoundInUnderlying() >= _amount, "COMPOUND: withdraw insufficient funds");
        require(CompoundInterface(compound).redeemUnderlying(_amount) == 0, "COMPOUND: redeemUnderlying failed");
    }

    /**
     * @dev Withdraw some underlying to Compound
     * @param _amount Amount of underlying to supply
     */
    function _supplyToProvider(uint256 _amount) internal {
        // Check compound rcode
        require(CompoundInterface(compound).mint(_amount) == 0, "COMPOUND: mint failed");
    }
}
