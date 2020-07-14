pragma solidity 0.5.16;

import "../interfaces/PriceOracleInterface.sol";
import "../tokens/BTokenBase.sol";
import "../interfaces/BErc20Interface.sol";
import "../utils/Ownable.sol";

contract OffChainPriceOracle is PriceOracleInterface, Ownable {
    mapping(address => uint) public prices;

    /*** EVENTS ***/

    event PricePosted(address asset, uint previousPriceMantissa, uint newPriceMantissa);

    /*** PUBLIC FUNCTIONS ***/

    /**
     * @notice Construct an off-chain price oracle
     */
    constructor() public {}

    /**
      * @notice Get the underlying price of a bToken asset
      * @param  bToken The bToken to get the underlying price of
      * @return The underlying asset price mantissa (scaled by 1e18).
      *         Zero means the price is unavailable.
      */
    function getUnderlyingPrice(BTokenBase bToken) public view returns (uint) {
        if (compareStrings(bToken.symbol(), "bETH")) {
            return 1e18;
        } else {
            return prices[address(BErc20Interface(address(bToken)).underlying())];
        }
    }

    /*** ADMIN FUNCTIONS ***/

    /**
      * @notice Set the price of an asset
      * @param asset Address of the asset to set the price for
      * @param newPriceMantissa The new asset price mantissa (scaled by 1e18).
      */
    function setPrice(address asset, uint newPriceMantissa) public onlyOwner {
        uint previousPriceMantissa = prices[asset];
        prices[asset] = newPriceMantissa;
        emit PricePosted(asset, previousPriceMantissa, newPriceMantissa);
    }

    /*** INTERNAL FUNCTIONS ***/

    function compareStrings(string memory a, string memory b) internal pure returns (bool) {
        return (keccak256(abi.encodePacked((a))) == keccak256(abi.encodePacked((b))));
    }
}
