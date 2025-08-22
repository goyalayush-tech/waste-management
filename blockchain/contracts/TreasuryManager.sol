// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./AutomatedProposalExecutor.sol";

/**
 * @title TreasuryManager
 * @dev Contract for managing treasury funds and automating fund allocations
 * through proposal execution
 */
contract TreasuryManager is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    // Role definitions
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant EXECUTOR_ROLE = keccak256("EXECUTOR_ROLE");
    
    // Reference to the executor contract
    AutomatedProposalExecutor public executor;
    
    // Spending categories
    enum SpendingCategory {
        Operations,
        Development,
        Marketing,
        Community,
        Research,
        Other
    }
    
    // Fund allocation record
    struct FundAllocation {
        uint256 proposalId;
        address recipient;
        uint256 amount;
        string purpose;
        SpendingCategory category;
        uint256 timestamp;
        bool executed;
        uint256 executedAt;
        address executor;
    }
    
    // Array of all fund allocations
    FundAllocation[] public fundAllocations;
    
    // Mapping from proposal ID to fund allocation index
    mapping(uint256 => uint256) public proposalToFundAllocation;
    
    // Budget limits by category
    mapping(SpendingCategory => uint256) public categoryBudgets;
    
    // Spent amounts by category
    mapping(SpendingCategory => uint256) public categorySpent;
    
    // Events
    event FundAllocationRegistered(
        uint256 indexed proposalId,
        uint256 indexed allocationIndex,
        address recipient,
        uint256 amount,
        SpendingCategory category
    );
    
    event FundAllocationExecuted(
        uint256 indexed proposalId,
        uint256 indexed allocationIndex,
        address recipient,
        uint256 amount,
        bool success
    );
    
    event CategoryBudgetUpdated(
        SpendingCategory indexed category,
        uint256 oldBudget,
        uint256 newBudget
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
     * @dev Register a fund allocation
     * @param proposalId ID of the proposal that triggered the allocation
     * @param recipient Recipient of the funds
     * @param amount Amount to allocate
     * @param purpose Purpose of the allocation
     * @param category Spending category
     */
    function registerFundAllocation(
        uint256 proposalId,
        address recipient,
        uint256 amount,
        string memory purpose,
        SpendingCategory category
    ) public onlyRole(EXECUTOR_ROLE) {
        // Check if allocation is within budget
        require(
            categorySpent[category] + amount <= categoryBudgets[category],
            "Exceeds category budget"
        );
        
        // Create fund allocation record
        FundAllocation memory allocation = FundAllocation({
            proposalId: proposalId,
            recipient: recipient,
            amount: amount,
            purpose: purpose,
            category: category,
            timestamp: block.timestamp,
            executed: false,
            executedAt: 0,
            executor: address(0)
        });
        
        // Add to array
        fundAllocations.push(allocation);
        
        // Store index
        proposalToFundAllocation[proposalId] = fundAllocations.length - 1;
        
        // Update category spent
        categorySpent[category] += amount;
        
        emit FundAllocationRegistered(
            proposalId,
            fundAllocations.length - 1,
            recipient,
            amount,
            category
        );
    }
    
    /**
     * @dev Execute a fund allocation
     * @param allocationIndex Index of the fund allocation
     */
    function executeFundAllocation(uint256 allocationIndex) public nonReentrant onlyRole(EXECUTOR_ROLE) {
        require(allocationIndex < fundAllocations.length, "Invalid allocation index");
        
        FundAllocation storage allocation = fundAllocations[allocationIndex];
        require(!allocation.executed, "Allocation already executed");
        
        // Mark as executed
        allocation.executed = true;
        allocation.executedAt = block.timestamp;
        allocation.executor = msg.sender;
        
        // Transfer funds
        (bool success, ) = allocation.recipient.call{value: allocation.amount}("");
        
        emit FundAllocationExecuted(
            allocation.proposalId,
            allocationIndex,
            allocation.recipient,
            allocation.amount,
            success
        );
    }
    
    /**
     * @dev Create a fund allocation proposal
     * @param recipient Recipient of the funds
     * @param amount Amount to allocate
     * @param purpose Purpose of the allocation
     * @param category Spending category
     * @return Encoded call data for the proposal
     */
    function createFundAllocationCalldata(
        address recipient,
        uint256 amount,
        string memory purpose,
        SpendingCategory category
    ) public pure returns (bytes memory) {
        return abi.encodeWithSelector(
            AutomatedProposalExecutor.createTreasuryAllocation.selector,
            0, // proposalId will be filled in by the executor
            recipient,
            amount,
            purpose
        );
    }
    
    /**
     * @dev Update category budget (only admin)
     * @param category Spending category
     * @param newBudget New budget amount
     */
    function updateCategoryBudget(
        SpendingCategory category,
        uint256 newBudget
    ) public onlyRole(ADMIN_ROLE) {
        uint256 oldBudget = categoryBudgets[category];
        categoryBudgets[category] = newBudget;
        
        emit CategoryBudgetUpdated(category, oldBudget, newBudget);
    }
    
    /**
     * @dev Get fund allocation by proposal ID
     * @param proposalId ID of the proposal
     */
    function getFundAllocationByProposal(uint256 proposalId) public view returns (FundAllocation memory) {
        uint256 index = proposalToFundAllocation[proposalId];
        require(index < fundAllocations.length, "Fund allocation not found");
        return fundAllocations[index];
    }
    
    /**
     * @dev Get fund allocation by index
     * @param index Index of the fund allocation
     */
    function getFundAllocation(uint256 index) public view returns (FundAllocation memory) {
        require(index < fundAllocations.length, "Fund allocation not found");
        return fundAllocations[index];
    }
    
    /**
     * @dev Get all fund allocations
     */
    function getAllFundAllocations() public view returns (FundAllocation[] memory) {
        return fundAllocations;
    }
    
    /**
     * @dev Get pending fund allocations
     */
    function getPendingFundAllocations() public view returns (FundAllocation[] memory) {
        uint256 pendingCount = 0;
        
        // Count pending allocations
        for (uint256 i = 0; i < fundAllocations.length; i++) {
            if (!fundAllocations[i].executed) {
                pendingCount++;
            }
        }
        
        // Create result array
        FundAllocation[] memory result = new FundAllocation[](pendingCount);
        
        // Fill result array
        uint256 index = 0;
        for (uint256 i = 0; i < fundAllocations.length; i++) {
            if (!fundAllocations[i].executed) {
                result[index] = fundAllocations[i];
                index++;
            }
        }
        
        return result;
    }
    
    /**
     * @dev Get fund allocations count
     */
    function getFundAllocationsCount() public view returns (uint256) {
        return fundAllocations.length;
    }
    
    /**
     * @dev Get category budget and spent
     * @param category Spending category
     */
    function getCategoryBudgetInfo(SpendingCategory category) public view returns (
        uint256 budget,
        uint256 spent,
        uint256 remaining
    ) {
        budget = categoryBudgets[category];
        spent = categorySpent[category];
        remaining = budget > spent ? budget - spent : 0;
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
    
    /**
     * @dev Receive function to accept ETH
     */
    receive() external payable {}
}