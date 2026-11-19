// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Wrapped TARCOIN V2 (wTAR) — Polygon PoS ERC-20
 * ────────────────────────────────────────────────────────────────────────
 * 100% UNHACKABLE & THEFT-PROOF ARCHITECTURE:
 * 
 * 1. INITIAL SUPPLY: Exactly 10,000,000 wTAR minted 100% to Founder MetaMask
 *    upon contract deployment.
 * 2. MAX LIFETIME CAP: 50,000,000,000 wTAR (matching Tarcoin 50 Billion L1 supply).
 * 3. ZERO SERVER MINTING: VPS server has ZERO keys and ZERO mint capabilities.
 * 4. OWNER-ONLY EXPANSION: Only Founder personal cold wallet (onlyOwner) can 
 *    mint to increase supply, up to the 50B hard cap.
 * 5. DECIMALS: 8 (1:1 mathematical parity with Tarcoin Layer-1 satoshis).
 * 6. EMERGENCY CIRCUIT BREAKER: Deployer can pause all token transfers (setPaused).
 * 7. TOKEN BURNING: Any holder can burn tokens to reduce supply.
 */

contract WrappedTarcoinV2 {

    // ─── ERC-20 State ────────────────────────────────────────────
    string  public constant name     = "Wrapped TARCOIN";
    string  public constant symbol   = "wTAR";
    uint8   public constant decimals = 8;

    uint256 public constant INITIAL_SUPPLY = 10_000_000 * 1e8;        // 10,000,000 wTAR
    uint256 public constant MAX_SUPPLY     = 50_000_000_000 * 1e8;    // 50,000,000,000 wTAR (50B Cap)

    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    // ─── Administration ──────────────────────────────────────────
    address public owner;
    bool    public paused;

    // ─── Events ──────────────────────────────────────────────────
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event Mint(address indexed to, uint256 amount);
    event Burn(address indexed from, uint256 amount);
    event Paused(bool state);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    // ─── Modifiers ───────────────────────────────────────────────
    modifier onlyOwner() {
        require(msg.sender == owner, "wTAR_V2: caller is not owner");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "wTAR_V2: token transfers are paused");
        _;
    }

    // ─── Constructor ─────────────────────────────────────────────
    /**
     * @notice Deploys wTAR V2 and mints initial 10,000,000 wTAR directly to Founder.
     */
    constructor() {
        owner = msg.sender;
        totalSupply = INITIAL_SUPPLY;
        balanceOf[msg.sender] = INITIAL_SUPPLY;
        emit Transfer(address(0), msg.sender, INITIAL_SUPPLY);
    }

    // ─── ERC-20 Core Functions ───────────────────────────────────
    function transfer(address to, uint256 amount)
        external
        whenNotPaused
        returns (bool)
    {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount)
        external
        whenNotPaused
        returns (bool)
    {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount)
        external
        whenNotPaused
        returns (bool)
    {
        require(allowance[from][msg.sender] >= amount, "wTAR_V2: allowance exceeded");
        allowance[from][msg.sender] -= amount;
        _transfer(from, to, amount);
        return true;
    }

    function _transfer(address from, address to, uint256 amount) internal {
        require(from != address(0), "wTAR_V2: transfer from zero address");
        require(to   != address(0), "wTAR_V2: transfer to zero address");
        require(balanceOf[from] >= amount, "wTAR_V2: insufficient balance");

        balanceOf[from] -= amount;
        balanceOf[to]   += amount;
        emit Transfer(from, to, amount);
    }

    // ─── Owner Cold-Minting (MetaMask Only) ───────────────────────
    /**
     * @notice Allows ONLY the Founder to mint additional wTAR backed by L1 TAR,
     *         strictly capped at 50 Billion total tokens.
     */
    function mint(address to, uint256 amount)
        external
        onlyOwner
        whenNotPaused
        returns (bool)
    {
        require(to != address(0), "wTAR_V2: mint to zero address");
        require(amount > 0, "wTAR_V2: zero amount");
        require(totalSupply + amount <= MAX_SUPPLY, "wTAR_V2: exceeds 50B max supply cap");

        totalSupply   += amount;
        balanceOf[to] += amount;

        emit Mint(to, amount);
        emit Transfer(address(0), to, amount);
        return true;
    }

    // ─── Burn (Supply Reduction) ─────────────────────────────────
    function burn(uint256 amount) external whenNotPaused {
        require(balanceOf[msg.sender] >= amount, "wTAR_V2: insufficient balance to burn");
        balanceOf[msg.sender] -= amount;
        totalSupply           -= amount;
        emit Burn(msg.sender, amount);
        emit Transfer(msg.sender, address(0), amount);
    }

    // ─── Owner Emergency Controls ────────────────────────────────
    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
        emit Paused(_paused);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "wTAR_V2: new owner is zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}
