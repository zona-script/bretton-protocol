pragma solidity 0.5.16;

import "../externals/ERC20.sol";
import "../externals/ERC20Detailed.sol";

// Fake implementation of ERC20 for testing
contract ERC20Fake is ERC20, ERC20Detailed {
    constructor (
        string memory _name,
        string memory _symbol,
        uint8 _decimals
    )
        ERC20Detailed(_name, _symbol, _decimals)
        public
    {
    }

    function mint(address _account, uint256 _amount) public {
        _mint(_account, _amount);
    }
}
