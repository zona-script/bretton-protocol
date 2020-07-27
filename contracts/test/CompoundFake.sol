pragma solidity 0.5.16;

import "../externals/SafeMath.sol";
import "../externals/Address.sol";
import "../externals/SafeERC20.sol";
import "../externals/ReentrancyGuard.sol";
import "../externals/IERC20.sol";
import "../externals/ERC20.sol";
import "../externals/ERC20Detailed.sol";

import "../providers/Compound.sol";

// Fake implementation of compound's cToken for testing
contract CompoundFake is ERC20, ERC20Detailed, Compound {
    using SafeERC20 for IERC20;
    using Address for address;
    using SafeMath for uint256;

    address public underlying;
    uint public exchangeRateMantissa; // exchange rate is stored as mantissa (1e18)

    constructor (
        string memory _name,
        string memory _symbol,
        uint8 _decimals,
        address _underlying,
        uint _exchangeRateMantissa
    )
        ERC20Detailed(_name, _symbol, _decimals)
        public
    {
        underlying = _underlying;
        exchangeRateMantissa = _exchangeRateMantissa;
    }

    // _amount = underlying amount deposited
    function mint(uint256 _amount) external returns ( uint256 ) {
        // Transfer underlying amount into cTokenFake
        IERC20(underlying).safeTransferFrom(msg.sender, address(this), _amount);

        // Mint cToken
        uint exchangeRateScaled = exchangeRateMantissa.div(1e18); // scale down exchangeRateMantissa
        uint amountToMint = _amount.div(exchangeRateScaled);
        _mint(msg.sender, amountToMint);

        return 0;
    }

    // _amount = underlying amount to redeem
    function redeemUnderlying(uint256 _amount) external returns (uint256) {
        // Transfer underlying to withdrawer, decrease totalPoolBalance
        IERC20(underlying).safeTransfer(msg.sender, _amount);

        // Burn dPool token for withdrawer
        uint exchangeRateScaled = exchangeRateMantissa.div(1e18); // scale down exchangeRateMantissa
        uint amountToBurn = _amount.div(exchangeRateScaled);
        _burn(msg.sender, amountToBurn);
    }

    function exchangeRateStored() external view returns (uint) {
        return exchangeRateMantissa;
    }

    function accrueInterest(uint _interest) external {
        exchangeRateMantissa = exchangeRateMantissa.mul(_interest);
    }
}
