//SPDX-License-Identifier:MIT
pragma solidity ^0.8.7;
import "./LoanAgreement.sol";
import "./interfaces/Ownable.sol";

// errors
error Governance__AlreadyGovTokenHolder();
error Governance__AccountIsNotTokenHolder();
error Governance__AccountAlreadyVoted();
error Governance__ProposalAlreadyPassed();
error Governance__QuorumNotReached();
error Governance__AccountIsNotApplicant();

/// @title A title that should describe the contract/interface
/// @author Oroghene Emudainohwo
/// @notice Explain to an end user what this does
/// @dev Explain to a developer any extra details
contract Governance is Ownable {
    // global variables
    LoanAgreement public loanAgreement;
    uint256 quorum = 5000;
    uint256 govTokenHolderCount;

    // structs
    struct Proposal {
        address Owner;
        uint256 ApplicationId;
        string Proof;
        uint256 proposalAmount;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 votesTotal;
        bool proposalPassed;
    }

    // events
    // mappings
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(uint256 => Proposal) public proposals;
    mapping(address => bool) public isGovTokenOwner;

    constructor() {}

    ////////////////////
    // Main Functions //
    ////////////////////

    /// @notice Explain to an end user what this does
    /// @dev Explain to a developer any extra details
    /// @param _newHolder a parameter just like in doxygen (must be followed by parameter name)
    function addGovTokenHolder(address _newHolder) public onlyOwner {
        if (checkIfGovTokenHolder(_newHolder)) {
            revert Governance__AlreadyGovTokenHolder();
        }
        isGovTokenOwner[_newHolder] = true;
        govTokenHolderCount = govTokenHolderCount + 1;
    }

    /// @notice Explain to an end user what this does
    /// @dev Explain to a developer any extra details
    /// @param _holder a parameter just like in doxygen (must be followed by parameter name)
    function removeGovTokenHolder(address _holder) public onlyOwner {
        if (!checkIfGovTokenHolder(_holder)) {
            revert Governance__AccountIsNotTokenHolder();
        }
        isGovTokenOwner[_holder] = false;
        govTokenHolderCount = govTokenHolderCount - 1;
    }

    /// @notice Explain to an end user what this does
    /// @dev Explain to a developer any extra details
    /// @param _proposalID a parameter just like in doxygen (must be followed by parameter name)
    /// @return decision Documents the return variables of a contract’s function state variable
    function checkProposal(uint256 _proposalID)
        public
        view
        returns (bool decision)
    {
        Proposal storage currentProposal = proposals[_proposalID];
        if (currentProposal.votesTotal < quorum) {
            revert Governance__QuorumNotReached();
        }

        uint256 minVotes = (govTokenHolderCount * quorum) / 10000;

        if (currentProposal.votesFor >= minVotes) {
            return true;
        }
        if (currentProposal.votesAgainst > minVotes) {
            return false;
        }
    }

    function loanAgreementContract(address _loanAgreement) public onlyOwner {
        loanAgreement = LoanAgreement(_loanAgreement);
    }

    /// @notice Explain to an end user what this does
    /// @dev Explain to a developer any extra details
    /// @param voting_side a parameter just like in doxygen (must be followed by parameter name)
    /// @param _proposalID a parameter just like in doxygen (must be followed by parameter name)
    function vote(bool voting_side, uint256 _proposalID) public {
        if (!isGovTokenOwner[msg.sender]) {
            revert Governance__AccountIsNotTokenHolder();
        }
        Proposal storage currentProposal = proposals[_proposalID];
        if (hasVoted[_proposalID][msg.sender]) {
            revert Governance__AccountAlreadyVoted();
        }
        if (currentProposal.proposalPassed) {
            revert Governance__ProposalAlreadyPassed();
        }

        if (voting_side) {
            currentProposal.votesFor = currentProposal.votesFor + 1;
        } else {
            currentProposal.votesAgainst = currentProposal.votesAgainst + 1;
        }
        currentProposal.votesTotal = currentProposal.votesTotal + 1;
        hasVoted[_proposalID][msg.sender] = true;
    }

    /// @notice Explain to an end user what this does
    /// @dev Explain to a developer any extra details
    /// @param _appID a parameter just like in doxygen (must be followed by parameter name)
    /// @param _proof a parameter just like in doxygen (must be followed by parameter name)
    /// @param _proposalAmount a parameter just like in doxygen (must be followed by parameter name)
    function approveApplication(
        uint256 _appID,
        string memory _proof,
        uint256 _proposalAmount
    ) public {
        address applicant = loanAgreement.getApplicant(_appID);
        if (msg.sender != applicant) {
            revert Governance__AccountIsNotApplicant();
        }

        Proposal memory _proposal = Proposal(
            msg.sender,
            _appID,
            _proof,
            _proposalAmount,
            0,
            0,
            0,
            false
        );
        proposals[_appID] = _proposal;
    }

    //////////////////////
    // Getter Functions //
    //////////////////////

    /// @notice Explain to an end user what this does
    /// @dev Explain to a developer any extra details
    /// @param _holder a parameter just like in doxygen (must be followed by parameter name)
    /// @return bool Documents the return variables of a contract’s function state variable
    function checkIfGovTokenHolder(address _holder)
        public
        view
        onlyOwner
        returns (bool)
    {
        return isGovTokenOwner[_holder];
    }

    /// @notice Explain to an end user what this does
    /// @dev Explain to a developer any extra details
    /// @return uint256 Documents the return variables of a contract’s function state variable
    function getGovTokenHolderCount() public view returns (uint256) {
        return govTokenHolderCount;
    }
}
