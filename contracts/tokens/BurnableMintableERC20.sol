pragma solidity 0.5.16;

import "../externals/Ownable.sol";
import "../externals/ERC20.sol";
import "../externals/ERC20Detailed.sol";

/**
 * @title Bretton Protocol Token
 * @dev Burnable and Mintable ERC20 Token
 */
contract BurnableMintableERC20 is ERC20, ERC20Detailed, Ownable {

    constructor (
        string memory _name,
        string memory _symbol,
        uint8 _decimals
    )
        ERC20Detailed(_name, _symbol, _decimals)
        public
    {
    }

    /**
     * @dev Destroys `amount` tokens from the caller.
     *
     * See {ERC20-_burn}.
     */
    function burn(uint256 amount) public {
        _burn(_msgSender(), amount);
    }

    /**
     * @dev Destroys `amount` tokens from `account`, deducting from the caller's
     * allowance.
     *
     * See {ERC20-_burn} and {ERC20-allowance}.
     *
     * Requirements:
     *
     * - the caller must have allowance for ``accounts``'s tokens of at least
     * `amount`.
     */
    function burnFrom(address account, uint256 amount) public {
        uint256 decreasedAllowance = allowance(account, _msgSender()).sub(amount, "ERC20: burn amount exceeds allowance");

        _approve(account, _msgSender(), decreasedAllowance);
        _burn(account, amount);
    }

    /**
     * @dev See {ERC20-_mint}.
     *
     * Requirements:
     *
     * - the caller must have the {MinterRole}.
     */
    function mint(address account, uint256 amount) public onlyOwner returns (bool) {
        _mint(account, amount);
        return true;
    }
}
