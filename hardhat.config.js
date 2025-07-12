require('@nomicfoundation/hardhat-toolbox');
require('dotenv').config();

module.exports = {
  solidity: {
    version: '0.8.19',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    abstractTestnet: {
      url: process.env.ABSTRACT_TESTNET_RPC_URL || 'https://api.testnet.abs.xyz',
      chainId: 11124, // Abstract testnet chain ID from docs.abs.xyz
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [
        '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
        '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
        '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a'
      ],
      gasPrice: 1000000000, // 1 gwei
    },
    abstractMainnet: {
      url: process.env.ABSTRACT_MAINNET_RPC_URL || 'https://api.mainnet.abs.xyz',
      chainId: 2741, // Abstract mainnet chain ID from docs.abs.xyz
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [
        '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
        '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
        '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a'
      ],
      gasPrice: 1000000000, // 1 gwei
    },
    localhost: {
      url: 'http://127.0.0.1:8545',
      chainId: 31337,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [
        '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
        '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
        '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a'
      ],
    }
  },
  etherscan: {
    apiKey: {
      abstractTestnet: process.env.ABSTRACTSCAN_API_KEY || '',
      abstractMainnet: process.env.ABSTRACTSCAN_API_KEY || ''
    },
    customChains: [
      {
        network: 'abstractTestnet',
        chainId: 11124,
        urls: {
          apiURL: 'https://api-sepolia.abscan.org/api',
          browserURL: 'https://sepolia.abscan.org'
        }
      },
      {
        network: 'abstractMainnet',
        chainId: 2741,
        urls: {
          apiURL: 'https://api.abscan.org/api',
          browserURL: 'https://abscan.org'
        }
      }
    ]
  }
}; 