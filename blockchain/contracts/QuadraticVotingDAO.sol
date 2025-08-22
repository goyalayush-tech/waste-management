// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "./interfaces/IAutomatedProposalExecutor.sol";

/**
 * @title QuadraticVotingDAO
 * @dev DAO contract implementing quadratic voting to prevent whale dominance
 * and ensure fair representation in the waste management ecosystem
 */
contract QuadraticVotingDAO is 
    Initializable, 
    AccessControlUpgradeable, 
    PausableUpgradeable,
    ReentrancyGuardUpgradeable
{
    using SafeMathUpgradeable for uint256;
    using SafeERC20Upgradeable for IERC20Upgradeable;
    using CountersUpgradeable for CountersUpgradeable.Counter;

    // Role definitions
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant PROPOSER_ROLE = keccak256("PROPOSER_ROLE");

    // Governance token
    IERC20Upgradeable public governanceToken;
    
    // Proposal counter
    CountersUpgradeable.Counter private _proposalIdCounter;
    
    // Proposal status enum
    enum ProposalStatus {
        Active,
        Passed,
        Failed,
        Executed,
        Canceled
    }
    
    // Proposal struct
    struct Proposal {
        uint256 id;
        address proposer;
        string title;
        string description;
        bytes executionData;
        address targetContract;
        uint256 createdAt;
        uint256 votingEndsAt;
        uint256 minimumQuorum;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        ProposalStatus status;
        mapping(address => Vote) votes;
        bool executed;
    }
    
    // Vote struct
    struct Vote {
        uint256 power;
        bool support;
        bool hasVoted;
        uint256 tokensUsed;
    }
    
    // Vote type enum
    enum VoteType {
        For,
        Against,
        Abstain
    }
    
    // Proposal details for external view
    struct ProposalView {
        uint256 id;
        address proposer;
        string title;
        string description;
        bytes executionData;
        address targetContract;
        uint256 createdAt;
        uint256 votingEndsAt;
        uint256 minimumQuorum;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        ProposalStatus status;
        bool executed;
    }
    
    // Mapping from proposal ID to proposal
    mapping(uint256 => Proposal) public proposals;
    
    // Voting configuration
    uint256 public votingPeriod; // in seconds
    uint256 public proposalThreshold; // minimum tokens required to create a proposal
    uint256 public minQuorumPercent; // minimum participation required as percentage of total supply
    
    // Participation tracking
    mapping(address => uint256) public lastProposalCreated;
    mapping(address => uint256) public participationScore; // tracks user participation
    
    // Events
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        string title,
        uint256 votingEndsAt
    );
    
    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        VoteType support,
        uint256 votePower,
        uint256 tokensUsed
    );
    
    event ProposalExecuted(
        uint256 indexed proposalId,
        address executor,
        bool success
    );
    
    event ProposalCanceled(
        uint256 indexed proposalId,
        address canceler
    );
    
    event VotingConfigUpdated(
        uint256 votingPeriod,
        uint256 proposalThreshold,
        uint256 minQuorumPercent
    );
    
    /**
     * @dev Initialize the contract
     */
    function initialize(
        address _governanceToken,
        uint256 _votingPeriod,
        uint256 _proposalThreshold,
        uint256 _minQuorumPercent
    ) public initializer {
        __AccessControl_init();
        __Pausable_init();
        __ReentrancyGuard_init();
        
        // Setup roles
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(ADMIN_ROLE, msg.sender);
        _setupRole(PROPOSER_ROLE, msg.sender);
        
        // Set governance token
        governanceToken = IERC20Upgradeable(_governanceToken);
        
        // Set voting configuration
        votingPeriod = _votingPeriod;
        proposalThreshold = _proposalThreshold;
        minQuorumPercent = _minQuorumPercent;
        
        // Start from proposal ID 1
        _proposalIdCounter.increment();
    }
    
    /**
     * @dev Create a new proposal
     * @param title Proposal title
     * @param description Proposal description
     * @param executionData ABI-encoded function call to be executed if proposal passes
     * @param targetContract Address of contract to call if proposal passes
     */
    function createProposal(
        string memory title,
        string memory description,
        bytes memory executionData,
        address targetContract
    ) public whenNotPaused nonReentrant returns (uint256) {
        // Check if sender has enough tokens to create a proposal
        uint256 balance = governanceToken.balanceOf(msg.sender);
        require(balance >= proposalThreshold, "Insufficient tokens to create proposal");
        
        // Check if sender has the proposer role or enough tokens
        require(
            hasRole(PROPOSER_ROLE, msg.sender) || balance >= proposalThreshold,
            "Not authorized to create proposal"
        );
        
        // Rate limit proposals to prevent spam
        require(
            block.timestamp > lastProposalCreated[msg.sender] + 1 days,
            "Can only create one proposal per day"
        );
        
        // Get proposal ID
        uint256 proposalId = _proposalIdCounter.current();
        _proposalIdCounter.increment();
        
        // Calculate minimum quorum
        uint256 totalSupply = governanceToken.totalSupply();
        uint256 minimumQuorum = totalSupply.mul(minQuorumPercent).div(100);
        
        // Create proposal
        Proposal storage proposal = proposals[proposalId];
        proposal.id = proposalId;
        proposal.proposer = msg.sender;
        proposal.title = title;
        proposal.description = description;
        proposal.executionData = executionData;
        proposal.targetContract = targetContract;
        proposal.createdAt = block.timestamp;
        proposal.votingEndsAt = block.timestamp + votingPeriod;
        proposal.minimumQuorum = minimumQuorum;
        proposal.status = ProposalStatus.Active;
        
        // Update last proposal created timestamp
        lastProposalCreated[msg.sender] = block.timestamp;
        
        // Increase participation score for creating a proposal
        participationScore[msg.sender] = participationScore[msg.sender].add(10);
        
        emit ProposalCreated(proposalId, msg.sender, title, proposal.votingEndsAt);
        
        return proposalId;
    }
    
    /**
     * @dev Cast a vote on a proposal using quadratic voting
     * @param proposalId ID of the proposal
     * @param support Vote type (For, Against, Abstain)
     * @param tokenAmount Amount of tokens to use for voting
     */
    function castVote(
        uint256 proposalId,
        VoteType support,
        uint256 tokenAmount
    ) public whenNotPaused nonReentrant {
        Proposal storage proposal = proposals[proposalId];
        
        // Check if proposal exists and is active
        require(proposal.createdAt > 0, "Proposal does not exist");
        require(proposal.status == ProposalStatus.Active, "Proposal not active");
        require(block.timestamp < proposal.votingEndsAt, "Voting period ended");
        
        // Check if voter has already voted
        require(!proposal.votes[msg.sender].hasVoted, "Already voted");
        
        // Check if voter has enough tokens
        uint256 balance = governanceToken.balanceOf(msg.sender);
        require(balance >= tokenAmount, "Insufficient token balance");
        require(tokenAmount > 0, "Must use at least 1 token");
        
        // Calculate quadratic voting power: sqrt(tokenAmount)
        uint256 votePower = sqrt(tokenAmount);
        
        // Lock tokens for voting
        governanceToken.safeTransferFrom(msg.sender, address(this), tokenAmount);
        
        // Record vote
        proposal.votes[msg.sender] = Vote({
            power: votePower,
            support: support == VoteType.For,
            hasVoted: true,
            tokensUsed: tokenAmount
        });
        
        // Update vote counts
        if (support == VoteType.For) {
            proposal.forVotes = proposal.forVotes.add(votePower);
        } else if (support == VoteType.Against) {
            proposal.againstVotes = proposal.againstVotes.add(votePower);
        } else {
            proposal.abstainVotes = proposal.abstainVotes.add(votePower);
        }
        
        // Increase participation score for voting
        participationScore[msg.sender] = participationScore[msg.sender].add(5);
        
        emit VoteCast(proposalId, msg.sender, support, votePower, tokenAmount);
    }
    
    /**
     * @dev Execute a passed proposal
     * @param proposalId ID of the proposal to execute
     */
    function executeProposal(uint256 proposalId) public whenNotPaused nonReentrant {
        Proposal storage proposal = proposals[proposalId];
        
        // Check if proposal exists
        require(proposal.createdAt > 0, "Proposal does not exist");
        
        // Check if proposal can be executed
        require(!proposal.executed, "Proposal already executed");
        require(block.timestamp > proposal.votingEndsAt, "Voting period not ended");
        
        // Calculate total votes
        uint256 totalVotes = proposal.forVotes.add(proposal.againstVotes).add(proposal.abstainVotes);
        
        // Check if quorum reached
        require(totalVotes >= proposal.minimumQuorum, "Quorum not reached");
        
        // Check if proposal passed
        require(proposal.forVotes > proposal.againstVotes, "Proposal did not pass");
        
        // Mark proposal as executed
        proposal.executed = true;
        proposal.status = ProposalStatus.Executed;
        
        // Execute proposal
        (bool success, ) = proposal.targetContract.call(proposal.executionData);
        
        // Update status based on execution result
        if (success) {
            // Return tokens to voters
            _returnVotingTokens(proposalId);
            
            // If the target contract is an AutomatedProposalExecutor, auto-queue the proposal
            if (_isAutomatedExecutor(proposal.targetContract)) {
                try IAutomatedProposalExecutor(proposal.targetContract).autoQueueProposal(proposalId) {
                    // Auto-queuing successful
                } catch {
                    // Auto-queuing failed, but we don't want to revert the whole transaction
                }
            }
        } else {
            proposal.status = ProposalStatus.Failed;
        }
        
        emit ProposalExecuted(proposalId, msg.sender, success);
    }
    
    /**
     * @dev Check if an address is an AutomatedProposalExecutor
     * @param target Address to check
     * @return True if the address is an AutomatedProposalExecutor
     */
    function _isAutomatedExecutor(address target) internal view returns (bool) {
        // Try to call a function that only exists in AutomatedProposalExecutor
        try IAutomatedProposalExecutor(target).systemParameters() returns (
            uint256,
            uint256,
            uint256,
            bool,
            uint256,
            uint256
        ) {
            return true;
        } catch {
            return false;
        }
    }
    
    /**
     * @dev Cancel a proposal (only proposer or admin)
     * @param proposalId ID of the proposal to cancel
     */
    function cancelProposal(uint256 proposalId) public {
        Proposal storage proposal = proposals[proposalId];
        
        // Check if proposal exists
        require(proposal.createdAt > 0, "Proposal does not exist");
        require(proposal.status == ProposalStatus.Active, "Proposal not active");
        
        // Check if caller is proposer or admin
        require(
            proposal.proposer == msg.sender || hasRole(ADMIN_ROLE, msg.sender),
            "Not authorized to cancel"
        );
        
        // Mark proposal as canceled
        proposal.status = ProposalStatus.Canceled;
        
        // Return tokens to voters
        _returnVotingTokens(proposalId);
        
        emit ProposalCanceled(proposalId, msg.sender);
    }
    
    /**
     * @dev Return voting tokens to voters after proposal is executed or canceled
     * @param proposalId ID of the proposal
     */
    function _returnVotingTokens(uint256 proposalId) internal {
        // Implementation would iterate through all voters and return their tokens
        // This is a simplified version that would need to be expanded with proper
        // voter tracking for a production implementation
    }
    
    /**
     * @dev Get proposal details
     * @param proposalId ID of the proposal
     */
    function getProposal(uint256 proposalId) public view returns (ProposalView memory) {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.createdAt > 0, "Proposal does not exist");
        
        return ProposalView({
            id: proposal.id,
            proposer: proposal.proposer,
            title: proposal.title,
            description: proposal.description,
            executionData: proposal.executionData,
            targetContract: proposal.targetContract,
            createdAt: proposal.createdAt,
            votingEndsAt: proposal.votingEndsAt,
            minimumQuorum: proposal.minimumQuorum,
            forVotes: proposal.forVotes,
            againstVotes: proposal.againstVotes,
            abstainVotes: proposal.abstainVotes,
            status: proposal.status,
            executed: proposal.executed
        });
    }
    
    /**
     * @dev Get vote details for a voter on a proposal
     * @param proposalId ID of the proposal
     * @param voter Address of the voter
     */
    function getVote(uint256 proposalId, address voter) public view returns (
        uint256 power,
        bool support,
        bool hasVoted,
        uint256 tokensUsed
    ) {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.createdAt > 0, "Proposal does not exist");
        
        Vote memory vote = proposal.votes[voter];
        return (vote.power, vote.support, vote.hasVoted, vote.tokensUsed);
    }
    
    /**
     * @dev Update voting configuration (only admin)
     * @param _votingPeriod New voting period in seconds
     * @param _proposalThreshold New proposal threshold
     * @param _minQuorumPercent New minimum quorum percentage
     */
    function updateVotingConfig(
        uint256 _votingPeriod,
        uint256 _proposalThreshold,
        uint256 _minQuorumPercent
    ) public onlyRole(ADMIN_ROLE) {
        require(_votingPeriod >= 1 days, "Voting period too short");
        require(_minQuorumPercent > 0 && _minQuorumPercent <= 100, "Invalid quorum percentage");
        
        votingPeriod = _votingPeriod;
        proposalThreshold = _proposalThreshold;
        minQuorumPercent = _minQuorumPercent;
        
        emit VotingConfigUpdated(_votingPeriod, _proposalThreshold, _minQuorumPercent);
    }
    
    /**
     * @dev Grant proposer role to an address (only admin)
     * @param account Address to grant role to
     */
    function grantProposerRole(address account) public onlyRole(ADMIN_ROLE) {
        grantRole(PROPOSER_ROLE, account);
    }
    
    /**
     * @dev Revoke proposer role from an address (only admin)
     * @param account Address to revoke role from
     */
    function revokeProposerRole(address account) public onlyRole(ADMIN_ROLE) {
        revokeRole(PROPOSER_ROLE, account);
    }
    
    /**
     * @dev Pause contract functionality (only admin)
     */
    function pause() public onlyRole(ADMIN_ROLE) {
        _pause();
    }
    
    /**
     * @dev Unpause contract functionality (only admin)
     */
    function unpause() public onlyRole(ADMIN_ROLE) {
        _unpause();
    }
    
    /**
     * @dev Calculate square root of a number (Babylonian method)
     * @param x Number to calculate square root of
     */
    function sqrt(uint256 x) internal pure returns (uint256) {
        if (x == 0) return 0;
        
        uint256 z = (x + 1) / 2;
        uint256 y = x;
        
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
        
        return y;
    }
}