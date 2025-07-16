// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./WasteCertificateNFT.sol";

/**
 * @title WasteCertificateFactory
 * @dev Factory contract for creating and managing waste certificate NFT contracts
 */
contract WasteCertificateFactory is Ownable {
    using Clones for address;
    
    address public immutable certificateImplementation;
    
    // Mapping from facility ID to certificate contract address
    mapping(string => address) public facilityContracts;
    
    // Array of all deployed contracts
    address[] public deployedContracts;
    
    // Events
    event CertificateContractDeployed(
        string indexed facilityId,
        address indexed contractAddress,
        string name,
        string symbol
    );
    
    constructor() {
        certificateImplementation = address(new WasteCertificateNFT());
    }
    
    /**
     * @dev Deploy a new certificate contract for a facility
     */
    function deployCertificateContract(
        string memory facilityId,
        string memory name,
        string memory symbol
    ) public onlyOwner returns (address) {
        require(
            facilityContracts[facilityId] == address(0),
            "Contract already exists for this facility"
        );
        
        address clone = certificateImplementation.clone();
        WasteCertificateNFT(clone).initialize(name, symbol);
        
        facilityContracts[facilityId] = clone;
        deployedContracts.push(clone);
        
        emit CertificateContractDeployed(facilityId, clone, name, symbol);
        
        return clone;
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
}