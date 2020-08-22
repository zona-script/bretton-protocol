pragma solidity 0.5.16;

import "../externals/SafeMath.sol";
import "../externals/SafeERC20.sol";
import "../externals/ReentrancyGuard.sol";
import "../externals/Ownable.sol";
import "../externals/IERC20.sol";
import "../externals/ERC20.sol";
import "../externals/ERC20Detailed.sol";

import "../interfaces/EarningPoolInterface.sol";
import "../interfaces/ManagedRewardPoolInterface.sol";

/**
 * @title nToken
 * @dev nToken are collateralized assets pegged to a specific value.
 *      Collaterals are EarningPool shares
 */
contract nToken is ERC20, ERC20Detailed, ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    mapping(address => address) public underlyingToEarningPoolMap;
    address[] public supportedUnderlyings;

    ManagedRewardPoolInterface public managedRewardPool;

    // mapping between underlying token and its paused state
    // pause is used for mint and swap
    mapping(address => bool) public paused;

    event Minted(address indexed beneficiary, address indexed underlying, uint256 amount, address payer);
    event Redeemed(address indexed beneficiary, address indexed underlying, uint256 amount, address payer);
    event Swapped(address indexed beneficiary, address indexed underlyingFrom, uint256 amountFrom, address indexed underlyingTo, uint256 amountTo, address payer);
    event EarningPoolAdded(address indexed earningPool, address indexed underlying);
    event Pause(address indexed underlying);
    event Unpause(address indexed underlying);

    /**
     * @dev nToken constructor
     * @param _name Name of nToken
     * @param _symbol Symbol of nToken
     * @param _decimals Decimal place of nToken
     * @param _earningPools List of earning pools to supply underlying token to
     */
    constructor (
        string memory _name,
        string memory _symbol,
        uint8 _decimals,
        address[] memory _earningPools,
        address _managedRewardPool
    )
        ERC20Detailed(_name, _symbol, _decimals)
        public
    {
        require(_managedRewardPool != address(0), "NTOKEN: reward pool address cannot be zero");
        managedRewardPool = ManagedRewardPoolInterface(_managedRewardPool);

        for (uint i=0; i<_earningPools.length; i++) {
            _addEarningPool(_earningPools[i]);
        }
    }

    /**
     * @dev Modifier to make a function callable only when the underlying is not paused.
     */
    modifier whenNotPaused(address _underlying) {
      require(!paused[_underlying], "NTOKEN: underlying is paused");
      _;
    }

    /**
     * @dev Modifier to make a function callable only when the contract is paused.
     */
    modifier whenPaused(address _underlying) {
      require(paused[_underlying], "NTOKEN: underlying is not paused");
      _;
    }

    /*** PUBLIC ***/

    /**
     * @dev Mint nToken using underlying
     * @param _beneficiary Address of beneficiary
     * @param _underlying Token supplied for minting
     * @param _underlyingAmount Amount of _underlying
     */
    function mint(
        address _beneficiary,
        address _underlying,
        uint _underlyingAmount
    )
        external
        nonReentrant
        whenNotPaused(_underlying)
    {
        _mintInternal(_beneficiary, _underlying, _underlyingAmount);
    }

    /**
     * @dev Redeem nToken to underlying
     * @param _beneficiary Address of beneficiary
     * @param _underlying Token withdrawn for redeeming
     * @param _underlyingAmount Amount of _underlying
     */
    function redeem(
        address _beneficiary,
        address _underlying,
        uint _underlyingAmount
    )
        external
        nonReentrant
    {
        _redeemInternal(_beneficiary, _underlying, _underlyingAmount);
    }

    /**
     * @dev Swap from one underlying to another
     * @param _beneficiary Address of beneficiary
     * @param _underlyingFrom Token to swap from
     * @param _amountFrom Amount of _underlyingFrom
     * @param _underlyingTo Token to swap to
     */
    function swap(
        address _beneficiary,
        address _underlyingFrom,
        uint _amountFrom,
        address _underlyingTo
    )
        external
        nonReentrant
        whenNotPaused(_underlyingFrom)
    {
        require(_amountFrom > 0, "NTOKEN: swap amountFrom must be greater than 0");
        require(isUnderlyingSupported(_underlyingFrom), "NTOKEN: swap underlyingFrom is not supported");
        require(isUnderlyingSupported(_underlyingTo), "NTOKEN: swap underlyingTo is not supported");

        // check if there is sufficient underlyingTo to swap
        // currently there are no exchange rate between underlyings as only stable coins are supported
        EarningPoolInterface underlyingToPool = EarningPoolInterface(underlyingToEarningPoolMap[_underlyingTo]);
        uint amountTo = _scaleTokenAmount(_underlyingFrom, _amountFrom, _underlyingTo);
        require(underlyingToPool.calcPoolValueInUnderlying() >= amountTo, "NTOKEN: insufficient underlyingTo for swap");

        // transfer underlyingFrom from msg.sender and deposit into earnin pool
        EarningPoolInterface underlyingFromPool = EarningPoolInterface(underlyingToEarningPoolMap[_underlyingFrom]);
        IERC20(_underlyingFrom).safeTransferFrom(msg.sender, address(this), _amountFrom);
        underlyingFromPool.deposit(address(this), _amountFrom);

        // withdraw underlyingTo from earning pool to _beneficiary
        uint256 actualAmountTo = underlyingToPool.withdraw(address(this), amountTo);
        IERC20(_underlyingTo).safeTransfer(_beneficiary, actualAmountTo);

        emit Swapped(_beneficiary, _underlyingFrom, _amountFrom, _underlyingTo, actualAmountTo, msg.sender);
    }

    /*** VIEW ***/

    /**
     * @dev Check if an underlying is supported
     * @param _underlying Address of underlying token
     */
    function isUnderlyingSupported(address _underlying) public view returns (bool) {
        return underlyingToEarningPoolMap[_underlying] != address(0);
    }

    /**
     * @dev Get corresponding earning pool address of underlying
     * @param _underlying Address of underlying token
     */
    function getUnderlyingEarningPool(address _underlying) public view returns (address) {
        return underlyingToEarningPoolMap[_underlying];
    }

    /**
     * @dev Get all supported underlyings
     * @return address[] List of address of supported underlying token
     */
    function getAllSupportedUnderlyings() public view returns (address[] memory) {
        return supportedUnderlyings;
    }

    /*** ADMIN ***/

    /**
     * @dev Add earning pool to nToken
     * @param _earningPool Address of earning pool
     */
    function addEarningPool(address _earningPool)
        external
        onlyOwner
    {
        _addEarningPool(_earningPool);
    }

    /**
     * @dev called by the owner to pause, triggers stopped state
     */
    function pause(address _underlying)
        public
        onlyOwner
        whenNotPaused(_underlying)
    {
        paused[_underlying] = true;
        emit Pause(_underlying);
    }

    /**
     * @dev called by the owner to unpause, returns to normal state
     */
    function unpause(address _underlying)
        public
        onlyOwner
        whenPaused(_underlying)
    {
        paused[_underlying] = false;
        emit Unpause(_underlying);
    }

    /**
     * @dev Set the name of token
     * @param _name Name of token
     */
    function setName(string calldata _name)
        external
        onlyOwner
    {
        name = _name;
    }

    /**
     * @dev Set the symbol of token
     * @param _symbol Symbol of token
     */
    function setSymbol(string calldata _symbol)
        external
        onlyOwner
    {
        symbol = _symbol;
    }

    /*** INTERNAL ***/

    function _mintInternal(address _beneficiary, address _underlying, uint _underlyingAmount) internal {
        require(_underlyingAmount > 0, "NTOKEN: mint must be greater than 0");
        require(isUnderlyingSupported(_underlying), "NTOKEN: mint underlying is not supported");

        // transfer underlying from msg.sender into nToken and deposit into earning pool
        EarningPoolInterface pool = EarningPoolInterface(underlyingToEarningPoolMap[_underlying]);
        IERC20(_underlying).safeTransferFrom(msg.sender, address(this), _underlyingAmount);
        pool.deposit(address(this), _underlyingAmount);

        // mint nToken for _beneficiary
        uint nTokenAmount = _scaleTokenAmount(_underlying, _underlyingAmount, address(this));
        _mint(_beneficiary, nTokenAmount);

        // mint shares in managedRewardPool for _beneficiary
        managedRewardPool.mintShares(_beneficiary, nTokenAmount);

        emit Minted(_beneficiary, _underlying, _underlyingAmount, msg.sender);
    }

    function _redeemInternal(address _beneficiary, address _underlying, uint _underlyingAmount) internal {
        require(_underlyingAmount > 0, "NTOKEN: redeem must be greater than 0");
        require(isUnderlyingSupported(_underlying), "NTOKEN: redeem underlying is not supported");

        // burn msg.sender nToken
        uint nTokenAmount = _scaleTokenAmount(_underlying, _underlyingAmount, address(this));
        _burn(msg.sender, nTokenAmount);

        // burn msg.sender shares from managedRewardPool
        managedRewardPool.burnShares(msg.sender, nTokenAmount);

        // withdraw underlying from earning pool and transfer to _beneficiary
        EarningPoolInterface pool = EarningPoolInterface(underlyingToEarningPoolMap[_underlying]);
        uint256 actualWithdrawnAmount = pool.withdraw(address(this), _underlyingAmount);
        IERC20(_underlying).safeTransfer(_beneficiary, actualWithdrawnAmount);

        emit Redeemed(_beneficiary, _underlying, actualWithdrawnAmount, msg.sender);
    }

    /**
     * @dev Approve underlyings to earning pool
     * @param _underlying Address of underlying token
     * @param _pool Address of earning pool
     */
    function _approveUnderlyingToEarningPool(address _underlying, address _pool) internal {
        IERC20(_underlying).safeApprove(_pool, uint(-1));
    }

    /**
     * @dev Scale token amount from one decimal precision to another
     * @param _from Address of token to convert from
     * @param _fromAmount Amount of _from token
     * @param _to Address of token to convert to
     */
    function _scaleTokenAmount(address _from, uint _fromAmount, address _to) internal view returns (uint) {
        uint fromTokenDecimalPlace = uint(ERC20Detailed(_from).decimals());
        uint toTokenDecimalPlace = uint(ERC20Detailed(_to).decimals());
        uint toTokenAmount;
        uint scaleFactor;
        if (fromTokenDecimalPlace > toTokenDecimalPlace) {
            scaleFactor = fromTokenDecimalPlace.sub(toTokenDecimalPlace);
            toTokenAmount = _fromAmount.div(uint(10**scaleFactor)); // expect precision loss
        } else if (toTokenDecimalPlace > fromTokenDecimalPlace) {
            scaleFactor = toTokenDecimalPlace.sub(fromTokenDecimalPlace);
            toTokenAmount = _fromAmount.mul(uint(10**(scaleFactor)));
        } else {
            toTokenAmount = _fromAmount;
        }
        return toTokenAmount;
    }

    /**
     * @dev Add earning pool to nToken
     * @param _earningPool Address of earning pool
     */
    function _addEarningPool(address _earningPool)
        internal
    {
        EarningPoolInterface pool = EarningPoolInterface(_earningPool);

        underlyingToEarningPoolMap[pool.underlyingToken()] = _earningPool;
        supportedUnderlyings.push(pool.underlyingToken());
        _approveUnderlyingToEarningPool(pool.underlyingToken(), _earningPool);

        emit EarningPoolAdded(_earningPool, pool.underlyingToken());
    }

    /**
     * @dev Overrides parent ERC20 _transfer function to update reward for sender and recipient
     * @param _sender Sender of transfer
     * @param _recipient Address to recieve transfer
     * @param _amount Amount to transfer
     * @return bool Is transfer successful
     */
    function _transfer(address _sender, address _recipient, uint256 _amount)
        internal
    {
        managedRewardPool.burnShares(_sender, _amount);
        managedRewardPool.mintShares(_recipient, _amount);
        super._transfer(_sender, _recipient, _amount);
    }
}
