pragma solidity 0.5.16;

import "./interfaces/BErc20Interface.sol";
import "./BToken.sol";

/**
 * @title Bretton's BErc20 Contract
 * @notice BTokens which wrap an EIP-20 underlying
 * @author Bretton
 */
contract BErc20 is BToken, BErc20Interface {

}
