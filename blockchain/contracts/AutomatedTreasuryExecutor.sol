// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./AutomatedProposalExecutor.sol";
import "./TreasuryManager.sol";

/**
 * @title AutomatedTreasuryExecutor
 * @dev Contract for automated treasury operations and fund management
 * Works in conjunction with AutomatedProposalExecutor for complete automation
 */
contract AutomatedTreasuryExecutor is AccessControl, ReentrancyGuard {
    // Role definitions
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant EXECUTOR_ROLE = keccak256("EXECUTOR_ROLE");
    
    // Reference contracts
    AutomatedProposalExecutor public proposalExecutor;
    TreasuryManager public treasuryManager;
    
    // Treasury operation record
    struct TreasuryOperation {
        uint256 proposalId;
        uint256 operationType; // 0: fund allocation, 1: parameter change, 2: other
        uint256 amount;
        address target;
        bytes data;
        uint256 timestamp;
        bool executed;
        uint256 executedAt;
        bool success;
    }
    
    // Array of all treasury operations
    TreasuryOperation[] public treasuryOperations;
    
    // Mapping from proposal ID to operation index
    mapping(uint256 => uint256) public proposalToOperation;
    
    // Events
    event TreasuryOperationScheduled(
        uint256 indexed proposalId,
        uint256 indexed operationIndex,
        uint256 operationType,
        uint256 amount,
        address target
    );
    
    event TreasuryOperationExecuted(
        uint256 indexed proposalId,
        uint256 indexed operationIndex,
        bool success
    );
    
    /**
     * @dev Constructor
     * @param _proposalExecutor Address of the proposal executor contract
     * @param _treasuryManager Address of the treasury manager contract
     */
    constructor(address _proposalExecutor, address _treasuryManager) {
        proposalExecutor = AutomatedProposalExecutor(payable(_proposalExecutor));
        treasuryManager = TreasuryManager(_treasuryManager);
        
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(ADMIN_ROLE, msg.sender);
        _setupRole(EXECUTOR_ROLE, msg.sender);
    }
    
    /**
     * @dev Schedule a treasury operation
     * @param proposalId ID of the proposal that triggered the operation
     * @param operationType Type of operation (0: fund allocation, 1: parameter change, 2: other)
     * @param amount Amount involved in the operation
     * @param target Target contract address
     * @param data Encoded function call data
     */
    function scheduleTreasuryOperation(
        uint256 proposalId,
        uint256 operationType,
        uint256 amount,
        address target,
        bytes memory data
    ) public onlyRole(EXECUTOR_ROLE) {
        // Create treasury operation record
        TreasuryOperation memory operation = TreasuryOperation({
            proposalId: proposalId,
            operationType: operationType,
            amount: amount,
            target: target,
            data: data,
            timestamp: block.timestamp,
            executed: false,
            executedAt: 0,
            success: false
        });
        
        // Add to array
        treasuryOperations.push(operation);
        
        // Store index
        proposalToOperation[proposalId] = treasuryOperations.length - 1;
        
        emit TreasuryOperationScheduled(
            proposalId,
            treasuryOperations.length - 1,
            operationType,
            amount,
            target
        );
    }
    
    /**
     * @dev Execute a treasury operation
     * @param operationIndex Index of the operation to execute
     */
    function executeTreasuryOperation(uint256 operationIndex) public nonReentrant onlyRole(EXECUTOR_ROLE) {
        require(operationIndex < treasuryOperations.length, "Invalid operation index");
        
        TreasuryOperation storage operation = treasuryOperations[operationIndex];
        require(!operation.executed, "Operation already executed");
        
        // Mark as executed
        operation.executed = true;
        operation.executedAt = block.timestamp;
        
        // Execute the operation
        (bool success, ) = operation.target.call{value: operation.amount}(operation.data);
        operation.success = success;
        
        emit TreasuryOperationExecuted(operation.proposalId, operationIndex, success);
    }
    
    /**
     * @dev Execute all pending treasury operations
     * @param maxOperations Maximum number of operations to execute
     */
    function executeAllPendingOperations(uint256 maxOperations) public nonReentrant onlyRole(EXECUTOR_ROLE) {
        uint256 executed = 0;
        
        for (uint256 i = 0; i < treasuryOperations.length && executed < maxOperations; i++) {
            TreasuryOperation storage operation = treasuryOperations[i];
            
            if (!operation.executed) {
                // Mark as executed
                operation.executed = true;
                operation.executedAt = block.timestamp;
                
                // Execute the operation
                (bool success, ) = operation.target.call{value: operation.amount}(operation.data);
                operation.success = success;
                
                emit TreasuryOperationExecuted(operation.proposalId, i, success);
                
                executed++;
            }
        }
    }
    
    /**
     * @dev Get treasury operation by proposal ID
     * @param proposalId ID of the proposal
     */
    function getTreasuryOperationByProposal(uint256 proposalId) public view returns (TreasuryOperation memory) {
        uint256 index = proposalToOperation[proposalId];
        require(index < treasuryOperations.length, "Treasury operation not found");
        return treasuryOperations[index];
    }
    
    /**
     * @dev Get treasury operation by index
     * @param index Index of the operation
     */
    function getTreasuryOperation(uint256 index) public view returns (TreasuryOperation memory) {
        require(index < treasuryOperations.length, "Treasury operation not found");
        return treasuryOperations[index];
    }
    
    /**
     * @dev Get all treasury operations
     */
    function getAllTreasuryOperations() public view returns (TreasuryOperation[] memory) {
        return treasuryOperations;
    }
    
    /**
     * @dev Get pending treasury operations
     */
    function getPendingTreasuryOperations() public view returns (TreasuryOperation[] memory) {
        uint256 pendingCount = 0;
        
        // Count pending operations
        for (uint256 i = 0; i < treasuryOperations.length; i++) {
            if (!treasuryOperations[i].executed) {
                pendingCount++;
            }
        }
        
        // Create result array
        TreasuryOperation[] memory result = new TreasuryOperation[](pendingCount);
        
        // Fill result array
        uint256 index = 0;
        for (uint256 i = 0; i < treasuryOperations.length; i++) {
            if (!treasuryOperations[i].executed) {
                result[index] = treasuryOperations[i];
                index++;
            }
        }
        
        return result;
    }
    
    /**
     * @dev Get treasury operations count
     */
    function getTreasuryOperationsCount() public view returns (uint256) {
        return treasuryOperations.length;
    }
    
    /**
     * @dev Set proposal executor contract address (only admin)
     * @param _proposalExecutor New proposal executor contract address
     */
    function setProposalExecutorContract(address _proposalExecutor) public onlyRole(ADMIN_ROLE) {
        proposalExecutor = AutomatedProposalExecutor(payable(_proposalExecutor));
    }
    
    /**
     * @dev Set treasury manager contract address (only admin)
     * @param _treasuryManager New treasury manager contract address
     */
    function setTreasuryManagerContract(address _treasuryManager) public onlyRole(ADMIN_ROLE) {
        treasuryManager = TreasuryManager(_treasuryManager);
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
     * @dev Receive function to accept ETH
     */
    receive() external payable {}
}