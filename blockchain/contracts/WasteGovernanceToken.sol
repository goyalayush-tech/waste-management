// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Snapshot.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";

/**
 * @title WasteGovernanceToken
 * @dev Governance token for the waste management DAO with snapshot capabilities
 * for voting weight determination
 */
contract WasteGovernanceToken is 
    ERC20, 
    ERC20Burnable, 
    ERC20Snapshot, 
    AccessControl, 
    Pausable, 
    ERC20Permit 
{
    bytes32 public constant SNAPSHOT_ROLE = keccak256("SNAPSHOT_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    
    // Maximum supply cap
    uint256 public immutable maxSupply;
    
    // Mapping for tracking participation-based rewards
    mapping(address => uint256) public participationPoints;
    
    // Events
    event ParticipationPointsAdded(address indexed account, uint256 points);
    event ParticipationRewardClaimed(address indexed account, uint256 amount);
    
    /**
     * @dev Constructor
     * @param name Token name
     * @param symbol Token symbol
     * @param initialSupply Initial token supply
     * @param _maxSupply Maximum token supply cap
     */
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        uint256 _maxSupply
    ) ERC20(name, symbol) ERC20Permit(name) {
        require(_maxSupply >= initialSupply, "Max supply must be >= initial supply");
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(SNAPSHOT_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        
        maxSupply = _maxSupply;
        
        // Mint initial supply to deployer
        _mint(msg.sender, initialSupply);
    }
    
    /**
     * @dev Create a new snapshot for voting
     */
    function snapshot() public onlyRole(SNAPSHOT_ROLE) returns (uint256) {
        return _snapshot();
    }
    
    /**
     * @dev Pause token transfers
     */
    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }
    
    /**
     * @dev Unpause token transfers
     */
    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }
    
    /**
     * @dev Mint new tokens (respecting max supply)
     * @param to Recipient address
     * @param amount Amount to mint
     */
    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        require(totalSupply() + amount <= maxSupply, "Exceeds maximum supply cap");
        _mint(to, amount);
    }
    
    /**
     * @dev Add participation points to an account
     * @param account Account to add points to
     * @param points Number of points to add
     */
    function addParticipationPoints(address account, uint256 points) public onlyRole(DEFAULT_ADMIN_ROLE) {
        participationPoints[account] += points;
        emit ParticipationPointsAdded(account, points);
    }
    
    /**
     * @dev Claim rewards based on participation points
     */
    function claimParticipationRewards() public {
        uint256 points = participationPoints[msg.sender];
        require(points > 0, "No participation points to claim");
        
        // Calculate reward (1 token per 100 points)
        uint256 reward = points / 100;
        require(reward > 0, "Not enough points for a reward");
        
        // Ensure we don't exceed max supply
        require(totalSupply() + reward <= maxSupply, "Exceeds maximum supply cap");
        
        // Reset points (keeping remainder)
        participationPoints[msg.sender] = points % 100;
        
        // Mint reward tokens
        _mint(msg.sender, reward);
        
        emit ParticipationRewardClaimed(msg.sender, reward);
    }
    
    /**
     * @dev Get current participation points for an account
     * @param account Account to check
     */
    function getParticipationPoints(address account) public view returns (uint256) {
        return participationPoints[account];
    }
    
    /**
     * @dev Get token balance at a specific snapshot id
     * @param account Account to check
     * @param snapshotId Snapshot ID
     */
    function balanceOfAt(address account, uint256 snapshotId) public view override returns (uint256) {
        return super.balanceOfAt(account, snapshotId);
    }
    
    /**
     * @dev Get total supply at a specific snapshot id
     * @param snapshotId Snapshot ID
     */
    function totalSupplyAt(uint256 snapshotId) public view override returns (uint256) {
        return super.totalSupplyAt(snapshotId);
    }
    
    /**
     * @dev Hook that is called before any transfer of tokens
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20, ERC20Snapshot) whenNotPaused {
        super._beforeTokenTransfer(from, to, amount);
    }
}