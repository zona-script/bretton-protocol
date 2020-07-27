pragma solidity 0.5.16;

import "../externals/SafeMath.sol";
import "../externals/Address.sol";
import "../externals/SafeERC20.sol";
import "../externals/ReentrancyGuard.sol";
import "../externals/Ownable.sol";
import "../externals/IERC20.sol";
import "../externals/ERC20.sol";
import "../externals/ERC20Detailed.sol";

import "../providers/Compound.sol";

/**
 * @title dPool
 * @dev dPool take an underlying and deposit into providers of best return
        dPool are pool of providers.
        dPool are used as collateral to mint dTokens.
        dPool tokens have 1:1 ratio with underlying
 */
contract dPool is ERC20, ERC20Detailed, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using Address for address;
    using SafeMath for uint256;

     // underlying asset address
    address public underlying;
    // total balance of underlying in this pool (total deposit + interest accrued)
    // total deposits = totalSupply
    // pool value in underlying could be greater than totalSupply since underlying in pool accrues interest

    // compound pool address of underlying
    address public compound;

    enum Lender {
       COMPOUND
    }
    Lender public provider;

    constructor (
        string memory _name,
        string memory _symbol,
        uint8 _decimals,
        address _underlying,
        address _compound
    )
        ERC20Detailed(_name, _symbol, _decimals)
        public
    {
        underlying = _underlying;
        compound = _compound;

        provider = Lender.COMPOUND;

        _approveUnderlyingToProvider();
    }

    /*** EXTERNAL FUNCTIONS ***/

    // Deposit underlying and mint dPool token
    // _amount = amount of underlying to deposit
    function deposit(uint256 _amount)
        external
        nonReentrant
    {
        require(_amount > 0, "DPOOL: deposit must be greater than 0");

        // Transfer underlying into this pool, increase pool value in underlying
        IERC20(underlying).safeTransferFrom(msg.sender, address(this), _amount);

        // Supply underlying to provider
        _supplyProvider(balancePoolInUnderlying());

        // Mint dPool token for depositer, increase totalSupply
        _mint(msg.sender, _amount);
    }

    // Withdraw underlying out of this pool and burn dPool token
    // _amount = amount of underlying to withdraw
    function withdraw(uint256 _amount)
        external
        nonReentrant
    {
        require(_amount > 0, "DPOOL: withdraw must be greater than 0");
        require(_amount <= balanceOf(msg.sender), "DPOOL: withdraw insufficient balance");

        // Check if pool has enough idle underlying to withdraw
        uint256 availableToWithdraw = IERC20(underlying).balanceOf(address(this));
        if (availableToWithdraw < _amount) {
          // if not, withdraw some from provider into pool
          _withdrawSome(_amount.sub(availableToWithdraw));
        }

        // Transfer underlying to withdrawer, decrease pool value in underlying
        IERC20(underlying).safeTransfer(msg.sender, _amount);

        // Burn dPool token for withdrawer, decrease totalSupply
        _burn(msg.sender, _amount);
    }

    // balance of underlying in this pool
    function balancePoolInUnderlying() public view returns (uint256) {
        return IERC20(underlying).balanceOf(address(this));
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
          b = b.mul(Compound(compound).exchangeRateStored()).div(1e18);
        }
        return b;
    }

    // calculate total underlying balance of this pool
    function calcPoolValueInUnderlying() public view returns (uint) {
        return balanceCompoundInUnderlying()
               .add(balancePoolInUnderlying());
    }

    // Interest earned = pool value - total supply
    function calcEarningInUnderlying() public view returns(uint256) {
        return calcPoolValueInUnderlying().sub(_totalSupply);
    }

    /*** INTERNAL FUNCTIONS ***/

    // aprove underlying token to providers
    function _approveUnderlyingToProvider() internal {
        IERC20(underlying).safeApprove(compound, uint(-1));
    }

    // withdraw some underlying from provider
    // _amount = amount of underlying to withdraw
    function _withdrawSome(uint256 _amount) internal {
        if (provider == Lender.COMPOUND) {
            _withdrawCompound(_amount);
        }
    }

    // withdraw some underlying amount from compound
    // _amount = amount of underlying to withdraw
    function _withdrawCompound(uint256 _amount) internal {
        require(balanceCompoundInUnderlying() >= _amount, "COMPOUND: withdraw insufficient funds");
        require(Compound(compound).redeemUnderlying(_amount) == 0, "COMPOUND: redeemUnderlying failed");
    }

    // withdraw all underlying from all providers
    function _withdrawAll() internal {
        uint256 amount = balanceCompound();
        if (amount > 0) {
            _withdrawCompound(balanceCompoundInUnderlying()); // ??? why sub 1
        }
    }

    // supply some underlying amount to provider
    // _amount = amount of underlying to supply
    function _supplyProvider(uint _amount) internal {
        if (provider == Lender.COMPOUND) {
            _supplyCompound(_amount);
        }
    }

    // supply some underlying amount to compound
    // _amount = amount of underlying to supply
    function _supplyCompound(uint _amount) internal {
        // check compound rcode
        require(Compound(compound).mint(_amount) == 0, "COMPOUND: mint failed");
    }
}
