// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "./QuadraticVotingDAO.sol";

/**
 * @title AutomatedProposalExecutor
 * @dev Contract for automatically executing proposals that have passed voting
 * and managing system parameter changes and treasury fund allocations
 */
contract AutomatedProposalExecutor is 
    Initializable, 
    AccessControlUpgradeable, 
    PausableUpgradeable,
    ReentrancyGuardUpgradeable
{
    // Role definitions
    bytes32 public constant EXECUTOR_ROLE = keccak256("EXECUTOR_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    // Reference to the DAO contract
    QuadraticVotingDAO public dao;
    
    // System parameters that can be updated via proposals
    struct SystemParameters {
        uint256 votingPeriod;
        uint256 proposalThreshold;
        uint256 minQuorumPercent;
        bool autoExecutionEnabled;
        uint256 executionDelay;
        uint256 maxGasForExecution;
    }
    
    // Current system parameters
    SystemParameters public systemParameters;
    
    // Treasury allocation record
    struct TreasuryAllocation {
        uint256 proposalId;
        address recipient;
        uint256 amount;
        string purpose;
        bool executed;
        uint256 executedAt;
    }
    
    // Mapping from proposal ID to treasury allocation
    mapping(uint256 => TreasuryAllocation) public treasuryAllocations;
    
    // Array to track all treasury allocations
    uint256[] public treasuryAllocationIds;
    
    // Execution queue for passed proposals
    struct ExecutionQueueItem {
        uint256 proposalId;
        uint256 scheduledExecutionTime;
        bool executed;
    }
    
    // Queue of proposals pending execution
    ExecutionQueueItem[] public executionQueue;
    
    // Mapping from proposal ID to queue index (add 1 to handle 0 index)
    mapping(uint256 => uint256) public proposalToQueueIndex;
    
    // Events
    event ProposalQueued(
        uint256 indexed proposalId,
        uint256 scheduledExecutionTime
    );
    
    event ProposalExecuted(
        uint256 indexed proposalId,
        bool success,
        bytes result
    );
    
    event ProposalAutoQueued(
        uint256 indexed proposalId,
        uint256 scheduledExecutionTime
    );
    
    event SystemParametersUpdated(
        uint256 votingPeriod,
        uint256 proposalThreshold,
        uint256 minQuorumPercent,
        bool autoExecutionEnabled,
        uint256 executionDelay,
        uint256 maxGasForExecution
    );
    
    event TreasuryAllocationCreated(
        uint256 indexed proposalId,
        address recipient,
        uint256 amount,
        string purpose
    );
    
    event TreasuryAllocationExecuted(
        uint256 indexed proposalId,
        address recipient,
        uint256 amount,
        bool success
    );
    
    event AutoExecutionToggled(
        bool enabled
    );
    
    event TreasuryAllocationScheduled(
        uint256 indexed proposalId,
        uint256 scheduledExecutionTime
    );
    
    /**
     * @dev Initialize the contract
     */
    function initialize(
        address _dao,
        uint256 _executionDelay,
        uint256 _maxGasForExecution
    ) public initializer {
        __AccessControl_init();
        __Pausable_init();
        __ReentrancyGuard_init();
        
        // Setup roles
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(ADMIN_ROLE, msg.sender);
        _setupRole(EXECUTOR_ROLE, msg.sender);
        
        // Set DAO contract
        dao = QuadraticVotingDAO(_dao);
        
        // Initialize system parameters
        systemParameters = SystemParameters({
            votingPeriod: dao.votingPeriod(),
            proposalThreshold: dao.proposalThreshold(),
            minQuorumPercent: dao.minQuorumPercent(),
            autoExecutionEnabled: true,
            executionDelay: _executionDelay,
            maxGasForExecution: _maxGasForExecution
        });
    }
    
    /**
     * @dev Toggle auto-execution functionality (only admin)
     * @param enabled Whether auto-execution should be enabled
     */
    function toggleAutoExecution(bool enabled) public onlyRole(ADMIN_ROLE) {
        systemParameters.autoExecutionEnabled = enabled;
        emit AutoExecutionToggled(enabled);
    }
    
    /**
     * @dev Queue a proposal for execution after it has passed
     * @param proposalId ID of the proposal to queue
     */
    function queueProposal(uint256 proposalId) public whenNotPaused {
        // Get proposal details
        QuadraticVotingDAO.ProposalView memory proposal = dao.getProposal(proposalId);
        
        // Check if proposal exists and has passed but not executed
        require(proposal.createdAt > 0, "Proposal does not exist");
        require(block.timestamp > proposal.votingEndsAt, "Voting period not ended");
        require(!proposal.executed, "Proposal already executed");
        require(proposal.status == QuadraticVotingDAO.ProposalStatus.Passed, "Proposal not passed");
        
        // Check if proposal is already queued
        require(proposalToQueueIndex[proposalId] == 0, "Proposal already queued");
        
        // Calculate scheduled execution time
        uint256 scheduledExecutionTime = block.timestamp + systemParameters.executionDelay;
        
        // Add to execution queue
        executionQueue.push(ExecutionQueueItem({
            proposalId: proposalId,
            scheduledExecutionTime: scheduledExecutionTime,
            executed: false
        }));
        
        // Store queue index
        proposalToQueueIndex[proposalId] = executionQueue.length;
        
        emit ProposalQueued(proposalId, scheduledExecutionTime);
    }
    
    /**
     * @dev Auto-queue a proposal for execution after it has been executed in the DAO
     * This function should be called by the DAO after a proposal is executed
     * @param proposalId ID of the proposal to auto-queue
     */
    function autoQueueProposal(uint256 proposalId) public whenNotPaused {
        // Only allow calls from the DAO contract or admin
        require(
            msg.sender == address(dao) || hasRole(ADMIN_ROLE, msg.sender) || hasRole(EXECUTOR_ROLE, msg.sender),
            "Not authorized"
        );
        
        // Check if auto-execution is enabled
        require(systemParameters.autoExecutionEnabled, "Auto execution disabled");
        
        // Check if proposal is already queued
        require(proposalToQueueIndex[proposalId] == 0, "Proposal already queued");
        
        // Get proposal details
        QuadraticVotingDAO.ProposalView memory proposal = dao.getProposal(proposalId);
        
        // Check if proposal exists and has been executed in the DAO
        require(proposal.createdAt > 0, "Proposal does not exist");
        require(proposal.executed, "Proposal not executed in DAO");
        
        // Calculate scheduled execution time
        uint256 scheduledExecutionTime = block.timestamp + systemParameters.executionDelay;
        
        // Add to execution queue
        executionQueue.push(ExecutionQueueItem({
            proposalId: proposalId,
            scheduledExecutionTime: scheduledExecutionTime,
            executed: false
        }));
        
        // Store queue index
        proposalToQueueIndex[proposalId] = executionQueue.length;
        
        emit ProposalAutoQueued(proposalId, scheduledExecutionTime);
    }
    
    /**
     * @dev Execute a queued proposal
     * @param queueIndex Index of the proposal in the execution queue
     */
    function executeProposal(uint256 queueIndex) public whenNotPaused nonReentrant {
        require(queueIndex < executionQueue.length, "Invalid queue index");
        
        ExecutionQueueItem storage queueItem = executionQueue[queueIndex];
        require(!queueItem.executed, "Proposal already executed");
        require(block.timestamp >= queueItem.scheduledExecutionTime, "Execution delay not passed");
        
        // Mark as executed
        queueItem.executed = true;
        
        // Get proposal details
        QuadraticVotingDAO.ProposalView memory proposal = dao.getProposal(queueItem.proposalId);
        
        // Execute the proposal
        (bool success, bytes memory result) = proposal.targetContract.call{
            gas: systemParameters.maxGasForExecution
        }(proposal.executionData);
        
        emit ProposalExecuted(queueItem.proposalId, success, result);
        
        // If this is a system parameter update, process it
        if (success && proposal.targetContract == address(this)) {
            // The execution data might be a call to updateSystemParameters or createTreasuryAllocation
            // The actual processing happens in those functions
        }
    }
    
    /**
     * @dev Process all executable proposals in the queue
     * @param maxProposalsToProcess Maximum number of proposals to process in one call
     */
    function processQueue(uint256 maxProposalsToProcess) public whenNotPaused nonReentrant {
        require(systemParameters.autoExecutionEnabled, "Auto execution disabled");
        require(maxProposalsToProcess > 0, "Must process at least one proposal");
        
        uint256 processed = 0;
        
        for (uint256 i = 0; i < executionQueue.length && processed < maxProposalsToProcess; i++) {
            ExecutionQueueItem storage queueItem = executionQueue[i];
            
            if (!queueItem.executed && block.timestamp >= queueItem.scheduledExecutionTime) {
                // Mark as executed
                queueItem.executed = true;
                
                // Get proposal details
                QuadraticVotingDAO.ProposalView memory proposal = dao.getProposal(queueItem.proposalId);
                
                // Execute the proposal
                (bool success, bytes memory result) = proposal.targetContract.call{
                    gas: systemParameters.maxGasForExecution
                }(proposal.executionData);
                
                emit ProposalExecuted(queueItem.proposalId, success, result);
                
                processed++;
            }
        }
    }
    
    /**
     * @dev Update system parameters (can be called via proposal execution)
     * @param _votingPeriod New voting period
     * @param _proposalThreshold New proposal threshold
     * @param _minQuorumPercent New minimum quorum percentage
     * @param _autoExecutionEnabled Whether auto execution is enabled
     * @param _executionDelay New execution delay
     * @param _maxGasForExecution New maximum gas for execution
     */
    function updateSystemParameters(
        uint256 _votingPeriod,
        uint256 _proposalThreshold,
        uint256 _minQuorumPercent,
        bool _autoExecutionEnabled,
        uint256 _executionDelay,
        uint256 _maxGasForExecution
    ) public {
        // Only allow calls from this contract (via proposal execution) or admin
        require(
            msg.sender == address(this) || hasRole(ADMIN_ROLE, msg.sender),
            "Not authorized"
        );
        
        // Update system parameters
        systemParameters = SystemParameters({
            votingPeriod: _votingPeriod,
            proposalThreshold: _proposalThreshold,
            minQuorumPercent: _minQuorumPercent,
            autoExecutionEnabled: _autoExecutionEnabled,
            executionDelay: _executionDelay,
            maxGasForExecution: _maxGasForExecution
        });
        
        // Update DAO parameters if they've changed
        if (_votingPeriod != dao.votingPeriod() || 
            _proposalThreshold != dao.proposalThreshold() || 
            _minQuorumPercent != dao.minQuorumPercent()) {
            
            dao.updateVotingConfig(_votingPeriod, _proposalThreshold, _minQuorumPercent);
        }
        
        emit SystemParametersUpdated(
            _votingPeriod,
            _proposalThreshold,
            _minQuorumPercent,
            _autoExecutionEnabled,
            _executionDelay,
            _maxGasForExecution
        );
    }
    
    /**
     * @dev Create a treasury allocation (can be called via proposal execution)
     * @param proposalId ID of the proposal that created this allocation
     * @param recipient Recipient of the funds
     * @param amount Amount to allocate
     * @param purpose Purpose of the allocation
     */
    function createTreasuryAllocation(
        uint256 proposalId,
        address recipient,
        uint256 amount,
        string memory purpose
    ) public {
        // Only allow calls from this contract (via proposal execution) or admin
        require(
            msg.sender == address(this) || hasRole(ADMIN_ROLE, msg.sender),
            "Not authorized"
        );
        
        // Validate parameters
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Invalid amount");
        
        // Create allocation
        treasuryAllocations[proposalId] = TreasuryAllocation({
            proposalId: proposalId,
            recipient: recipient,
            amount: amount,
            purpose: purpose,
            executed: false,
            executedAt: 0
        });
        
        // Add to list of allocations
        treasuryAllocationIds.push(proposalId);
        
        emit TreasuryAllocationCreated(proposalId, recipient, amount, purpose);
        
        // If auto-execution is enabled, schedule the allocation for execution
        if (systemParameters.autoExecutionEnabled) {
            // Schedule execution after the execution delay
            _scheduleAllocationExecution(proposalId);
        }
    }
    
    /**
     * @dev Schedule a treasury allocation for execution after the execution delay
     * @param proposalId ID of the proposal that created the allocation
     */
    function _scheduleAllocationExecution(uint256 proposalId) internal {
        // This function would typically use a timelock mechanism or add to a queue
        // For simplicity, we'll just emit an event that can be monitored by an off-chain service
        emit TreasuryAllocationScheduled(proposalId, block.timestamp + systemParameters.executionDelay);
    }
    
    /**
     * @dev Execute a treasury allocation
     * @param proposalId ID of the proposal that created the allocation
     */
    function executeTreasuryAllocation(uint256 proposalId) public whenNotPaused nonReentrant {
        // Get allocation
        TreasuryAllocation storage allocation = treasuryAllocations[proposalId];
        
        // Validate allocation
        require(allocation.proposalId == proposalId, "Allocation does not exist");
        require(!allocation.executed, "Allocation already executed");
        
        // Mark as executed
        allocation.executed = true;
        allocation.executedAt = block.timestamp;
        
        // Transfer funds
        (bool success, ) = allocation.recipient.call{value: allocation.amount}("");
        
        emit TreasuryAllocationExecuted(
            proposalId,
            allocation.recipient,
            allocation.amount,
            success
        );
    }
    
    /**
     * @dev Get all pending proposals in the execution queue
     */
    function getPendingProposals() public view returns (ExecutionQueueItem[] memory) {
        uint256 pendingCount = 0;
        
        // Count pending proposals
        for (uint256 i = 0; i < executionQueue.length; i++) {
            if (!executionQueue[i].executed) {
                pendingCount++;
            }
        }
        
        // Create result array
        ExecutionQueueItem[] memory result = new ExecutionQueueItem[](pendingCount);
        
        // Fill result array
        uint256 index = 0;
        for (uint256 i = 0; i < executionQueue.length; i++) {
            if (!executionQueue[i].executed) {
                result[index] = executionQueue[i];
                index++;
            }
        }
        
        return result;
    }
    
    /**
     * @dev Get all treasury allocations
     */
    function getAllTreasuryAllocations() public view returns (TreasuryAllocation[] memory) {
        TreasuryAllocation[] memory result = new TreasuryAllocation[](treasuryAllocationIds.length);
        
        for (uint256 i = 0; i < treasuryAllocationIds.length; i++) {
            result[i] = treasuryAllocations[treasuryAllocationIds[i]];
        }
        
        return result;
    }
    
    /**
     * @dev Get pending treasury allocations
     */
    function getPendingTreasuryAllocations() public view returns (TreasuryAllocation[] memory) {
        uint256 pendingCount = 0;
        
        // Count pending allocations
        for (uint256 i = 0; i < treasuryAllocationIds.length; i++) {
            if (!treasuryAllocations[treasuryAllocationIds[i]].executed) {
                pendingCount++;
            }
        }
        
        // Create result array
        TreasuryAllocation[] memory result = new TreasuryAllocation[](pendingCount);
        
        // Fill result array
        uint256 index = 0;
        for (uint256 i = 0; i < treasuryAllocationIds.length; i++) {
            if (!treasuryAllocations[treasuryAllocationIds[i]].executed) {
                result[index] = treasuryAllocations[treasuryAllocationIds[i]];
                index++;
            }
        }
        
        return result;
    }
    
    /**
     * @dev Set DAO contract address (only admin)
     * @param _dao New DAO contract address
     */
    function setDAOContract(address _dao) public onlyRole(ADMIN_ROLE) {
        dao = QuadraticVotingDAO(_dao);
    }
    
    /**
     * @dev Grant executor role to an address (only admin)
     * @param account Address to grant role to
     */
    function grantExecutorRole(address account) public onlyRole(ADMIN_ROLE) {
        grantRole(EXECUTOR_ROLE, account);
    }
    
    /**
     * @dev Revoke executor role from an address (only admin)
     * @param account Address to revoke role from
     */
    function revokeExecutorRole(address account) public onlyRole(ADMIN_ROLE) {
        revokeRole(EXECUTOR_ROLE, account);
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
     * @dev Receive function to accept ETH
     */
    receive() external payable {}
}