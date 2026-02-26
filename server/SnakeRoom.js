const ethers = require('ethers');
const CONTRACT_ABI = require('../frontend/src/contract/SnakstractABI.json');

class SnakeRoom {
  constructor(options = {}) {
    this.contractAddress = options.contractAddress || process.env.CONTRACT_ADDRESS;
    this.providerUrl = options.providerUrl || process.env.PROVIDER_URL || "http://localhost:8545";
    this.provider = null;
    this.contract = null;
    this.privateKey = options.privateKey || process.env.SERVER_PRIVATE_KEY;
    
    if (!this.contractAddress) {
      console.error("Contract address not provided");
    }
    
    this.initialize();
  }
  
  async initialize() {
    try {
      console.log(`Initializing SnakeRoom with contract: ${this.contractAddress}`);
      
      // Connect to the blockchain
      this.provider = new ethers.providers.JsonRpcProvider(this.providerUrl);
      
      // Create a wallet if private key is provided
      if (this.privateKey) {
        this.wallet = new ethers.Wallet(this.privateKey, this.provider);
        this.contract = new ethers.Contract(this.contractAddress, CONTRACT_ABI, this.wallet);
        console.log(`Connected to contract with wallet: ${this.wallet.address}`);
      } else {
        // Read-only mode
        this.contract = new ethers.Contract(this.contractAddress, CONTRACT_ABI, this.provider);
        console.log("Connected to contract in read-only mode");
      }
    } catch (error) {
      console.error("Failed to initialize SnakeRoom:", error);
    }
  }
  
