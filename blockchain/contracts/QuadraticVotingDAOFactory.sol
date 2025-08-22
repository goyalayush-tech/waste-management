// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./QuadraticVotingDAO.sol";
import "./WasteGovernanceToken.sol";

/**
 * @title QuadraticVotingDAOFactory
 * @dev Factory contract for creating and managing DAO instances with quadratic voting
 */
contract QuadraticVotingDAOFactory is Ownable, AccessControl {
    using Clones for address;
    
    // Role definitions
    bytes32 public constant DEPLOYER_ROLE = keccak256("DEPLOYER_ROLE");
    
    // Implementation contracts
    address public immutable daoImplementation;
    
    // Mapping from DAO ID to DAO contract address
    mapping(string => address) public daoContracts;
    
    // Mapping from DAO ID to governance token address
    mapping(string => address) public daoTokens;
    
    // Array of all deployed DAOs
    address[] public deployedDAOs;
    
    // DAO metadata
    struct DAOInfo {
        string name;
        string description;
        address governanceToken;
        uint256 createdAt;
        bool isActive;
    }
    
    // Mapping from DAO ID to DAO info
    mapping(string => DAOInfo) public daoInfo;
    
    // Events
    event DAODeployed(
        string indexed daoId,
        address indexed daoAddress,
        address indexed tokenAddress,
        string name,
        string description
    );
    
    event DAOStatusChanged(
        string indexed daoId,
        bool isActive
    );
    
    /**
     * @dev Constructor
     */
    constructor() {
        // Deploy implementation contract
        daoImplementation = address(new QuadraticVotingDAO());
        
        // Setup roles
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(DEPLOYER_ROLE, msg.sender);
    }
    
    /**
     * @dev Deploy a new DAO with its governance token
     * @param daoId Unique identifier for the DAO
     * @param name Name of the DAO
     * @param description Description of the DAO
     * @param tokenName Name of the governance token
     * @param tokenSymbol Symbol of the governance token
     * @param initialSupply Initial supply of the governance token
     * @param maxSupply Maximum supply of the governance token
     * @param votingPeriod Voting period in seconds
     * @param proposalThreshold Minimum tokens required to create a proposal
     * @param minQuorumPercent Minimum participation required as percentage
     */
    function deployDAO(
        string memory daoId,
        string memory name,
        string memory description,
        string memory tokenName,
        string memory tokenSymbol,
        uint256 initialSupply,
        uint256 maxSupply,
        uint256 votingPeriod,
        uint256 proposalThreshold,
        uint256 minQuorumPercent
    ) public onlyRole(DEPLOYER_ROLE) returns (address daoAddress, address tokenAddress) {
        require(
            daoContracts[daoId] == address(0),
            "DAO already exists with this ID"
        );
        
        // Deploy governance token
        WasteGovernanceToken token = new WasteGovernanceToken(
            tokenName,
            tokenSymbol,
            initialSupply,
            maxSupply
        );
        
        // Deploy DAO clone
        address clone = daoImplementation.clone();
        QuadraticVotingDAO(clone).initialize(
            address(token),
            votingPeriod,
            proposalThreshold,
            minQuorumPercent
        );
        
        // Store contract addresses
        daoContracts[daoId] = clone;
        daoTokens[daoId] = address(token);
        deployedDAOs.push(clone);
        
        // Store DAO info
        daoInfo[daoId] = DAOInfo({
            name: name,
            description: description,
            governanceToken: address(token),
            createdAt: block.timestamp,
            isActive: true
        });
        
        // Grant roles
        QuadraticVotingDAO dao = QuadraticVotingDAO(clone);
        dao.grantRole(dao.DEFAULT_ADMIN_ROLE(), msg.sender);
        dao.grantRole(dao.ADMIN_ROLE(), msg.sender);
        dao.grantRole(dao.PROPOSER_ROLE(), msg.sender);
        
        // Transfer token ownership to DAO
        token.grantRole(token.DEFAULT_ADMIN_ROLE(), clone);
        token.grantRole(token.MINTER_ROLE(), clone);
        token.grantRole(token.SNAPSHOT_ROLE(), clone);
        
        emit DAODeployed(daoId, clone, address(token), name, description);
        
        return (clone, address(token));
    }
    
    /**
     * @dev Set DAO status (active/inactive)
     * @param daoId DAO identifier
     * @param isActive New status
     */
    function setDAOStatus(
        string memory daoId,
        bool isActive
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(daoContracts[daoId] != address(0), "DAO does not exist");
        
        daoInfo[daoId].isActive = isActive;
        
        // Pause/unpause the DAO
        QuadraticVotingDAO dao = QuadraticVotingDAO(daoContracts[daoId]);
        if (isActive) {
            dao.unpause();
        } else {
            dao.pause();
        }
        
        emit DAOStatusChanged(daoId, isActive);
    }
    
    /**
     * @dev Get DAO contract address
     * @param daoId DAO identifier
     */
    function getDAOContract(string memory daoId) public view returns (address) {
        return daoContracts[daoId];
    }
    
    /**
     * @dev Get governance token address
     * @param daoId DAO identifier
     */
    function getGovernanceToken(string memory daoId) public view returns (address) {
        return daoTokens[daoId];
    }
    
    /**
     * @dev Get DAO information
     * @param daoId DAO identifier
     */
    function getDAOInfo(string memory daoId) public view returns (DAOInfo memory) {
        require(daoContracts[daoId] != address(0), "DAO does not exist");
        return daoInfo[daoId];
    }
    
    /**
     * @dev Get all deployed DAOs
     */
    function getAllDAOs() public view returns (address[] memory) {
        return deployedDAOs;
    }
    
    /**
     * @dev Get number of deployed DAOs
     */
    function getDAOCount() public view returns (uint256) {
        return deployedDAOs.length;
    }
    
    /**
     * @dev Grant deployer role to an address
     * @param account Address to grant role to
     */
    function grantDeployerRole(address account) public onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(DEPLOYER_ROLE, account);
    }
    
    /**
     * @dev Revoke deployer role from an address
     * @param account Address to revoke role from
     */
    function revokeDeployerRole(address account) public onlyRole(DEFAULT_ADMIN_ROLE) {
        revokeRole(DEPLOYER_ROLE, account);
    }
}