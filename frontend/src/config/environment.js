// Environment Configuration for Snakstract
// This file contains all environment-specific settings

export const ENV_CONFIG = {
  // Development settings
  DEBUG_MODE: import.meta.env.VITE_DEBUG_MODE === 'true' || false,
  DEFAULT_NETWORK: import.meta.env.VITE_DEFAULT_NETWORK || 'mainnet',
  
  // Contract settings - Updated to new deployed contract
  CONTRACT_ADDRESS: import.meta.env.VITE_CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  
  // Game server - Production URL
  GAME_SERVER_URL: import.meta.env.VITE_GAME_SERVER_URL || 'wss://snakstract.io:2567',
  
  // Abstract Testnet Configuration (from docs.abs.xyz)
  ABSTRACT_TESTNET: {
    CHAIN_ID: parseInt(import.meta.env.VITE_ABSTRACT_TESTNET_CHAIN_ID) || 11124,
    RPC_URL: import.meta.env.VITE_ABSTRACT_TESTNET_RPC || 'https://api.testnet.abs.xyz',
    WS_URL: import.meta.env.VITE_ABSTRACT_TESTNET_WS || 'wss://api.testnet.abs.xyz/ws',
    EXPLORER: import.meta.env.VITE_ABSTRACT_TESTNET_EXPLORER || 'https://sepolia.abscan.org/',
    VERIFY_URL: import.meta.env.VITE_ABSTRACT_TESTNET_VERIFY_URL || 'https://api-sepolia.abscan.org/api',
    CURRENCY: 'ETH'
  },
  
  // Abstract Mainnet Configuration (from docs.abs.xyz)
  ABSTRACT_MAINNET: {
    CHAIN_ID: parseInt(import.meta.env.VITE_ABSTRACT_MAINNET_CHAIN_ID) || 2741,
    RPC_URL: import.meta.env.VITE_ABSTRACT_MAINNET_RPC || 'https://api.mainnet.abs.xyz',
    WS_URL: import.meta.env.VITE_ABSTRACT_MAINNET_WS || 'wss://api.mainnet.abs.xyz/ws',
    EXPLORER: import.meta.env.VITE_ABSTRACT_MAINNET_EXPLORER || 'https://abscan.org/',
    VERIFY_URL: import.meta.env.VITE_ABSTRACT_MAINNET_VERIFY_URL || 'https://api.abscan.org/api',
    CURRENCY: 'ETH'
  },
  
  // Localhost Configuration (for development only)
  LOCALHOST: {
    CHAIN_ID: parseInt(import.meta.env.VITE_LOCALHOST_CHAIN_ID) || 31337,
    RPC_URL: import.meta.env.VITE_LOCALHOST_RPC || 'http://127.0.0.1:8545',
    WS_URL: import.meta.env.VITE_LOCALHOST_WS || 'ws://127.0.0.1:8545',
    EXPLORER: import.meta.env.VITE_LOCALHOST_EXPLORER || 'http://127.0.0.1:8545',
    VERIFY_URL: import.meta.env.VITE_LOCALHOST_VERIFY_URL || 'http://127.0.0.1:8545',
    CURRENCY: 'ETH'
  }
};

// Helper function to get current network config
export function getCurrentNetwork() {
  return ENV_CONFIG.DEFAULT_NETWORK === 'mainnet' 
    ? ENV_CONFIG.ABSTRACT_MAINNET 
    : ENV_CONFIG.ABSTRACT_TESTNET;
}

// Helper function to check if we're in development mode
export function isDevelopment() {
  return ENV_CONFIG.DEBUG_MODE;
}

// Helper function to get RPC URL for current network
export function getCurrentRpcUrl() {
  return getCurrentNetwork().RPC_URL;
}

// Helper function to get explorer URL for current network
export function getCurrentExplorerUrl() {
  return getCurrentNetwork().EXPLORER;
} 