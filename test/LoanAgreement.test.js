const { Framework } = require('@superfluid-finance/sdk-core');
const { assert } = require('chai');
const { expectRevert } = require('@openzeppelin/test-helpers');
const { ethers, web3, network } = require('hardhat');
const daiABI = require('./abis/fDAIBAI');
const LoanAgreementArtifact = require('../artifacts/contracts/LoanAgreement.sol/LoanAgreement.json');

const LoanABI = LoanAgreementArtifact.abi;

const deployFramework = require('@superfluid-finance/ethereum-contracts/scripts/deploy-framework');
const deployTestToken = require('@superfluid-finance/ethereum-contracts/scripts/deploy-test-token');
const deploySuperToken = require('@superfluid-finance/ethereum-contracts/scripts/deploy-super-token');

const provider = web3;

let accounts;

let sf;
let dai;
let daix;
let col;
let colx;
let borrower;
let lender;
let guarantor;
let outsider;
let LoanAgreementFactory;
let priceFeed;
let loanAgreement;

const errorHandler = (err) => {
  if (err) throw err;
};

before(async function () {
  //get accounts from hardhat
  accounts = await ethers.getSigners();

  //deploy the framework
  await deployFramework(errorHandler, {
    web3,
    from: accounts[0].address,
  });

  //deploy a fake erc20 token for borrow token
  let fDAIAddress = await deployTestToken(errorHandler, [':', 'fDAI'], {
    web3,
    from: accounts[0].address,
  });

  //deploy another fake erc20 token for collateral token
  let fCOLAddress = await deployTestToken(errorHandler, [':', 'fCOL'], {
    web3,
    from: accounts[0].address,
  });

  //deploy a fake erc20 wrapper super token around the fDAI token
  let fDAIxAddress = await deploySuperToken(errorHandler, [':', 'fDAI'], {
    web3,
    from: accounts[0].address,
  });

  let fCOLxAddress = await deploySuperToken(errorHandler, [':', 'fCOL'], {
    web3,
    from: accounts[0].address,
  });

  //initialize the superfluid framework...put custom and web3 only bc we are using hardhat locally
  sf = await Framework.create({
    networkName: 'custom',
    provider,
    dataMode: 'WEB3_ONLY',
    resolverAddress: process.env.RESOLVER_ADDRESS, //this is how you get the resolver address
    protocolReleaseVersion: 'test',
  });

  borrower = await sf.createSigner({
    signer: accounts[0],
    provider: provider,
  });

  lender = await sf.createSigner({
    signer: accounts[1],
    provider: provider,
  });

  guarantor = await sf.createSigner({
    signer: accounts[2],
    provider: provider,
  });

  outsider = await sf.createSigner({
    signer: accounts[3],
    provider: provider,
  });
  //use the framework to get the super toen
  daix = await sf.loadSuperToken('fDAIx');
  colx = await sf.loadSuperToken('fCOLx');

  //get the contract object for the erc20 token
  let daiAddress = daix.underlyingToken.address;
  dai = new ethers.Contract(daiAddress, daiABI, accounts[0]);

  let coladdress = colx.underlyingToken.address;
  col = new ethers.Contract(coladdress, daiABI, accounts[0]);

  // Deploy mock Governance Contract
  console.log('Deploying Governance Contract...');
  govContract = await ethers.getContractFactory('Governance');
  GovContract = await govContract.deploy();

  let LoanAgreementFactory = await ethers.getContractFactory(
    'LoanAgreement',
    accounts[0]
  );
  LoanAgreementFactory = await LoanAgreementFactory.deploy(
    sf.settings.config.hostAddress,
    daix.address,
    colx.address,
    GovContract.address,
    ethers.utils.parseEther('10000'),
    10,
    12,
    ethers.utils.parseEther('1000'),
    guarantor.address,
    borrower.address
  );
  await LoanAgreementFactory.deployed();

  let MockV3Aggregator = await ethers.getContractFactory(
    'MockV3Aggregator',
    accounts[0]
  );

  //fake price of collateral token to simulate oracle - 10 borrow tokens for 1 collateral tokens, collateralTokenAddress is used
  priceFeed = await MockV3Aggregator.deploy(10000000000);

  await priceFeed.deployed();

  let borrowAmount = ethers.utils.parseEther('1000');
  let interest = 10;
  let paybackMonths = 12;
  let collateralAmount = ethers.utils.parseEther('1000');

  await LoanAgreementFactory.createNewLoan(
    borrowAmount, //borrowing 1000 fDAI tokens
    interest, // 10% annual interest
    paybackMonths, //in months
    collateralAmount, // total collateral amount required
    guarantor.address, //address of guarantor
    borrower.address, //address of borrower
    daix.address,
    colx.address,
    sf.settings.config.hostAddress,
    priceFeed.address,
    8
  );

  let loanAddress = await LoanAgreementFactory.idToLoan(1);

  loanAgreement = new ethers.Contract(loanAddress, LoanABI, accounts[0]);
});

