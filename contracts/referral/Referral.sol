pragma solidity ^0.5.0;

import "../externals/IERC20.sol";

/**
 * Forked from YFV, original audit at https://github.com/yfv-finance/audit
 */

contract Referral {
    mapping(address => address) public referrers; // account_address -> referrer_address
    mapping(address => uint256) public referredCount; // referrer_address -> num_of_referred
    mapping(address => address[]) public referredList; // referrer_address -> referee_addresses
    mapping(address => uint256) public referrerEarning; // referrer_address -> total earning from referral

    event NewReferral(address indexed referrer, address indexed farmer);

    // Standard contract ownership transfer.
    address public owner;
    address private nextOwner;

    mapping(address => bool) public isAdmin;

    constructor () public {
        owner = msg.sender;
    }

    // Standard modifier on methods invokable only by contract owner.
    modifier onlyOwner {
        require(msg.sender == owner, "OnlyOwner methods called by non-owner.");
        _;
    }

    modifier onlyAdmin {
        require(isAdmin[msg.sender], "OnlyAdmin methods called by non-admin.");
        _;
    }

    // Standard contract ownership transfer implementation,
    function approveNextOwner(address _nextOwner) external onlyOwner {
        require(_nextOwner != owner, "Cannot approve current owner.");
        nextOwner = _nextOwner;
    }

    function acceptNextOwner() external {
        require(msg.sender == nextOwner, "Can only accept preapproved new owner.");
        owner = nextOwner;
    }

    function setReferrer(address farmer, address referrer) public onlyAdmin {
        if (referrers[farmer] == address(0) && referrer != address(0)) {
            referrers[farmer] = referrer;
            referredCount[referrer] += 1;
            referredList[referrer].push(farmer);
            emit NewReferral(referrer, farmer);
        }
    }

    function addEarning(address referrer, uint256 earning) public onlyAdmin {
        if (referrer != address(0)) {
            referrerEarning[referrer] += earning;
        }
    }

    function getReferrer(address farmer) public view returns (address) {
        return referrers[farmer];
    }

    // Set admin status.
    function setAdminStatus(address _admin, bool _status) external onlyOwner {
        isAdmin[_admin] = _status;
    }

    event EmergencyERC20Drain(address token, address owner, uint256 amount);

    // owner can drain tokens that are sent here by mistake
    function emergencyERC20Drain(IERC20 token, uint amount) external onlyOwner {
        emit EmergencyERC20Drain(address(token), owner, amount);
        token.transfer(owner, amount);
    }
}
