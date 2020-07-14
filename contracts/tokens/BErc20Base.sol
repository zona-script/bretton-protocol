pragma solidity 0.5.16;

import "../interfaces/BErc20Interface.sol";
import "./BTokenBase.sol";

/**
 * @title Bretton's BErc20 Contract
 * @notice Abstract base for BErc20 (BToken which wrap an EIP-20 underlying)
 * @author Bretton
 */
contract BErc20Base is BTokenBase, BErc20Interface {
  
}
