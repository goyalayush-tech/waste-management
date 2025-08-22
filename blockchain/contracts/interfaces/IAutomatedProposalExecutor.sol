// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

/**
 * @title IAutomatedProposalExecutor
 * @dev Interface for the AutomatedProposalExecutor contract
 */
interface IAutomatedProposalExecutor {
    /**
     * @dev Auto-queue a proposal for execution after it has been executed in the DAO
     * @param proposalId ID of the proposal to auto-queue
     */
    function autoQueueProposal(uint256 proposalId) external;
    
    /**
     * @dev Get the current system parameters
     * @return votingPeriod The current voting period
     * @return proposalThreshold The current proposal threshold
     * @return minQuorumPercent The current minimum quorum percentage
     * @return autoExecutionEnabled Whether auto execution is enabled
     * @return executionDelay The current execution delay
     * @return maxGasForExecution The current maximum gas for execution
     */
    function systemParameters() external view returns (
        uint256 votingPeriod,
        uint256 proposalThreshold,
        uint256 minQuorumPercent,
        bool autoExecutionEnabled,
        uint256 executionDelay,
        uint256 maxGasForExecution
    );
}