pragma solidity 0.5.16;

import "../interfaces/BEtherInterface.sol";
import "./BTokenBase.sol";

/**
 * @title Bretton's BEther Contract
 * @notice Abstract base for BEther (Btoken which wrap Ether underlying)
 * @author Bretton
 */
contract BEtherBase is BTokenBase, BEtherInterface {

}
