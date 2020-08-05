pragma solidity 0.5.16;

import "../externals/SafeMath.sol";
import "../externals/SafeERC20.sol";
import "../externals/ReentrancyGuard.sol";
import "../externals/Ownable.sol";
import "../externals/IERC20.sol";
import "../externals/ERC20.sol";
import "../externals/ERC20Detailed.sol";

import "../providers/CompoundInterface.sol";

/**
 * @title EarningPool
 * @dev Pool that tracks shares of an underlying token, of which are deposited into COMPOUND.
        Earnings from provider is sent to a RewardPool
 */
contract EarningPool is ERC20, ERC20Detailed, ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    address public underlyingToken;

    // Compound cToken address (provider)
    address public compound;

    // Provider reward token address
    address public rewardToken;

    // Address of rewardPool where earning and rewards are dispensed to
    address public rewardPool;

    // Fee factor mantissa, 1e18 = 100%
    uint256 public withdrawFeeFactorMantissa;

    uint256 public totalFeesCollectedInUnderlying;

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
        string memory _name,
        string memory _symbol,
        uint8 _decimals,
        address _underlyingToken,
        address _rewardToken,
        address _compound,
        address _rewardPool
    )
        ERC20Detailed(_name, _symbol, _decimals)
        public
    {
        underlyingToken = _underlyingToken;
        rewardToken = _rewardToken;
        compound = _compound;
        rewardPool = _rewardPool;
        withdrawFeeFactorMantissa = 0; // initialize fee to zero

        _approveUnderlyingToProvider();
    }

    /*** USER ***/

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

    function depositTo(address _beneficiary, uint256 _amount)
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

    /*** VIEW ***/

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
     *      Earning = total pool underlying value - total deposit + total withdraw fee
     * @return uint256 Underlying token balance
     */
    function calcUnclaimedEarningInUnderlying() public view returns(uint256) {
        return calcPoolValueInUnderlying().sub(totalSupply()).add(totalFeesCollectedInUnderlying);
    }

    /**
     * @dev Get outstanding reward token in pool
     * @return uint256 Reward token balance
     */
    function calcUnclaimedProviderReward() public view returns(uint256) {
        return IERC20(rewardToken).balanceOf(address(this));
    }

    /*** ADMIN ***/

    function setWithdrawFeeFactor(uint256 _withdrawFeeFactorManitssa)
        public
        onlyOwner
    {
        withdrawFeeFactorMantissa = _withdrawFeeFactorManitssa;
    }

    /*** INTERNAL ***/

    function _deposit(address _beneficiary, uint256 _amount)
        internal
    {
        require(_amount > 0, "EARNING_POOL: deposit must be greater than 0");

        // Transfer underlying into this pool, increase pool value in underlying
        IERC20(underlyingToken).safeTransferFrom(msg.sender, address(this), _amount);

        // Supply underlying to provider
        _supplyToProvider(_amount);

        // mint EarningPool tokens for beneficiary
        _mint(_beneficiary, _amount);

        emit Deposited(_beneficiary, _amount, msg.sender);

        // dispense outstanding rewards to rewardPool
        dispenseEarning();
        dispenseReward();
    }

    function _withdraw(uint256 _amount)
        internal
    {
        require(_amount > 0, "EARNING_POOL: withdraw must be greater than 0");
        require(_amount <= balanceOf(msg.sender), "EARNING_POOL: withdraw insufficient shares");

        // Collect withdraw fee
        uint256 withdrawFee = _amount.mul(withdrawFeeFactorMantissa).div(1e18);
        totalFeesCollectedInUnderlying = totalFeesCollectedInUnderlying.add(withdrawFee);
        uint256 withdrawAmountLessFee = _amount.sub(withdrawFee);
        // withdraw some from provider into pool
        _withdrawFromProvider(withdrawAmountLessFee);

        // Transfer underlying to withdrawer
        IERC20(underlyingToken).safeTransfer(msg.sender, withdrawAmountLessFee);

        // burn earningPool tokens for withdrawer
        _burn(msg.sender, _amount);

        emit Withdrawn(msg.sender, withdrawAmountLessFee);

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
