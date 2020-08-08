pragma solidity 0.5.16;

import "./IERC20.sol";

contract ERC20Detailed is IERC20 {
    string public name;
    string public symbol;
    uint8 public decimals;

    constructor (string memory _name, string memory _symbol, uint8 _decimals) public {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
    }
}
