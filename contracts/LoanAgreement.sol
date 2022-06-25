// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import {ISuperfluid, ISuperToken, ISuperApp, ISuperAgreement, SuperAppDefinitions} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";
import {CFAv1Library} from "@superfluid-finance/ethereum-contracts/contracts/apps/CFAv1Library.sol";

import {IConstantFlowAgreementV1} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/IConstantFlowAgreementV1.sol";
import {SuperAppBase} from "@superfluid-finance/ethereum-contracts/contracts/apps/SuperAppBase.sol";
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "hardhat/console.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./Base64.sol";
import "./DateTime.sol";
import "./Governance.sol";
import "./interfaces/ERC721URIStorage.sol";
import "./interfaces/Ownable.sol";
import "./interfaces/Pausable.sol";

// errors
error LoanAgreement__AddressMustNotBeZero();
error LoanAgreement__PrincipalNotPaid();
error LoanAgreement__ApplicationDoesNotExist();
error LoanAgreement__NotGovernanceContract();
error LoanAgreement__LoanAgreementTransferFailed();

/// @title dapplicant NFT contract with Superfluid
/// @author Oroghene Emudainohwo
/// @notice The project allows users to apply for undercollateralized loans using forms which are non-transferable NFTs. This project is inspired by section 4.2 (Soul Lending) of "Decentralized Society" by  E. Glen Weyl, Puja Ohlhaver, and Vitalik Buterin. This project from the idea in section 4.2 of the paper by being undercollateralized (not uncollateralized) lending. Like the U.S. credit system, all users will start with a fixed amount they can borrow. As they continue to succesfully repay loans, they can borrow higher amounts. the loans will have interest rates which the user pays in intervals using Superfluid. each loan application requires principal payments (minimum payments) and regular interest payments. ( The baseAmount is automatically staked when the user buys a policy through us and it generates our own  ERC20 Utility Token.) Token can be used to subsidize loans
// https://github.com/superfluid-finance/protocol-monorepo/blob/dev/examples/employment-based-loan
/// @dev Only possible for a loan application for each wallet right now
contract LoanAgreement is
    ERC721URIStorage,
    Ownable,
    Pausable,
    ReentrancyGuard,
    SuperAppBase
{
    // global variables
    address govContractAddress;
    Governance private govContract;

    // SUPERFLUID PARAMETERS
    ISuperfluid private _host; // host
    IConstantFlowAgreementV1 private _cfa; // the stored constant flow agreement class address
    // ISuperToken public _acceptedToken; // accepted token
    using CFAv1Library for CFAv1Library.InitData;
    CFAv1Library.InitData public cfaV1;
    bytes32 constant CFA_ID =
        keccak256("org.superfluid-finance.agreements.ConstantFlowAgreement.v1");
    AggregatorV3Interface public priceFeed;
    //decimals of value returned by the priceFeed
    uint256 public priceFeedDecimals;
    uint256 public loanStartTime;
    int256 public borrowAmount;
    int8 public interestRate;
    int256 public paybackMonths;
    int256 public collateralAmount;
    address public guarantor; //
    address public borrower;
    address public lender;
    ISuperToken public borrowToken;
    ISuperToken public collateralToken;

    using Strings for uint256;
    using Counters for Counters.Counter;
    Counters.Counter private _applicationID;

    // enum
    enum ApplicationStatus {
        ACTIVE,
        DEFAULTED,
        INACTIVE,
        REPAID
    }
    // structs
    struct Application {
        address applicant;
        uint256 applicationID;
        address borrowToken;
        address collateralToken;
        uint256 borrowAmount;
        int96 interestRate;
        uint256 durationInMonths;
        uint256 collateralAmount;
        address guarantor;
        uint256 submittedTime;
        ApplicationStatus status;
        uint256 amountPaid;
        string textHue;
        string bgHue;
    }
    // events

    // mappings
    mapping(uint256 => Application) public applications;
    mapping(address => uint256) public personToCreditScore;

    /// @notice Explain to an end user what this does
    /// @dev replace randomNum with chainlink VRF for texthue and bghue
    /// @param host Superfluid host contract ( reference from Superfluid Docs )
    /// @param _govContract contract address of the governance contract that handles the claim submission
    constructor(
        ISuperfluid host,
        ISuperToken _borrowToken,
        ISuperToken _collateralToken,
        address _govContract,
        int256 _borrowAmount,
        int8 _interestRate,
        int256 _paybackMonths,
        int256 _collateralAmount,
        address _guarantor,
        address _borrower
    ) ERC721("Dapplication", "DPLY") {
        _host = host;
        // _cfa = cfa;
        // _acceptedToken = acceptedToken;
        

        // if (address(_host) == address(0)) {
        //     revert LoanAgreement__AddressMustNotBeZero();
        // }
        // if (address(_cfa) == address(0)) {
        //     revert LoanAgreement__AddressMustNotBeZero();
        // }
        // if (address(_borrowToken) == address(0)) {
        //     revert LoanAgreement__AddressMustNotBeZero();
        // }
        // if (address(_collateralToken) == address(0)) {
        //     revert LoanAgreement__AddressMustNotBeZero();
        // }

        govContract = Governance(_govContract);
        IConstantFlowAgreementV1 cfa = IConstantFlowAgreementV1(
            address(_host.getAgreementClass(CFA_ID))
        );

        borrowAmount = _borrowAmount;
        interestRate = _interestRate;
        paybackMonths = _paybackMonths;
        collateralAmount = _collateralAmount;
        guarantor = _guarantor;
        borrower = _borrower;
        borrowToken = _borrowToken;
        collateralToken = _collateralToken;

        cfaV1 = CFAv1Library.InitData(_host, cfa);

        // use dai-eth for now because constructor cannot take any more arguments
        priceFeed = AggregatorV3Interface(
            0xFC539A559e170f848323e19dfD66007520510085
        );
        priceFeedDecimals = 18;

        uint256 configWord = SuperAppDefinitions.APP_LEVEL_FINAL |
            SuperAppDefinitions.BEFORE_AGREEMENT_CREATED_NOOP |
            SuperAppDefinitions.BEFORE_AGREEMENT_UPDATED_NOOP |
            SuperAppDefinitions.BEFORE_AGREEMENT_TERMINATED_NOOP;

        _host.registerApp(configWord);
    }

    // SF FUNCTIONS
    /// @notice Explain to an end user what this does
    /// @dev not sure what it is for. helper function? 
    /// @return paymentFlowRate Documents the return variables of a contract’s function state variable
    function getPaymentFlowRate() public view returns (int96 paymentFlowRate) {
        return (
            int96(
                ((borrowAmount / paybackMonths) +
                    ((borrowAmount * int256(int256(interestRate) / 100)) /
                        paybackMonths)) / ((365 / 12) * 86400)
            )
        );
    }

    /// @notice Explain to an end user what this does
    /// @dev not sure what it is for. helper function? 
    /// @return collateralFlowRate Documents the return variables of a contract’s function state variable
    function _getCollateralFlowRate()
        public
        view
        returns (int96 collateralFlowRate)
    {
        int256 collateralDenominatedBorrowAmount;
        (, int256 collateralTokenPrice, , , ) = priceFeed.latestRoundData();

        //note: all chainlink feeds return either 8 or 18 decimals...in our case, if it's not 18, we need to balance out the diff
        if (uint256(priceFeedDecimals) < 18) {
            collateralTokenPrice = int256(
                uint256(collateralTokenPrice) *
                    (10**uint256(18 - int256(priceFeedDecimals)))
            );
        }

        //denominate borrow amount in collateral token instead
        if (collateralTokenPrice > 0) {
            //not perfect, but assumes that borrow token is a stablecoin
            collateralDenominatedBorrowAmount = int256(
                (borrowAmount * collateralTokenPrice) / borrowAmount
            );
        }

        //calculate monthly payment formula
        return (
            int96(
                ((collateralDenominatedBorrowAmount / paybackMonths) +
                    ((collateralDenominatedBorrowAmount *
                        int256(int256(interestRate) / 100)) / paybackMonths)) /
                    ((365 / 12) * 86400)
            )
        );
    }

    /// @notice Explain to an end user what this does
    /// @dev not sure what it is for. helper function? 
    /// @return uint256 Documents the return variables of a contract’s function state variable
    function getTotalAmountRemaining() public view returns (uint256) {
        //if there is no time left on loan, return zero
        int256 secondsLeft = (paybackMonths * int256((365 * 86400) / 12)) -
            int256(block.timestamp - loanStartTime);
        if (secondsLeft <= 0) {
            return 0;
        }
        //if an amount is left, return the total amount to be paid
        else {
            return uint256(secondsLeft) * uint256(int256(getPaymentFlowRate()));
        }
    }

    /// @notice allows loan to be prepped by the borrower
    /// @dev Explain to a developer any extra details
    function sendCollateral() external {
        require(msg.sender == borrower);

        if (collateralAmount > 0) {
            collateralToken.transferFrom(
                msg.sender,
                address(this),
                uint256(collateralAmount)
            );
        }
    }

    /// @notice lender can use this function to send funds to the borrower and start the loan
    /// @dev Explain to a developer any extra details
    function lend() external {
        (, int96 guarantorFlowRate, , ) = cfaV1.cfa.getFlow(
            borrowToken, // supertoken
            guarantor, // sender
            address(this) // receiver, after is signer/provider
        );

        require(guarantorFlowRate >= getPaymentFlowRate());

        if (collateralAmount > 0) {
            require(
                collateralToken.balanceOf(address(this)) >=
                    uint256(collateralAmount)
            );
        }
        //lender must approve contract before running next line
        borrowToken.transferFrom(msg.sender, borrower, uint256(borrowAmount));
        //want to make sure that tokens are sent successfully first before setting lender to msg.sender
        int96 netFlowRate = cfaV1.cfa.getNetFlow(borrowToken, address(this));
        (, int96 outFlowRate, , ) = cfaV1.cfa.getFlow(
            borrowToken,
            address(this),
            borrower
        );

        //update flow to borrower
        cfaV1.updateFlow(
            borrower,
            borrowToken,
            ((netFlowRate - outFlowRate) * -1) - getPaymentFlowRate()
        );
        //create flow to lender
        cfaV1.createFlow(msg.sender, borrowToken, getPaymentFlowRate());

        lender = msg.sender;
        loanStartTime = block.timestamp;
    }

    /// @notice If a new stream is opened, or an existing one is opened. (1) get expected payment flowRte, current netflowRate, etc. (2) check how much the guarantor is sending - if they're not sending enough, revert
    /// @dev Explain to a developer any extra details
    /// @param ctx a parameter just like in doxygen (must be followed by parameter name)
    /// @param paymentFlowRate a parameter just like in doxygen (must be followed by parameter name)
    /// @param collateralFlow a parameter just like in doxygen (must be followed by parameter name)
    /// @param inFlowRate the return variables of a contract’s function state variable
    /// @return newCtx Documents the return variables of a contract’s function state variable
    function _updateOutFlowCreate(
        bytes calldata ctx,
        int96 paymentFlowRate,
        int96 collateralFlow,
        int96 inFlowRate
    ) private returns (bytes memory newCtx) {
        newCtx = ctx;
        // @dev If there is no existing outflow, then create new flow to equal inflow
        if (inFlowRate - paymentFlowRate > 0 && collateralFlow == 0) {
            //create flow to employee
            newCtx = cfaV1.createFlowWithCtx(
                newCtx,
                borrower,
                borrowToken,
                inFlowRate
            );
        }
        //collateral net flow is < 0 - meaning that it exists, and the new payment flow rate is > 0
        else if (collateralFlow > 0 && inFlowRate - paymentFlowRate > 0) {
            newCtx = cfaV1.deleteFlowWithCtx(
                newCtx,
                address(this),
                lender,
                collateralToken
            );
            newCtx = cfaV1.createFlowWithCtx(
                newCtx,
                lender,
                borrowToken,
                paymentFlowRate
            );
            newCtx = cfaV1.createFlowWithCtx(
                newCtx,
                borrower,
                borrowToken,
                inFlowRate - paymentFlowRate
            );
        }
    }

    /// @notice not sure what it does. helper function?
    /// @dev Explain to a developer any extra details
    /// @param ctx a parameter just like in doxygen (must be followed by parameter name)
    /// @param paymentFlowRate a parameter just like in doxygen (must be followed by parameter name)
    /// @param outFlowRateLender a parameter just like in doxygen (must be followed by parameter name)
    /// @param collateralFlow a parameter just like in doxygen (must be followed by parameter name)
    /// @param inFlowRate the return variables of a contract’s function state variable
    /// @return newCtx Documents the return variables of a contract’s function state variable
    function _updateOutFlowUpdate(
        bytes calldata ctx,
        int96 paymentFlowRate,
        int96 outFlowRateLender,
        int96 collateralFlow,
        int96 inFlowRate
    ) private returns (bytes memory newCtx) {
        newCtx = ctx;
        //this will get us the amount of money that should be redirected to the lender out of the inflow, denominated in borrow token
        //if the amount being sent is enough to cover loan
        if ((inFlowRate - paymentFlowRate) > 0) {
            //if there is a collateral net flow
            if (collateralFlow > 0) {
                //loan is solvent again so delete the flow of collateral to lender
                newCtx = cfaV1.deleteFlowWithCtx(
                    newCtx,
                    address(this),
                    lender,
                    collateralToken
                );
                //re open payment flow to lender
                newCtx = cfaV1.updateFlowWithCtx(
                    newCtx,
                    borrower,
                    borrowToken,
                    inFlowRate - paymentFlowRate
                );
                newCtx = cfaV1.createFlowWithCtx(
                    newCtx,
                    lender,
                    borrowToken,
                    paymentFlowRate
                );
            }
            //if the loan is solvent flow when the flow is updated, and it is already started, then simply update outflow toborrower
            else if (collateralFlow == 0 && outFlowRateLender > 0) {
                newCtx = cfaV1.updateFlowWithCtx(
                    newCtx,
                    borrower,
                    borrowToken,
                    inFlowRate - paymentFlowRate
                );
            } else {
                //otherwise, if there is no colleteral netflow and loan has not yet begun, then just
                //update the flow to the borrower with the full inflow rate
                newCtx = cfaV1.updateFlowWithCtx(
                    newCtx,
                    borrower,
                    borrowToken,
                    inFlowRate
                );
            }
        } else {
            //if inFlowRate is less than the required amount to pay interest, we need to start streaming out the collateral
            if (collateralAmount > 0) {
                if (outFlowRateLender == 0 && collateralFlow == 0) {
                    //if current outflow rate to lender is zero, just update the flow to borrower
                    newCtx = cfaV1.updateFlowWithCtx(
                        newCtx,
                        borrower,
                        borrowToken,
                        inFlowRate
                    );
                } else {
                    //the borrow token amount has been reduced below our threshold, so we must:
                    //update flow to borrower to reflect inflow amount
                    //begin streaming out the collateral
                    newCtx = cfaV1.createFlowWithCtx(
                        newCtx,
                        lender,
                        collateralToken,
                        _getCollateralFlowRate()
                    );
                    newCtx = cfaV1.deleteFlowWithCtx(
                        newCtx,
                        address(this),
                        lender,
                        borrowToken
                    );
                    newCtx = cfaV1.updateFlowWithCtx(
                        newCtx,
                        borrower,
                        borrowToken,
                        inFlowRate
                    );
                }
            }
            //if there is no collateral amount, then just update the flow
            else {
                if (outFlowRateLender > 0) {
                    newCtx = cfaV1.updateFlowWithCtx(
                        newCtx,
                        borrower,
                        borrowToken,
                        inFlowRate - paymentFlowRate
                    );
                } else {
                    //if outflow to lender does not yet exist, then update accordingly
                    newCtx = cfaV1.updateFlowWithCtx(
                        newCtx,
                        borrower,
                        borrowToken,
                        inFlowRate
                    );
                }
            }
        }
    }

    /// @notice Explain to an end user what this does
    /// @dev Explain to a developer any extra details
    /// @param ctx a parameter just like in doxygen (must be followed by parameter name)
    /// @param outFlowRateLender a parameter just like in doxygen (must be followed by parameter name)
    /// @return newCtx the return variables of a contract’s function state variable
    function _updateOutFlowDelete(bytes calldata ctx, int96 outFlowRateLender)
        private
        returns (bytes memory newCtx)
    {
        newCtx = ctx;

        //delete flow to lender in borrow token if they are currently receiving a flow
        if (outFlowRateLender > 0) {
            newCtx = cfaV1.deleteFlowWithCtx(
                newCtx,
                address(this),
                lender,
                borrowToken
            );
        }
        //delete flow to borrower in borrow token
        newCtx = cfaV1.deleteFlowWithCtx(
            newCtx,
            address(this),
            borrower,
            borrowToken
        );
        //check if collateral > 0. if so, create a flow to lender using the collateral
        if (collateralAmount > 0) {
            newCtx = cfaV1.createFlowWithCtx(
                newCtx,
                lender,
                collateralToken,
                _getCollateralFlowRate()
            );
        }
    }

    /// @notice Explain to an end user what this does
    /// @dev Explain to a developer any extra details
    /// @param ctx a parameter just like in doxygen (must be followed by parameter name)
    /// @return newCtx the return variables of a contract’s function state variable
    function _updateOutflow(bytes calldata ctx)
        private
        returns (bytes memory newCtx)
    {
        newCtx = ctx;
        //this will get us the amount of money that should be redirected to the lender out of the inflow, denominated in borrow token
        int96 paymentFlowRate = getPaymentFlowRate();
        // @dev This will give me the new flowRate, as it is called in after callbacks
        int96 netFlowRate = cfaV1.cfa.getNetFlow(borrowToken, address(this));

        //current amount being sent to lender
        (, int96 outFlowRateLender, , ) = cfaV1.cfa.getFlow(
            borrowToken,
            address(this),
            lender
        );
        //current amount being sent to borrower
        (, int96 outFlowRateBorrower, , ) = cfaV1.cfa.getFlow(
            borrowToken,
            address(this),
            borrower
        );
        //current amount being streamed out in collateral token
        (, int96 collateralFlow, , ) = cfaV1.cfa.getFlow(
            collateralToken,
            address(this),
            lender
        );
        //total outflow rate in borrow token - only 2
        int96 outFlowRate = outFlowRateLender + outFlowRateBorrower;
        //total inflow rate in borrow token
        int96 inFlowRate = netFlowRate + outFlowRate;

        if (inFlowRate < 0) {
            inFlowRate = inFlowRate * -1; // Fixes issue when inFlowRate is negative
        }

        // @dev If inFlow === 0 && outflowRate > 0, then delete existing flows. decrease credict score?
        if (inFlowRate == int96(0)) {
            newCtx = _updateOutFlowDelete(ctx, outFlowRateLender);
        }
        //if flow exists, update the flow according to various params
        else if (outFlowRate != int96(0)) {
            newCtx = _updateOutFlowUpdate(
                ctx,
                paymentFlowRate,
                outFlowRateLender,
                collateralFlow,
                inFlowRate
            );
        }
        //no flow exists into the contract in borrow token
        else {
            newCtx = _updateOutFlowCreate(
                ctx,
                paymentFlowRate,
                collateralFlow,
                inFlowRate
            );
            // @dev If there is no existing outflow, then create new flow to equal inflow
        }
    }

    /// @notice function to close a loan that is already completed. increase borrower's credit
    /// @dev Explain to a developer any extra details
    function closeCompletedLoan() external {
        require(msg.sender == lender || getTotalAmountRemaining() <= 0);

        uint256 collateralTokenBalance = collateralToken.balanceOf(
            address(this)
        );
        if (collateralAmount >= 0 && collateralTokenBalance > 0) {
            collateralToken.transfer(borrower, collateralTokenBalance);
        }

        (, int96 currentLenderFlowRate, , ) = cfaV1.cfa.getFlow(
            borrowToken,
            address(this),
            lender
        );
        cfaV1.deleteFlow(address(this), lender, borrowToken);

        (, int96 currentFlowRate, , ) = cfaV1.cfa.getFlow(
            borrowToken,
            address(this),
            borrower
        );
        cfaV1.updateFlow(
            borrower,
            borrowToken,
            currentFlowRate + currentLenderFlowRate
        );
        // increase credit score
        if (personToCreditScore[borrower] == 0) {
            personToCreditScore[borrower] = 300;
        }
        personToCreditScore[borrower] = personToCreditScore[borrower] + 10;
    }

    /// @notice Explain to an end user what this does
    //allows lender or borrower to close a loan
    //if the loan is paid off, or if the loan is closed by the lender, pass 0 and increase credit
    //if the loan is not yet paid off, pass in the required amount to close loan, decrease credit
    /// @dev Explain to a developer any extra details
    /// @param amountForPayoff a parameter just like in doxygen (must be followed by parameter name)
    function closeOpenLoan(uint256 amountForPayoff) external {
        (, int96 currentLenderFlowRate, , ) = cfaV1.cfa.getFlow(
            borrowToken,
            address(this),
            lender
        );
        (, int96 currentFlowRate, , ) = cfaV1.cfa.getFlow(
            borrowToken,
            address(this),
            borrower
        );

        if (msg.sender == lender) {
            cfaV1.deleteFlow(address(this), lender, borrowToken);
            cfaV1.updateFlow(
                borrower,
                borrowToken,
                currentFlowRate + currentLenderFlowRate
            );
            // increase credit score
            if (personToCreditScore[borrower] == 0) {
                personToCreditScore[borrower] = 300;
            }
            personToCreditScore[borrower] = personToCreditScore[borrower] + 5;
        } else {
            if (getTotalAmountRemaining() > 0) {
                require(
                    amountForPayoff >= (getTotalAmountRemaining()),
                    "insuf funds"
                );
                borrowToken.transferFrom(msg.sender, lender, amountForPayoff);

                cfaV1.deleteFlow(address(this), lender, borrowToken);

                cfaV1.updateFlow(
                    borrower,
                    borrowToken,
                    currentFlowRate + currentLenderFlowRate
                );
                // decrease credit score
                if (personToCreditScore[borrower] == 0) {
                    personToCreditScore[borrower] = 300;
                }
                personToCreditScore[borrower] = personToCreditScore[borrower] - 15;
            } else {
                cfaV1.deleteFlow(address(this), lender, borrowToken);
                cfaV1.updateFlow(
                    borrower,
                    borrowToken,
                    currentFlowRate + currentLenderFlowRate
                );
            }
        }
    }

    function afterAgreementCreated(
        ISuperToken _superToken,
        address _agreementClass,
        bytes32, // _agreementId,
        bytes calldata, /*_agreementData*/
        bytes calldata, // _cbdata,
        bytes calldata ctx
    ) external override onlyCFA(_agreementClass) returns (bytes memory newCtx) {
        newCtx = _updateOutflow(ctx);
    }

    function afterAgreementUpdated(
        ISuperToken _superToken,
        address _agreementClass,
        bytes32, // _agreementId,
        bytes calldata, /*_agreementData*/
        bytes calldata, // _cbdata,
        bytes calldata ctx
    )
        external
        override
        onlyCFA(_agreementClass)
        onlyHost
        returns (bytes memory newCtx)
    {
        newCtx = _updateOutflow(ctx);
    }

    function afterAgreementTerminated(
        ISuperToken _superToken,
        address _agreementClass,
        bytes32, // _agreementId,
        bytes calldata, /*_agreementData*/
        bytes calldata, // _cbdata,
        bytes calldata ctx
    ) external override onlyHost returns (bytes memory newCtx) {
        if (!_isCFAv1(_agreementClass)) {
            return ctx;
        }
        return _updateOutflow(ctx);
    }

    function _isCFAv1(address agreementClass) private view returns (bool) {
        return ISuperAgreement(agreementClass).agreementType() == CFA_ID;
    }

    modifier onlyHost() {
        require(
            msg.sender == address(cfaV1.host),
            "Only host can call callback"
        );
        _;
    }

    modifier onlyCFA(address agreementClass) {
        require(_isCFAv1(agreementClass), "Only CFAv1 supported");
        _;
    }

    // end of superfluid

    /// @notice Explain to an end user what this does
    /// @dev Explain to a developer any extra details
    /// @param _borrowAmount a parameter just like in doxygen (must be followed by parameter name)
    /// @param _interestRate a parameter just like in doxygen (must be followed by parameter name)
    /// @param _principalAmount a parameter just like in doxygen (must be followed by parameter name)
    function mint(
        uint256 _borrowAmount,
        int96 _interestRate,
        uint256 _principalAmount
    ) public payable {
        if (msg.value < uint256(borrowAmount)) {
            revert LoanAgreement__PrincipalNotPaid();
        }

        _applicationID.increment();
        uint256 currentApplicationID = _applicationID.current();

        Application memory newApplication = Application(
            msg.sender, // applicant
            currentApplicationID, // applicationID
            borrowToken.getUnderlyingToken.address,
            collateralToken.getUnderlyingToken.address,
            uint256(_borrowAmount), // borrowAmount
            interestRate, // interestRate
            12,
            uint256(collateralAmount),
            guarantor,
            block.timestamp, // submittedTime
            ApplicationStatus.INACTIVE,
            0, // amountPaid
            randomNum(361, block.difficulty).toString(), // textHue
            randomNum(361, block.timestamp).toString() // bgHue
        );
        applications[currentApplicationID] = newApplication;
        _safeMint(msg.sender, currentApplicationID);
    }

    ///////////////////////
    // Utility Functions //
    ///////////////////////
    /// @dev Generates a random number (used for BG hue and text hue). Change randomNum to Chainlink VRF
    function randomNum(uint256 _mod, uint256 _seed)
        public
        view
        returns (uint256)
    {
        uint256 num = uint256(
            keccak256(abi.encodePacked(block.timestamp, msg.sender, _seed))
        ) % _mod;

        return num;
    }

    /// @dev Converts address type to string, remember to add 0x infront
    function toAsciiString(address x) internal pure returns (string memory) {
        bytes memory s = new bytes(40);
        for (uint256 i = 0; i < 20; i++) {
            bytes1 b = bytes1(uint8(uint256(uint160(x)) / (2**(8 * (19 - i)))));
            bytes1 hi = bytes1(uint8(b) / 16);
            bytes1 lo = bytes1(uint8(b) - 16 * uint8(hi));
            s[2 * i] = char(hi);
            s[2 * i + 1] = char(lo);
        }
        return string(s);
    }

    /// @dev Helper function used in toAsciiString
    function char(bytes1 b) internal pure returns (bytes1 c) {
        if (uint8(b) < 10) return bytes1(uint8(b) + 0x30);
        else return bytes1(uint8(b) + 0x57);
    }

    ////////////////
    // modifiers ///
    ////////////////

    ////////////////////
    // Main Functions //
    ////////////////////

    /// @notice gets details on whether the policy owner is streaming or not
    /// @dev Explain to a developer any extra details
    /// @param _appID a parameter just like in doxygen (must be followed by parameter name)
    /// @return bool Documents the return variables of a contract’s function state variable
    function isActive(uint256 _appID) public view returns (bool) {
        (, int96 flowrate, , ) = _cfa.getFlow( // gets details on whether the policy owner is streaming or not
            borrowToken, // superToken used
            getApplicant(_appID), // sender of the flow
            address(this) // receiver of the flow
        );
        return flowrate >= applications[_appID].interestRate;
    }

    /// @notice Builds the on-chain SVG for the specific application
    /// @dev Explain to a developer any extra details
    /// @param _appID ID of the application of which an SVG NFT is being generated
    /// @return string base64 encoded dynamically generated SVG NFT
    function buildApplicationSvg(uint256 _appID)
        public
        view
        returns (string memory)
    {
        Application memory currentApplication = applications[_appID];
        (
            uint256 applicationYear,
            uint256 applicationMonth,
            uint256 applicationDay
        ) = DateTime.timestampToDate(currentApplication.submittedTime);

        // convert bool to string for isActive
        string memory isApplicationActive = isActive(_appID) ? "True" : "False";

        bytes memory p1 = abi.encodePacked(
            '<svg width="500" height="500" xmlns="http://www.w3.org/2000/svg"><rect y="0" fill="hsl(',
            currentApplication.bgHue,
            ',100%,80% stroke="#000000" x="-0.5" width="500" height="500"/><text dominant-baseline="middle" text-anchor="middle" font-family="serif" font-size="14" y="50" x="50%" fill="#000000">'"Applicant: 0x",
            toAsciiString(currentApplication.applicant),
            "</text>"'<text dominant-baseline="middle" text-anchor="middle" font-family="serif" font-size="18" y="100" x="50%" fill="#000000">'"Guarantor: ",
            toAsciiString(currentApplication.guarantor),
            "</text>"
        );

        bytes memory p2 = abi.encodePacked(
            '<text dominant-baseline="middle" text-anchor="middle" font-family="serif" font-szie"18" y="150" x="50%" fill="#000000">'"Application ID: ",
            Strings.toString(currentApplication.applicationID),
            "</text>"'<text dominant-baseline="middle" text-anchor="middle" font-family="serif" font-size="18" y="200" x="50%" fill=""#000000">'"Interest Rate: ",
            Strings.toString(currentApplication.collateralAmount),
            "</text>"'<text dominant-baseline="middle" text-anchor="middle" font-family="serif" font-size="18" y="250" x="50%" fill="#000000">'"Loan Amount: ",
            Strings.toString(currentApplication.borrowAmount),
            "</text>"'<text dominant-baseline="middle" text-anchor="middle" font-family="Noto Sans JP" font-size="20" y="100" x="50%" fill="#000000">'"Credit Score: ",
            personToCreditScore[currentApplication.applicant],
            "</text>"
        );

        bytes memory p3 = abi.encodePacked(
            '<text dominant-baseline="middle" text-anchor="middle" font-family="serif" font-size="18" y="300" x="50%" fill="#000000">'"Interest Rate: ",
            Strings.toString(uint96(currentApplication.interestRate)),
            "</text>"'<text dominant-baseline="middle" text-anchor="middle" font-family="serif" font-size="18" y="300" x="50%" fill="#000000">'"Approval Time: ",
            Strings.toString(applicationMonth),
            "/",
            Strings.toString(applicationDay),
            "/",
            Strings.toString(applicationYear),
            "</text>"
        );

        bytes memory p4 = abi.encodePacked(
            '<text dominant-baseline="middle" text-anchor="middle" font-family="serif" font-size="18" y="300" x="50%" fill="#000000">'"Status: ",
            currentApplication.status,
            "</text>"'<text dominant-baseline="middle" text-anchor="middle" font-family="serif" font-size="18" y="350" x="50%" fill="#000000">'"Date Submitted: ",
            Strings.toString(currentApplication.submittedTime),
            "</text>"'<text dominant-baseline="middle" text-anchor="middle" font-family="serif" font-size="18" y="400" x="50%" fill="#000000">'"Duration (months): ",
            Strings.toString(currentApplication.durationInMonths),
            "</text>"'<text dominant-baseline="middle" text-anchor="middle" font-family="serif" font-size="18" y="450" x="50%" fill="#000000">'"Borrowed Token: ",
            toAsciiString(currentApplication.borrowToken),
            "</text>"'<text dominant-baseline="middle" text-anchor="middle" font-family="serif" font-size="18" y="500" x="50%" fill="#000000">'"Collateral Token: ",
            toAsciiString(currentApplication.collateralToken),
            "</text>""</svg>"
        );

        return Base64.encode(bytes.concat(p1, p2, p3, p4));
    }

    /// @notice Explain to an end user what this does
    /// @dev Explain to a developer any extra details
    /// @param _appID a parameter just like in doxygen (must be followed by parameter name)
    /// @return string Documents the return variables of a contract’s function state variable
    function setMetadata(uint256 _appID) public view returns (string memory) {
        Application memory currentApplication = applications[_appID];
        string memory isApplicationActive = isActive(_appID) ? "True" : "False";

        bytes memory m1 = abi.encodePacked(
            '{"name":"'"Loan Agreement"'", "description": "'"Undercollateralized loan agreement secured from Dapplicant."'", "image": "'"data:image/svg+xml;base64,",
            buildApplicationSvg(_appID),
            '", "attributes": [{"trait_type":"Applicant", ''"value": "0x',
            toAsciiString(currentApplication.applicant),
            '"}''{"trait_type": "Application ID",''"value":"',
            Strings.toString(currentApplication.applicationID),
            '"}'
        );

        bytes memory m2 = abi.encodePacked('{"trait_type": "Borrowed Token",',
            '"value":"',toAsciiString(currentApplication.borrowToken),'"},',
            '{"trait_type":"Collateral Token",',
            '"value":"',toAsciiString(currentApplication.collateralToken),'"},',
            '{"trait_type":"Borrow Amount",',
            '"value":"',Strings.toString(currentApplication.borrowAmount),'"},'
            '{"trait_type":"Duration In Months",',
            '"value":"',Strings.toString(currentApplication.durationInMonths),'"},');

        bytes memory m3 = abi.encodePacked(
            '{"trait_type":"Amount Paid", ''"value": "',
            Strings.toString(currentApplication.amountPaid),
            '"},''{"trait_type":"Interest Rate",''"value": "',
            Strings.toString(uint96(currentApplication.interestRate)),
            '"},''{"trait_type":"Approved Time",''"value": "',
            Strings.toString(currentApplication.submittedTime),
            '"},'
        );

        bytes memory m4 = abi.encodePacked(
            '{"trait_type":"Status",''"value": "',
            currentApplication.status,
            '"},''{"trait_type":"Collateral Amount", ''"value": "',
            Strings.toString(currentApplication.collateralAmount),
            '"},''{"trait_type":"Guarantor",''"value":"',
            toAsciiString(currentApplication.guarantor),
            '"}'"]}"
        );

        return
            string(
                abi.encodePacked(
                    "data:application/json;base64,",
                    Base64.encode(bytes.concat(m1, m2, m3, m4))
                )
            );
    }

    /// @notice Explain to an end user what this does
    /// @dev Explain to a developer any extra details
    /// @param _appID a parameter just like in doxygen (must be followed by parameter name)
    /// @return string Documents the return variables of a contract’s function state variable
    function tokenURI(uint256 _appID)
        public
        view
        virtual
        override
        returns (string memory)
    {
        if (!_exists(_appID)) {
            revert LoanAgreement__ApplicationDoesNotExist();
        }
        return '1';
        // return buildApplicationSvg(_appID);
    }

    /// @notice Explain to an end user what this does
    /// @dev Explain to a developer any extra details
    /// @param _appID a parameter just like in doxygen (must be followed by parameter name)
    /// @return uint256 Documents the return variables of a contract’s function state variable
    function getApplicationApprovalTime(uint256 _appID)
        public
        view
        returns (uint256)
    {
        if (!_exists(_appID)) {
            revert LoanAgreement__ApplicationDoesNotExist();
        }
        (uint256 approvalTimestamp, , , ) = _cfa.getFlow( // gets details on whether the policy owner is streaming or not
            borrowToken, // superToken used
            getApplicant(_appID), // sender of the flow
            address(this) // receiver of the flow
        );

        return approvalTimestamp;
    }

    /// @notice Explain to an end user what this does
    /// @dev Explain to a developer any extra details
    /// @param _receiver a parameter just like in doxygen (must be followed by parameter name)
    /// @param _amount a parameter just like in doxygen (must be followed by parameter name)
    function sendLoanAgreementContract(address _receiver, uint256 _amount)
        external
    {
        if (msg.sender != govContractAddress) {
            revert LoanAgreement__NotGovernanceContract();
        }

        (bool success, ) = _receiver.call{value: _amount}("");
        if (!success) {
            revert LoanAgreement__LoanAgreementTransferFailed();
        }
    }

    //////////////////////
    // Getter Functions //
    //////////////////////

    /// @notice Explain to an end user what this does
    /// @dev Explain to a developer any extra details
    /// @param _appID a parameter just like in doxygen (must be followed by parameter name)
    /// @return address the return variables of a contract’s function state variable
    function getApplicant(uint256 _appID) public view returns (address) {
        Application memory currentApplication = applications[_appID];
        address applicant = currentApplication.applicant;
        return applicant;
    }

    /// @notice Explain to an end user what this does
    /// @dev Explain to a developer any extra details
    /// @param from a parameter just like in doxygen (must be followed by parameter name)
    /// @param to a parameter just like in doxygen (must be followed by parameter name)
    /// @param _appID a parameter just like in doxygen (must be followed by parameter name)
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 _appID
    ) internal virtual override {
        super._beforeTokenTransfer(from, to, _appID);

        Application storage currentApplication = applications[_appID];
        currentApplication.applicant = to;
    }

    /// @notice To pause and unpause the contract, in case, if any vulnerability is discovered.
    function pause() public onlyOwner {
        _pause();
    }

    /// @notice To pause and unpause the contract, in case, if any vulnerability is discovered.
    function unpause() public onlyOwner {
        _unpause();
    }
}