  /**
   * Add ETH orb winnings to a player
   * @param {string} playerAddress - Player's wallet address
   * @param {string} amount - Amount of ETH orbs collected
   * @returns {Promise<Object>} Transaction status
   */
  async addEthOrbWinnings(playerAddress, amount) {
    try {
      if (!this.contract || !this.wallet) {
        console.error("Contract or wallet not initialized");
        return { success: false, error: "Contract not initialized" };
      }
      
      console.log(`Adding ${amount} ETH orb winnings to ${playerAddress}`);
      
      // Convert amount to wei
      const amountInWei = ethers.utils.parseEther(amount.toString());
      
      // Call the contract
      const tx = await this.contract.addEthOrbWinnings(playerAddress, amountInWei);
      console.log(`Transaction sent: ${tx.hash}`);
      
      // Wait for confirmation
      const receipt = await tx.wait();
      console.log(`Transaction confirmed: ${receipt.transactionHash}`);
      
      return {
        success: receipt.status === 1,
        hash: receipt.transactionHash
      };
    } catch (error) {
      console.error(`Failed to add ETH orb winnings for ${playerAddress}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Record XP earned from eating orbs
   * @param {string} playerAddress - Player's wallet address
   * @param {number} orbs - Number of orbs eaten
   * @returns {Promise<Object>} Transaction status
   */
  async recordOrbXP(playerAddress, orbs) {
    try {
      if (!this.contract || !this.wallet) {
        console.error("Contract or wallet not initialized");
        return { success: false, error: "Contract not initialized" };
      }
      
      console.log(`Recording ${orbs} orb XP for ${playerAddress}`);
      
      // Call the contract
      const tx = await this.contract.earnOrbXP(playerAddress, orbs);
      console.log(`Transaction sent: ${tx.hash}`);
      
      // Wait for confirmation
      const receipt = await tx.wait();
      console.log(`Transaction confirmed: ${receipt.transactionHash}`);
      
      return {
        success: receipt.status === 1,
        hash: receipt.transactionHash
      };
    } catch (error) {
      console.error(`Failed to record orb XP for ${playerAddress}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Record XP earned from kills
   * @param {string} playerAddress - Player's wallet address
   * @param {boolean} tookEth - Whether ETH was taken from the kill
   * @returns {Promise<Object>} Transaction status
   */
  async recordKillXP(playerAddress, tookEth) {
    try {
      if (!this.contract || !this.wallet) {
        console.error("Contract or wallet not initialized");
        return { success: false, error: "Contract not initialized" };
      }
      
      console.log(`Recording kill XP for ${playerAddress}, tookEth: ${tookEth}`);
      
      // Call the contract
      const tx = await this.contract.earnKillXP(playerAddress, tookEth);
      console.log(`Transaction sent: ${tx.hash}`);
      
      // Wait for confirmation
      const receipt = await tx.wait();
      console.log(`Transaction confirmed: ${receipt.transactionHash}`);
      
      return {
        success: receipt.status === 1,
        hash: receipt.transactionHash
      };
    } catch (error) {
      console.error(`Failed to record kill XP for ${playerAddress}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Record XP earned from causing deaths
   * @param {string} playerAddress - Player's wallet address
   * @returns {Promise<Object>} Transaction status
   */
  async recordCauseDeathXP(playerAddress) {
    try {
      if (!this.contract || !this.wallet) {
        console.error("Contract or wallet not initialized");
        return { success: false, error: "Contract not initialized" };
      }
      
      console.log(`Recording cause death XP for ${playerAddress}`);
      
      // Call the contract
      const tx = await this.contract.earnCauseDeathXP(playerAddress);
      console.log(`Transaction sent: ${tx.hash}`);
      
      // Wait for confirmation
      const receipt = await tx.wait();
      console.log(`Transaction confirmed: ${receipt.transactionHash}`);
      
      return {
        success: receipt.status === 1,
        hash: receipt.transactionHash
      };
    } catch (error) {
      console.error(`Failed to record cause death XP for ${playerAddress}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Record XP earned from winning
   * @param {string} playerAddress - Player's wallet address
   * @returns {Promise<Object>} Transaction status
   */
  async recordWinXP(playerAddress) {
    try {
      if (!this.contract || !this.wallet) {
        console.error("Contract or wallet not initialized");
        return { success: false, error: "Contract not initialized" };
      }
      
      console.log(`Recording win XP for ${playerAddress}`);
      
      // Call the contract
      const tx = await this.contract.earnWinXP(playerAddress);
      console.log(`Transaction sent: ${tx.hash}`);
      
      // Wait for confirmation
      const receipt = await tx.wait();
      console.log(`Transaction confirmed: ${receipt.transactionHash}`);
      
      return {
        success: receipt.status === 1,
        hash: receipt.transactionHash
      };
    } catch (error) {
      console.error(`Failed to record win XP for ${playerAddress}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Record XP earned from escaping
   * @param {string} playerAddress - Player's wallet address
   * @returns {Promise<Object>} Transaction status
   */
  async recordEscapeXP(playerAddress) {
    try {
      if (!this.contract || !this.wallet) {
        console.error("Contract or wallet not initialized");
        return { success: false, error: "Contract not initialized" };
      }
      
      console.log(`Recording escape XP for ${playerAddress}`);
      
      // Call the contract
      const tx = await this.contract.earnEscapeXP(playerAddress);
      console.log(`Transaction sent: ${tx.hash}`);
      
      // Wait for confirmation
      const receipt = await tx.wait();
      console.log(`Transaction confirmed: ${receipt.transactionHash}`);
      
      return {
        success: receipt.status === 1,
        hash: receipt.transactionHash
      };
    } catch (error) {
      console.error(`Failed to record escape XP for ${playerAddress}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Get a player's details from the contract
   * @param {string} playerAddress - Player's wallet address
   * @returns {Promise<Object>} Player details
   */
  async getPlayerDetails(playerAddress) {
    try {
      if (!this.contract) {
        console.error("Contract not initialized");
        return null;
      }
      
      const details = await this.contract.getPlayerDetails(playerAddress);
      
      return {
        stake: ethers.utils.formatEther(details.stake),
        inGame: details.inGame,
        lastEscape: details.lastEscape.toNumber(),
        gameStartTime: details.gameStartTime.toNumber(),
        referrer: details.referrer,
        referralEarnings: ethers.utils.formatEther(details.referralEarnings),
        totalSurvivalTime: details.totalSurvivalTime.toNumber(),
        gamesPlayed: details.gamesPlayed.toNumber(),
        xp: details.xp.toNumber()
      };
    } catch (error) {
      console.error(`Failed to get player details for ${playerAddress}:`, error);
      return null;
    }
  }
  
  /**
   * Get ETH orb winnings for a player
   * @param {string} playerAddress - Player's wallet address
   * @returns {Promise<string>} ETH orb winnings in ETH
   */
  async getEthOrbWinnings(playerAddress) {
    try {
      if (!this.contract) {
        console.error("Contract not initialized");
        return "0";
      }
      
      const winnings = await this.contract.ethOrbWinnings(playerAddress);
      return ethers.utils.formatEther(winnings);
    } catch (error) {
      console.error(`Failed to get ETH orb winnings for ${playerAddress}:`, error);
      return "0";
    }
  }
}

module.exports = SnakeRoom; 