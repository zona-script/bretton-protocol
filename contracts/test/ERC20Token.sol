pragma solidity 0.5.16;

import "../math/SafeMath.sol";
import "../interfaces/Erc20Interface.sol";

/**
 * @title Standard ERC20 token
 * @dev Implementation of the basic standard token.
 * See https://github.com/ethereum/EIPs/issues/20
 */
contract StandardToken is Erc20Interface {
    using SafeMath for uint256;

    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public totalSupply;
    mapping (address => mapping (address => uint256)) public allowance;
    mapping(address => uint256) public balanceOf;

    constructor(uint256 _initialAmount, string memory _tokenName, uint8 _decimalUnits, string memory _tokenSymbol) public {
        totalSupply = _initialAmount;
        balanceOf[msg.sender] = _initialAmount;
        name = _tokenName;
        symbol = _tokenSymbol;
        decimals = _decimalUnits;
    }

    function transfer(address dst, uint256 amount) external returns (bool) {
        balanceOf[msg.sender] = balanceOf[msg.sender].sub(amount, "Insufficient balance");
        balanceOf[dst] = balanceOf[dst].add(amount, "Balance overflow");
        emit Transfer(msg.sender, dst, amount);
        return true;
    }

    function transferFrom(address src, address dst, uint256 amount) external returns (bool) {
        allowance[src][msg.sender] = allowance[src][msg.sender].sub(amount, "Insufficient allowance");
        balanceOf[src] = balanceOf[src].sub(amount, "Insufficient balance");
        balanceOf[dst] = balanceOf[dst].add(amount, "Balance overflow");
        emit Transfer(src, dst, amount);
        return true;
    }

    function approve(address _spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][_spender] = amount;
        emit Approval(msg.sender, _spender, amount);
        return true;
    }
}
