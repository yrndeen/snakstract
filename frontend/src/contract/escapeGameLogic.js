// Handles game escape logic and claim functionality
import { parseEther } from "viem";

/**
 * Handles the escape process - no blockchain transaction
 * This simply records the escape in the game server
 */
export async function handleEscape() {
  // Escape is already handled by the game server
  // This is just a utility function for frontend components
  return true;
}

/**
 * Claims winnings after a successful escape
 * @param {Object} options 
 * @param {Object} options.walletClient - Wallet client for transactions
 * @param {string} options.contractAddress - Address of the Snakstract contract 
 * @param {Object} options.contractAbi - ABI of the Snakstract contract
 * @returns {Object} - Transaction result
 */
export async function claimWinnings({ walletClient, contractAddress, contractAbi }) {
  try {
    // Call the withdraw function on the contract
    const txHash = await walletClient.writeContract({
      address: contractAddress,
      abi: contractAbi,
      functionName: "withdraw",
    });

    return {
      success: true,
      txHash,
      message: "Claim transaction sent successfully!"
    };
  } catch (error) {
    console.error("Error claiming winnings:", error);
    return {
      success: false,
      error,
      message: error.message || "Failed to claim winnings"
    };
  }
}

/**
 * Queries contract for claimable ETH amount
 * @param {Object} options
 * @param {Object} options.publicClient - Public client for reading contract
 * @param {string} options.address - User wallet address
 * @param {string} options.contractAddress - Address of the Snakstract contract
 * @param {Object} options.contractAbi - ABI of the Snakstract contract
 * @returns {Object} - Claimable amounts information
 */
export async function getClaimableAmount({ publicClient, address, contractAddress, contractAbi }) {
  try {
    // Get stake amount and ETH orb winnings
    const playerDetailsPromise = publicClient.readContract({
      address: contractAddress,
      abi: contractAbi,
      functionName: "getPlayerDetails",
      args: [address]
    });

    const ethOrbWinningsPromise = publicClient.readContract({
      address: contractAddress,
      abi: contractAbi,
      functionName: "ethOrbWinnings",
      args: [address]
    });

    const [playerDetails, ethOrbWinnings] = await Promise.all([
      playerDetailsPromise,
      ethOrbWinningsPromise
    ]);

    // Extract stake from player details (position 0 in returned array)
    const stake = playerDetails[0] || BigInt(0);
    
    return {
      success: true,
      stake,
      ethOrbWinnings,
      total: stake + ethOrbWinnings
    };
  } catch (error) {
    console.error("Error getting claimable amount:", error);
    return {
      success: false,
      error,
      message: error.message || "Failed to get claimable amount"
    };
  }
}

/**
 * Check if player is currently in a game
 * @param {Object} options
 * @param {Object} options.publicClient - Public client for reading contract
 * @param {string} options.address - User wallet address
 * @param {string} options.contractAddress - Address of the Snakstract contract
 * @param {Object} options.contractAbi - ABI of the Snakstract contract
 * @returns {Object} - Player game status
 */
export async function checkPlayerInGame({ publicClient, address, contractAddress, contractAbi }) {
  try {
    const playerDetails = await publicClient.readContract({
      address: contractAddress,
      abi: contractAbi,
      functionName: "getPlayerDetails",
      args: [address]
    });

    // inGame is at position 1 in returned array
    const inGame = playerDetails[1] || false;
    
    return {
      success: true,
      inGame
    };
  } catch (error) {
    console.error("Error checking player game status:", error);
    return {
      success: false,
      error,
      message: error.message || "Failed to check player status"
    };
  }
}

/**
 * Finalizes an escape by calling the contract's escapeGame function
 * Only needed if the server requires on-chain verification of escape
 */
export async function finalizeEscape({ walletClient, contractAddress, contractAbi }) {
  try {
    const txHash = await walletClient.writeContract({
      address: contractAddress,
      abi: contractAbi,
      functionName: "escapeGame"
    });
    
    return {
      success: true,
      txHash,
      message: "Escape finalized on-chain!"
    };
  } catch (error) {
    console.error("Error finalizing escape:", error);
    return {
      success: false,
      error,
      message: error.message || "Failed to finalize escape"
    };
  }
}

/**
 * Safely executes a contract call with retry logic for network issues
 * @param {Function} callFunction - Async function to execute the contract call
 * @param {number} maxRetries - Maximum number of retry attempts
 * @returns {Promise} - Result of the contract call
 */
