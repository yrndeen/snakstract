import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config';

/**
 * Sets a new referral code for the user
 * @param {string} referralCode - 5-character referral code to set
 * @param {Object} provider - Web3 provider
 * @returns {Promise<Object>} Transaction receipt and status
 */
export async function setReferralCode(referralCode, provider) {
  try {
    if (!referralCode || referralCode.length !== 5) {
      throw new Error('Referral code must be exactly 5 characters');
    }
    
    console.log(`Setting referral code: ${referralCode}`);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    
    // Call setReferralCode function
    const tx = await contract.setReferralCode(referralCode);
    console.log('Transaction sent:', tx.hash);
    
    // Wait for transaction confirmation
    const receipt = await tx.wait();
    console.log('Transaction confirmed:', receipt);
    
    return {
      success: receipt.status === 1,
      receipt,
      hash: tx.hash
    };
  } catch (error) {
    console.error('Error setting referral code:', error);
    throw error;
  }
}

/**
 * Get user's current referral code
 * @param {string} address - User's wallet address
 * @param {Object} provider - Web3 provider
 * @returns {Promise<string>} User's referral code or empty string if not set
 */
export async function getReferralCode(address, provider) {
  try {
    if (!address) return '';
    
    console.log(`Getting referral code for ${address}`);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
    
    // Call getReferralCode function
    const code = await contract.getReferralCode(address);
    console.log(`Referral code: ${code}`);
    
    return code;
  } catch (error) {
    console.error('Error getting referral code:', error);
    return '';
  }
}

/**
 * Apply a referral code to user's account
 * @param {string} referralCode - 5-character referral code to apply
 * @param {Object} provider - Web3 provider
 * @returns {Promise<Object>} Transaction receipt and status
 */
export async function applyReferralCode(referralCode, provider) {
  try {
    if (!referralCode || referralCode.length !== 5) {
      throw new Error('Referral code must be exactly 5 characters');
    }
    
    console.log(`Applying referral code: ${referralCode}`);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    
    // Call setReferrer function
    const tx = await contract.setReferrer(referralCode);
    console.log('Transaction sent:', tx.hash);
    
    // Wait for transaction confirmation
    const receipt = await tx.wait();
    console.log('Transaction confirmed:', receipt);
    
    return {
      success: receipt.status === 1,
      receipt,
      hash: tx.hash
    };
  } catch (error) {
    console.error('Error applying referral code:', error);
    throw error;
  }
}

/**
 * Get address associated with a referral code
 * @param {string} referralCode - Referral code to lookup
 * @param {Object} provider - Web3 provider
 * @returns {Promise<string>} Address associated with the referral code
 */
export async function getAddressByReferralCode(referralCode, provider) {
  try {
    if (!referralCode || referralCode.length !== 5) {
      throw new Error('Referral code must be exactly 5 characters');
    }
    
    console.log(`Looking up address for referral code: ${referralCode}`);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
    
    // Call getAddressByReferralCode function
    const address = await contract.getAddressByReferralCode(referralCode);
    console.log(`Address for referral code ${referralCode}: ${address}`);
    
    return address;
  } catch (error) {
    console.error('Error getting address by referral code:', error);
    return ethers.constants.AddressZero;
  }
}

/**
 * Get user's referral statistics
 * @param {string} address - User's wallet address
 * @param {Object} provider - Web3 provider
 * @returns {Promise<Object>} Referral statistics
 */
export async function getReferralStats(address, provider) {
  try {
    if (!address) {
      return {
        totalReferrals: 0,
        activeReferrals: 0,
        totalEarnings: '0'
      };
    }
    
    console.log(`Getting referral stats for ${address}`);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
    
    // Call getReferralStats function
    const stats = await contract.getReferralStats(address);
    
    return {
      totalReferrals: stats.totalReferrals.toNumber(),
      activeReferrals: stats.activeReferrals.toNumber(),
      totalEarnings: ethers.utils.formatEther(stats.totalEarnings)
    };
  } catch (error) {
    console.error('Error getting referral stats:', error);
    return {
      totalReferrals: 0,
      activeReferrals: 0,
      totalEarnings: '0'
    };
  }
}

/**
 * Get list of user's referrals
 * @param {string} address - User's wallet address
 * @param {Object} provider - Web3 provider
 * @returns {Promise<Array>} Array of referrals
 */
export async function getReferrals(address, provider) {
  try {
    if (!address) return [];
    
    console.log(`Getting referrals for ${address}`);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
    
    // Call getReferrals function
    const referrals = await contract.getReferrals(address);
    
    // Format the result
    return referrals.map(referral => ({
      player: referral.player,
      gamesPlayed: referral.gamesPlayed.toNumber(),
      totalWagered: ethers.utils.formatEther(referral.totalWagered),
      totalWon: ethers.utils.formatEther(referral.totalWon),
      netEarned: ethers.utils.formatEther(referral.netEarned),
      referralEarnings: ethers.utils.formatEther(referral.referralEarnings),
      lastActive: new Date(referral.lastActive.toNumber() * 1000),
      sp: referral.sp.toNumber()
    }));
  } catch (error) {
    console.error('Error getting referrals:', error);
    return [];
  }
}

/**
 * Claim referral rewards
 * @param {Object} provider - Web3 provider
 * @returns {Promise<Object>} Transaction receipt and status
 */
export async function claimReferralRewards(provider) {
  try {
    console.log('Claiming referral rewards');
    const signer = provider.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    
    // Check if there are rewards to claim
    const address = await signer.getAddress();
    const playerDetails = await contract.getPlayerDetails(address);
    
    if (playerDetails.referralEarnings.isZero()) {
      throw new Error('No referral rewards to claim');
    }
    
    // Call claimReferralRewards function
    const tx = await contract.claimReferralRewards();
    console.log('Transaction sent:', tx.hash);
    
    // Wait for transaction confirmation
    const receipt = await tx.wait();
    console.log('Transaction confirmed:', receipt);
    
    return {
      success: receipt.status === 1,
      receipt,
      hash: tx.hash,
      amount: ethers.utils.formatEther(playerDetails.referralEarnings)
    };
  } catch (error) {
    console.error('Error claiming referral rewards:', error);
    throw error;
  }
}

/**
 * Validate a referral code format
 * @param {string} referralCode - Referral code to validate
 * @returns {boolean} Whether the referral code is valid format
 */
export function isValidReferralCodeFormat(referralCode) {
  if (!referralCode) return false;
  
  // Check length
  if (referralCode.length !== 5) return false;
  
  // Check characters (alphanumeric)
  return /^[A-Za-z0-9]{5}$/.test(referralCode);
}

/**
 * Get referral URL with code
 * @param {string} referralCode - Referral code
 * @returns {string} URL with referral code
 */
export function getReferralUrl(referralCode) {
  if (!referralCode) return '';
  
  const baseUrl = window.location.origin;
  return `${baseUrl}?ref=${referralCode}`;
}

/**
 * Extract referral code from URL
 * @returns {string} Referral code from URL or empty string
 */
export function getRefCodeFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  const refCode = urlParams.get('ref');
  
  if (refCode && isValidReferralCodeFormat(refCode)) {
    return refCode;
  }
  
  return '';
}