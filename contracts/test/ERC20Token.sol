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

    constructor(uint256 initialAmount_, string memory tokenName_, uint8 decimalUnits_, string memory tokenSymbol_) public {
        totalSupply = initialAmount_;
        balanceOf[msg.sender] = initialAmount_;
        name = tokenName_;
        symbol = tokenSymbol_;
        decimals = decimalUnits_;
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

    function approve(address spender_, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender_] = amount;
        emit Approval(msg.sender, spender_, amount);
        return true;
    }
}
