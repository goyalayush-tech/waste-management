// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

/**
 * @title VoteWeightCalculator
 * @dev Contract for calculating vote weights based on token holdings and participation
 * using quadratic voting principles
 */
contract VoteWeightCalculator is Ownable {
    using SafeMath for uint256;
    
    // Governance token
    IERC20 public governanceToken;
    
    // Participation tracking
    mapping(address => uint256) public participationScore;
    
    // Participation bonus multiplier (in basis points, 100 = 1%)
    uint256 public participationBonus = 500; // 5% bonus per 100 participation points
    
    // Maximum participation bonus (in basis points)
    uint256 public maxParticipationBonus = 5000; // 50% maximum bonus
    
    // Events
    event ParticipationScoreUpdated(
        address indexed voter,
        uint256 newScore
    );
    
    event ParticipationBonusUpdated(
        uint256 newBonus,
        uint256 newMaxBonus
    );
    
    /**
     * @dev Constructor
     * @param _governanceToken Address of the governance token
     */
    constructor(address _governanceToken) {
        governanceToken = IERC20(_governanceToken);
    }
    
    /**
     * @dev Calculate vote weight using quadratic voting formula with participation bonus
     * @param voter Address of the voter
     * @param tokenAmount Amount of tokens being used for voting
     */
    function calculateVoteWeight(
        address voter,
        uint256 tokenAmount
    ) public view returns (uint256) {
        // Base quadratic voting weight: sqrt(tokenAmount)
        uint256 baseWeight = sqrt(tokenAmount);
        
        // Calculate participation bonus (if any)
        uint256 bonus = 0;
        uint256 score = participationScore[voter];
        
        if (score > 0) {
            // Calculate bonus percentage (5% per 100 participation points)
            uint256 bonusPercent = score.div(100).mul(participationBonus);
            
            // Cap at maximum bonus
            if (bonusPercent > maxParticipationBonus) {
                bonusPercent = maxParticipationBonus;
            }
            
            // Apply bonus
            bonus = baseWeight.mul(bonusPercent).div(10000);
        }
        
        // Return base weight plus bonus
        return baseWeight.add(bonus);
    }
    
    /**
     * @dev Update participation score for a voter
     * @param voter Address of the voter
     * @param score New participation score
     */
    function updateParticipationScore(
        address voter,
        uint256 score
    ) external onlyOwner {
        participationScore[voter] = score;
        
        emit ParticipationScoreUpdated(voter, score);
    }
    
    /**
     * @dev Increment participation score for a voter
     * @param voter Address of the voter
     * @param increment Amount to increment by
     */
    function incrementParticipationScore(
        address voter,
        uint256 increment
    ) external onlyOwner {
        participationScore[voter] = participationScore[voter].add(increment);
        
        emit ParticipationScoreUpdated(voter, participationScore[voter]);
    }
    
    /**
     * @dev Update participation bonus parameters
     * @param newBonus New participation bonus (in basis points)
     * @param newMaxBonus New maximum participation bonus (in basis points)
     */
    function updateParticipationBonus(
        uint256 newBonus,
        uint256 newMaxBonus
    ) external onlyOwner {
        require(newBonus <= 1000, "Bonus too high"); // Max 10% per 100 points
        require(newMaxBonus <= 10000, "Max bonus too high"); // Max 100% bonus
        
        participationBonus = newBonus;
        maxParticipationBonus = newMaxBonus;
        
        emit ParticipationBonusUpdated(newBonus, newMaxBonus);
    }
    
    /**
     * @dev Set governance token address
     * @param _governanceToken New governance token address
     */
    function setGovernanceToken(address _governanceToken) external onlyOwner {
        governanceToken = IERC20(_governanceToken);
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