// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./QuadraticVotingDAO.sol";

/**
 * @title GasOptimizedVotingInterface
 * @dev Gas-optimized interface for proposal submission and voting
 * with batched operations and meta-transactions
 */
contract GasOptimizedVotingInterface is AccessControl, ReentrancyGuard {
    using ECDSA for bytes32;
    
    // Role definitions
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    
    // Domain separator for EIP-712 signatures
    bytes32 public immutable DOMAIN_SEPARATOR;
    
    // EIP-712 type hashes
    bytes32 public constant VOTE_TYPEHASH = keccak256(
        "Vote(uint256 proposalId,uint8 support,uint256 tokenAmount,address voter,uint256 nonce)"
    );
    
    // Reference to the DAO contract
    QuadraticVotingDAO public dao;
    
    // Nonce tracking for meta-transactions
    mapping(address => uint256) public nonces;
    
    // Events
    event BatchVoteSubmitted(
        address indexed submitter,
        uint256 proposalId,
        uint256 voteCount
    );
    
    event MetaTransactionProcessed(
        address indexed signer,
        address indexed relayer,
        bytes4 functionSignature
    );
    
    /**
     * @dev Constructor
     * @param _dao Address of the DAO contract
     */
    constructor(address _dao) {
        dao = QuadraticVotingDAO(_dao);
        
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(OPERATOR_ROLE, msg.sender);
        
        // Initialize domain separator for EIP-712
        uint256 chainId;
        assembly {
            chainId := chainid()
        }
        
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes("GasOptimizedVotingInterface")),
                keccak256(bytes("1")),
                chainId,
                address(this)
            )
        );
    }
    
    /**
     * @dev Submit multiple votes in a single transaction to save gas
     * @param proposalId ID of the proposal
     * @param voters Array of voter addresses
     * @param voteTypes Array of vote types
     * @param tokenAmounts Array of token amounts
     */
    function batchVote(
        uint256 proposalId,
        address[] calldata voters,
        QuadraticVotingDAO.VoteType[] calldata voteTypes,
        uint256[] calldata tokenAmounts
    ) external onlyRole(OPERATOR_ROLE) nonReentrant {
        require(
            voters.length == voteTypes.length && 
            voteTypes.length == tokenAmounts.length,
            "Array lengths must match"
        );
        
        for (uint256 i = 0; i < voters.length; i++) {
            // Delegate call to DAO contract
            (bool success, ) = address(dao).delegatecall(
                abi.encodeWithSelector(
                    dao.castVote.selector,
                    proposalId,
                    voteTypes[i],
                    tokenAmounts[i]
                )
            );
            
            require(success, "Vote delegation failed");
        }
        
        emit BatchVoteSubmitted(msg.sender, proposalId, voters.length);
    }
    
    /**
     * @dev Submit a vote via meta-transaction (gasless voting)
     * @param proposalId ID of the proposal
     * @param support Vote type
     * @param tokenAmount Amount of tokens to use
     * @param voter Address of the voter
     * @param signature EIP-712 signature
     */
    function metaVote(
        uint256 proposalId,
        QuadraticVotingDAO.VoteType support,
        uint256 tokenAmount,
        address voter,
        bytes memory signature
    ) external nonReentrant {
        // Verify signature
        uint256 nonce = nonces[voter];
        bytes32 structHash = keccak256(
            abi.encode(
                VOTE_TYPEHASH,
                proposalId,
                uint8(support),
                tokenAmount,
                voter,
                nonce
            )
        );
        
        bytes32 hash = keccak256(
            abi.encodePacked(
                "\x19\x01",
                DOMAIN_SEPARATOR,
                structHash
            )
        );
        
        address signer = hash.recover(signature);
        require(signer == voter, "Invalid signature");
        
        // Increment nonce
        nonces[voter]++;
        
        // Execute vote on behalf of signer
        dao.castVote(proposalId, support, tokenAmount);
        
        emit MetaTransactionProcessed(
            voter,
            msg.sender,
            dao.castVote.selector
        );
    }
    
    /**
     * @dev Get the current nonce for an address
     * @param voter Address to check
     */
    function getNonce(address voter) external view returns (uint256) {
        return nonces[voter];
    }
    
    /**
     * @dev Set the DAO contract address (only admin)
     * @param _dao New DAO contract address
     */
    function setDAOContract(address _dao) external onlyRole(DEFAULT_ADMIN_ROLE) {
        dao = QuadraticVotingDAO(_dao);
    }
    
    /**
     * @dev Grant operator role to an address
     * @param account Address to grant role to
     */
    function grantOperatorRole(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(OPERATOR_ROLE, account);
    }
    
    /**
     * @dev Revoke operator role from an address
     * @param account Address to revoke role from
     */
    function revokeOperatorRole(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        revokeRole(OPERATOR_ROLE, account);
    }
}