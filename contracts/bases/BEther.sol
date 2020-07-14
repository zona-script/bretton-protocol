pragma solidity 0.5.16;

import "../interfaces/BEtherInterface.sol";
import "./BToken.sol";

/**
 * @title Bretton's BEther Contract
 * @notice Abstract base for BEther (Btoken which wrap Ether underlying)
 * @author Bretton
 */
contract BEther is BToken, BEtherInterface {

}
