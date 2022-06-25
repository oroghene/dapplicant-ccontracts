const { Framework } = require('@superfluid-finance/sdk-core');
const { assert } = require('chai');
const { expectRevert } = require('@openzeppelin/test-helpers');
const { ethers, web3, network } = require('hardhat');
// const daiABI = require('./abis/fDAIABI');
// const LoanArtifact = require('../artifacts/contracts/EmploymentLoan.sol/EmploymentLoan.json');
// const LoanABI = LoanArtifact.abi;
const deployFramework = require('@superfluid-finance/ethereum-contracts/scripts/deploy-framework');
const deployTestToken = require('@superfluid-finance/ethereum-contracts/scripts/deploy-test-token');
const deploySuperToken = require('@superfluid-finance/ethereum-contracts/scripts/deploy-super-token');
const provider = web3;
const { GasLogger } = require('../utils/helper.js');
require('dotenv').config();
const gasLogger = new GasLogger();

const main = async () => {
  // Config
  // const { getNamedAccounts, deployments, getChainId } = ethers;
  // console.log('ethers:', ethers);

  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();
  const HOST_ADDRESS = '0xEB796bdb90fFA0f28255275e16936D25d3418603';
  const CFA = '0x49e565Ed1bdc17F3d220f72DF0857C26FA83F873';
  const ACCEPTEDTOKEN = '0x5D8B4C2554aeB7e86F387B4d6c00Ac33499Ed01f'; //fDAIx
  const arguments = [];

  // Deployment
  // governance
  log('----------------------------------------------------');
  console.log(`Deploying Governance Contract... from ${deployer}`);
  let govContract = await deploy('Governance', {
    from: deployer,
    args: arguments,
    log: true,
  });
  gasLogger.addDeployment(govContract);

  // superfluid
  //initialize the superfluid framework...put custom and web3 only bc we are using hardhat locally
  let sf = await Framework.create({
    networkName: 'custom',
    provider,
    dataMode: 'WEB3_ONLY',
    resolverAddress: process.env.RESOLVER_ADDRESS, //this is how you get the resolver address
    protocolReleaseVersion: 'test',
  });

  let borrower = await sf.createSigner({
    signer: accounts[0],
    provider: provider,
  });

  let guarantor = await sf.createSigner({
    signer: accounts[2],
    provider: provider,
  });

  //use the framework to get the super toen
  let daix = await sf.loadSuperToken('fDAIx');
  let colx = await sf.loadSuperToken('fCOLx');

  let borrowAmount = ethers.utils.parseEther('10000');
  let collateralAmount = ethers.utils.parseEther('1000');

  log('----------------------------------------------------');
  console.log(`Deploying LoanAgreement Contract... from ${deployer}`);
  let loanAgreementContract = await deploy('LoanAgreement', {
    from: deployer,
    args: [
      sf.settings.config.hostAddress, // ✅
      daix.address, // ✅
      colx.address, // ✅
      govContract.address, // ✅
      borrowAmount, //borrowing 1000 fDAI tokens ✅
      10, // ✅
      12, // ✅
      collateralAmount, // total collateral amount required ✅
      guarantor.address, //address of guarantor ✅
      borrower.address, //address of borrower ✅
    ],
    log: true,
  });
  await loanAgreementContract.deployed();
  gasLogger.addDeployment(loanAgreementContract);
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

module.exports.tags = ['LoanAgreement'];
