// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";

/**
 * @title WasteCertificateNFT
 * @dev NFT contract for waste processing certificates with dynamic metadata
 */
contract WasteCertificateNFT is 
    Initializable,
    ERC721Upgradeable,
    ERC721URIStorageUpgradeable,
    OwnableUpgradeable
{
    using CountersUpgradeable for CountersUpgradeable.Counter;
    
    CountersUpgradeable.Counter private _tokenIdCounter;
    
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
    }
    
    // Mapping from token ID to certificate data
    mapping(uint256 => WasteCertificate) public certificates;
    
    // Mapping to track authorized processors
    mapping(address => bool) public authorizedProcessors;
    
    // Events
    event CertificateMinted(
        uint256 indexed tokenId,
        address indexed recipient,
        string wasteOrigin,
        string ipfsHash
    );
    
    event CertificateUpdated(
        uint256 indexed tokenId,
        string newIpfsHash,
        uint256 carbonCredits
    );
    
    event ProcessorAuthorized(address indexed processor);
    event ProcessorRevoked(address indexed processor);
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    function initialize(
        string memory name,
        string memory symbol
    ) public initializer {
        __ERC721_init(name, symbol);
        __ERC721URIStorage_init();
        __Ownable_init();
        _tokenIdCounter.increment(); // Start from token ID 1
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
        string memory ipfsHash
    ) public returns (uint256) {
        require(
            authorizedProcessors[msg.sender] || msg.sender == owner(),
            "Not authorized to mint certificates"
        );
        
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
            processor: msg.sender
        });
        
        emit CertificateMinted(tokenId, to, wasteOrigin, ipfsHash);
        
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
        string[] memory ipfsHashes
    ) public returns (uint256[] memory) {
        require(
            authorizedProcessors[msg.sender] || msg.sender == owner(),
            "Not authorized to mint certificates"
        );
        
        require(
            recipients.length == wasteOrigins.length &&
            wasteOrigins.length == processingMethods.length &&
            processingMethods.length == carbonCredits.length &&
            carbonCredits.length == recyclingEfficiencies.length &&
            recyclingEfficiencies.length == environmentalImpacts.length &&
            environmentalImpacts.length == ipfsHashes.length,
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
                ipfsHashes[i]
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
    ) public {
        require(_exists(tokenId), "Certificate does not exist");
        require(
            certificates[tokenId].processor == msg.sender || msg.sender == owner(),
            "Not authorized to update this certificate"
        );
        
        WasteCertificate storage cert = certificates[tokenId];
        cert.carbonCredits = newCarbonCredits;
        cert.recyclingEfficiency = newRecyclingEfficiency;
        cert.environmentalImpact = newEnvironmentalImpact;
        cert.ipfsHash = newIpfsHash;
        
        _setTokenURI(tokenId, newIpfsHash);
        
        emit CertificateUpdated(tokenId, newIpfsHash, newCarbonCredits);
    }
    
    /**
     * @dev Verify a certificate
     */
    function verifyCertificate(uint256 tokenId) public onlyOwner {
        require(_exists(tokenId), "Certificate does not exist");
        certificates[tokenId].isVerified = true;
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
     * @dev Authorize a processor to mint certificates
     */
    function authorizeProcessor(address processor) public onlyOwner {
        authorizedProcessors[processor] = true;
        emit ProcessorAuthorized(processor);
    }
    
    /**
     * @dev Revoke processor authorization
     */
    function revokeProcessor(address processor) public onlyOwner {
        authorizedProcessors[processor] = false;
        emit ProcessorRevoked(processor);
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
               authorizedProcessors[cert.processor] && 
               cert.processingTimestamp > 0;
    }
    
    /**
     * @dev Get total number of certificates minted
     */
    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter.current() - 1;
    }
    
    // Override required functions
    function _burn(uint256 tokenId) 
        internal 
        override(ERC721Upgradeable, ERC721URIStorageUpgradeable) 
    {
        super._burn(tokenId);
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
        override(ERC721Upgradeable, ERC721URIStorageUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}