// Import security configuration
import { SECURITY_CONFIG } from './config/security.js';
import CONTRACT_ABI from './contract/SnakstractABI.json';

// Contract Configuration
export const CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3'; // Updated local contract
export { CONTRACT_ABI };

// Network Configuration
export const NETWORK_CONFIG = {
  chainId: 31337, // Localhost chain ID
  name: 'Localhost',
  rpcUrl: 'http://127.0.0.1:8545',
  explorer: 'http://127.0.0.1:8545',
  currency: 'ETH'
};

// Game Configuration
export const GAME_CONFIG = {
  serverUrl: 'ws://localhost:2567',
  defaultWager: '0.001',
  minWager: '0.001',
  maxWager: '1.0'
};

// UI Configuration
export const UI_CONFIG = {
  theme: {
    primary: '#00ffcc',
    secondary: '#c07eff',
    background: '#181c2b',
    text: '#ffffff'
  }
};

// Localhost Network Configuration (replacing Abstract networks)
export const LOCALHOST_NETWORK = SECURITY_CONFIG.LOCALHOST;

// Game server URL
export const GAME_SERVER_URL = SECURITY_CONFIG.GAME_SERVER_URL;

// SECURITY WARNING: Never put private keys in this file or any frontend code
// Use wallet connection for user authentication instead

// Localhost Chain Configuration for wallet providers
export const LOCALHOST_CHAIN = {
  id: LOCALHOST_NETWORK.CHAIN_ID,
  name: 'Localhost',
  network: 'localhost',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: LOCALHOST_NETWORK.CURRENCY,
  },
  rpcUrls: {
    default: { http: [LOCALHOST_NETWORK.RPC_URL] },
    public: { http: [LOCALHOST_NETWORK.RPC_URL] },
  },
  blockExplorers: {
    default: { name: 'Localhost', url: LOCALHOST_NETWORK.EXPLORER },
  },
};

// Legacy Abstract Chain Configuration (kept for compatibility but not used)
export const ABSTRACT_CHAINS = {
  mainnet: {
    id: SECURITY_CONFIG.ABSTRACT_MAINNET.CHAIN_ID,
    name: 'Localhost (Legacy)',
    network: 'localhost',
    nativeCurrency: {
      decimals: 18,
      name: 'Ether',
      symbol: SECURITY_CONFIG.ABSTRACT_MAINNET.CURRENCY,
    },
    rpcUrls: {
      default: { http: [SECURITY_CONFIG.ABSTRACT_MAINNET.RPC_URL] },
      public: { http: [SECURITY_CONFIG.ABSTRACT_MAINNET.RPC_URL] },
    },
    blockExplorers: {
      default: { name: 'Localhost', url: SECURITY_CONFIG.ABSTRACT_MAINNET.EXPLORER },
    },
  },
  testnet: {
    id: SECURITY_CONFIG.ABSTRACT_TESTNET.CHAIN_ID,
    name: 'Localhost (Legacy)',
    network: 'localhost',
    nativeCurrency: {
      decimals: 18,
      name: 'Ether',
      symbol: SECURITY_CONFIG.ABSTRACT_TESTNET.CURRENCY,
    },
    rpcUrls: {
      default: { http: [SECURITY_CONFIG.ABSTRACT_TESTNET.RPC_URL] },
      public: { http: [SECURITY_CONFIG.ABSTRACT_TESTNET.RPC_URL] },
    },
    blockExplorers: {
      default: { name: 'Localhost', url: SECURITY_CONFIG.ABSTRACT_TESTNET.EXPLORER },
    },
  },
};