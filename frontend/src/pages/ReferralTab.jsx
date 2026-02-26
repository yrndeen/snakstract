import React, { useState, useEffect, useRef } from 'react';
import { useAccount, useClient, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { useSignMessage } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config';
import { formatEther } from 'viem';
import useClickSound from '../hooks/useClickSound';
import { useNavigate } from 'react-router-dom';
import { 
  setReferralCode, 
  setReferrer, 
  claimReferralRewards, 
  getReferralStats, 
  safeContractCall 
} from '../contract/escapeGameLogic';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) { return { hasError: true }; }
  componentDidCatch(error, errorInfo) { console.error('ReferralTab error:', error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="page-container">
          <h2>🤝 Referral Program</h2>
          <div style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>
            Something went wrong. Please try refreshing the page.
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const ReferralTab = () => {
  const { address, isConnected } = useAccount();
  const publicClient = useClient();
  const walletClient = useClient({ mode: 'wallet' });
  const navigate = useNavigate();
  const [referralCode, setReferralCode] = useState('');
  const [referralLink, setReferralLink] = useState('');
  const [isEditingCode, setIsEditingCode] = useState(false);
  const [tempCode, setTempCode] = useState('');
  const [referralStats, setReferralStats] = useState({
    totalReferrals: 0,
    activeReferrals: 0,
    totalEarnings: 0
  });
  const [referrals, setReferrals] = useState([]);
  const [isClaimed, setIsClaimed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [buttonMessage, setButtonMessage] = useState('Claim Rewards');
  const [isCopied, setIsCopied] = useState(false);
  const [canCustomizeCode, setCanCustomizeCode] = useState(false);
  const [referrer, setReferrer] = useState(null);
  const [pendingTx, setPendingTx] = useState(null);
  const { signMessageAsync } = useSignMessage();
  const chimeRef = useRef(null);
  const playClick = useClickSound();
  const [referrerInput, setReferrerInput] = useState("");
  const [referrerErrorMsg, setReferrerErrorMsg] = useState("");
  const canEditReferralCode = parseFloat(referralStats.totalEarnings) >= 0.05;
  const [codeErrorMsg, setCodeErrorMsg] = useState("");
  const [referrerCode, setReferrerCode] = useState('');
  const [referrerWallet, setReferrerWallet] = useState('');
  const referralLinkInputRef = useRef(null);

  // Generate random referral code
  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  // Fetch referral code and stats
  const [onChainReferralCode, setOnChainReferralCode] = useState('');
  const [isRefetching, setIsRefetching] = useState(false);

  const refetchReferralCode = async () => {
    if (!address || !publicClient) return;
    try {
      const result = await safeContractCall(async () => {
        return await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: CONTRACT_ABI,
          functionName: 'getReferralCode',
          args: [address]
        });
      });
      setOnChainReferralCode(result);
    } catch (error) {
      console.error('Error fetching referral code:', error);
    }
  };

  const fetchReferralStats = async () => {
    if (!address || !publicClient) return;
    
    try {
      const result = await getReferralStats({ 
        publicClient, 
        contractAddress: CONTRACT_ADDRESS, 
        contractAbi: CONTRACT_ABI,
        address 
      });
      
      if (result.success) {
        setReferralStats({
          totalReferrals: Number(result.totalReferrals),
          activeReferrals: Number(result.activeReferrals),
          totalEarnings: formatEther(result.totalEarnings),
        });
      }
    } catch (error) {
      console.error('Error fetching referral stats:', error);
    }
  };

  // Fetch referrals list
  const fetchReferrals = async () => {
    if (!address || !publicClient) return;
    
    try {
      const referralsData = await safeContractCall(async () => {
        return await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: CONTRACT_ABI,
          functionName: 'getReferrals',
          args: [address]
        });
      });
      
      if (referralsData) {
        const formattedReferrals = referralsData.map(ref => ({
          address: ref[0],
          gamesPlayed: Number(ref[1]),
          totalWagered: formatEther(ref[2]),
          totalWon: formatEther(ref[3]),
          netEarned: formatEther(ref[4]),
          referralEarnings: formatEther(ref[5]),
          lastActive: new Date(Number(ref[6]) * 1000).toLocaleDateString(),
          sp: ref[7] !== undefined ? Number(ref[7]) : 0
        }));
        setReferrals(formattedReferrals);
      }
    } catch (error) {
      console.error('Error fetching referrals:', error);
    }
  };

  // Fetch player's referrer info
  const fetchReferrer = async () => {
    if (!address || !publicClient) return;
    
    try {
      const referrerData = await safeContractCall(async () => {
        return await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: CONTRACT_ABI,
          functionName: 'getPlayerDetails',
          args: [address]
        });
      });
      
      if (referrerData && referrerData[4] !== '0x0000000000000000000000000000000000000000') {
        setReferrer(referrerData[4]);
      }
    } catch (error) {
      console.error('Error fetching referrer:', error);
    }
  };

  // Initialize data on component mount
  useEffect(() => {
    if (isConnected && address) {
      refetchReferralCode();
      fetchReferralStats();
      fetchReferrals();
      fetchReferrer();
    }
  }, [isConnected, address]);

  // Update referral code when fetched
  useEffect(() => {
    if (onChainReferralCode && onChainReferralCode.length > 0) {
      setReferralCode(onChainReferralCode);
      setReferralLink(`snakstract.io/${onChainReferralCode}`);
    } else {
      setReferralCode('');
      setReferralLink('');
    }
  }, [onChainReferralCode]);

  // Claim rewards function
  const handleClaimRewards = async () => {
    if (!address || !walletClient) return;
    
    setIsLoading(true);
    try {
      const result = await claimReferralRewards({
        walletClient,
        contractAddress: CONTRACT_ADDRESS,
        contractAbi: CONTRACT_ABI
      });
      
      if (result.success) {
        setSuccessMessage('Claim transaction sent!');
        setPendingTx(result.txHash);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(`Failed to claim rewards: ${result.message}`);
        setTimeout(() => setError(null), 3000);
      }
    } catch (error) {
      console.error('Failed to claim rewards:', error);
      setError(`Failed to claim rewards: ${error.message || 'Unknown error'}`);
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  // Transaction confirmation monitoring
  const { isLoading: isTransactionLoading } = useWaitForTransactionReceipt({
    hash: pendingTx,
    onSuccess: () => {
      fetchReferralStats();
      setIsClaimed(true);
      setTimeout(() => setIsClaimed(false), 3000);
      setPendingTx(null);
    },
    onError: () => {
      setError('Transaction failed');
      setPendingTx(null);
      setTimeout(() => setError(null), 3000);
    }
  });

  // Update UI state when transaction is confirmed
  useEffect(() => {
    if (pendingTx) {
      // Transaction is pending - wait for it
    } else if (isTransactionLoading) {
      // Still loading
    } else {
      // Transaction completed or not started
      if (isConnected && address) {
        // Refresh all data after transaction completion
        refetchReferralCode();
        fetchReferralStats();
        fetchReferrals();
        fetchReferrer();
      }
    }
  }, [pendingTx, isTransactionLoading, isConnected, address]);

  const handleCopyLink = async () => {
    playClick();
    // Always use the up-to-date referralLink state, fallback to address if needed
    let linkToCopy = referralLink;
    if (!linkToCopy) {
      if (referralCode) {
        linkToCopy = `snakstract.io/${referralCode}`;
      } else if (address) {
        linkToCopy = `snakstract.io/${address.slice(0, 5).toUpperCase()}`;
      } else {
        setError('No referral link to copy.');
        return;
      }
    }
    try {
      await navigator.clipboard.writeText(linkToCopy);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      setSuccessMessage('Referral link copied to clipboard!');
      setTimeout(() => setSuccessMessage(''), 2000);
    } catch (err) {
      // Fallback for older browsers
      if (referralLinkInputRef.current) {
        referralLinkInputRef.current.select();
        document.execCommand('copy');
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
        setSuccessMessage('Referral link copied to clipboard!');
        setTimeout(() => setSuccessMessage(''), 2000);
      } else {
        setError('Failed to copy link. Please copy manually.');
      }
    }
  };

  const handleCodeChange = (e) => {
    let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (value.length > 5) value = value.slice(0, 5);
    setTempCode(value);
    setCodeErrorMsg("");
  };

  const handleCodeClick = () => {
    if (!canEditReferralCode) return;
    setIsEditingCode(true);
    setTempCode(referralCode);
  };

  // Handle set referral code
  const handleCodeSubmit = async () => {
    if (tempCode.length !== 5) {
      setCodeErrorMsg("Referral code must be 5 characters.");
      return;
    }
    
    // Check if code contains only valid characters
    if (!/^[A-Z0-9]{5}$/.test(tempCode)) {
      setCodeErrorMsg("Referral code must contain only letters and numbers.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await setReferralCode({
        walletClient,
        contractAddress: CONTRACT_ADDRESS,
        contractAbi: CONTRACT_ABI,
        code: tempCode
      });
      
      if (result.success) {
        setPendingTx(result.txHash);
        setIsEditingCode(false);
        setSuccessMessage('Transaction sent! Waiting for confirmation...');
        setTimeout(() => setSuccessMessage(''), 2000);
      } else {
        setError(`Failed to set referral code: ${result.message}`);
        setTimeout(() => setError(null), 3000);
      }
    } catch (error) {
      console.error('Failed to set referral code:', error);
      setError('Failed to set referral code: ' + (error.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleCodeSubmit();
    } else if (e.key === 'Escape') {
      setIsEditingCode(false);
      setTempCode(referralCode);
    }
  };

  const handleGenerateAndSetCode = async () => {
    if (!address || !walletClient) return;
    
    // Generate a unique code based on address
    const newCode = address.slice(0, 5).toUpperCase(); // Take first 5 chars including 0x
    setTempCode(newCode);
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await setReferralCode({
        walletClient,
        contractAddress: CONTRACT_ADDRESS,
        contractAbi: CONTRACT_ABI,
        code: newCode
      });
      
      if (result.success) {
        setPendingTx(result.txHash);
        setIsEditingCode(false);
        setSuccessMessage('Transaction sent! Waiting for confirmation...');
        setTimeout(() => setSuccessMessage(''), 2000);
      } else {
        setError('Failed to set referral code: ' + (result.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to set referral code:', error);
      setError('Failed to set referral code: ' + (error.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleReferrerInputChange = (e) => {
    let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (value.length > 5) value = value.slice(0, 5);
    setReferrerInput(value);
    setReferrerErrorMsg("");
  };

  // Handle set referrer
  const handleReferrerSubmit = async () => {
    if (referrerInput.length !== 5) {
      setReferrerErrorMsg("Referral code must be 5 characters.");
      return;
    }
    
    if (referralCode && referrerInput === referralCode) {
      setReferrerErrorMsg("You cannot use your own referral code.");
      return;
    }

    // Check if user already has a referrer
    if (referrerWallet) {
      setReferrerErrorMsg("You already have a referrer and cannot change it.");
      return;
    }

    // Check if the person they're trying to refer has already referred them
    if (referrals.some(ref => ref.player?.toLowerCase() === address?.toLowerCase())) {
      setReferrerErrorMsg("Cannot refer someone who has already referred you.");
      return;
    }

    // Additional check: prevent circular referrals
    if (referrals.length > 0) {
      const potentialReferrerAddress = referrals.find(ref => 
        ref.player?.toLowerCase() === address?.toLowerCase()
      );
      if (potentialReferrerAddress) {
        setReferrerErrorMsg("Cannot refer someone who is already your referral.");
        return;
      }
    }
    
    setIsLoading(true);
    try {
      const result = await setReferrer({
        walletClient,
        contractAddress: CONTRACT_ADDRESS,
        contractAbi: CONTRACT_ABI,
        code: referrerInput
      });
      
      if (result.success) {
        setPendingTx(result.txHash);
        setReferrerCode(referrerInput);
        setReferrerInput("");
        setReferrerErrorMsg("");
        setSuccessMessage('Referrer set! Transaction sent...');
        setTimeout(() => setSuccessMessage(''), 2000);
      } else {
        setReferrerErrorMsg(`Failed to set referrer: ${result.message}`);
      }
    } catch (err) {
      console.error('Failed to set referrer:', err);
      setReferrerErrorMsg(err.message || 'Failed to set referrer');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="page-container" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0e1a 0%, #1a1f2e 50%, #0a0e1a 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <div style={{ background: 'rgba(24, 28, 43, 0.95)', borderRadius: '24px', padding: '3rem 4rem', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', border: '2px solid rgba(0,255,204,0.2)' }}>
            <h2 style={{ color: '#00ffcc', marginBottom: '1rem' }}>Connect Your Wallet</h2>
            <p style={{ color: '#ccc' }}>Please connect your wallet to view your referral details.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="page-container" style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden', background: 'rgba(24,28,43,0.82)' }}>
        {/* Animated background */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'radial-gradient(circle at 20% 80%, rgba(0,255,204,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(108,92,231,0.1) 0%, transparent 50%)', animation: 'pulse 8s ease-in-out infinite alternate' }} />
        <style>{`
          .referral-scroll::-webkit-scrollbar { width: 8px; }
          .referral-scroll::-webkit-scrollbar-thumb { background: linear-gradient(180deg, #00ffcc 0%, #6c5ce7 100%); border-radius: 4px; border: 1px solid rgba(255,255,255,0.1); }
          .referral-scroll::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); border-radius: 4px; }
          @keyframes pulse { 0% { opacity: 0.3; } 100% { opacity: 0.7; } }
          @keyframes slideIn { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
          .section-card { animation: slideIn 0.6s ease-out; }
        `}</style>
        
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '2rem' }}>
          <div style={{ maxWidth: 1100, width: '100%', background: 'rgba(24,28,43,0.08)', borderRadius: '32px', border: '1.5px solid rgba(0,255,204,0.04)', boxShadow: '0 12px 48px 0 rgba(0,255,204,0.01), 0 1.5px 8px 0 rgba(0,0,0,0.01)', backdropFilter: 'blur(4px)', overflow: 'hidden', padding: '0 0 2rem 0' }}>
            {/* Header */}
            <div style={{ padding: '2.5rem 3.5rem 1.5rem 3.5rem', borderBottom: '1px solid rgba(0,255,204,0.10)', textAlign: 'center', background: 'rgba(0,255,204,0.04)' }}>
              <h1 style={{ color: '#00ffe0', fontSize: '2.2rem', fontWeight: 800, margin: 0, letterSpacing: '-1px', textShadow: '0 2px 16px #00ffe044, 0 0 1px #00ffe0', fontFamily: 'Orbitron, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <img src="/reff.png" alt="Referral" style={{ height: '2em', verticalAlign: 'middle', display: 'inline-block', marginRight: '0.18em', filter: 'drop-shadow(0 0 4px #00ffe0) drop-shadow(0 0 8px #00ffe066)' }} />
                Referral Program
              </h1>
              <p style={{ color: '#b2fff7', fontSize: '0.735rem', margin: '0.7rem 0 0 0', fontWeight: 500, letterSpacing: '0.01em', fontFamily: 'Orbiton, sans-serif' }}>Invite friends, earn rewards, and grow the Snakstract community!</p>
            </div>
            {/* Content Area */}
            <div className="referral-scroll" style={{ padding: '3.5rem 3.5rem 0 3.5rem', maxHeight: '70vh', overflowY: 'auto' }}>
              {/* Stats Overview */}
              <div className="section-card" style={{ marginBottom: '3.5rem', display: 'flex', gap: '1.2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <div style={{ flex: 1, minWidth: 140, maxWidth: 180, background: 'rgba(0,255,204,0.13)', border: '2px solid rgba(0,255,204,0.22)', borderRadius: '1.2rem', padding: '1.1rem 0.7rem', textAlign: 'center', boxShadow: '0 2px 12px 0 #00ffe022', margin: '0 0.3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: 'Orbiton, sans-serif', transition: 'box-shadow 0.2s', cursor: 'default' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.3rem', filter: 'drop-shadow(0 2px 8px #00ffe055)', fontFamily: 'Orbiton, sans-serif' }}>👥</div>
                  <div style={{ color: '#00ffe0', fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.15rem', letterSpacing: '0.01em', fontFamily: 'Orbiton, sans-serif' }}>Total Referrals</div>
                  <div style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 900, margin: 0, letterSpacing: '-1px', fontFamily: 'Orbiton, sans-serif' }}>{referralStats.totalReferrals}</div>
                </div>
                <div style={{ flex: 1, minWidth: 140, maxWidth: 180, background: 'rgba(0,255,204,0.13)', border: '2px solid rgba(0,255,204,0.22)', borderRadius: '1.2rem', padding: '1.1rem 0.7rem', textAlign: 'center', boxShadow: '0 2px 12px 0 #00ffe022', margin: '0 0.3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: 'Orbiton, sans-serif', transition: 'box-shadow 0.2s', cursor: 'default' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.3rem', filter: 'drop-shadow(0 2px 8px #00ffe055)', fontFamily: 'Orbiton, sans-serif' }}>🎯</div>
                  <div style={{ color: '#00ffe0', fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.15rem', letterSpacing: '0.01em', fontFamily: 'Orbiton, sans-serif' }}>Active Referrals</div>
                  <div style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 900, margin: 0, letterSpacing: '-1px', fontFamily: 'Orbiton, sans-serif' }}>{referralStats.activeReferrals}</div>
            </div>
                <div style={{ flex: 1, minWidth: 140, maxWidth: 180, background: 'rgba(0,255,204,0.13)', border: '2px solid rgba(0,255,204,0.22)', borderRadius: '1.2rem', padding: '1.1rem 0.7rem', textAlign: 'center', boxShadow: '0 2px 12px 0 #00ffe022', margin: '0 0.3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: 'Orbiton, sans-serif', transition: 'box-shadow 0.2s', cursor: 'default' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.3rem', filter: 'drop-shadow(0 2px 8px #00ffe055)', fontFamily: 'Orbiton, sans-serif' }}>💰</div>
                  <div style={{ color: '#00ffe0', fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.15rem', letterSpacing: '0.01em', fontFamily: 'Orbiton, sans-serif' }}>Total Earnings</div>
                  <div style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 900, margin: 0, letterSpacing: '-1px', fontFamily: 'Orbiton, sans-serif' }}>{referralStats.totalEarnings} <span style={{ fontSize: '0.9rem', color: '#00ffe0', fontWeight: 700, fontFamily: 'Orbiton, sans-serif' }}>ETH</span></div>
              <button
                    style={{ marginTop: '0.7rem', padding: '0.5rem 1.2rem', background: 'linear-gradient(135deg, #00ffe0 0%, #6c5ce7 100%)', border: 'none', borderRadius: '0.8rem', color: '#000', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 8px #00ffe033', fontFamily: 'Orbiton, sans-serif' }}
                onClick={() => { playClick(); handleClaimRewards(); }}
                    disabled={buttonMessage === 'No Rewards'}
                    onMouseDown={e => e.target.style.transform = 'scale(0.97)'}
                    onMouseUp={e => e.target.style.transform = 'scale(1)'}
                    onMouseLeave={e => e.target.style.transform = 'scale(1)'}
              >
                {buttonMessage}
              </button>
                  {successMessage && <div style={{ color: '#00ffe0', marginTop: '0.4rem', fontSize: '0.85rem', fontWeight: 600, fontFamily: 'Orbiton, sans-serif' }}>{successMessage}</div>}
            </div>
          </div>

              {/* Referral Link Section */}
              <div className="section-card" style={{ marginBottom: '3.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <h2 style={{ color: '#00ffe0', fontSize: '2.1rem', marginBottom: '1.5rem', fontWeight: 800, letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '1rem' }}>🔗 Your Referral Link</h2>
                <div style={{ background: 'rgba(0,255,204,0.08)', border: '1.5px solid rgba(0,255,204,0.18)', borderRadius: '2.5rem', padding: '1.2rem 2.2rem', display: 'flex', alignItems: 'center', gap: '1.2rem', boxShadow: '0 2px 16px #00ffe022', position: 'relative', minWidth: 340, maxWidth: 520, width: '100%' }}>
                  <input 
                    type="text" 
                    value={referralCode ? `snakstract.io/${referralCode}` : (address ? `snakstract.io/${address.slice(0, 5).toUpperCase()}` : '')} 
                    readOnly 
                    ref={referralLinkInputRef}
                    style={{ 
                      flex: 1, 
                      minWidth: '180px',
                      padding: '1.1rem 1.2rem', 
                      borderRadius: '2rem', 
                      border: 'none', 
                      background: 'rgba(0,0,0,0.18)', 
                      color: '#fff', 
                      fontSize: '1.15rem',
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      outline: 'none',
                      boxShadow: '0 1px 8px #00ffe022',
                      letterSpacing: '0.01em',
                      transition: 'box-shadow 0.2s',
                    }}
                  />
                  <button
                    onClick={handleCopyLink}
                    style={{ 
                      position: 'absolute',
                      right: '1.2rem',
                      top: '44%', // moved up a bit
                      transform: 'translateY(-50%)',
                      padding: '1.1rem 2.2rem', // bigger button
                      background: isCopied ? 'linear-gradient(135deg, #00ff88 0%, #00cc66 100%)' : 'linear-gradient(135deg, #00ffe0 0%, #6c5ce7 100%)', 
                      border: 'none', 
                      borderRadius: '2rem', 
                      color: '#000', 
                      fontWeight: 800, 
                      cursor: 'pointer',
                      fontSize: '1.35rem',
                      boxShadow: '0 2px 12px #00ffe033',
                      transition: 'background 0.2s',
                      zIndex: 2
                    }}
                    disabled={!(referralCode || address)}
                  >
                    {isCopied ? '✅' : '📋'}
                  </button>
                </div>
                <p style={{ color: '#b2fff7', fontSize: '1rem', margin: '1rem 0 0 0', fontWeight: 500 }}>Share this link with friends to start earning referral rewards!</p>
              </div>

              {/* Your Code Section */}
              <div className="section-card" style={{ marginBottom: '3rem' }}>
                <h2 style={{ color: '#00ffcc', fontSize: '2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>🎫 Your Referral Code</h2>
                <div style={{ background: 'rgba(0,255,204,0.05)', border: '1px solid rgba(0,255,204,0.2)', borderRadius: '16px', padding: '2rem' }}>
            {referralCode ? (
              isEditingCode ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    value={tempCode}
                    onChange={handleCodeChange}
                    onKeyDown={handleCodeKeyPress}
                    maxLength={5}
                    autoFocus
                    placeholder="Enter 5 characters"
                          disabled={!canEditReferralCode}
                          style={{ padding: '1rem', borderRadius: '12px', border: '2px solid #00ffcc', fontSize: '1.2rem', background: 'rgba(0,0,0,0.3)', color: '#fff', fontFamily: 'monospace', textAlign: 'center', width: '120px' }}
                  />
                    <button 
                      onClick={handleCodeSubmit}
                          disabled={isLoading || !canEditReferralCode}
                          style={{ padding: '1rem 2rem', background: '#00ffcc', color: '#000', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: canEditReferralCode ? 'pointer' : 'not-allowed', fontSize: '1rem' }}
                    >
                          {isLoading ? '⏳ Saving...' : '💾 Save Code'}
                    </button>
                    <button 
                          onClick={() => { setIsEditingCode(false); setTempCode(referralCode); }}
                          style={{ padding: '1rem 2rem', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '2px solid rgba(255,255,255,0.3)', borderRadius: '12px', cursor: 'pointer', fontSize: '1rem' }}
                        >
                          ❌ Cancel
                    </button>
                        {!canEditReferralCode && (
                          <div style={{ color: '#ffc107', fontSize: '0.9rem', background: 'rgba(255,193,7,0.1)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,193,7,0.3)' }}>
                            ⚠️ Need to win up to 0.05 ETH in profits first.
                  </div>
                        )}
                        {codeErrorMsg && <div style={{ color: '#ff4444', fontSize: '0.9rem', background: 'rgba(255,68,68,0.1)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,68,68,0.3)' }}>{codeErrorMsg}</div>}
                </div>
              ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        <div 
                          onClick={() => { if (canEditReferralCode) { playClick(); handleCodeClick(); } }}
                          style={{ 
                            padding: '1.5rem 3rem', 
                            background: 'rgba(0,255,204,0.1)', 
                            border: '3px solid #00ffcc', 
                            borderRadius: '16px', 
                            fontSize: '2rem', 
                            fontWeight: 'bold', 
                            color: '#00ffcc',
                            cursor: canEditReferralCode ? 'pointer' : 'default',
                            opacity: canEditReferralCode ? 1 : 0.6,
                            transition: 'all 0.3s ease',
                            fontFamily: 'monospace',
                            textAlign: 'center',
                            minWidth: '150px'
                          }}
                >
                  {referralCode}
                </div>
                        {canEditReferralCode && (
                          <button
                            onClick={() => { playClick(); handleCodeClick(); }}
                            style={{ padding: '1rem 2rem', background: 'rgba(0,255,204,0.2)', color: '#00ffcc', border: '2px solid #00ffcc', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' }}
                          >
                            ✏️ Edit Code
              </button>
            )}
          </div>
                    )
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <input 
                type="text" 
                        value={tempCode}
                        onChange={handleCodeChange}
                        onKeyDown={handleCodeKeyPress}
                        maxLength={5}
                        autoFocus
                        placeholder={address ? address.slice(0, 5).toUpperCase() : 'ABCDE'}
                        style={{ padding: '1rem', borderRadius: '12px', border: '2px solid #00ffcc', fontSize: '1.2rem', background: 'rgba(0,0,0,0.3)', color: '#fff', fontFamily: 'monospace', textAlign: 'center', width: '120px' }}
                        disabled={!canEditReferralCode}
              />
              <button 
                        onClick={handleCodeSubmit}
                        disabled={isLoading || tempCode.length !== 5 || !canEditReferralCode}
                        style={{ padding: '1rem 2rem', background: '#00ffcc', color: '#000', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: canEditReferralCode ? 'pointer' : 'not-allowed', fontSize: '1rem' }}
                      >
                        💾 Set Code
              </button>
                      <span style={{ color: '#888', fontSize: '0.9rem' }}>or leave blank to use wallet prefix</span>
                      {!canEditReferralCode && (
                        <span style={{ color: '#ffc107', fontSize: '0.9rem', background: 'rgba(255,193,7,0.1)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,193,7,0.3)' }}>
                          ⚠️ Need to win up to 0.05 ETH in profits first.
                        </span>
                      )}
                    </div>
                  )}
            </div>
          </div>

              {/* Referrals Table Section */}
              <div className="section-card" style={{ marginBottom: '3rem' }}>
                <h2 style={{ color: '#00ffcc', fontSize: '2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>👥 Your Referrals</h2>
                <div style={{ background: 'rgba(0,255,204,0.05)', border: '1px solid rgba(0,255,204,0.2)', borderRadius: '16px', padding: '2rem', overflowX: 'auto' }}>
                  {referrals.length > 0 ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff' }}>
                <thead>
                        <tr style={{ borderBottom: '2px solid rgba(0,255,204,0.3)' }}>
                          <th style={{ padding: '1rem', textAlign: 'left', color: '#00ffcc', fontSize: '1rem' }}>Address</th>
                          <th style={{ padding: '1rem', textAlign: 'left', color: '#00ffcc', fontSize: '1rem' }}>Games</th>
                          <th style={{ padding: '1rem', textAlign: 'left', color: '#00ffcc', fontSize: '1rem' }}>Wagered</th>
                          <th style={{ padding: '1rem', textAlign: 'left', color: '#00ffcc', fontSize: '1rem' }}>Won</th>
                          <th style={{ padding: '1rem', textAlign: 'left', color: '#00ffcc', fontSize: '1rem' }}>Net Earned</th>
                          <th style={{ padding: '1rem', textAlign: 'left', color: '#00ffcc', fontSize: '1rem' }}>Your Earnings</th>
                          <th style={{ padding: '1rem', textAlign: 'left', color: '#00ffcc', fontSize: '1rem' }}>Last Active</th>
                          <th style={{ padding: '1rem', textAlign: 'left', color: '#00ffcc', fontSize: '1rem' }}>SP</th>
                  </tr>
                </thead>
                <tbody>
                        {referrals.map((ref, index) => (
                          <tr key={index} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', background: index % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                            <td style={{ padding: '1rem', fontFamily: 'monospace' }}>{`${ref.address.slice(0, 6)}...${ref.address.slice(-4)}`}</td>
                            <td style={{ padding: '1rem', textAlign: 'center' }}>{ref.gamesPlayed}</td>
                            <td style={{ padding: '1rem', fontFamily: 'monospace' }}>{parseFloat(ref.totalWagered).toFixed(4)} ETH</td>
                            <td style={{ padding: '1rem', fontFamily: 'monospace' }}>{parseFloat(ref.totalWon).toFixed(4)} ETH</td>
                            <td style={{ padding: '1rem', fontFamily: 'monospace', color: parseFloat(ref.netEarned) >= 0 ? '#00ff88' : '#ff4444' }}>{parseFloat(ref.netEarned).toFixed(4)} ETH</td>
                            <td style={{ padding: '1rem', fontFamily: 'monospace', color: '#00ffcc' }}>{parseFloat(ref.referralEarnings).toFixed(4)} ETH</td>
                            <td style={{ padding: '1rem' }}>{ref.lastActive}</td>
                            <td style={{ padding: '1rem', textAlign: 'center' }}>{ref.sp !== undefined ? `${ref.sp} SP` : '-'}</td>
                      </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>
                      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>👥</div>
                      <h3 style={{ color: '#00ffcc', marginBottom: '1rem' }}>No referrals yet</h3>
                      <p style={{ color: '#aaa', fontSize: '1.1rem' }}>Share your referral link with friends to start earning rewards!</p>
                    </div>
                  )}
            </div>
          </div>

              {/* How It Works Section */}
              <div className="section-card">
                <h2 style={{ color: '#00ffcc', fontSize: '2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>📖 How It Works</h2>
                <div style={{ background: 'rgba(0,255,204,0.05)', border: '1px solid rgba(0,255,204,0.2)', borderRadius: '16px', padding: '2rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                    <div>
                      <h3 style={{ color: '#00ffcc', marginBottom: '1rem', fontSize: '1.3rem' }}>🎯 Getting Started</h3>
                      <ul style={{ color: '#ddd', lineHeight: '1.8', paddingLeft: '1.5rem' }}>
              <li>Share your unique referral link with friends</li>
              <li>When they sign up using your link, they become your referral</li>
              <li>Earn 5% of their game entry fees as rewards</li>
              <li>Claim your rewards anytime</li>
                      </ul>
                    </div>
                    <div>
                      <h3 style={{ color: '#00ffcc', marginBottom: '1rem', fontSize: '1.3rem' }}>⚙️ Code System</h3>
                      <ul style={{ color: '#ddd', lineHeight: '1.8', paddingLeft: '1.5rem' }}>
              <li>New players get a random 5-character referral code</li>
              <li>After earning 0.05 ETH, you can customize your referral code</li>
                        <li>Codes are unique and case-insensitive</li>
                      </ul>
                    </div>
                    <div>
                      <h3 style={{ color: '#ffc107', marginBottom: '1rem', fontSize: '1.3rem' }}>⚠️ Important Rules</h3>
                      <ul style={{ color: '#ddd', lineHeight: '1.8', paddingLeft: '1.5rem' }}>
                        <li>You can only accept one referral invitation</li>
                        <li>Once set, your referrer cannot be changed</li>
                        <li>You cannot refer someone who has already referred you</li>
                        <li>Circular referrals are not allowed</li>
            </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <audio ref={chimeRef} src="/sounds/chime.mp3" preload="auto" />
    </ErrorBoundary>
  );
};

export default ReferralTab;
