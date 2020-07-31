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
 * @dev EarningPool take an underlying and deposit into providers of best return
        EarningPool are pool of providers.
        EarningPool are used as collateral to mint dTokens.
 */
contract EarningPool is ReentrancyGuard, Pool {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

     // underlying asset address
    address public underlyingToken;
    // total balance of underlying in this pool (total deposit + interest accrued + fee collected)
    // total deposits = totalSupply

    // LP reward token address
    address public rewardToken;

    // compound pool address of underlying
    address public compound;

    address public stakingPool;

    enum Lender {
       COMPOUND
    }
    Lender public provider;

    constructor (
        address _underlyingToken,
        address _rewardToken,
        address _compound,
        address _stakingPool
    )
        Pool ()
        public
    {
        underlyingToken = _underlyingToken;
        rewardToken = _rewardToken;
        compound = _compound;
        stakingPool = _stakingPool;

        provider = Lender.COMPOUND;
        _approveUnderlyingToProvider();
    }

    /*** USER FUNCTIONS ***/

    // Deposit underlying and mint EarningPool token
    // _amount = amount of underlying to deposit
    function deposit(uint256 _amount)
        external
        nonReentrant
    {
        require(_amount > 0, "EARNING_POOL: deposit must be greater than 0");

        // Transfer underlying into this pool, increase pool value in underlying
        IERC20(underlyingToken).safeTransferFrom(msg.sender, address(this), _amount);

        // Supply underlying to provider
        _supplyToProvider(_amount);

        // increase EarningPool shares for depositer, increase totalShares
        _increaseShares(msg.sender, _amount);

        // dispense rewards to stakingPool
        dispenseEarning();
        /* dispenseReward(); */
    }

    // Withdraw underlying out of this pool and burn earningPool token
    // _amount = amount of underlying to withdraw
    function withdraw(uint256 _amount)
        external
        nonReentrant
    {
        require(_amount > 0, "EARNING_POOL: withdraw must be greater than 0");
        require(_amount <= sharesOf(msg.sender), "EARNING_POOL: withdraw insufficient shares");

        // withdraw some from provider into pool
        _withdrawFromProvider(_amount);

        // Transfer underlying to withdrawer, decrease pool value in underlying
        // Collect Withdraw Fee
        IERC20(underlyingToken).safeTransfer(msg.sender, _amount);

        // decrase earningPool shares for withdrawer, decrease totalShares
        _decreaseShares(msg.sender, _amount);

        // dispense rewards to stakingPool
        dispenseEarning();
        /* dispenseReward(); */
    }

    // collects LP interest and pool fee earnings and distribute to earnings contract
    function dispenseEarning() public returns (uint) {
        if (stakingPool == address(0)) {
           // dont dispense earning if stakingPool is not set
           return 0;
        }

        uint256 earnings = calcUnclaimedEarningInUnderlying();
        if (earnings > 0) {
            // Withdraw earning from provider
            _withdrawFromProvider(earnings);
            // Transfer earning to staking contract, decrease pool in underlying
            IERC20(underlyingToken).safeTransfer(stakingPool, earnings);
        }

        return earnings;
    }

    // collects token reward from provider and distribute to rewards contract
    function dispenseReward() public returns (uint) {
        if (stakingPool == address(0)) {
            // dont dispense rewards if stakingPool is not set
           return 0;
        }

        uint256 rewards = calcUnclaimedProviderReward();
        if (rewards > 0) {
            // Transfer LP rewards to staking contract
            IERC20(rewardToken).safeTransfer(stakingPool, rewards);
        }

        return rewards;
    }

    /*** VIEW FUNCTIONS ***/

    // balance of underlying in this pool
    function balanceInUnderlying() public view returns (uint256) {
        return IERC20(underlyingToken).balanceOf(address(this));
    }

    // balance of compound token in this pool
    function balanceCompound() public view returns (uint256) {
        return IERC20(compound).balanceOf(address(this));
    }

    // balance of compound token in this pool converted to underlying
    function balanceCompoundInUnderlying() public view returns (uint256) {
        // Mantisa 1e18 to decimals
        uint256 b = balanceCompound();
        if (b > 0) {
          b = b.mul(CompoundInterface(compound).exchangeRateStored()).div(1e18);
        }
        return b;
    }

    // calculate total underlying balance of this pool
    function calcPoolValueInUnderlying() public view returns (uint) {
        return balanceCompoundInUnderlying()
               .add(balanceInUnderlying());
    }

    // earning = interest + fee = pool value - total supply
    function calcUnclaimedEarningInUnderlying() public view returns(uint256) {
        return calcPoolValueInUnderlying().sub(totalShares());
    }

    function calcUnclaimedProviderReward() public view returns(uint256) {
        return IERC20(rewardToken).balanceOf(address(this));
    }

    /*** INTERNAL FUNCTIONS ***/

    // aprove underlying token to providers
    function _approveUnderlyingToProvider() internal {
        IERC20(underlyingToken).safeApprove(compound, uint(-1));
    }

    /*** PROVIDER FUNCTIONS ***/

    // withdraw some underlying from provider
    // _amount = amount of underlying to withdraw
    function _withdrawFromProvider(uint256 _amount) internal {
        if (provider == Lender.COMPOUND) {
            _withdrawCompound(_amount);
        }
    }

    // withdraw some underlying amount from compound
    // _amount = amount of underlying to withdraw
    function _withdrawCompound(uint256 _amount) internal {
        require(balanceCompoundInUnderlying() >= _amount, "COMPOUND: withdraw insufficient funds");
        require(CompoundInterface(compound).redeemUnderlying(_amount) == 0, "COMPOUND: redeemUnderlying failed");
    }

    // withdraw all underlying from all providers
    function _withdrawAll() internal {
        if (provider == Lender.COMPOUND) {
            uint256 amount = balanceCompound();
            if (amount > 0) {
                _withdrawCompound(balanceCompoundInUnderlying()); // ??? why sub 1
            }
        }
    }

    // supply some underlying amount to compound
    // _amount = amount of underlying to supply
    function _supplyCompound(uint _amount) internal {
        // check compound rcode
        require(CompoundInterface(compound).mint(_amount) == 0, "COMPOUND: mint failed");
    }

    // supply some underlying amount to provider
    // _amount = amount of underlying to supply
    function _supplyToProvider(uint _amount) internal {
        if (provider == Lender.COMPOUND) {
            _supplyCompound(_amount);
        }
    }
}
