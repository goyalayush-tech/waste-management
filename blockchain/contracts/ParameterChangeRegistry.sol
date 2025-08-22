// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./AutomatedProposalExecutor.sol";

/**
 * @title ParameterChangeRegistry
 * @dev Contract for managing system parameter changes through proposals
 * and providing a registry of historical parameter changes
 */
contract ParameterChangeRegistry is AccessControl, ReentrancyGuard {
    // Role definitions
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant EXECUTOR_ROLE = keccak256("EXECUTOR_ROLE");
    
    // Reference to the executor contract
    AutomatedProposalExecutor public executor;
    
    // Parameter change record
    struct ParameterChange {
        uint256 proposalId;
        uint256 timestamp;
        uint256 oldVotingPeriod;
        uint256 newVotingPeriod;
        uint256 oldProposalThreshold;
        uint256 newProposalThreshold;
        uint256 oldMinQuorumPercent;
        uint256 newMinQuorumPercent;
        bool oldAutoExecutionEnabled;
        bool newAutoExecutionEnabled;
        uint256 oldExecutionDelay;
        uint256 newExecutionDelay;
        uint256 oldMaxGasForExecution;
        uint256 newMaxGasForExecution;
        address initiator;
    }
    
    // Array of all parameter changes
    ParameterChange[] public parameterChanges;
    
    // Mapping from proposal ID to parameter change index
    mapping(uint256 => uint256) public proposalToParameterChange;
    
    // Events
    event ParameterChangeRegistered(
        uint256 indexed proposalId,
        uint256 indexed changeIndex,
        address initiator
    );
    
    /**
     * @dev Constructor
     * @param _executor Address of the executor contract
     */
    constructor(address _executor) {
        executor = AutomatedProposalExecutor(payable(_executor));
        
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(ADMIN_ROLE, msg.sender);
        _setupRole(EXECUTOR_ROLE, msg.sender);
    }
    
    /**
     * @dev Register a parameter change
     * @param proposalId ID of the proposal that triggered the change
     * @param oldParams Old system parameters
     * @param newParams New system parameters
     */
    function registerParameterChange(
        uint256 proposalId,
        AutomatedProposalExecutor.SystemParameters memory oldParams,
        AutomatedProposalExecutor.SystemParameters memory newParams
    ) public onlyRole(EXECUTOR_ROLE) {
        // Create parameter change record
        ParameterChange memory change = ParameterChange({
            proposalId: proposalId,
            timestamp: block.timestamp,
            oldVotingPeriod: oldParams.votingPeriod,
            newVotingPeriod: newParams.votingPeriod,
            oldProposalThreshold: oldParams.proposalThreshold,
            newProposalThreshold: newParams.proposalThreshold,
            oldMinQuorumPercent: oldParams.minQuorumPercent,
            newMinQuorumPercent: newParams.minQuorumPercent,
            oldAutoExecutionEnabled: oldParams.autoExecutionEnabled,
            newAutoExecutionEnabled: newParams.autoExecutionEnabled,
            oldExecutionDelay: oldParams.executionDelay,
            newExecutionDelay: newParams.executionDelay,
            oldMaxGasForExecution: oldParams.maxGasForExecution,
            newMaxGasForExecution: newParams.maxGasForExecution,
            initiator: msg.sender
        });
        
        // Add to array
        parameterChanges.push(change);
        
        // Store index
        proposalToParameterChange[proposalId] = parameterChanges.length - 1;
        
        emit ParameterChangeRegistered(proposalId, parameterChanges.length - 1, msg.sender);
    }
    
    /**
     * @dev Create a parameter change proposal
     * @param votingPeriod New voting period
     * @param proposalThreshold New proposal threshold
     * @param minQuorumPercent New minimum quorum percentage
     * @param autoExecutionEnabled Whether auto execution is enabled
     * @param executionDelay New execution delay
     * @param maxGasForExecution New maximum gas for execution
     * @return Encoded call data for the proposal
     */
    function createParameterChangeCalldata(
        uint256 votingPeriod,
        uint256 proposalThreshold,
        uint256 minQuorumPercent,
        bool autoExecutionEnabled,
        uint256 executionDelay,
        uint256 maxGasForExecution
    ) public pure returns (bytes memory) {
        return abi.encodeWithSelector(
            AutomatedProposalExecutor.updateSystemParameters.selector,
            votingPeriod,
            proposalThreshold,
            minQuorumPercent,
            autoExecutionEnabled,
            executionDelay,
            maxGasForExecution
        );
    }
    
    /**
     * @dev Get parameter change by proposal ID
     * @param proposalId ID of the proposal
     */
    function getParameterChangeByProposal(uint256 proposalId) public view returns (ParameterChange memory) {
        uint256 index = proposalToParameterChange[proposalId];
        require(index < parameterChanges.length, "Parameter change not found");
        return parameterChanges[index];
    }
    
    /**
     * @dev Get parameter change by index
     * @param index Index of the parameter change
     */
    function getParameterChange(uint256 index) public view returns (ParameterChange memory) {
        require(index < parameterChanges.length, "Parameter change not found");
        return parameterChanges[index];
    }
    
    /**
     * @dev Get all parameter changes
     */
    function getAllParameterChanges() public view returns (ParameterChange[] memory) {
        return parameterChanges;
    }
    
    /**
     * @dev Get parameter changes count
     */
    function getParameterChangesCount() public view returns (uint256) {
        return parameterChanges.length;
    }
    
    /**
     * @dev Set executor contract address (only admin)
     * @param _executor New executor contract address
     */
    function setExecutorContract(address _executor) public onlyRole(ADMIN_ROLE) {
        executor = AutomatedProposalExecutor(payable(_executor));
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
}