export async function safeContractCall(callFunction, maxRetries = 3) {
  let retries = 0;
  while (retries < maxRetries) {
    try {
      return await callFunction();
    } catch (error) {
      if (error.message && (error.message.includes('network') || error.message.includes('timeout'))) {
        retries++;
        await new Promise(resolve => setTimeout(resolve, 1000 * retries));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Failed after multiple retries');
}

/**
 * Sets a referral code for the current player
 * @param {Object} options
 * @param {Object} options.walletClient - Wallet client for transactions
 * @param {string} options.contractAddress - Address of the Snakstract contract
 * @param {Object} options.contractAbi - ABI of the Snakstract contract
 * @param {string} options.code - 5-character referral code to set
 * @returns {Object} - Transaction result
 */
export async function setReferralCode({ walletClient, contractAddress, contractAbi, code }) {
  try {
    const txHash = await walletClient.writeContract({
      address: contractAddress,
      abi: contractAbi,
      functionName: "setReferralCode",
      args: [code]
    });
    
    return { 
      success: true, 
      txHash,
      message: "Referral code set successfully!"
    };
  } catch (error) {
    console.error("Error setting referral code:", error);
    return { 
      success: false, 
      error,
      message: error.message || "Failed to set referral code"
    };
  }
}

/**
 * Sets a referrer for the current player using a referral code
 * @param {Object} options
 * @param {Object} options.walletClient - Wallet client for transactions
 * @param {string} options.contractAddress - Address of the Snakstract contract
 * @param {Object} options.contractAbi - ABI of the Snakstract contract
 * @param {string} options.code - 5-character referral code to use
 * @returns {Object} - Transaction result
 */
export async function setReferrer({ walletClient, contractAddress, contractAbi, code }) {
  try {
    const txHash = await walletClient.writeContract({
      address: contractAddress,
      abi: contractAbi,
      functionName: "setReferrer",
      args: [code]
    });
    
    return { 
      success: true, 
      txHash,
      message: "Referrer set successfully!"
    };
  } catch (error) {
    console.error("Error setting referrer:", error);
    return { 
      success: false, 
      error,
      message: error.message || "Failed to set referrer"
    };
  }
}

/**
 * Claims accumulated referral rewards
 * @param {Object} options
 * @param {Object} options.walletClient - Wallet client for transactions
 * @param {string} options.contractAddress - Address of the Snakstract contract
 * @param {Object} options.contractAbi - ABI of the Snakstract contract
 * @returns {Object} - Transaction result
 */
export async function claimReferralRewards({ walletClient, contractAddress, contractAbi }) {
  try {
    const txHash = await walletClient.writeContract({
      address: contractAddress,
      abi: contractAbi,
      functionName: "claimReferralRewards"
    });
    
    return { 
      success: true, 
      txHash,
      message: "Referral rewards claimed successfully!"
    };
  } catch (error) {
    console.error("Error claiming referral rewards:", error);
    return { 
      success: false, 
      error,
      message: error.message || "Failed to claim referral rewards"
    };
  }
}

/**
 * Gets referral statistics for a player
 * @param {Object} options
 * @param {Object} options.publicClient - Public client for reading contract
 * @param {string} options.contractAddress - Address of the Snakstract contract
 * @param {Object} options.contractAbi - ABI of the Snakstract contract
 * @param {string} options.address - Player address to get stats for
 * @returns {Object} - Referral statistics
 */
export async function getReferralStats({ publicClient, contractAddress, contractAbi, address }) {
  try {
    const stats = await publicClient.readContract({
      address: contractAddress,
      abi: contractAbi,
      functionName: "getReferralStats",
      args: [address]
    });
    
    return {
      success: true,
      totalReferrals: stats[0],
      activeReferrals: stats[1],
      totalEarnings: stats[2]
    };
  } catch (error) {
    console.error("Error getting referral stats:", error);
    return { 
      success: false, 
      error,
      message: error.message || "Failed to get referral statistics"
    };
  }
}

/**
 * Join a game by staking ETH
 * @param {Object} options
 * @param {Object} options.walletClient - Wallet client for transactions
 * @param {string} options.contractAddress - Address of the Snakstract contract
 * @param {Object} options.contractAbi - ABI of the Snakstract contract
 * @param {number|string} options.wagerAmount - Amount of ETH to stake
 * @param {string} options.referrerAddress - Address of the referrer (default: zero address)
 * @returns {Object} - Transaction result
 */
export async function joinGame({ walletClient, contractAddress, contractAbi, wagerAmount, referrerAddress = "0x0000000000000000000000000000000000000000" }) {
  try {
    const txHash = await walletClient.writeContract({
      address: contractAddress,
      abi: contractAbi,
      functionName: "joinGame",
      args: [referrerAddress],
      value: parseEther(wagerAmount.toString())
    });
    
    return { 
      success: true, 
      txHash,
      message: "Successfully joined game!"
    };
  } catch (error) {
    console.error("Error joining game:", error);
    return { 
      success: false, 
      error,
      message: error.message || "Failed to join game"
    };
  }
}