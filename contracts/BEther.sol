pragma solidity 0.5.16;

import "./interfaces/BEtherInterface.sol";
import "./BToken.sol";

/**
 * @title Bretton's BEther Contract
 * @notice BTokens which wrap Ether
 * @author Bretton
 */
contract BEther is BToken, BEtherInterface {

}
