import React, { useState, useEffect, useRef } from 'react';
import { useAccount, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { useWriteContractSponsored } from "@abstract-foundation/agw-react";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config';
import { useNetwork } from '../App';
import { useNavigate } from 'react-router-dom';

function HistoryTab() {
  const { address, isConnected } = useAccount();
  const [withdrawStatus, setWithdrawStatus] = useState('');
  const [withdrawError, setWithdrawError] = useState(null);
  const [gameHistory, setGameHistory] = useState([]);
  const [showNoEthMessage, setShowNoEthMessage] = useState(false);

  const { writeContractSponsored, data: hash, isPending: isWithdrawLoading, error: writeError } = useWriteContractSponsored();
  const { networkConfig } = useNetwork();

  const chimeRef = useRef(null);

  // Read game history from contract
  const { data: historyData } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getPlayerHistory',
    args: [address],
    query: {
      enabled: !!address,
    watch: true,
    },
  });

  // Read player details from contract
  const { data: playerDetails } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getPlayerDetails',
    args: [address],
    query: {
      enabled: !!address,
      refetchInterval: 5000, // Refetch every 5 seconds
    },
  });

  useWaitForTransactionReceipt({
    hash,
    query: {
      enabled: !!hash,
    },
    onSuccess(data) {
      setWithdrawStatus('Withdrawal successful!');
      setWithdrawError(null);
      console.log('Withdrawal transaction successful:', data);
      // You might want to refresh user's balance here or game state
    },
    onError(error) {
      setWithdrawStatus('Withdrawal failed.');
      setWithdrawError(error);
      console.error('Withdrawal transaction failed:', error);
    },
  });

  useEffect(() => {
    const fetchHistory = () => {
      fetch('http://10.0.0.248:2567/history')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            // Filter by wallet address and sort by timestamp (latest first)
            const filteredData = data.filter(g => address ? g.wallet.toLowerCase() === address.toLowerCase() : true);
            const sortedData = filteredData.sort((a, b) => {
              // Use timestamp if available, otherwise use sessionStartTime or fallback to 0
              const timeA = a.timestamp || a.sessionStartTime || 0;
              const timeB = b.timestamp || b.sessionStartTime || 0;
              return timeB - timeA; // Descending order (latest first)
            });
            setGameHistory(sortedData);
    } else {
      setGameHistory([]);
    }
        })
        .catch(() => setGameHistory([]));
    };
    
    // Fetch immediately
    fetchHistory();
    
    // Listen for SP updates from quest claims
    const handleSPUpdate = (event) => {
      if (event.detail && event.detail.wallet.toLowerCase() === (address || '').toLowerCase()) {
        console.log('SP update event received, refreshing history');
        fetchHistory(); // Refresh immediately
      }
    };
    
    window.addEventListener('spUpdated', handleSPUpdate);
    
    return () => {
      window.removeEventListener('spUpdated', handleSPUpdate);
    };
  }, [address]);

  const handleWithdraw = async () => {
    if (chimeRef.current) {
      chimeRef.current.currentTime = 0;
      chimeRef.current.play();
    }
    
    if (!isConnected) {
      setWithdrawStatus('Please connect your wallet to withdraw.');
      return;
    }

    // Check if player is in game - prevent withdrawal
    if (isInGame) {
      setWithdrawStatus('Cannot withdraw while in game. Complete your current game first.');
      return;
    }

    // Check if there's any ETH to claim - if not, show message for 2 seconds
    if (claimableEth <= 0) {
      setShowNoEthMessage(true);
      setTimeout(() => {
        setShowNoEthMessage(false);
      }, 2000);
      return; // Exit early, don't call writeContract
    }

    // Don't set any status message when there's ETH to claim - just proceed with transaction
    setWithdrawError(null);
    
    const transactionData = {
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'withdrawWithEarnings',
      args: [claimableEth * 1e18], // Pass total amount in wei
    };

    // Set a timeout to detect if the wallet popup is blank
    const timeoutId = setTimeout(() => {
      setWithdrawStatus("Abstract wallet popup appears to be blank. This usually means there's a crypto API issue. Please try:\n\n1. Refresh the page\n2. Use a different browser (Chrome, Firefox, Edge)\n3. Try in incognito/private mode\n4. Disable browser extensions\n5. Check if your browser supports Web Crypto API");
    }, 5000); // 5 second timeout
    
    try {
      const result = writeContractSponsored(transactionData);
      
      // Clear timeout if successful
      clearTimeout(timeoutId);
    } catch (error) {
      console.error("Abstract SDK contract call failed:", error);
      clearTimeout(timeoutId);
      
      // Show manual transaction instructions since Abstract SDK is failing
      const manualInstructions = `
Abstract SDK Error: ${error.message || 'Crypto initialization failed'}

Since the Abstract SDK is having crypto API issues, here are manual instructions:

1. Open your Abstract wallet manually
2. Go to the "Send" or "Transaction" section
3. Use these transaction details:
   - To: ${CONTRACT_ADDRESS}
   - Value: 0 ETH (no value needed for withdraw)
   - Data: 0x3d18b912 (withdraw function selector)
   - Chain: Abstract Mainnet (Chain ID: 11124)

4. After the transaction is confirmed, refresh this page

Alternative solutions:
- Try a different browser (Chrome, Firefox, Edge)
- Use incognito/private mode
- Disable browser extensions
- Update your browser to the latest version
      `;
      
      setWithdrawStatus(manualInstructions);
      setWithdrawError(error);
    }
  };

  // Calculate total claimable ETH (stake + pending rewards) from playerDetails
  let claimableEth = 0;
  let stakeAmount = 0;
  let pendingRewards = 0;
  let isInGame = false;
  let sp = 0;
  
  if (playerDetails && Array.isArray(playerDetails) && playerDetails.length >= 10) {
    stakeAmount = Number(playerDetails[0]) / 1e18;
    isInGame = playerDetails[1];
    sp = Number(playerDetails[9]) || 0;
    
    // Check for pending rewards from expired ETH orbs in game history
    const userHistory = gameHistory.filter(game => 
      game.wallet && game.wallet.toLowerCase() === (address || '').toLowerCase()
    );
    
    // Sum up all pending rewards from escape entries
    pendingRewards = userHistory
      .filter(game => game.result === 'escape' && game.pendingRewards)
      .reduce((total, game) => total + (game.pendingRewards || 0), 0);
    
    claimableEth = stakeAmount + pendingRewards;
  }
  
  let claimText = `ETH ${claimableEth.toFixed(4)} to claim`;
  if (!isConnected || !address) claimText = 'ETH 0.000';
  if (playerDetails === undefined) claimText = 'ETH 0.000';

  // Get accumulated SP from playerDetails (assume index 9, as in other components)
  let accumulatedSP = 0;
  if (playerDetails && Array.isArray(playerDetails) && playerDetails.length >= 10) {
    accumulatedSP = Number(playerDetails[9]);
  }

  // Show breakdown if there are stake, survival rewards, or pending rewards
  let breakdownText = '';
  if (stakeAmount > 0 && pendingRewards > 0) {
    breakdownText = `(Stake: ${stakeAmount.toFixed(4)} + Pending: ${pendingRewards.toFixed(4)})`;
  } else if (stakeAmount > 0) {
    breakdownText = `(Stake: ${stakeAmount.toFixed(4)})`;
  } else if (pendingRewards > 0) {
    breakdownText = `(Pending Rewards: ${pendingRewards.toFixed(4)})`;
  }

  // Determine button text and state based on game status
  let buttonText = 'Withdraw Funds';
  let buttonDisabled = isWithdrawLoading || !isConnected;
  let buttonStyle = {
    padding: '1rem 2rem',
    background: isWithdrawLoading ? '#888' : (showNoEthMessage ? '#ff4444' : '#6c5ce7'),
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: isWithdrawLoading ? 'not-allowed' : 'pointer',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    transition: 'all 0.3s ease',
  };

  if (isInGame) {
    buttonText = 'In Game - Cannot Withdraw';
    buttonDisabled = true;
    buttonStyle.background = '#666';
    buttonStyle.cursor = 'not-allowed';
  } else if (claimableEth <= 0) {
    buttonText = 'No ETH to Claim';
    buttonDisabled = true;
    buttonStyle.background = '#666';
    buttonStyle.cursor = 'not-allowed';
  } else if (isWithdrawLoading) {
    buttonText = 'Withdrawing...';
  } else if (showNoEthMessage) {
    buttonText = 'No ETH to Claim';
  }

  // Show explanation text
  let explanationText = '';
  if (isInGame) {
    explanationText = 'Complete your current game to withdraw funds';
  } else if (claimableEth > 0) {
    if (stakeAmount > 0 && pendingRewards > 0) {
      explanationText = 'Withdraw failed escape claims and pending ETH from expired orbs';
    } else if (stakeAmount > 0) {
      explanationText = 'Withdraw failed escape claims';
    } else if (pendingRewards > 0) {
      explanationText = 'Withdraw pending ETH from expired orbs (70% of uncollected ETH from kills)';
    }
  }

  // Calculate total SP for the connected wallet
  const userSP = gameHistory
    .filter(game => game.wallet && game.wallet.toLowerCase() === (address || '').toLowerCase())
    .reduce((total, game) => total + (game.sp || game.SP || 0), 0);

  if (!isConnected) {
    return (
      <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '90vh' }}>
        <div style={{ color: '#00ffcc', textAlign: 'center' }}>
          <h2>Please connect your wallet to view your game history.</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ minHeight: '100vh', background: 'rgba(24,28,43,0.82)', fontFamily: 'Orbiton, sans-serif' }}>
      {/* Animated background */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'radial-gradient(circle at 20% 80%, rgba(0,255,204,0.08) 0%, transparent 60%), radial-gradient(circle at 80% 20%, rgba(108,92,231,0.08) 0%, transparent 60%)', zIndex: 0 }} />
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', minHeight: '100vh', padding: '3rem 0' }}>
        <div style={{ maxWidth: 1100, width: '100%', background: 'rgba(24,28,43,0.08)', borderRadius: '32px', border: '1.5px solid rgba(0,255,204,0.04)', boxShadow: '0 12px 48px 0 rgba(0,255,204,0.01), 0 1.5px 8px 0 rgba(0,0,0,0.01)', backdropFilter: 'blur(4px)', overflow: 'hidden', padding: '0 0 2rem 0', position: 'relative', zIndex: 1 }}>
          <div style={{ padding: '2.5rem 3.5rem 1.5rem 3.5rem', borderBottom: '1px solid rgba(0,255,204,0.10)', textAlign: 'center', background: 'rgba(0,255,204,0.04)' }}>
            <h1 style={{ color: '#00ffe0', fontSize: '2.2rem', fontWeight: 800, margin: 0, letterSpacing: '-1px', textShadow: '0 2px 16px #00ffe044, 0 0 1px #00ffe0', fontFamily: 'Orbitron, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <img src="/history.png" alt="History" style={{ height: '2em', verticalAlign: 'middle', display: 'inline-block', marginRight: '0.05em', filter: 'drop-shadow(0 0 4px #00ffe0) drop-shadow(0 0 8px #00ffe044)' }} />
              History
            </h1>
            <p style={{ color: '#b2fff7', fontSize: '0.85rem', margin: '0.7rem 0 0 0', fontWeight: 500, letterSpacing: '0.01em', fontFamily: 'Orbiton, sans-serif' }}>Track your past games and results below.</p>
          </div>
          <div style={{ padding: '2.5rem 3.5rem 0 3.5rem' }}>
            {/* ETH to claim and SP points, separated and styled */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-evenly',
              alignItems: 'flex-start',
              gap: '3rem',
              marginBottom: '3rem',
              marginTop: '1.5rem',
            }}>
              {/* ETH to claim + button */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{
                  fontSize: '1.8rem',
                  fontWeight: 700,
                color: '#00ff88',
                  textShadow: '0 0 20px #00ff88, 0 0 40px #00ff88, 0 0 60px #00ff88',
                  letterSpacing: '0.05em',
                  padding: '0.3em 1em',
                  borderRadius: '1.2em',
                  background: 'linear-gradient(135deg, rgba(0,255,136,0.1) 0%, rgba(0,255,136,0.2) 100%)',
                  boxShadow: '0 0 30px rgba(0, 255, 136, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                  display: 'inline-block',
                  marginBottom: '1rem',
                  fontFamily: "'Orbitron', sans-serif",
                  border: '1px solid rgba(0, 255, 136, 0.3)',
                  className: 'pulse-animation'
              }}>
                {claimText}
              </span>
                <button
                  onClick={handleWithdraw}
                  disabled={buttonDisabled}
                  style={{
                    ...buttonStyle,
                    padding: '1.2rem 2.5rem',
                    background: isWithdrawLoading 
                      ? 'linear-gradient(135deg, #666, #888)' 
                      : (showNoEthMessage 
                        ? 'linear-gradient(135deg, #ff4444, #cc0000)' 
                        : 'linear-gradient(135deg, #00ffcc, #00cc99)'),
                    border: '2px solid rgba(0, 255, 204, 0.3)',
                    borderRadius: '12px',
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    fontFamily: "'Orbitron', sans-serif",
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    boxShadow: '0 8px 24px rgba(0, 255, 204, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                    transition: 'all 0.3s ease',
                    cursor: buttonDisabled ? 'not-allowed' : 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    if (!buttonDisabled) {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 12px 32px rgba(0, 255, 204, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 8px 24px rgba(0, 255, 204, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
                  }}
                >
                  {buttonText}
                </button>
                {breakdownText && (
                  <div style={{
                    fontSize: '1rem',
                    color: '#00ffcc',
                    marginTop: '0.8rem',
                    opacity: 0.9,
                    fontFamily: "'Orbitron', sans-serif",
                    textAlign: 'center'
                  }}>
                    {breakdownText}
                  </div>
                )}
              </div>
              {/* SP points with purple glow */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 120,
                padding: 0,
                background: 'none',
                borderRadius: 0,
                boxShadow: 'none',
              }}>
                <span style={{
                  fontSize: '1.8rem',
                  fontWeight: 700,
                  color: '#a259ff',
                  textShadow: '0 0 20px #a259ff, 0 0 40px #a259ff, 0 0 60px #a259ff',
                  letterSpacing: '0.05em',
                  padding: '0.3em 1em',
                  borderRadius: '1.2em',
                  background: 'linear-gradient(135deg, rgba(162,89,255,0.1) 0%, rgba(162,89,255,0.2) 100%)',
                  boxShadow: '0 0 30px rgba(162, 89, 255, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                  display: 'inline-block',
                  margin: 0,
                  fontFamily: "'Orbitron', sans-serif",
                  border: '1px solid rgba(162, 89, 255, 0.3)',
                  className: 'pulse-animation'
                }}>
                  SP {userSP}
                </span>
                {/* Finished Quests Button */}
                <FinishedQuestsButton />
              </div>
            </div>

            {explanationText && (
              <div style={{ textAlign: 'center', marginBottom: '2.5rem', marginTop: '1.5rem' }}>
                <div style={{
                  fontSize: '1rem',
                color: '#00ffcc',
                  opacity: 0.9,
                  fontFamily: "'Orbitron', sans-serif"
              }}>
                {explanationText}
                </div>
            </div>
            )}

            {/* Table section with background image and custom scrollbars */}
            <div className="history-table-bg" style={{ position: 'relative', marginTop: '2.5rem', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.10)' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, backgroundImage: "url('/snakstract_bg.png')", backgroundRepeat: 'no-repeat', backgroundPosition: 'center', backgroundSize: 'cover', opacity: 0.32 }} />
              <div className="history-scroll" style={{ position: 'relative', zIndex: 1, maxHeight: '500px', overflowY: 'auto', overflowX: 'auto', borderRadius: '24px' }}>
                <style>{`
                  .history-scroll::-webkit-scrollbar {
                    width: 8px;
                    height: 8px;
                  }
                  .history-scroll::-webkit-scrollbar-thumb {
                    background: linear-gradient(180deg, #00ffcc 0%, #a259ff 100%);
                    border-radius: 4px;
                    border: 1px solid rgba(0,255,204,0.15);
                  }
                  .history-scroll::-webkit-scrollbar-track {
                    background: rgba(24,28,43,0.18);
                    border-radius: 4px;
                  }
                `}</style>
                <table className="history-table" style={{ width: '100%', tableLayout: 'fixed', background: 'rgba(24,28,43,0.72)' }}>
                <thead>
                  <tr>
                      <th style={{ width: '16%', fontSize: '0.75rem', textAlign: 'center', fontFamily: "'Orbitron', sans-serif", fontWeight: '600', paddingLeft: '1.5rem' }}>TX</th>
                      <th style={{ width: '16%', fontSize: '0.75rem', textAlign: 'center', fontFamily: "'Orbitron', sans-serif", fontWeight: '600' }}>Date & Time</th>
                      <th style={{ width: '12%', fontSize: '0.75rem', textAlign: 'center', fontFamily: "'Orbitron', sans-serif", fontWeight: '600' }}>Stake</th>
                      <th style={{ width: '13%', fontSize: '0.75rem', textAlign: 'center', fontFamily: "'Orbitron', sans-serif", fontWeight: '600' }}>Result</th>
                      <th style={{ width: '12%', fontSize: '0.75rem', textAlign: 'center', fontFamily: "'Orbitron', sans-serif", fontWeight: '600' }}>Profit</th>
                      <th style={{ width: '10%', fontSize: '0.75rem', textAlign: 'center', fontFamily: "'Orbitron', sans-serif", fontWeight: '600' }}>SP</th>
                      <th style={{ width: '10%', fontSize: '0.75rem', textAlign: 'center', fontFamily: "'Orbitron', sans-serif", fontWeight: '600' }}>Kills</th>
                      <th style={{ width: '8%', fontSize: '0.75rem', textAlign: 'center', fontFamily: "'Orbitron', sans-serif", fontWeight: '600' }}>🎖️</th>
                      <th style={{ width: '9%', fontSize: '0.75rem', textAlign: 'center', fontFamily: "'Orbitron', sans-serif", fontWeight: '600' }}>Time</th>
                  </tr>
                </thead>
                <tbody>
                    {gameHistory.map((game, index) => (
                      <tr key={game.id || `${game.timestamp || game.sessionStartTime}-${game.wallet || index}`}>
                        <td style={{ textAlign: 'left', paddingLeft: '1.5rem', minWidth: '204px', maxWidth: '374px' }}>
                          {game.result === '🎯' ? (
                            <span
                              style={{
                                color: '#00ffcc',
                                textDecoration: 'none',
                                fontFamily: "'Orbitron', sans-serif",
                                fontWeight: '600',
                                textShadow: '0 0 8px rgba(0, 255, 204, 0.5)',
                                transition: 'all 0.3s ease',
                                fontSize: '0.65rem',
                                background: 'linear-gradient(135deg, rgba(0,255,204,0.1) 0%, rgba(0,255,204,0.2) 100%)',
                                borderRadius: '6px',
                                boxShadow: '0 0 12px rgba(0, 255, 204, 0.3)',
                                padding: '0.3rem 1.7rem',
                                display: 'inline-block',
                                border: '1px solid rgba(0, 255, 204, 0.3)',
                                maxWidth: '100%',
                                minWidth: '102px',
                                width: '100%',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              N/A
                            </span>
                          ) : (
                            <a
                              href={game.tx && game.tx !== '-' && game.tx !== 'N/A' ? `https://abs.scan/tx/${game.tx}` : undefined}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                color: '#00ffcc',
                                textDecoration: 'none',
                                fontFamily: "'Orbitron', sans-serif",
                                fontWeight: '600',
                                textShadow: '0 0 8px rgba(0, 255, 204, 0.5)',
                                transition: 'all 0.3s ease',
                                fontSize: '0.65rem',
                                background: 'linear-gradient(135deg, rgba(0,255,204,0.1) 0%, rgba(0,255,204,0.2) 100%)',
                                borderRadius: '6px',
                                boxShadow: '0 0 12px rgba(0, 255, 204, 0.3)',
                                padding: '0.3rem 1.7rem',
                                display: 'inline-block',
                                border: '1px solid rgba(0, 255, 204, 0.3)',
                                maxWidth: '100%',
                                minWidth: '102px',
                                width: '100%',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                              title={game.tx}
                              onMouseEnter={e => {
                                e.target.style.textShadow = '0 0 12px rgba(0, 255, 204, 0.8)';
                                e.target.style.transform = 'scale(1.05)';
                                e.target.style.boxShadow = '0 0 20px rgba(0, 255, 204, 0.5)';
                              }}
                              onMouseLeave={e => {
                                e.target.style.textShadow = '0 0 8px rgba(0, 255, 204, 0.5)';
                                e.target.style.transform = 'scale(1)';
                                e.target.style.boxShadow = '0 0 12px rgba(0, 255, 204, 0.3)';
                              }}
                            >
                              {game.tx && game.tx !== '-' && game.tx !== 'N/A' ? `${game.tx.slice(0, 6)}...${game.tx.slice(-4)}` : '-'}
                            </a>
                          )}
                        </td>
                        <td style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.75rem' }}>
                          {game.timestamp ? new Date(game.timestamp).toLocaleString('en-US', { 
                            timeZone: 'America/New_York',
                            year: 'numeric', 
                            month: '2-digit', 
                            day: '2-digit', 
                            hour: '2-digit',
                            minute: '2-digit', 
                            second: '2-digit',
                            hour12: true 
                          }) : (game.dateTime ? game.dateTime : '-')}
                        </td>
                        <td>
                          {game.result === '🎯' ? (
                            <span
                              style={{
                                color: '#00ffcc',
                                textDecoration: 'none',
                                fontFamily: "'Orbitron', sans-serif",
                                fontWeight: '600',
                                textShadow: '0 0 8px rgba(0, 255, 204, 0.5)',
                                transition: 'all 0.3s ease',
                                fontSize: '0.65rem',
                                background: 'linear-gradient(135deg, rgba(0,255,204,0.1) 0%, rgba(0,255,204,0.2) 100%)',
                                borderRadius: '6px',
                                boxShadow: '0 0 12px rgba(0, 255, 204, 0.3)',
                                padding: '0.3rem 1rem',
                                display: 'inline-block',
                                border: '1px solid rgba(0, 255, 204, 0.3)',
                                maxWidth: '100%',
                                minWidth: '60px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              N/A
                            </span>
                          ) : (
                            <span
                              style={{
                                color: '#00ffcc',
                                textDecoration: 'none',
                                fontFamily: "'Orbitron', sans-serif",
                                fontWeight: '600',
                                textShadow: '0 0 8px rgba(0, 255, 204, 0.5)',
                                transition: 'all 0.3s ease',
                                fontSize: '0.65rem',
                                background: 'linear-gradient(135deg, rgba(0,255,204,0.1) 0%, rgba(0,255,204,0.2) 100%)',
                                borderRadius: '6px',
                                boxShadow: '0 0 12px rgba(0, 255, 204, 0.3)',
                                padding: '0.3rem 1rem',
                                display: 'inline-block',
                                border: '1px solid rgba(0, 255, 204, 0.3)',
                                maxWidth: '100%',
                                minWidth: '60px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                              title={game.stake}
                              onMouseEnter={e => {
                                e.target.style.textShadow = '0 0 12px rgba(0, 255, 204, 0.8)';
                                e.target.style.transform = 'scale(1.05)';
                                e.target.style.boxShadow = '0 0 20px rgba(0, 255, 204, 0.5)';
                              }}
                              onMouseLeave={e => {
                                e.target.style.textShadow = '0 0 8px rgba(0, 255, 204, 0.5)';
                                e.target.style.transform = 'scale(1)';
                                e.target.style.boxShadow = '0 0 12px rgba(0, 255, 204, 0.3)';
                              }}
                            >
                              {typeof game.stake === 'number' ? `${game.stake.toFixed(3)} ETH` : (game.stake || 'N/A')}
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`status-badge ${game.result?.toLowerCase()}`}> 
                            {game.result === 'kill' ? (
                              <span style={{ color: '#ff2222', textShadow: '0 0 8px #ff2222, 0 0 16px #ff2222', fontWeight: 700, fontSize: '1.2em' }}>🗡️</span>
                            ) : game.result === 'death' ? (
                              <span style={{ color: '#fff', textShadow: '0 0 8px #ff2222, 0 0 16px #ff2222', fontWeight: 700, fontSize: '1.2em' }}>💀</span>
                            ) : game.result === 'escape' ? (
                              <span style={{ color: '#00ff88', textShadow: '0 0 8px #00ff88, 0 0 16px #00ff88', fontWeight: 700, fontSize: '1.2em' }}>🚁</span>
                            ) : game.result === '🎯' ? (
                              <span style={{ color: '#ffe066', textShadow: '0 0 8px #ffe066, 0 0 16px #ffe066', fontWeight: 700, fontSize: '1.2em' }}>🎯</span>
                            ) : (
                              <span style={{ fontSize: '0.75rem' }}>{game.result || '-'}</span>
                            )}
                        </span>
                      </td>
                        <td style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: '600', color: game.ethEarned > 0 ? '#00ff88' : '#ff4444', fontSize: '0.75rem' }}>
                          {game.result === '🎯' ? (
                            <span style={{ color: '#ffe066', fontWeight: 700, fontFamily: "'Orbitron', sans-serif", fontSize: '0.75rem' }}>N/A</span>
                          ) : (
                            game.ethEarned > 0 ? (
                              <div>
                                <div>{game.ethEarned.toFixed(3)}+ ETH</div>
                                {game.pendingRewards > 0 && (
                                  <div style={{ fontSize: '0.6rem', color: '#00ffcc', opacity: 0.8, marginTop: '2px' }}>
                                    +{game.pendingRewards.toFixed(3)} pending
                                  </div>
                                )}
                              </div>
                            ) : game.pendingRewards > 0 ? (
                              <div style={{ color: '#00ffcc' }}>
                                +{game.pendingRewards.toFixed(3)} pending
                              </div>
                            ) : (
                              '0.000 ETH'
                            )
                          )}
                        </td>
                        <td style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: '600', color: '#a259ff', fontSize: '0.75rem' }}>
                          {game.sp !== undefined ? `${game.sp} SP` : (game.SP !== undefined ? `${game.SP} SP` : '-')}
                        </td>
                        <td style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: '600', fontSize: '0.75rem', color: '#000000', textShadow: '0 0 8px rgba(255, 0, 0, 0.8)' }}>
                          {game.result === '🎯' ? (
                            <span style={{ color: '#ffe066', fontWeight: 700, fontFamily: "'Orbitron', sans-serif", fontSize: '0.75rem' }}>N/A</span>
                          ) : (
                            game.kills !== undefined ? game.kills : '-'
                          )}
                        </td>
                        <td style={{ textAlign: 'center', fontFamily: "'Orbitron', sans-serif", fontWeight: '600', fontSize: '0.75rem' }}>
                          {game.result === '🎯' ? (
                            <span style={{ color: '#ffe066', fontWeight: 700, fontFamily: "'Orbitron', sans-serif", fontSize: '0.75rem' }}>N/A</span>
                          ) : (
                            game.achievements > 0 ? game.achievements : '-'
                          )}
                        </td>
                        <td style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.75rem' }}>
                          {game.result === '🎯' ? (
                            <span style={{ color: '#ffe066', fontWeight: 700, fontFamily: "'Orbitron', sans-serif", fontSize: '0.75rem' }}>N/A</span>
                          ) : (
                            (() => {
                              const timeInSeconds = game.timeSurvived !== undefined ? game.timeSurvived : (game.time !== undefined ? game.time : 0);
                              if (timeInSeconds < 60) {
                                return `${timeInSeconds}s`;
                              } else if (timeInSeconds < 3600) {
                                const minutes = Math.floor(timeInSeconds / 60);
                                const seconds = timeInSeconds % 60;
                                return `${minutes}m ${seconds}s`;
                              } else {
                                const hours = Math.floor(timeInSeconds / 3600);
                                const minutes = Math.floor((timeInSeconds % 3600) / 60);
                                const seconds = timeInSeconds % 60;
                                return `${hours}h ${minutes}m ${seconds}s`;
                              }
                            })()
                          )}
                        </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          </div>
        </div>
      </div>
      <audio ref={chimeRef} src="/sounds/chime.mp3" preload="auto" />
    </div>
  );
}

function FinishedQuestsButton() {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate('/quests', { state: { tab: 'completed' } })}
      style={{
        marginTop: '1.2rem',
        padding: '1.1rem 2.2rem',
        background: 'linear-gradient(135deg, #a259ff 0%, #6c5ce7 100%)',
        color: '#fff',
        border: '2px solid rgba(162, 89, 255, 0.3)',
        borderRadius: '14px',
        fontSize: '1.1rem',
        fontWeight: 'bold',
        fontFamily: "'Orbitron', sans-serif",
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        boxShadow: '0 8px 24px rgba(162, 89, 255, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        outline: 'none',
        backdropFilter: 'blur(8px)',
        display: 'inline-block',
        marginBottom: 0
      }}
      onMouseEnter={e => {
        e.target.style.transform = 'translateY(-2px)';
        e.target.style.boxShadow = '0 12px 32px rgba(162, 89, 255, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
      }}
      onMouseLeave={e => {
        e.target.style.transform = 'translateY(0)';
        e.target.style.boxShadow = '0 8px 24px rgba(162, 89, 255, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
      }}
    >
      Finished Quests
    </button>
  );
}

export default HistoryTab;
