import React, { useState, useEffect } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { formatEther } from 'viem';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config';
import './ReferralManager.css';

const ReferralManager = () => {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  
  const [referralCode, setReferralCode] = useState('');
  const [newReferralCode, setNewReferralCode] = useState('');
  const [referralCodeInput, setReferralCodeInput] = useState('');
  const [referralStats, setReferralStats] = useState({
    totalReferrals: 0,
    activeReferrals: 0,
    totalEarnings: BigInt(0)
  });
  const [referrerAddress, setReferrerAddress] = useState(null);
  const [referralEarnings, setReferralEarnings] = useState(BigInt(0));
  const [isLoading, setIsLoading] = useState(false);
  const [isClaimingRewards, setIsClaimingRewards] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Fetch referral data on component mount
  useEffect(() => {
    if (address && publicClient) {
      fetchReferralData();
    }
  }, [address, publicClient]);

  // Fetch referral data from contract
  const fetchReferralData = async () => {
    if (!address || !publicClient) return;
    setIsLoading(true);
    setError(null);

    try {
      // Get player's referral code
      const codePromise = publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'getReferralCode',
        args: [address]
      });

      // Get player details to check referrer and earnings
      const playerDetailsPromise = publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'getPlayerDetails',
        args: [address]
      });

      // Get referral stats
      const referralStatsPromise = publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'getReferralStats',
        args: [address]
      });

      // Wait for all promises to resolve
      const [code, playerDetails, stats] = await Promise.all([
        codePromise, 
        playerDetailsPromise, 
        referralStatsPromise
      ]);

      // Update state with fetched data
      setReferralCode(code);
      setReferrerAddress(playerDetails[4]); // referrer address is at index 4
      setReferralEarnings(playerDetails[5]); // referral earnings at index 5
      setReferralStats({
        totalReferrals: Number(stats[0]),
        activeReferrals: Number(stats[1]),
        totalEarnings: stats[2]
      });
    } catch (err) {
      console.error('Error fetching referral data:', err);
      setError('Failed to load referral data');
    } finally {
      setIsLoading(false);
    }
  };

  // Set referral code
  const handleSetReferralCode = async (e) => {
    e.preventDefault();
    
    if (!walletClient) {
      setError('Wallet not connected');
      return;
    }

    if (!newReferralCode || newReferralCode.length !== 5) {
      setError('Referral code must be exactly 5 characters');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const tx = await walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'setReferralCode',
        args: [newReferralCode]
      });

      setSuccess(`Referral code set! Transaction: ${tx}`);
      setReferralCode(newReferralCode);
      setNewReferralCode('');
    } catch (err) {
      console.error('Error setting referral code:', err);
      setError(err.message || 'Failed to set referral code');
    } finally {
      setIsLoading(false);
    }
  };

  // Set referrer using a referral code
  const handleUseReferralCode = async (e) => {
    e.preventDefault();
    
    if (!walletClient) {
      setError('Wallet not connected');
      return;
    }

    if (!referralCodeInput || referralCodeInput.length !== 5) {
      setError('Referral code must be exactly 5 characters');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const tx = await walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'setReferrer',
        args: [referralCodeInput]
      });

      setSuccess(`Referrer set! Transaction: ${tx}`);
      // Get the referrer address from the code
      const referrerAddr = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'getAddressByReferralCode',
        args: [referralCodeInput]
      });
      
      setReferrerAddress(referrerAddr);
      setReferralCodeInput('');
    } catch (err) {
      console.error('Error setting referrer:', err);
      setError(err.message || 'Failed to set referrer');
    } finally {
      setIsLoading(false);
    }
  };

  // Claim referral rewards
  const handleClaimReferralRewards = async () => {
    if (!walletClient) {
      setError('Wallet not connected');
      return;
    }

    if (referralEarnings <= 0) {
      setError('No rewards to claim');
      return;
    }

    setIsClaimingRewards(true);
    setError(null);
    setSuccess(null);

    try {
      const tx = await walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'claimReferralRewards'
      });

      setSuccess(`Rewards claimed! Transaction: ${tx}`);
      setReferralEarnings(BigInt(0));
    } catch (err) {
      console.error('Error claiming rewards:', err);
      setError(err.message || 'Failed to claim rewards');
    } finally {
      setIsClaimingRewards(false);
    }
  };

  return (
    <div className="referral-manager">
      <h2>Referral Management</h2>
      
      {isLoading ? (
        <p>Loading referral data...</p>
      ) : (
        <div className="referral-content">
          {/* Your Referral Code */}
          <div className="referral-section">
            <h3>Your Referral Code</h3>
            {referralCode ? (
              <div className="referral-code-display">
                <p className="code">{referralCode}</p>
                <p>Share this code with friends to earn rewards!</p>
                <button 
                  onClick={() => navigator.clipboard.writeText(referralCode)}
                  className="copy-button"
                >
                  Copy Code
                </button>
              </div>
            ) : (
              <div className="set-code-form">
                <p>You haven't set a referral code yet.</p>
                <form onSubmit={handleSetReferralCode}>
                  <input
                    type="text"
                    value={newReferralCode}
                    onChange={(e) => setNewReferralCode(e.target.value.toUpperCase())}
                    placeholder="Enter 5-char code"
                    maxLength={5}
                    required
                  />
                  <button type="submit" disabled={isLoading}>
                    {isLoading ? 'Setting...' : 'Set Code'}
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Your Referrer */}
          <div className="referral-section">
            <h3>Your Referrer</h3>
            {referrerAddress && referrerAddress !== '0x0000000000000000000000000000000000000000' ? (
              <div className="referrer-info">
                <p>You were referred by:</p>
                <p className="address">{referrerAddress}</p>
              </div>
            ) : (
              <div className="use-code-form">
                <p>You haven't used a referral code yet.</p>
                <form onSubmit={handleUseReferralCode}>
                  <input
                    type="text"
                    value={referralCodeInput}
                    onChange={(e) => setReferralCodeInput(e.target.value.toUpperCase())}
                    placeholder="Enter referral code"
                    maxLength={5}
                    required
                  />
                  <button type="submit" disabled={isLoading}>
                    {isLoading ? 'Submitting...' : 'Use Code'}
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Referral Stats */}
          <div className="referral-section">
            <h3>Your Referral Stats</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">Total Referrals</span>
                <span className="stat-value">{referralStats.totalReferrals}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Active Referrals</span>
                <span className="stat-value">{referralStats.activeReferrals}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Total Earnings</span>
                <span className="stat-value">{formatEther(referralStats.totalEarnings)} ETH</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Claimable Rewards</span>
                <span className="stat-value">{formatEther(referralEarnings)} ETH</span>
              </div>
            </div>

            {/* Claim Button */}
            {referralEarnings > 0 && (
              <button
                onClick={handleClaimReferralRewards}
                disabled={isClaimingRewards}
                className="claim-button"
              >
                {isClaimingRewards ? 'Claiming...' : `Claim ${formatEther(referralEarnings)} ETH`}
              </button>
            )}
          </div>
          
          {/* Error/Success Messages */}
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
        </div>
      )}
    </div>
  );
};

export default ReferralManager; 