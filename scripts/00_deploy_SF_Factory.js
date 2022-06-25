// const ethers = require('ethers');
const { Framework } = require('@superfluid-finance/sdk-core');
const Factory = require('../artifacts/contracts/LoanAgreement.sol/LoanAgreement.json');
const FactoryABI = Factory.abi;
const MOCKAggregator = require('../artifacts/contracts/test/MockV3Aggregator.sol/MockV3Aggregator.json');
const MOCK_ABI = MOCKAggregator.abi;
require('dotenv').config();
const { ethers, web3, network } = require('hardhat');
const { GasLogger } = require('../utils/helper.js');
const gasLogger = new GasLogger();

async function main() {
  const url = `${process.env.RPC_URL}`;
  const customHttpProvider = new ethers.providers.JsonRpcProvider(url);

  const sf = await Framework.create({
    chainId: parseInt(process.env.CHAIN_ID),
    // resolverAddress: '0x8C54C83FbDe3C59e59dd6E324531FB93d4F504d3',
    provider: customHttpProvider,
    customSubgraphQueriesEndpoint: '',
    dataMode: 'WEB3_ONLY',
  });

  const { borrowing, guarantoring } = ethers.getSigners();

  const borrower = sf.createSigner({
    privateKey:
      'ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', // process.env.BORROWER_PRIVATE_KEY,
    provider: customHttpProvider,
  });

  const guarantor = sf.createSigner({
    privateKey:
      '59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d', // process.env.GUARANTOR_PRIVATE_KEY,
    provider: customHttpProvider,
  });

  // governance
  // const { deploy, log } = deployments;
  // const { deployer } = await getNamedAccounts();
  // console.log(`Deploying Governance Contract... from ${deployer}`);
  // let govContract = await deploy('Governance', {
  //   from: deployer,
  //   args: [],
  //   log: true,
  // });
  // gasLogger.addDeployment(govContract);

  //use the framework to get the super toen
  let daix = await sf.loadSuperToken('fDAIx');
  let usdcx = await sf.loadSuperToken('fUSDCx');

  let borrowAmount = ethers.utils.parseEther('10000');
  let collateralAmount = ethers.utils.parseEther('1000');

  console.log('running deploy factory script...', sf.settings.hostAddress);
  // We get the contract to deploy
  const LoanAgreement = await hre.ethers.getContractFactory('LoanAgreement');
  // deploying
  const loanAgreement = await LoanAgreement.connect(borrower).deploy(
    '0xEB796bdb90fFA0f28255275e16936D25d3418603', // sf.settings.hostAddress,
    daix.address,
    usdcx.address,
    '0x28c43a01d81c4edc4c67b4a881d1c540857fcc38', // govContract.address,
    borrowAmount,
    10,
    12,
    collateralAmount,
    guarantor.address, // guarantor.address,
    borrower.address // borrower.address
    // { gasLimit: 3000000 }
  );

  await loanAgreement.deployed();

  console.log('LoanAgreement.sol deployed to:', loanAgreement.address);

  const MockV3Aggregator = await hre.ethers.getContractFactory(
    'MockV3Aggregator'
  );
  const mockV3Aggregator = await MockV3Aggregator.connect(borrower).deploy(
    10000000000
  );

  await mockV3Aggregator.deployed();

  console.log('MockV3Aggregator deployed to: ', mockV3Aggregator.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
