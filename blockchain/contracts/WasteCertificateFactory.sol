// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./WasteCertificateNFT.sol";

/**
 * @title WasteCertificateFactory
 * @dev Enhanced factory contract for creating and managing waste certificate NFT contracts
 * with support for digital twins and role-based access control
 */
contract WasteCertificateFactory is Ownable, AccessControl {
    using Clones for address;
    
    // Role definitions
    bytes32 public constant DEPLOYER_ROLE = keccak256("DEPLOYER_ROLE");
    bytes32 public constant PROCESSOR_ROLE = keccak256("PROCESSOR_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    bytes32 public constant UPDATER_ROLE = keccak256("UPDATER_ROLE");
    
    address public immutable certificateImplementation;
    
    // Mapping from facility ID to certificate contract address
    mapping(string => address) public facilityContracts;
    
    // Array of all deployed contracts
    address[] public deployedContracts;
    
    // Facility metadata
    struct FacilityInfo {
        string name;
        string location;
        string facilityType;
        uint256 createdAt;
        bool isActive;
    }
    
    // Mapping from facility ID to facility info
    mapping(string => FacilityInfo) public facilityInfo;
    
    // Events
    event CertificateContractDeployed(
        string indexed facilityId,
        address indexed contractAddress,
        string name,
        string symbol,
        string facilityType
    );
    
    event ProcessorAuthorized(
        string indexed facilityId,
        address indexed processor,
        address authorizer
    );
    
    event VerifierAuthorized(
        string indexed facilityId,
        address indexed verifier,
        address authorizer
    );
    
    event UpdaterAuthorized(
        string indexed facilityId,
        address indexed updater,
        address authorizer
    );
    
    event FacilityStatusChanged(
        string indexed facilityId,
        bool isActive
    );
    
    constructor() {
        certificateImplementation = address(new WasteCertificateNFT());
        
        // Setup roles
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(DEPLOYER_ROLE, msg.sender);
        _setupRole(PROCESSOR_ROLE, msg.sender);
        _setupRole(VERIFIER_ROLE, msg.sender);
        _setupRole(UPDATER_ROLE, msg.sender);
    }
    
    /**
     * @dev Deploy a new certificate contract for a facility
     */
    function deployCertificateContract(
        string memory facilityId,
        string memory name,
        string memory symbol,
        string memory location,
        string memory facilityType
    ) public onlyRole(DEPLOYER_ROLE) returns (address) {
        require(
            facilityContracts[facilityId] == address(0),
            "Contract already exists for this facility"
        );
        
        // Deploy clone
        address clone = certificateImplementation.clone();
        WasteCertificateNFT(clone).initialize(name, symbol);
        
        // Store contract address
        facilityContracts[facilityId] = clone;
        deployedContracts.push(clone);
        
        // Store facility info
        facilityInfo[facilityId] = FacilityInfo({
            name: name,
            location: location,
            facilityType: facilityType,
            createdAt: block.timestamp,
            isActive: true
        });
        
        // Grant roles to deployer
        WasteCertificateNFT certificate = WasteCertificateNFT(clone);
        certificate.grantRole(certificate.DEFAULT_ADMIN_ROLE(), msg.sender);
        certificate.grantRole(certificate.PROCESSOR_ROLE(), msg.sender);
        certificate.grantRole(certificate.VERIFIER_ROLE(), msg.sender);
        certificate.grantRole(certificate.UPDATER_ROLE(), msg.sender);
        
        emit CertificateContractDeployed(facilityId, clone, name, symbol, facilityType);
        
        return clone;
    }
    
    /**
     * @dev Authorize a processor for a facility
     */
    function authorizeProcessor(
        string memory facilityId,
        address processor
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        address contractAddress = facilityContracts[facilityId];
        require(contractAddress != address(0), "Facility contract does not exist");
        
        WasteCertificateNFT certificate = WasteCertificateNFT(contractAddress);
        certificate.grantRole(certificate.PROCESSOR_ROLE(), processor);
        
        emit ProcessorAuthorized(facilityId, processor, msg.sender);
    }
    
    /**
     * @dev Authorize a verifier for a facility
     */
    function authorizeVerifier(
        string memory facilityId,
        address verifier
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        address contractAddress = facilityContracts[facilityId];
        require(contractAddress != address(0), "Facility contract does not exist");
        
        WasteCertificateNFT certificate = WasteCertificateNFT(contractAddress);
        certificate.grantRole(certificate.VERIFIER_ROLE(), verifier);
        
        emit VerifierAuthorized(facilityId, verifier, msg.sender);
    }
    
    /**
     * @dev Authorize an updater for a facility
     */
    function authorizeUpdater(
        string memory facilityId,
        address updater
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        address contractAddress = facilityContracts[facilityId];
        require(contractAddress != address(0), "Facility contract does not exist");
        
        WasteCertificateNFT certificate = WasteCertificateNFT(contractAddress);
        certificate.grantRole(certificate.UPDATER_ROLE(), updater);
        
        emit UpdaterAuthorized(facilityId, updater, msg.sender);
    }
    
    /**
     * @dev Set facility status (active/inactive)
     */
    function setFacilityStatus(
        string memory facilityId,
        bool isActive
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(facilityContracts[facilityId] != address(0), "Facility contract does not exist");
        
        facilityInfo[facilityId].isActive = isActive;
        
        // Pause/unpause the certificate contract
        WasteCertificateNFT certificate = WasteCertificateNFT(facilityContracts[facilityId]);
        if (isActive) {
            certificate.unpause();
        } else {
            certificate.pause();
        }
        
        emit FacilityStatusChanged(facilityId, isActive);
    }
    
    /**
     * @dev Get certificate contract for a facility
     */
    function getCertificateContract(string memory facilityId) 
        public 
        view 
        returns (address) 
    {
        return facilityContracts[facilityId];
    }
    
    /**
     * @dev Get facility information
     */
    function getFacilityInfo(string memory facilityId)
        public
        view
        returns (FacilityInfo memory)
    {
        require(facilityContracts[facilityId] != address(0), "Facility contract does not exist");
        return facilityInfo[facilityId];
    }
    
    /**
     * @dev Get all deployed contracts
     */
    function getAllContracts() public view returns (address[] memory) {
        return deployedContracts;
    }
    
    /**
     * @dev Get number of deployed contracts
     */
    function getContractCount() public view returns (uint256) {
        return deployedContracts.length;
    }
    
    /**
     * @dev Get all active facilities
     */
    function getActiveFacilities() public view returns (string[] memory) {
        uint256 activeCount = 0;
        
        // Count active facilities
        for (uint256 i = 0; i < deployedContracts.length; i++) {
            address contractAddress = deployedContracts[i];
            string memory facilityId = "";
            
            // Find facility ID for this contract
            for (uint256 j = 0; j < bytes(facilityId).length; j++) {
                if (facilityContracts[facilityId] == contractAddress && facilityInfo[facilityId].isActive) {
                    activeCount++;
                    break;
                }
            }
        }
        
        // Create array of active facility IDs
        string[] memory activeFacilities = new string[](activeCount);
        uint256 index = 0;
        
        // Populate array
        for (uint256 i = 0; i < deployedContracts.length; i++) {
            address contractAddress = deployedContracts[i];
            string memory facilityId = "";
            
            // Find facility ID for this contract
            for (uint256 j = 0; j < bytes(facilityId).length; j++) {
                if (facilityContracts[facilityId] == contractAddress && facilityInfo[facilityId].isActive) {
                    activeFacilities[index] = facilityId;
                    index++;
                    break;
                }
            }
        }
        
        return activeFacilities;
    }
    
    /**
     * @dev Grant deployer role to an address
     */
    function grantDeployerRole(address account) public onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(DEPLOYER_ROLE, account);
    }
    
    /**
     * @dev Revoke deployer role from an address
     */
    function revokeDeployerRole(address account) public onlyRole(DEFAULT_ADMIN_ROLE) {
        revokeRole(DEPLOYER_ROLE, account);
    }
}