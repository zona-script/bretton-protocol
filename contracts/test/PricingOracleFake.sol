pragma solidity 0.5.16;

import "../interfaces/PriceOracleInterface.sol";
import "../tokens/BTokenBase.sol";

contract PricingOracleFake is PriceOracleInterface {

    bool public constant isPriceOracle = true;

    mapping(address => uint) public prices;

    constructor() public {}

    // this oracle set/get price directly to a fake bToken without underlying

    function getUnderlyingPrice(address bToken) public view returns (uint) {
        return prices[bToken];
    }

    function setPrice(address asset, uint newPriceMantissa) public {
        prices[asset] = newPriceMantissa;
    }

    function compareStrings(string memory a, string memory b) internal pure returns (bool) {
        return (keccak256(abi.encodePacked((a))) == keccak256(abi.encodePacked((b))));
    }

    /*** TEST FUNCTIONS ***/
}
