pragma solidity 0.5.16;

import "../externals/Address.sol";
import "../externals/SafeMath.sol";
import "../externals/SafeERC20.sol";
import "../externals/IERC20.sol";
import "../externals/ERC20.sol";
import "../externals/ERC20Detailed.sol";

contract BRETToken is ERC20, ERC20Detailed {
  using SafeERC20 for IERC20;
  using Address for address;
  using SafeMath for uint;

  address public governance;
  mapping (address => bool) public minters;

  constructor ()
      public
      ERC20Detailed(
          "Bretton Protocol",
          "BRET",
          18
      )
  {
      governance = msg.sender;
  }

  function mint(address account, uint amount) public {
      require(minters[msg.sender], "!minter");
      _mint(account, amount);
  }

  function setGovernance(address _governance) public {
      require(msg.sender == governance, "!governance");
      governance = _governance;
  }

  function addMinter(address _minter) public {
      require(msg.sender == governance, "!governance");
      minters[_minter] = true;
  }

  function removeMinter(address _minter) public {
      require(msg.sender == governance, "!governance");
      minters[_minter] = false;
  }
}
