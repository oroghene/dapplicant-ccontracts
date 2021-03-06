require('@nomiclabs/hardhat-waffle');
require('@nomiclabs/hardhat-etherscan');
require('@nomiclabs/hardhat-truffle5');
require('@nomiclabs/hardhat-ethers');
require('hardhat-gas-reporter');
require('hardhat-deploy');
require('hardhat-typechain');

require('dotenv').config();

let ethers = require('ethers');
// Setup Default Values
let PRIVATE_KEY;
if (process.env.PRIVATE_KEY) {
  PRIVATE_KEY = process.env.PRIVATE_KEY;
} else {
  console.log('⚠️ Please set PRIVATE_KEY in the .env file');
  PRIVATE_KEY = ethers.Wallet.createRandom()._signingKey().privateKey;
}

if (!process.env.INFURA_API_KEY) {
  console.log('⚠️ Please set INFURA_API_KEY in the .env file');
}

if (!process.env.POLYGONSCAN_API_KEY) {
  console.log('⚠️ Please set POLYGONSCAN_API_KEY in the .env file');
}

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  defaultNetwork: 'hardhat',
  networks: {
    localhost: {
      url: 'http://127.0.0.1:8545',
      saveDeployments: true,
      accounts: 'remote',
    },
    hardhat: {
      // TODO: Add snapshot block
      // forking: {
      //   url: process.env.ALCHEMY_PROVIDER_MAINNET,
      //   block: 0,
      // },
      mining: {
        auto: true,
      },
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
      chainId: 1,
      accounts: [PRIVATE_KEY],
    },
    rinkeby: {
      url: `https://rinkeby.infura.io/v3/${process.env.INFURA_API_KEY}`,
      chainId: 4,
      accounts: [PRIVATE_KEY],
    },
    matic: {
      url: 'https://polygon-rpc.com/', // https://polygon-mumbai.g.alchemy.com/v2/e9tdjrQ3uNDjZZdN0fS2MOyFSzBqzWBy
      chainId: 137,
      accounts: [PRIVATE_KEY],
    },
    mumbai: {
      url: 'https://matic-mumbai.chainstacklabs.com',
      chainId: 80001,
      accounts: [PRIVATE_KEY],
    },
  },
  solidity: {
    compilers: [
      // {
      //   version: '0.8.14',
      //   settings: {
      //     optimizer: {
      //       enabled: true,
      //       runs: 2000,
      //       details: {
      //         yul: true,
      //         yulDetails: {
      //           stackAllocation: true,
      //           optimizerSteps: 'dhfoDgvulfnTUtnIf',
      //         },
      //       },
      //     },
      //   },
      // },
      {
        version: '0.8.11',
        settings: {
          optimizer: {
            runs: 200,
            enabled: true,
          },
        },
      },
      {
        version: '0.7.6',
        settings: {
          optimizer: {
            enabled: true,
          },
        },
      },
    ],
  },
  namedAccounts: {
    deployer: 0,
  },
  etherscan: {
    apiKey: process.env.POLYGONSCAN_API_KEY,
  },

  paths: {
    sources: './contracts',
    tests: './test',
    cache: './cache',
    artifacts: './artifacts',
    deploy: './deploy',
  },
  mocha: {
    timeout: 2000000000,
  },
  typechain: {
    outDir: 'typechain',
    target: 'ethers-v5',
  },
};
