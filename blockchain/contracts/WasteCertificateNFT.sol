// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721RoyaltyUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/EIP712Upgradeable.sol";

/**
 * @title WasteCertificateNFT
 * @dev Enhanced NFT contract for waste processing certificates with dynamic metadata
 * and digital twin integration
 */
contract WasteCertificateNFT is 
    Initializable,
    ERC721Upgradeable,
    ERC721URIStorageUpgradeable,
    ERC721RoyaltyUpgradeable,
    OwnableUpgradeable,
    AccessControlUpgradeable,
    PausableUpgradeable,
    EIP712Upgradeable
{
    using CountersUpgradeable for CountersUpgradeable.Counter;
    
    // Role definitions
    bytes32 public constant PROCESSOR_ROLE = keccak256("PROCESSOR_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    bytes32 public constant UPDATER_ROLE = keccak256("UPDATER_ROLE");
    
    CountersUpgradeable.Counter private _tokenIdCounter;
    
    // Default royalty percentage (in basis points, 100 = 1%)
    uint96 private _defaultRoyaltyBps;
    
    // Waste certificate data structure
    struct WasteCertificate {
        string wasteOrigin;
        string processingMethod;
        uint256 carbonCredits;
        uint256 recyclingEfficiency;
        uint256 environmentalImpact;
        uint256 processingTimestamp;
        string ipfsHash;
        bool isVerified;
        address processor;
        string digitalTwinId;
        uint256 lastUpdated;
    }
    
    // Processing stage structure
    struct ProcessingStage {
        string stageName;
        string stageType;
        uint256 timestamp;
        string dataHash; // IPFS hash of additional stage data
    }
    
    // Mapping from token ID to certificate data
    mapping(uint256 => WasteCertificate) public certificates;
    
    // Mapping from digital twin ID to token ID
    mapping(string => uint256) public digitalTwinToToken;
    
    // Events
    event CertificateMinted(
        uint256 indexed tokenId,
        address indexed recipient,
        string wasteOrigin,
        string ipfsHash,
        string digitalTwinId
    );
    
    event CertificateUpdated(
        uint256 indexed tokenId,
        string newIpfsHash,
        uint256 carbonCredits,
        uint256 timestamp
    );
    
    event ProcessingStageAdded(
        uint256 indexed tokenId,
        string stageName,
        string stageType,
        uint256 timestamp
    );
    
    event CertificateVerified(
        uint256 indexed tokenId,
        address indexed verifier,
        uint256 timestamp
    );
    
    event DigitalTwinLinked(
        uint256 indexed tokenId,
        string digitalTwinId
    );
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    /**
     * @dev Initialize the contract
     */
    function initialize(
        string memory name,
        string memory symbol
    ) public initializer {
        __ERC721_init(name, symbol);
        __ERC721URIStorage_init();
        __ERC721Royalty_init();
        __Ownable_init();
        __AccessControl_init();
        __Pausable_init();
        __EIP712_init("WasteCertificateNFT", "1");
        
        // Setup roles
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(PROCESSOR_ROLE, msg.sender);
        _setupRole(VERIFIER_ROLE, msg.sender);
        _setupRole(UPDATER_ROLE, msg.sender);
        
        // Start from token ID 1
        _tokenIdCounter.increment();
        
        // Set default royalty to 2.5%
        _defaultRoyaltyBps = 250;
        
        // Set default royalty receiver to contract owner
        _setDefaultRoyalty(msg.sender, _defaultRoyaltyBps);
    }
    
    /**
     * @dev Mint a new waste certificate NFT
     */
    function mintCertificate(
        address to,
        string memory wasteOrigin,
        string memory processingMethod,
        uint256 carbonCredits,
        uint256 recyclingEfficiency,
        uint256 environmentalImpact,
        string memory ipfsHash,
        string memory digitalTwinId
    ) public whenNotPaused onlyRole(PROCESSOR_ROLE) returns (uint256) {
        // Check if digital twin ID is already linked to a token
        if (bytes(digitalTwinId).length > 0) {
            require(
                digitalTwinToToken[digitalTwinId] == 0,
                "Digital twin already linked to a certificate"
            );
        }
        
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, ipfsHash);
        
        certificates[tokenId] = WasteCertificate({
            wasteOrigin: wasteOrigin,
            processingMethod: processingMethod,
            carbonCredits: carbonCredits,
            recyclingEfficiency: recyclingEfficiency,
            environmentalImpact: environmentalImpact,
            processingTimestamp: block.timestamp,
            ipfsHash: ipfsHash,
            isVerified: false,
            processor: msg.sender,
            digitalTwinId: digitalTwinId,
            lastUpdated: block.timestamp
        });
        
        // Link digital twin if provided
        if (bytes(digitalTwinId).length > 0) {
            digitalTwinToToken[digitalTwinId] = tokenId;
        }
        
        emit CertificateMinted(tokenId, to, wasteOrigin, ipfsHash, digitalTwinId);
        
        return tokenId;
    }
    
    /**
     * @dev Batch mint multiple certificates
     */
    function batchMintCertificates(
        address[] memory recipients,
        string[] memory wasteOrigins,
        string[] memory processingMethods,
        uint256[] memory carbonCredits,
        uint256[] memory recyclingEfficiencies,
        uint256[] memory environmentalImpacts,
        string[] memory ipfsHashes,
        string[] memory digitalTwinIds
    ) public whenNotPaused onlyRole(PROCESSOR_ROLE) returns (uint256[] memory) {
        require(
            recipients.length == wasteOrigins.length &&
            wasteOrigins.length == processingMethods.length &&
            processingMethods.length == carbonCredits.length &&
            carbonCredits.length == recyclingEfficiencies.length &&
            recyclingEfficiencies.length == environmentalImpacts.length &&
            environmentalImpacts.length == ipfsHashes.length &&
            ipfsHashes.length == digitalTwinIds.length,
            "Array lengths must match"
        );
        
        uint256[] memory tokenIds = new uint256[](recipients.length);
        
        for (uint256 i = 0; i < recipients.length; i++) {
            tokenIds[i] = mintCertificate(
                recipients[i],
                wasteOrigins[i],
                processingMethods[i],
                carbonCredits[i],
                recyclingEfficiencies[i],
                environmentalImpacts[i],
                ipfsHashes[i],
                digitalTwinIds[i]
            );
        }
        
        return tokenIds;
    }
    
    /**
     * @dev Update certificate metadata
     */
    function updateCertificate(
        uint256 tokenId,
        uint256 newCarbonCredits,
        uint256 newRecyclingEfficiency,
        uint256 newEnvironmentalImpact,
        string memory newIpfsHash
    ) public whenNotPaused {
        require(_exists(tokenId), "Certificate does not exist");
        require(
            certificates[tokenId].processor == msg.sender || 
            hasRole(UPDATER_ROLE, msg.sender) || 
            msg.sender == owner(),
            "Not authorized to update this certificate"
        );
        
        WasteCertificate storage cert = certificates[tokenId];
        cert.carbonCredits = newCarbonCredits;
        cert.recyclingEfficiency = newRecyclingEfficiency;
        cert.environmentalImpact = newEnvironmentalImpact;
        cert.ipfsHash = newIpfsHash;
        cert.lastUpdated = block.timestamp;
        
        _setTokenURI(tokenId, newIpfsHash);
        
        emit CertificateUpdated(tokenId, newIpfsHash, newCarbonCredits, block.timestamp);
    }
    
    /**
     * @dev Batch update multiple certificates for efficient blockchain transaction management
     */
    function batchUpdateCertificates(
        uint256[] memory tokenIds,
        uint256[] memory carbonCredits,
        uint256[] memory recyclingEfficiencies,
        uint256[] memory environmentalImpacts,
        string[] memory ipfsHashes
    ) public whenNotPaused {
        require(
            tokenIds.length == carbonCredits.length &&
            carbonCredits.length == recyclingEfficiencies.length &&
            recyclingEfficiencies.length == environmentalImpacts.length &&
            environmentalImpacts.length == ipfsHashes.length,
            "Array lengths must match"
        );
        
        require(tokenIds.length > 0, "No certificates to update");
        require(tokenIds.length <= 50, "Batch size too large"); // Limit batch size for gas efficiency
        
        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            
            require(_exists(tokenId), "Certificate does not exist");
            require(
                certificates[tokenId].processor == msg.sender || 
                hasRole(UPDATER_ROLE, msg.sender) || 
                msg.sender == owner(),
                "Not authorized to update this certificate"
            );
            
            WasteCertificate storage cert = certificates[tokenId];
            cert.carbonCredits = carbonCredits[i];
            cert.recyclingEfficiency = recyclingEfficiencies[i];
            cert.environmentalImpact = environmentalImpacts[i];
            cert.ipfsHash = ipfsHashes[i];
            cert.lastUpdated = block.timestamp;
            
            _setTokenURI(tokenId, ipfsHashes[i]);
            
            emit CertificateUpdated(tokenId, ipfsHashes[i], carbonCredits[i], block.timestamp);
        }
    }
    
    /**
     * @dev Add a processing stage to a certificate (stores in IPFS)
     */
    function addProcessingStage(
        uint256 tokenId,
        string memory stageName,
        string memory stageType,
        string memory dataHash
    ) public whenNotPaused {
        require(_exists(tokenId), "Certificate does not exist");
        require(
            certificates[tokenId].processor == msg.sender || 
            hasRole(UPDATER_ROLE, msg.sender) || 
            msg.sender == owner(),
            "Not authorized to update this certificate"
        );
        
        WasteCertificate storage cert = certificates[tokenId];
        cert.lastUpdated = block.timestamp;
        
        emit ProcessingStageAdded(tokenId, stageName, stageType, block.timestamp);
    }
    
    /**
     * @dev Verify a certificate
     */
    function verifyCertificate(uint256 tokenId) public whenNotPaused onlyRole(VERIFIER_ROLE) {
        require(_exists(tokenId), "Certificate does not exist");
        certificates[tokenId].isVerified = true;
        
        emit CertificateVerified(tokenId, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Link a digital twin to a certificate
     */
    function linkDigitalTwin(uint256 tokenId, string memory digitalTwinId) public whenNotPaused {
        require(_exists(tokenId), "Certificate does not exist");
        require(
            certificates[tokenId].processor == msg.sender || 
            hasRole(UPDATER_ROLE, msg.sender) || 
            msg.sender == owner(),
            "Not authorized to update this certificate"
        );
        require(bytes(digitalTwinId).length > 0, "Digital twin ID cannot be empty");
        require(
            digitalTwinToToken[digitalTwinId] == 0 || digitalTwinToToken[digitalTwinId] == tokenId,
            "Digital twin already linked to another certificate"
        );
        
        // Update old mapping if there was a previous digital twin
        string memory oldTwinId = certificates[tokenId].digitalTwinId;
        if (bytes(oldTwinId).length > 0) {
            digitalTwinToToken[oldTwinId] = 0;
        }
        
        // Update certificate with new digital twin ID
        certificates[tokenId].digitalTwinId = digitalTwinId;
        digitalTwinToToken[digitalTwinId] = tokenId;
        
        emit DigitalTwinLinked(tokenId, digitalTwinId);
    }
    
    /**
     * @dev Get certificate details
     */
    function getCertificate(uint256 tokenId) 
        public 
        view 
        returns (WasteCertificate memory) 
    {
        require(_exists(tokenId), "Certificate does not exist");
        return certificates[tokenId];
    }
    
    /**
     * @dev Get certificate by digital twin ID
     */
    function getCertificateByDigitalTwin(string memory digitalTwinId)
        public
        view
        returns (uint256, WasteCertificate memory)
    {
        uint256 tokenId = digitalTwinToToken[digitalTwinId];
        require(tokenId != 0, "No certificate linked to this digital twin");
        require(_exists(tokenId), "Certificate does not exist");
        
        return (tokenId, certificates[tokenId]);
    }
    
    /**
     * @dev Get processing stages for a certificate (stored in IPFS)
     */
    function getProcessingStages(uint256 tokenId)
        public
        view
        returns (string memory)
    {
        require(_exists(tokenId), "Certificate does not exist");
        return certificates[tokenId].ipfsHash; // Processing stages stored in IPFS metadata
    }
    
    /**
     * @dev Check if certificate is authentic and verified
     */
    function isAuthentic(uint256 tokenId) public view returns (bool) {
        if (!_exists(tokenId)) {
            return false;
        }
        
        WasteCertificate memory cert = certificates[tokenId];
        return cert.isVerified && 
               hasRole(PROCESSOR_ROLE, cert.processor) && 
               cert.processingTimestamp > 0;
    }
    
    /**
     * @dev Get total number of certificates minted
     */
    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter.current() - 1;
    }
    
    /**
     * @dev Set default royalty for all tokens
     */
    function setDefaultRoyalty(address receiver, uint96 feeNumerator) public onlyOwner {
        _setDefaultRoyalty(receiver, feeNumerator);
        _defaultRoyaltyBps = feeNumerator;
    }
    
    /**
     * @dev Set token-specific royalty
     */
    function setTokenRoyalty(
        uint256 tokenId,
        address receiver,
        uint96 feeNumerator
    ) public onlyOwner {
        require(_exists(tokenId), "Certificate does not exist");
        _setTokenRoyalty(tokenId, receiver, feeNumerator);
    }
    
    /**
     * @dev Pause contract functionality
     */
    function pause() public onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause contract functionality
     */
    function unpause() public onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Override required functions
     */
    function _burn(uint256 tokenId) 
        internal 
        override(ERC721Upgradeable, ERC721URIStorageUpgradeable, ERC721RoyaltyUpgradeable) 
    {
        super._burn(tokenId);
        
        // Clear digital twin mapping if exists
        string memory twinId = certificates[tokenId].digitalTwinId;
        if (bytes(twinId).length > 0) {
            digitalTwinToToken[twinId] = 0;
        }
    }
    
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721Upgradeable, ERC721URIStorageUpgradeable)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Upgradeable, ERC721URIStorageUpgradeable, ERC721RoyaltyUpgradeable, AccessControlUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}