beforeEach(async function () {
  console.log('Topping up account balances...');

  await dai
    .connect(guarantor)
    .mint(guarantor.address, ethers.utils.parseEther('10000'));

  await dai
    .connect(lender)
    .mint(lender.address, ethers.utils.parseEther('10000'));

  await col
    .connect(borrower)
    .mint(borrower.address, ethers.utils.parseEther('1000'));

  await dai
    .connect(guarantor)
    .approve(daix.address, ethers.utils.parseEther('10000'));
  await dai
    .connect(lender)
    .approve(daix.address, ethers.utils.parseEther('10000'));
  await col
    .connect(borrower)
    .approve(colx.address, ethers.utils.parseEther('1000'));

  const guarantorDaixUpgradeOperation = daix.upgrade({
    amount: ethers.utils.parseEther('10000'),
  });
  const lenderDaixUpgradeOperation = daix.upgrade({
    amount: ethers.utils.parseEther('10000'),
  });
  const borrowerColxUpgradeOperation = colx.upgrade({
    amount: ethers.utils.parseEther('1000'),
  });

  await guarantorDaixUpgradeOperation.exec(guarantor);
  await lenderDaixUpgradeOperation.exec(lender);
  await borrowerColxUpgradeOperation.exec(borrower);
});

describe('loan agreement deployment', async function () {
  it('0 deploys correctly', async () => {
    let borrowAmount = ethers.utils.parseEther('1000');
    let interest = 10;
    let paybackMonths = 12;

    console.log(
      `
        New Loan Generated...
        Loan Address: ${loanAgreement.address}
        Borrow Amount: ${await loanAgreement.borrowAmount()}
        Interest Rate: ${await loanAgreement.interestRate()}
        Payback Months: ${await loanAgreement.paybackMonths()}
        Collateral Token: ${await loanAgreement.collateralToken()}
        Collateral Amount: ${await loanAgreement.collateralAmount()}
        Borrow Token: ${await loanAgreement.borrowToken()}
        Borrow Amount: ${await loanAgreement.borrowAmount()}
        guarantor: ${await loanAgreement.guarantor()}
        Borrower: ${await loanAgreement.borrower()}
        `
    );

    let actualBorrowAmount = await loanAgreement.borrowAmount();
    let actualInterest = await loanAgreement.interestRate();
    let actualPaybackMonths = await loanAgreement.paybackMonths();
    let acutalguarantorAddress = await loanAgreement.guarantor();
    let actualBorrower = await loanAgreement.borrower();
    let actualBorrowToken = await loanAgreement.borrowToken();
    let actualCollateralToken = await loanAgreement.collateralToken();
    let actualPriceFeed = await loanAgreement.priceFeed();

    assert.equal(
      borrowAmount,
      actualBorrowAmount.toString(),
      'borrow amount not equal to intended amount'
    );

    assert.equal(
      interest,
      actualInterest,
      'interest rate not equal to intended rate'
    );

    assert.equal(
      paybackMonths,
      actualPaybackMonths,
      'payback months not equal to intended months'
    );

    assert.equal(
      guarantor.address,
      acutalguarantorAddress,
      'wrong guarantor address'
    );

    assert.equal(borrower.address, actualBorrower, 'wrong borrower address');

    assert.equal(daix.address, actualBorrowToken, 'wrong borrow token');

    assert.equal(colx.address, actualCollateralToken, 'wrong collateral token');

    assert.equal(priceFeed.address, actualPriceFeed, 'wrong mock address');
  });
});

