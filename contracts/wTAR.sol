// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * Wrapped TARCOIN (wTAR) — Polygon ERC-20
 * ─────────────────────────────────────────
 * Phase 1: Buy-only. Burn/sell disabled until Phase 2.
 * Mint:    Only bridge wallet (onlyOwner).
 * Pause:   Emergency freeze by owner.
 * Cap:     Max 10,000,000 wTAR per mint tx. Daily 50,000,000 cap.
 * Price:   Fixed at $0.00005 USDT (set in bridge, not contract).
 */

contract WrappedTarcoin {

    // ─── ERC-20 State ────────────────────────────────────────────
    string  public constant name     = "Wrapped TARCOIN";
    string  public constant symbol   = "wTAR";
    uint8   public constant decimals = 8;

    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    // ─── Control ─────────────────────────────────────────────────
    address public owner;
    bool    public paused;
    bool    public sellEnabled;        // Phase 2: set true to allow burn/sell

    // ─── Mint Caps ───────────────────────────────────────────────
    uint256 public constant MAX_MINT_PER_TX  = 10_000_000 * 1e8;   // 10M wTAR
    uint256 public constant MAX_MINT_PER_DAY = 50_000_000 * 1e8;   // 50M wTAR
    uint256 public dailyMinted;
    uint256 public dailyMintReset;     // timestamp of last reset

    // ─── Supply Tracking ─────────────────────────────────────────
    uint256 public totalWrapped;       // TAR locked in bridge → wTAR
    uint256 public totalBought;        // USDT paid → wTAR

    // ─── Events ──────────────────────────────────────────────────
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event Mint(address indexed to, uint256 amount, string mintType);
    event Burn(address indexed from, uint256 amount);
    event Paused(bool state);
    event SellEnabled(bool state);
    event OwnershipTransferred(address indexed prev, address indexed next);

    // ─── Modifiers ───────────────────────────────────────────────
    modifier onlyOwner() {
        require(msg.sender == owner, "wTAR: not owner");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "wTAR: contract paused");
        _;
    }

    // ─── Constructor ─────────────────────────────────────────────
    constructor() {
        owner = msg.sender;
        dailyMintReset = block.timestamp;
    }

    // ─── ERC-20 Core ─────────────────────────────────────────────
    function transfer(address to, uint256 amount)
        external whenNotPaused returns (bool)
    {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount)
        external whenNotPaused returns (bool)
    {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount)
        external whenNotPaused returns (bool)
    {
        require(allowance[from][msg.sender] >= amount, "wTAR: allowance exceeded");
        allowance[from][msg.sender] -= amount;
        _transfer(from, to, amount);
        return true;
    }

    function _transfer(address from, address to, uint256 amount) internal {
        require(from != address(0), "wTAR: zero address");
        require(to   != address(0), "wTAR: zero address");
        require(balanceOf[from] >= amount, "wTAR: insufficient balance");
        balanceOf[from] -= amount;
        balanceOf[to]   += amount;
        emit Transfer(from, to, amount);
    }

    // ─── Mint (Bridge Only) ───────────────────────────────────────
    /**
     * @param to        Recipient Polygon wallet
     * @param amount    Amount in wTAR smallest unit (8 decimals)
     * @param mintType  "buy" = USDT purchase | "wrap" = TAR locked
     */
    function mint(address to, uint256 amount, string calldata mintType)
        external onlyOwner whenNotPaused
    {
        require(to != address(0),              "wTAR: zero address");
        require(amount > 0,                    "wTAR: zero amount");
        require(amount <= MAX_MINT_PER_TX,     "wTAR: exceeds per-tx cap");

        // Reset daily counter if 24h passed
        if (block.timestamp >= dailyMintReset + 1 days) {
            dailyMinted    = 0;
            dailyMintReset = block.timestamp;
        }
        require(dailyMinted + amount <= MAX_MINT_PER_DAY, "wTAR: daily cap reached");

        dailyMinted  += amount;
        totalSupply  += amount;
        balanceOf[to]+= amount;

        if (keccak256(bytes(mintType)) == keccak256(bytes("wrap"))) {
            totalWrapped += amount;
        } else {
            totalBought  += amount;
        }

        emit Mint(to, amount, mintType);
        emit Transfer(address(0), to, amount);
    }

    // ─── Burn / Unwrap ────────────────────────────────────────────
    /**
     * Phase 1: disabled. Phase 2: user burns wTAR, bridge releases TAR.
     */
    function burn(uint256 amount) external whenNotPaused {
        require(sellEnabled, "wTAR: sell/burn disabled in Phase 1");
        require(balanceOf[msg.sender] >= amount, "wTAR: insufficient balance");
        balanceOf[msg.sender] -= amount;
        totalSupply           -= amount;
        emit Burn(msg.sender, amount);
        emit Transfer(msg.sender, address(0), amount);
    }

    // ─── Owner Controls ───────────────────────────────────────────
    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
        emit Paused(_paused);
    }

    function enableSell(bool _enabled) external onlyOwner {
        sellEnabled = _enabled;
        emit SellEnabled(_enabled);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "wTAR: zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    // ─── View Helpers ──────────────────────────────────────────────
    function todayMinted() external view returns (uint256) {
        if (block.timestamp >= dailyMintReset + 1 days) return 0;
        return dailyMinted;
    }

    function remainingDailyCap() external view returns (uint256) {
        if (block.timestamp >= dailyMintReset + 1 days) return MAX_MINT_PER_DAY;
        return MAX_MINT_PER_DAY > dailyMinted ? MAX_MINT_PER_DAY - dailyMinted : 0;
    }
}
