// Security Configuration for Snakstract
// IMPORTANT: Never put private keys in frontend code

import { ENV_CONFIG } from './environment.js';

export const SECURITY_CONFIG = {
  // Contract addresses
  CONTRACT_ADDRESS: ENV_CONFIG.CONTRACT_ADDRESS,
  
  // Localhost Network Configuration (replacing Abstract networks)
  LOCALHOST: ENV_CONFIG.LOCALHOST,
  
  // Legacy Abstract Network Configuration (kept for compatibility but not used)
  ABSTRACT_MAINNET: ENV_CONFIG.ABSTRACT_MAINNET,
  ABSTRACT_TESTNET: ENV_CONFIG.ABSTRACT_TESTNET,
  
  // Game server
  GAME_SERVER_URL: ENV_CONFIG.GAME_SERVER_URL,
  
  // Security settings
  DEBUG_MODE: ENV_CONFIG.DEBUG_MODE,
  
  // Default to localhost for development
  DEFAULT_NETWORK: ENV_CONFIG.DEFAULT_NETWORK
};

// Export the network configurations directly for easier access
export const LOCALHOST = ENV_CONFIG.LOCALHOST;
export const ABSTRACT_MAINNET = ENV_CONFIG.ABSTRACT_MAINNET;
export const ABSTRACT_TESTNET = ENV_CONFIG.ABSTRACT_TESTNET;

// SECURITY WARNING: 
// 1. Never put private keys in frontend code
// 2. Never commit private keys to version control
// 3. Use wallet connection for user authentication
// 4. For backend services, use environment variables with proper encryption
// 5. Consider using Abstract's account abstraction for better security

export const SECURITY_BEST_PRACTICES = {
  // For development testing, use these methods instead of hardcoded private keys:
  
  // Method 1: Use Abstract wallet connection (recommended)
  // - Users connect their own wallets
  // - No private keys in your code
  // - Most secure for production
  
  // Method 2: Use environment variables (backend only)
  // - Store in .env file (not committed to git)
  // - Use only in backend services
  // - Encrypt sensitive data
  
  // Method 3: Use Abstract's account abstraction
  // - Let Abstract handle key management
  // - Better security model
  // - Recommended for production apps
};

// Example of what NOT to do:
// const PRIVATE_KEY = "0x9c5b981ce7654399da9cb144929756710467f2de805893752667d766a06ad48d"; // ❌ NEVER DO THIS

// Example of what TO do:
// 1. Use wallet connection
// 2. Let users sign transactions with their own wallets
// 3. Use Abstract's sponsored transactions
// 4. Implement proper authentication 