describe('Loan is initialized properly', async function () {
  it('1 - Depositing collateral works properly', async () => {
    //1) Calling sendCollateral should deposit collateral in contract at proper amount
    //2) Calling sendCollateral should revert if borrower has insufficient funds
    let collateral = await loanAgreement.collateralAmount();

    let colxApprovalOperation = colx.approve({
      receiver: loanAgreement.address,
      amount: collateral,
    });

    await colxApprovalOperation.exec(borrower);

    await loanAgreement.connect(borrower).sendCollateral();

    let loanContractBalance = await colx.balanceOf({
      account: loanAgreement.address,
      providerOrSigner: borrower,
    });

    assert.equal(
      collateral,
      loanContractBalance,
      'contract should have all collateral'
    );
  });

  it('2 First flow into contract works correctly', async () => {
    let loanContractBalance = await colx.balanceOf({
      account: loanAgreement.address,
      providerOrSigner: borrower,
    });

    let loadguarantorBalance = await daix.balanceOf({
      account: guarantor.address,
      providerOrSigner: borrower,
    });

    let guarantorFlowOperation = sf.cfaV1.createFlow({
      superToken: daix.address,
      receiver: loanAgreement.address,
      flowRate: '3215019290123456', // ~100k per year in usd
    });

    await guarantorFlowOperation.exec(guarantor);

    let guarantorNetFlowRate = await sf.cfaV1.getNetFlow({
      superToken: daix.address,
      account: guarantor.address,
      providerOrSigner: guarantor,
    });

    let borrowerNetFlowRate = await sf.cfaV1.getNetFlow({
      superToken: daix.address,
      account: borrower.address,
      providerOrSigner: guarantor,
    });

    let contractNetFlowRate = await sf.cfaV1.getNetFlow({
      superToken: daix.address,
      account: loanAgreement.address,
      providerOrSigner: guarantor,
    });

    console.log('guarantor flow into contract', guarantorNetFlowRate);
    console.log('borrower flow from contract', borrowerNetFlowRate);
    console.log('contract net flow rate', contractNetFlowRate);

    assert.equal(guarantorNetFlowRate, -3215019290123456);

    assert.equal(borrowerNetFlowRate, 3215019290123456);

    assert.equal(contractNetFlowRate, 0);
  });

  it('3 - Flow Reduction works correctly', async () => {
    //testing reduction in flow

    const getguarantorContractFlow = await sf.cfaV1.getFlow({
      superToken: daix.address,
      sender: guarantor.address,
      receiver: loanAgreement.address,
      providerOrSigner: guarantor,
    });

    console.log('current flow is.....', getguarantorContractFlow.flowRate);

    const reduceFlowOperation = sf.cfaV1.updateFlow({
      superToken: daix.address,
      receiver: loanAgreement.address,
      flowRate: '1000000',
    });

    await reduceFlowOperation.exec(guarantor);

    const newguarantorFlowRate = await sf.cfaV1.getFlow({
      superToken: daix.address,
      sender: guarantor.address,
      receiver: loanAgreement.address,
      providerOrSigner: guarantor,
    });

    console.log('New guarantor flow rate:', newguarantorFlowRate.flowRate);

    const newBorrowerFlowRate = await sf.cfaV1.getFlow({
      superToken: daix.address,
      sender: loanAgreement.address,
      receiver: borrower.address,
      providerOrSigner: borrower,
    });

    console.log('New Borrower flow rate: ', newBorrowerFlowRate.flowRate);

    const newContractFlowRate = await sf.cfaV1.getNetFlow({
      superToken: daix.address,
      account: loanAgreement.address,
      providerOrSigner: guarantor,
    });

    console.log('New contract flow rate:', newContractFlowRate);

    assert.equal(
      newguarantorFlowRate.flowRate,
      '1000000',
      'wrong guarantor flow rate'
    );

    assert.equal(
      newBorrowerFlowRate.flowRate,
      '1000000',
      'wrong borrower flow rate'
    );

    assert.equal(newContractFlowRate, 0, 'contract is not balanced');
  });

  it('4 Lend Function works correctly', async () => {
    //should reduce flow rate, test to ensure failure, then test update flow rate
    //try calling lend - should revert
    const borrowAmount = await loanAgreement.borrowAmount();

    const lenderApprovalOperation = daix.approve({
      receiver: loanAgreement.address,
      amount: borrowAmount,
    });

    await lenderApprovalOperation.exec(lender);

    const guarantorUpdateFlowOperation = sf.cfaV1.updateFlow({
      superToken: daix.address,
      receiver: loanAgreement.address,
      flowRate: '3215019290123456',
    });

    await guarantorUpdateFlowOperation.exec(guarantor);

    let borrowerBalBefore = await daix.balanceOf({
      account: borrower.address,
      providerOrSigner: borrower,
    });

    let lenderBalBefore = await daix.balanceOf({
      account: lender.address,
      providerOrSigner: lender,
    });

    let borrowerFlowRateBefore = await sf.cfaV1.getFlow({
      superToken: daix.address,
      sender: loanAgreement.address,
      receiver: borrower.address,
      providerOrSigner: borrower,
    });

    let lenderFlowRateBefore = await sf.cfaV1.getFlow({
      superToken: daix.address,
      sender: loanAgreement.address,
      receiver: lender.address,
      providerOrSigner: lender,
    });

    console.log('borrow bal before', borrowerBalBefore);
    console.log('lender bal before', lenderBalBefore);
    console.log('borrow amount', borrowAmount.toString());

    await loanAgreement.connect(lender).lend();

    let lenderBalAfter = await daix.balanceOf({
      account: lender.address,
      providerOrSigner: lender,
    });

    let borrowerBalAfter = await daix.balanceOf({
      account: borrower.address,
      providerOrSigner: borrower,
    });

    let borrowerFlowRateAfter = await sf.cfaV1.getFlow({
      superToken: daix.address,
      sender: loanAgreement.address,
      receiver: borrower.address,
      providerOrSigner: borrower,
    });

    let lenderFlowRateAfter = await sf.cfaV1.getFlow({
      superToken: daix.address,
      sender: loanAgreement.address,
      receiver: lender.address,
      providerOrSigner: lender,
    });

    let guarantorFlow = await sf.cfaV1.getFlow({
      superToken: daix.address,
      sender: guarantor.address,
      receiver: loanAgreement.address,
      providerOrSigner: lender,
    });

    let expectedLender = await loanAgreement.lender();
    let loanStartedTime = await loanAgreement.loanStartTime();

    let expectedFlowRate = await loanAgreement.getPaymentFlowRate();
    console.log('expected lender flow rate', expectedFlowRate.flowRate);

    assert.isAtLeast(
      Number(borrowerBalBefore + borrowAmount),
      Number(borrowerBalAfter),
      'borrower bal did not increase enough'
    );

    assert.isAtMost(
      lenderBalBefore - borrowAmount,
      Number(lenderBalAfter),
      'lender should have less money'
    );

    assert.equal(
      Number(borrowerFlowRateAfter.flowRate),
      Number(
        Number(guarantorFlow.flowRate) - Number(lenderFlowRateAfter.flowRate)
      ),
      'borrower flow rate incorrect'
      //borrower flow rate should decrease by paymentFlowrate amount after lend is called
    );

    assert.equal(
      //lender flow rate should increase by proper amount when lend is called
      Number(lenderFlowRateAfter.flowRate),
      Number(borrowerFlowRateBefore.flowRate) -
        (Number(borrowerFlowRateBefore.flowRate) - expectedFlowRate),
      'lender flowRate incorrect'
    );

    assert.equal(
      Number(lender.address),
      Number(expectedLender),
      'lender is not correct'
    );

    assert.notEqual(loanStartedTime, 0, 'loan has not been started properly');
  });

  it('5 - flow is reduced', async () => {
    const lenderInitialFlowRate = await sf.cfaV1.getFlow({
      superToken: daix.address,
      sender: loanAgreement.address,
      receiver: lender.address,
      providerOrSigner: lender,
    });

    console.log(lenderInitialFlowRate.flowRate);

    const collateralFlowRate = await loanAgreement._getCollateralFlowRate();
    console.log('expected collateral flow rate is: ', collateralFlowRate);
    const [, price, , ,] = await priceFeed.latestRoundData();
    console.log('price is:', price);

    const colAmount = await loanAgreement.collateralAmount();
    console.log('Collateral Amount', colAmount);
    const [, collateralPrice, , ,] = await priceFeed.latestRoundData();
    console.log('Current price of collateral token', collateralPrice);

    const updateFlowOp = await sf.cfaV1.updateFlow({
      superToken: daix.address,
      receiver: loanAgreement.address,
      flowRate: '10000',
    });

    await updateFlowOp.exec(guarantor);

    const newguarantorFlowRate = await sf.cfaV1.getFlow({
      superToken: daix.address,
      sender: guarantor.address,
      receiver: loanAgreement.address,
      providerOrSigner: guarantor,
    });

    console.log('updated contract flow rate', newguarantorFlowRate.flowRate);

    const newBorrowerNetflow = await sf.cfaV1.getNetFlow({
      superToken: daix.address,
      account: borrower.address,
      providerOrSigner: borrower,
    });

    console.log('new borrower net flow:', newBorrowerNetflow);

    const collateralFlowToLender = await sf.cfaV1.getFlow({
      superToken: colx.address,
      sender: loanAgreement.address,
      receiver: lender.address,
      providerOrSigner: lender,
    });

    const borrowFlowToLender = await sf.cfaV1.getFlow({
      superToken: daix.address,
      sender: loanAgreement.address,
      receiver: lender.address,
      providerOrSigner: lender,
    });
    console.log(
      'borrow token amount sent to lender: ',
      borrowFlowToLender.flowRate
    );

    const borrowerNewFlowRate = await sf.cfaV1.getFlow({
      superToken: daix.address,
      sender: loanAgreement.address,
      receiver: borrower.address,
      providerOrSigner: borrower,
    });

    console.log('lender init flowRate: ', lenderInitialFlowRate.flowRate);
    console.log('Collateral flow to lender', collateralFlowToLender.flowRate);

    assert.equal(borrowFlowToLender.flowRate, 0, 'should be zero');
    //new flow rate should be correct - take a decimal place away bc the price of the collateral is 10 for every 1 borrow token
    assert.equal(
      Number(collateralFlowToLender.flowRate),
      Math.floor(Number(lenderInitialFlowRate.flowRate) / 10),
      'collateral flow rate is incorrect'
    );
    //remaining amount should go to borrower
    assert.equal(
      borrowerNewFlowRate.flowRate,
      '10000',
      'borrower new flow should be zero'
    );
  });

  it('6 - should allow a loan to become solvent again after a flow is reduced', async () => {
    const collateralFlowToLenderBefore = await sf.cfaV1.getFlow({
      superToken: colx.address,
      sender: loanAgreement.address,
      receiver: lender.address,
      providerOrSigner: lender,
    });

    const borrowTokenFlowToLenderBefore = await sf.cfaV1.getFlow({
      superToken: daix.address,
      sender: loanAgreement.address,
      receiver: lender.address,
      providerOrSigner: lender,
    });
    //should be 0

    const borrowTokenFlowToBorrowerBefore = await sf.cfaV1.getFlow({
      superToken: daix.address,
      sender: loanAgreement.address,
      receiver: borrower.address,
      providerOrSigner: lender,
    });
    //should be ~100000

    let guarantorFlowOperation = sf.cfaV1.updateFlow({
      superToken: daix.address,
      receiver: loanAgreement.address,
      flowRate: '3215019290123456', // ~100k per year in usd
    });

    await guarantorFlowOperation.exec(guarantor);

    const guarantorFlowRate = await sf.cfaV1.getFlow({
      superToken: daix.address,
      sender: guarantor.address,
      receiver: loanAgreement.address,
      providerOrSigner: lender,
    });

    const collateralFlowToLenderAfter = await sf.cfaV1.getFlow({
      superToken: colx.address,
      sender: loanAgreement.address,
      receiver: lender.address,
      providerOrSigner: lender,
    });
    //should be 0

    const borrowTokenFlowToLenderAfter = await sf.cfaV1.getFlow({
      superToken: daix.address,
      sender: loanAgreement.address,
      receiver: lender.address,
      providerOrSigner: lender,
    });
    //should be total inflow to contract from guarantor - flow to lender

    const borrowTokenFlowToBorrowerAfter = await sf.cfaV1.getFlow({
      superToken: daix.address,
      sender: loanAgreement.address,
      receiver: borrower.address,
      providerOrSigner: lender,
    });

    //should be total inflow to contract from guarantor - flow to lender

    assert.equal(
      collateralFlowToLenderAfter.flowRate,
      0,
      'collateral flow rate after should be 0'
    );

    assert.equal(
      Number(borrowTokenFlowToBorrowerAfter.flowRate),
      Number(
        Number(guarantorFlowRate.flowRate) -
          Number(borrowTokenFlowToLenderAfter.flowRate)
      ),
      'borrower flow rate incorrect'
      //borrower flow rate should decrease by paymentFlowrate amount after lend is called
    );

    assert.equal(
      //lender flow rate should increase by proper amount when lend is called
      Number(borrowTokenFlowToLenderAfter.flowRate),
      Number(guarantorFlowRate.flowRate) -
        Number(borrowTokenFlowToBorrowerAfter.flowRate),
      'lender flowRate incorrect'
    );
  });

  it('7 - flow is deleted', async () => {
    //delete flow
    const lenderInitialFlowRate = await sf.cfaV1.getFlow({
      superToken: daix.address,
      sender: loanAgreement.address,
      receiver: lender.address,
      providerOrSigner: lender,
    });

    const colAmount = await loanAgreement.collateralAmount();
    console.log('Collateral Amount', colAmount);
    const [, collateralPrice, , ,] = await priceFeed.latestRoundData();
    console.log('Current price of collateral token', collateralPrice);

    const deleteFlowOp = await sf.cfaV1.deleteFlow({
      superToken: daix.address,
      sender: guarantor.address,
      receiver: loanAgreement.address,
    });

    await deleteFlowOp.exec(guarantor);

    const newguarantorFlowRate = await sf.cfaV1.getFlow({
      superToken: daix.address,
      sender: guarantor.address,
      receiver: loanAgreement.address,
      providerOrSigner: guarantor,
    });

    console.log('updated contract flow rate', newguarantorFlowRate.flowRate);

    const newBorrowerNetflow = await sf.cfaV1.getNetFlow({
      superToken: daix.address,
      account: borrower.address,
      providerOrSigner: borrower,
    });

    console.log('new borrower net flow:', newBorrowerNetflow);

    const collateralFlowToLender = await sf.cfaV1.getFlow({
      superToken: colx.address,
      sender: loanAgreement.address,
      receiver: lender.address,
      providerOrSigner: lender,
    });

    const borrowFlowToLender = await sf.cfaV1.getFlow({
      superToken: daix.address,
      sender: loanAgreement.address,
      receiver: lender.address,
      providerOrSigner: lender,
    });
    console.log(
      'borrow token amount sent to lender: ',
      borrowFlowToLender.flowRate
    );

    const borrowerNewFlowRate = await sf.cfaV1.getFlow({
      superToken: daix.address,
      sender: loanAgreement.address,
      receiver: borrower.address,
      providerOrSigner: borrower,
    });

    console.log('lender init flowRate: ', lenderInitialFlowRate.flowRate);
    console.log('Collateral flow to lender', collateralFlowToLender.flowRate);

    assert.equal(
      newguarantorFlowRate.flowRate,
      0,
      'guarantor to contract flow rate should be 0'
    );

    assert.equal(
      borrowFlowToLender.flowRate,
      0,
      'lender should no longer receive daix'
    );
    //new flow rate should be correct - take a decimal place away bc the price of the collateral is 10 for every 1 borrow token
    assert.equal(
      Number(collateralFlowToLender.flowRate),
      Math.floor(Number(lenderInitialFlowRate.flowRate) / 10),
      'collateral flow rate is incorrect'
    );
    //remaining amount should go to borrower
    assert.equal(
      borrowerNewFlowRate.flowRate,
      '0',
      'borrower new flow should be zero'
    );
  });

  it('8 - should allow loan to become solvent again after deletion ', async () => {
    //re start flow
    const collateralFlowToLenderBefore = await sf.cfaV1.getFlow({
      superToken: colx.address,
      sender: loanAgreement.address,
      receiver: lender.address,
      providerOrSigner: lender,
    });

    const borrowTokenFlowToLenderBefore = await sf.cfaV1.getFlow({
      superToken: daix.address,
      sender: loanAgreement.address,
      receiver: lender.address,
      providerOrSigner: lender,
    });
    //should be 0
    const borrowTokenFlowToBorrowerBefore = await sf.cfaV1.getFlow({
      superToken: daix.address,
      sender: loanAgreement.address,
      receiver: borrower.address,
      providerOrSigner: lender,
    });
    //should be ~100000

    let guarantorFlowOperation = sf.cfaV1.createFlow({
      superToken: daix.address,
      receiver: loanAgreement.address,
      flowRate: '3215019290123456', // ~100k per year in usd
    });

    await guarantorFlowOperation.exec(guarantor);

    const guarantorFlowRate = await sf.cfaV1.getFlow({
      superToken: daix.address,
      sender: guarantor.address,
      receiver: loanAgreement.address,
      providerOrSigner: lender,
    });

    const collateralFlowToLenderAfter = await sf.cfaV1.getFlow({
      superToken: colx.address,
      sender: loanAgreement.address,
      receiver: lender.address,
      providerOrSigner: lender,
    });
    //should be 0

    const borrowTokenFlowToLenderAfter = await sf.cfaV1.getFlow({
      superToken: daix.address,
      sender: loanAgreement.address,
      receiver: lender.address,
      providerOrSigner: lender,
    });
    //should be total inflow to contract from guarantor - flow to lender

    const borrowTokenFlowToBorrowerAfter = await sf.cfaV1.getFlow({
      superToken: daix.address,
      sender: loanAgreement.address,
      receiver: borrower.address,
      providerOrSigner: lender,
    });

    //should be total inflow to contract from guarantor - flow to lender

    assert.equal(
      collateralFlowToLenderAfter.flowRate,
      0,
      'collateral flow rate after should be 0'
    );

    assert.equal(
      Number(borrowTokenFlowToBorrowerAfter.flowRate),
      Number(
        Number(guarantorFlowRate.flowRate) -
          Number(borrowTokenFlowToLenderAfter.flowRate)
      ),
      'borrower flow rate incorrect'
      //borrower flow rate should decrease by paymentFlowrate amount after lend is called
    );

    assert.equal(
      //lender flow rate should increase by proper amount when lend is called
      Number(borrowTokenFlowToLenderAfter.flowRate),
      Number(guarantorFlowRate.flowRate) -
        Number(borrowTokenFlowToBorrowerAfter.flowRate),
      'lender flowRate incorrect'
    );
  });

  //todo fix - looks like transfer and approve opp don't work here
  it('9 closing the loan early with payment from borrower', async () => {
    //borrower sends payment to pay off loan
    const amountLeft = await loanAgreement
      .connect(borrower)
      .getTotalAmountRemaining();
    const lenderBalBefore = await daix.balanceOf({
      account: lender.address,
      providerOrSigner: lender,
    });

    //somewhat impractical, but we'll assume that the borrower is sent money from lender (they just need the money in general to pay off loan)
    const transferTokenOperation = daix.transfer({
      receiver: borrower.address,
      amount: amountLeft,
    });

    await transferTokenOperation.exec(lender);

    const borrowerApprovalOperation = await daix.approve({
      receiver: loanAgreement.address,
      amount: amountLeft,
    });

    await borrowerApprovalOperation.exec(borrower);

    await loanAgreement.connect(borrower).closeOpenLoan(amountLeft);

    const lenderFlowRateAfterCompletion = await sf.cfaV1.getFlow({
      superToken: daix.address,
      sender: loanAgreement.address,
      receiver: lender.address,
      providerOrSigner: lender,
    });

    const borrowerFlowRateAfterCompletion = await sf.cfaV1.getFlow({
      superToken: daix.address,
      sender: loanAgreement.address,
      receiver: borrower.address,
      providerOrSigner: borrower,
    });

    const guarantorFlowRateAfterCompletion = await sf.cfaV1.getFlow({
      superToken: daix.address,
      sender: guarantor.address,
      receiver: loanAgreement.address,
      providerOrSigner: guarantor,
    });

    assert.equal(
      lenderFlowRateAfterCompletion.flowRate,
      0,
      'lender flow rate should now be zero'
    );
    assert.equal(
      borrowerFlowRateAfterCompletion.flowRate,
      guarantorFlowRateAfterCompletion.flowRate,
      'guarantor should now send 100% of flow to borrower'
    );
    assert.isAtLeast(
      Number(Number(lenderBalBefore) + Number(amountLeft)),
      Number(lenderBalBefore),
      'lender should see increase in borrow token balance'
    );
  });

  it('10 closing the loan early from lender', async () => {
    //other party sends payment to pay off loan
    let borrowAmount = ethers.utils.parseEther('1000');
    let interest = 10;
    let paybackMonths = 12;
    let collateralAmount = ethers.utils.parseEther('1000');

    await LoanAgreementFactory.createNewLoan(
      borrowAmount, //borrowing 1000 fDAI tokens
      interest, // 10% annual interest
      paybackMonths, //in months
      collateralAmount, // total collateral amount required
      guarantor.address, //address of guarantor
      borrower.address, //address of borrower
      daix.address,
      colx.address,
      sf.settings.config.hostAddress,
      priceFeed.address,
      8
    );

    let loanAddress = await LoanAgreementFactory.idToLoan(1);
    let loan2Address = await LoanAgreementFactory.idToLoan(2);
    let loanAgreement2 = new ethers.Contract(
      loan2Address,
      LoanABI,
      accounts[0]
    );

    //send collateral
    let collateral = await loanAgreement2.collateralAmount();

    let colxApprovalOperation = colx.approve({
      receiver: loanAgreement2.address,
      amount: collateral,
    });

    await colxApprovalOperation.exec(borrower);

    console.log('sending collateral to loan 2');

    await loanAgreement2.connect(borrower).sendCollateral();

    //create flow

    const createFlowOperation = sf.cfaV1.createFlow({
      superToken: daix.address,
      receiver: loanAgreement2.address,
      flowRate: '3215019290123456',
    });

    await createFlowOperation.exec(guarantor);

    //lend

    const lenderApprovalOperation = daix.approve({
      receiver: loanAgreement2.address,
      amount: borrowAmount.toString(),
    });

    await lenderApprovalOperation.exec(lender);

    console.log('lender lends for loan 2');

    await loanAgreement2.connect(lender).lend();

    //make sure it worked
    const borrowerFlow = await sf.cfaV1.getFlow({
      superToken: daix.address,
      sender: loanAgreement2.address,
      receiver: borrower.address,
      providerOrSigner: borrower,
    });

    const lenderFlow = await sf.cfaV1.getFlow({
      superToken: daix.address,
      sender: loanAgreement2.address,
      receiver: lender.address,
      providerOrSigner: lender,
    });

    const guarantorFlow = await sf.cfaV1.getFlow({
      superToken: daix.address,
      sender: guarantor.address,
      receiver: loanAgreement2.address,
      providerOrSigner: guarantor,
    });

    console.log('Borrower flow: ', borrowerFlow.flowRate);
    console.log('lender flow: ', lenderFlow.flowRate);

    let pass6Months = 86400 * (365 / 2);
    await network.provider.send('evm_increaseTime', [pass6Months]);
    await network.provider.send('evm_mine');

    //close loan before it ends
    await loanAgreement2.connect(lender).closeOpenLoan(0);

    const borrowerFlowAfter = await sf.cfaV1.getFlow({
      superToken: daix.address,
      sender: loanAgreement2.address,
      receiver: borrower.address,
      providerOrSigner: borrower,
    });

    const lenderFlowAfter = await sf.cfaV1.getFlow({
      superToken: daix.address,
      sender: loanAgreement2.address,
      receiver: lender.address,
      providerOrSigner: lender,
    });

    console.log('borrower flow after: ', borrowerFlowAfter.flowRate);
    console.log('lender flow after: ', lenderFlowAfter.flowRate);

    assert.isBelow(
      Number(borrowerFlow.flowRate),
      Number(guarantorFlow.flowRate),
      'borrower flow rate should be less than total amount sent into loan by guarantor prior to the closing of the loan'
    );
    assert.isAbove(
      Number(lenderFlow.flowRate),
      0,
      'lender should have positive flow rate prior to loan ending'
    );
    assert.equal(
      borrowerFlowAfter.flowRate,
      guarantorFlow.flowRate,
      'borrower flow after loan ends should be equal to full value of guarantor flow'
    );
    assert.equal(
      lenderFlowAfter.flowRate,
      0,
      'lender flow rate should be zero after'
    );

    const guarantorDAIxBalance = await daix.balanceOf({
      account: guarantor.address,
      providerOrSigner: guarantor,
    });
    console.log('guarantor daix balance in 2.11...', guarantorDAIxBalance);
  });

  it('11 borrower closing the loan once completed', async () => {
    //borrower closes loan once complete
    let borrowAmount = ethers.utils.parseEther('1000');
    let interest = 10;
    let paybackMonths = 12;
    let collateralAmount = ethers.utils.parseEther('1000');

    await LoanAgreementFactory.createNewLoan(
      borrowAmount, //borrowing 1000 fDAI tokens
      interest, // 10% annual interest
      paybackMonths, //in months
      collateralAmount, // total collateral amount required
      guarantor.address, //address of guarantor
      borrower.address, //address of borrower
      daix.address,
      colx.address,
      sf.settings.config.hostAddress,
      priceFeed.address,
      8
    );

    let loanAddress = await LoanAgreementFactory.idToLoan(1);
    let loan2Address = await LoanAgreementFactory.idToLoan(2);
    let loan3Address = await LoanAgreementFactory.idToLoan(3);
    console.log('first loan address', loanAddress);
    console.log('second loan address', loan2Address);
    console.log('third loan address', loan3Address);

    let loanAgreement3 = new ethers.Contract(
      loan3Address,
      LoanABI,
      accounts[0]
    );

    //send collateral
    let collateral = await loanAgreement3.collateralAmount();

    let colxApprovalOperation = colx.approve({
      receiver: loanAgreement3.address,
      amount: collateral,
    });

    await colxApprovalOperation.exec(borrower);

    console.log('sending collateral to loan 3');

    const borrowerPreSendCollateral = await colx.balanceOf({
      account: borrower.address,
      providerOrSigner: borrower,
    });
    console.log(
      'borrower initial collateral balance',
      borrowerPreSendCollateral
    );
    await loanAgreement3.connect(borrower).sendCollateral();

    //create flow

    const createLoan3FlowOperation = sf.cfaV1.createFlow({
      superToken: daix.address,
      receiver: loanAgreement3.address,
      flowRate: '3215019290123456',
    });

    console.log('creating a flow from guarantor to loan 3...');
    const guarantorDAIxBalance = await daix.balanceOf({
      account: guarantor.address,
      providerOrSigner: guarantor,
    });
    console.log('guarantor daix balance...', guarantorDAIxBalance);

    await createLoan3FlowOperation.exec(guarantor);

    //lend

    console.log('approving lender spend for loan 3...');

    const lenderApprovalOperation = daix.approve({
      receiver: loanAgreement3.address,
      amount: borrowAmount.toString(),
    });

    await lenderApprovalOperation.exec(lender);

    console.log('lender lends for loan 3');

    await loanAgreement3.connect(lender).lend();

    //make sure it worked
    const borrowerFlow = await sf.cfaV1.getFlow({
      superToken: daix.address,
      sender: loanAgreement3.address,
      receiver: borrower.address,
      providerOrSigner: borrower,
    });

    const lenderFlow = await sf.cfaV1.getFlow({
      superToken: daix.address,
      sender: loanAgreement3.address,
      receiver: lender.address,
      providerOrSigner: lender,
    });

    const guarantorFlow = await sf.cfaV1.getFlow({
      superToken: daix.address,
      sender: guarantor.address,
      receiver: loanAgreement3.address,
      providerOrSigner: guarantor,
    });

    console.log('Borrower flow: ', borrowerFlow.flowRate);
    console.log('lender flow: ', lenderFlow.flowRate);

    //we will close loan 1 hour after the loan expires
    let passLoanDuration = 86400 * (365 / 12) * paybackMonths + 3600;
    await network.provider.send('evm_increaseTime', [passLoanDuration]);
    await network.provider.send('evm_mine');

    const borrowerCollateralBalanceBefore = await colx.balanceOf({
      account: borrower.address,
      providerOrSigner: borrower,
    });
    console.log(
      'borrower collateral balance before: ',
      borrowerCollateralBalanceBefore
    );

    //close loan before it ends
    await loanAgreement3.connect(borrower).closeCompletedLoan();

    const borrowerFlowAfter = await sf.cfaV1.getFlow({
      superToken: daix.address,
      sender: loanAgreement3.address,
      receiver: borrower.address,
      providerOrSigner: borrower,
    });

    const lenderFlowAfter = await sf.cfaV1.getFlow({
      superToken: daix.address,
      sender: loanAgreement3.address,
      receiver: lender.address,
      providerOrSigner: lender,
    });

    const borrowerCollateralBalanceAfter = await colx.balanceOf({
      account: borrower.address,
      providerOrSigner: borrower,
    });

    console.log(
      'borrower collateral balance after: ',
      borrowerCollateralBalanceAfter
    );

    console.log('borrower flow after: ', borrowerFlowAfter.flowRate);
    console.log('lender flow after: ', lenderFlowAfter.flowRate);

    assert.isBelow(
      Number(borrowerFlow.flowRate),
      Number(guarantorFlow.flowRate),
      'borrower flow rate should be less than total amount sent into loan by guarantor prior to the closing of the loan'
    );
    assert.isAbove(
      Number(lenderFlow.flowRate),
      0,
      'lender should have positive flow rate prior to loan ending'
    );
    assert.equal(
      borrowerFlowAfter.flowRate,
      guarantorFlow.flowRate,
      'borrower flow after loan ends should be equal to full value of guarantor flow'
    );
    assert.equal(
      lenderFlowAfter.flowRate,
      0,
      'lender flow rate should be zero after'
    );

    //TODO - fix this test
    console.log('borrower balance after, ', borrowerCollateralBalanceAfter);
    console.log('borrower balance before,', borrowerCollateralBalanceBefore);
    console.log('collateral amount, ', collateral.toString());
    assert.equal(
      Number(borrowerCollateralBalanceAfter),
      Number(borrowerPreSendCollateral),
      'borrower should be returned full value of collateral'
    );
    assert.equal(
      Number(borrowerCollateralBalanceAfter),
      Number(Number(borrowerCollateralBalanceBefore) + Number(collateral)),
      'collateral math works out'
    );
  });
});
