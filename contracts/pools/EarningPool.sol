pragma solidity 0.5.16;

import "../externals/SafeMath.sol";
import "../externals/SafeERC20.sol";
import "../externals/ReentrancyGuard.sol";
import "../externals/Ownable.sol";
import "../externals/IERC20.sol";

import "../providers/CompoundInterface.sol";

import "./abstract/Pool.sol";

/**
 * @title EarningPool
 * @dev Pool that tracks shares of an underlying token, of which are deposited into COMPOUND.
        Earnings from provider is sent to recipients
 */
contract EarningPool is ReentrancyGuard, Ownable, Pool {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    address public underlyingToken;

    // Compound cToken address (provider)
    address public compound;

    // Provider reward token address
    address public rewardToken;

    // Address where earning are dispensed to
    address public earningRecipient;

    // Address where rewards are dispensed to
    address public rewardRecipient;

    // Fee factor mantissa, 1e18 = 100%
    uint256 public withdrawFeeFactorMantissa;

    uint256 public earningDispenseThreshold;
    uint256 public rewardDispenseThreshold;

    event Deposited(address indexed beneficiary, uint256 amount, address payer);
    event Withdrawn(address indexed beneficiary, uint256 amount, address payer);
    event Dispensed(address indexed token, uint256 amount);

    /**
     * @dev EarningPool constructor
     * @param _underlyingToken The underlying token thats is earning interest from provider
     * @param _rewardToken Provider reward token
     * @param _compound Compound cToken address for underlying token
     */
    constructor (
        address _underlyingToken,
        address _rewardToken,
        address _compound
    )
        Pool()
        public
    {
        underlyingToken = _underlyingToken;
        rewardToken = _rewardToken;
        compound = _compound;

        _approveUnderlyingToProvider();
    }

    /*** USER ***/

    /**
     * @dev Deposit underlying into pool
     * @param _beneficiary Address to benefit from the deposit
     * @param _amount Amount of underlying to deposit
     */
    function deposit(address _beneficiary, uint256 _amount)
        external
        nonReentrant
    {
        _deposit(_beneficiary, _amount);
    }

    /**
     * @dev Withdraw underlying from pool
     * @param _beneficiary Address to benefit from the withdraw
     * @param _amount Amount of underlying to withdraw
     * @return uint256 Actual amount of underlying withdrawn
     */
    function withdraw(address _beneficiary, uint256 _amount)
        external
        nonReentrant
        returns (uint256)
    {
        return _withdraw(_beneficiary, _amount);
    }

    /**
     * @dev Transfer underlying token interest earned to recipient
     * @return uint256 Amount dispensed
     */
    function dispenseEarning() public returns (uint256) {
        if (earningRecipient == address(0)) {
           return 0;
        }

        uint256 earnings = calcUndispensedEarningInUnderlying();
        // total dispense amount = earning + withdraw fee
        uint256 totalDispenseAmount =  earnings.add(balanceInUnderlying());
        if (totalDispenseAmount < earningDispenseThreshold) {
           return 0;
        }

        // Withdraw earning from provider
        _withdrawFromProvider(earnings);

        // Transfer earning + withdraw fee to recipient
        IERC20(underlyingToken).safeTransfer(earningRecipient, totalDispenseAmount);

        emit Dispensed(underlyingToken, totalDispenseAmount);

        return totalDispenseAmount;
    }

    /**
     * @dev Transfer reward token earned to recipient
     * @return uint256 Amount dispensed
     */
    function dispenseReward() public returns (uint256) {
        if (rewardRecipient == address(0)) {
           return 0;
        }

        uint256 rewards = calcUndispensedProviderReward();
        if (rewards < rewardDispenseThreshold) {
           return 0;
        }

        // Transfer COMP rewards to recipient
        IERC20(rewardToken).safeTransfer(rewardRecipient, rewards);

        emit Dispensed(rewardToken, rewards);

        return rewards;
    }

    /*** VIEW ***/

    /**
     * @dev Get balance of underlying token in this pool
     *      Should equal to withdraw fee unless underlyings are sent to pool
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
     *      Total balance of underlying = total provider underlying balance (deposit + interest accrued) + withdraw fee
     * @return uint256 Underlying token balance
     */
    function calcPoolValueInUnderlying() public view returns (uint256) {
        return balanceCompoundInUnderlying() // compound
               .add(balanceInUnderlying()); // withdraw fee
    }

    /**
     * @dev Calculate outstanding interest earning of underlying token in this pool
     *      Earning = total provider underlying balance - total deposit
     * @return uint256 Underlying token balance
     */
    function calcUndispensedEarningInUnderlying() public view returns(uint256) {
        return balanceCompoundInUnderlying().sub(totalShares());
    }

    /**
     * @dev Get outstanding reward token in pool
     * @return uint256 Reward token balance
     */
    function calcUndispensedProviderReward() public view returns(uint256) {
        return IERC20(rewardToken).balanceOf(address(this));
    }

    /*** ADMIN ***/

    function setWithdrawFeeFactor(uint256 _withdrawFeeFactorManitssa)
        public
        onlyOwner
    {
        withdrawFeeFactorMantissa = _withdrawFeeFactorManitssa;
    }

    function setEarningRecipient(address _recipient)
        public
        onlyOwner
    {
        earningRecipient = _recipient;
    }

    function setRewardRecipient(address _recipient)
        public
        onlyOwner
    {
        rewardRecipient = _recipient;
    }

    function setEarningDispenseThreshold(uint256 _threshold)
        public
        onlyOwner
    {
        earningDispenseThreshold = _threshold;
    }

    function setRewardDispenseThreshold(uint256 _threshold)
        public
        onlyOwner
    {
        rewardDispenseThreshold = _threshold;
    }


    /*** INTERNAL ***/

    function _deposit(address _beneficiary, uint256 _amount)
        internal
    {
        require(_amount > 0, "EARNING_POOL: deposit must be greater than 0");

        // Transfer underlying from payer into pool
        IERC20(underlyingToken).safeTransferFrom(msg.sender, address(this), _amount);

        // Supply underlying to provider
        _supplyToProvider(_amount);

        // increase pool shares for beneficiary
        _increaseShares(_beneficiary, _amount);

        emit Deposited(_beneficiary, _amount, msg.sender);
    }

    function _withdraw(address _beneficiary, uint256 _amount)
        internal
        returns (uint256)
    {
        require(_amount > 0, "EARNING_POOL: withdraw must be greater than 0");
        require(_amount <= sharesOf(msg.sender), "EARNING_POOL: withdraw insufficient shares");

        // Withdraw underlying from provider
        _withdrawFromProvider(_amount);

        // decrease pool shares from payer
        _decreaseShares(msg.sender, _amount);

        // Collect withdraw fee
        uint256 withdrawFee = _amount.mul(withdrawFeeFactorMantissa).div(1e18);
        uint256 withdrawAmountLessFee = _amount.sub(withdrawFee);

        // Transfer underlying to beneficiary
        IERC20(underlyingToken).safeTransfer(_beneficiary, withdrawAmountLessFee);

        emit Withdrawn(_beneficiary, withdrawAmountLessFee, msg.sender);

        return withdrawAmountLessFee;
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
