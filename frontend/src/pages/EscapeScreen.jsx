import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAccount, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { useWriteContractSponsored } from "@abstract-foundation/agw-react";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config';
import EscapeSummary from '../components/EscapeSummary';
import useClickSound from '../hooks/useClickSound';

function EscapeScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { address, isConnected } = useAccount();
  const [countdown, setCountdown] = useState(40);
  const [isClaiming, setIsClaiming] = useState(false);
  const [error, setError] = useState(null);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [alreadyClaimed, setAlreadyClaimed] = useState(false);
  const escapeSoundRef = useRef(null);
  const chimeRef = useRef(null);
  const playClick = useClickSound();
  const [showEscaped, setShowEscaped] = useState(true);

  // Get game data from navigation state
  const gameData = location.state || {};
  const { txHash, wagerAmount, stakeAmount, startTime, sessionStartTime, kills, claimedDuringEscape, isTestMode, timeSurvived, orbsEaten, spEarned, achievements } = gameData;

  // Calculate time survived from session data or fallback
  const actualTimeSurvived = timeSurvived || (startTime || sessionStartTime ? Math.floor((Date.now() - (startTime || sessionStartTime)) / 1000) : 0);

  // Use wagerAmount or stakeAmount for display
  const displayStake = typeof wagerAmount !== 'undefined' ? wagerAmount : (typeof stakeAmount !== 'undefined' ? stakeAmount : 0);

  // Check if player has already claimed their winnings
  const { data: playerDetails } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getPlayerDetails',
    args: [address],
    query: {
      enabled: !!address && isConnected,
    },
  });

  // Calculate claimable ETH and in-game status from playerDetails
  let claimableEthWithdraw = 0;
  let stakeAmountWithdraw = 0;
  let survivalRewardsWithdraw = 0;
  let isInGameWithdraw = false;
  if (playerDetails && Array.isArray(playerDetails) && playerDetails.length >= 10) {
    stakeAmountWithdraw = Number(playerDetails[0]) / 1e18;
    isInGameWithdraw = playerDetails[1];
    survivalRewardsWithdraw = Number(playerDetails[5]) / 1e18;
    claimableEthWithdraw = stakeAmountWithdraw + survivalRewardsWithdraw;
  }

  // Check if winnings were already claimed
  useEffect(() => {
    // If winnings were claimed during escape, set already claimed
    if (claimedDuringEscape) {
      setAlreadyClaimed(true);
      setClaimSuccess(true);
      return;
    }
    
    // Otherwise check contract state
    if (playerDetails && Array.isArray(playerDetails) && playerDetails.length >= 10) {
      const stakeAmount = Number(playerDetails[0]) / 1e18;
      const survivalRewards = Number(playerDetails[5]) / 1e18;
      const claimableEth = stakeAmount + survivalRewards;
      
      // If there's no claimable ETH, it means winnings were already claimed
      if (claimableEth <= 0) {
        setAlreadyClaimed(true);
        setClaimSuccess(true); // Show as already claimed
      }
    }
  }, [playerDetails, claimedDuringEscape]);

  // Refactored claim logic to match withdraw logic
  const { writeContractSponsored, data: claimTx, isPending: isClaimLoading, error: claimError } = useWriteContractSponsored({
    onSuccess: (data) => {
      setClaimSuccess(true);
      setIsClaiming(false);
    },
    onError: (err) => {
      setError('Claim failed: ' + (err.message || err));
      setIsClaiming(false);
    }
  });

  // Wait for claim transaction to be mined
  useWaitForTransactionReceipt({
    hash: claimTx?.hash,
    query: {
      enabled: !!claimTx?.hash,
    },
    onSuccess: () => {
      console.log('Claim transaction confirmed!');
      setIsClaiming(false);
      // Start countdown after successful claim
      setCountdown(40);
    },
    onError: (err) => {
      console.error('Claim transaction failed:', err);
      setError('Claim transaction failed: ' + (err.message || err));
      setIsClaiming(false);
    }
  });

  const handleClaim = async () => {
    if (!isConnected || !address) {
      setError('Please connect your wallet to claim rewards');
      return;
    }
    if (isInGameWithdraw) {
      setError('Cannot claim while in game. Complete your current game first.');
      return;
    }
    if (claimableEthWithdraw <= 0) {
      setError('No ETH to claim.');
      return;
    }
    if (chimeRef.current) {
      chimeRef.current.currentTime = 0;
      chimeRef.current.play();
    }
    setIsClaiming(true);
    setError(null);
    try {
      writeContractSponsored({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'withdraw',
      });
    } catch (err) {
      setError('Claim failed: ' + (err.message || err));
      setIsClaiming(false);
    }
  };

  // Countdown effect - only start after successful claim or if no claim needed
  useEffect(() => {
    if (claimSuccess || !isConnected || alreadyClaimed) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate('/');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [navigate, claimSuccess, isConnected, alreadyClaimed]);

  useEffect(() => {
    // Only play escape sound if this screen is shown due to a successful escape
    if (gameData.escaped || claimedDuringEscape || isTestMode) {
      if (escapeSoundRef.current) {
        escapeSoundRef.current.currentTime = 0;
        escapeSoundRef.current.play();
      }
    }
  }, [gameData.escaped, claimedDuringEscape, isTestMode]);

  useEffect(() => {
    setShowEscaped(true);
    const timer = setTimeout(() => setShowEscaped(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  // When sending escape message to server, include achievements count
  const achievementCount = (achievements && typeof achievements === 'object' && !Array.isArray(achievements))
    ? Object.values(achievements).filter(Boolean).length
    : 0;

  // After the achievementCount calculation, add this useEffect to update all-time achievements in localStorage:
  useEffect(() => {
    if (achievements && typeof achievements === 'object') {
      let persistent = {};
      try {
        persistent = JSON.parse(localStorage.getItem('achievements')) || {};
      } catch {}
      let changed = false;
      for (const key of Object.keys(achievements)) {
        if (achievements[key] && !persistent[key]) {
          persistent[key] = true;
          changed = true;
        }
      }
      if (changed) {
        localStorage.setItem('achievements', JSON.stringify(persistent));
      }
    }
  }, [achievements]);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(135deg, #001a00, #003300, #001a00)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Animated ESCAPED overlay */}
      {showEscaped && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          pointerEvents: 'none',
          overflow: 'hidden',
        }}>
          {/* Green/teal gradient overlay for drama */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'radial-gradient(circle at 50% 60%, rgba(0,255,204,0.13) 0%, rgba(0,0,0,0.0) 80%)',
            zIndex: 1,
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'relative',
            zIndex: 2,
            background: 'rgba(0,32,32,0.38)',
            borderRadius: '48px',
            padding: '3.5rem 7rem',
            boxShadow: '0 0 64px 16px rgba(0,255,204,0.18), 0 0 0 2px rgba(255,255,255,0.10) inset, 0 8px 32px 0 rgba(0,0,0,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(22px) saturate(1.3)',
            animation: 'fadeEscaped 3s cubic-bezier(0.4,0,0.2,1), shakeEscaped 0.7s cubic-bezier(0.36,0.07,0.19,0.97) 2',
          }}>
            <span style={{
              background: 'linear-gradient(92deg, #00ffd0 0%, #00bfae 40%, #007a6e 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              color: '#00bfae',
              fontSize: '5.5rem',
              fontWeight: 900,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              textShadow: '0 0 32px #00ffd0, 0 0 64px #00ffd0, 0 0 24px #00bfae, 0 2px 0 #fff, 0 0 0 #000',
              filter: 'drop-shadow(0 0 32px #00ffd0) drop-shadow(0 0 12px #00bfae)',
              fontFamily: 'Orbitron, Arial Black, Arial, sans-serif',
              userSelect: 'none',
              opacity: 0.99,
              transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
              borderRadius: '18px',
              padding: '0.2em 0.7em',
              boxShadow: '0 0 32px 8px rgba(0,255,204,0.18) inset',
              position: 'relative',
            }}>
              <span style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: '100%',
                height: '100%',
                borderRadius: '18px',
                boxShadow: '0 0 32px 8px #00ffd0',
                opacity: 0.18,
                pointerEvents: 'none',
                zIndex: 0,
              }} />
              ESCAPED!
            </span>
          </div>
          <style>{`
            @keyframes fadeEscaped {
              0% { opacity: 1; transform: scale(1.18); }
              60% { opacity: 1; transform: scale(1); }
              100% { opacity: 0; transform: scale(0.98); }
            }
            @keyframes shakeEscaped {
              0% { transform: translateX(0); }
              10% { transform: translateX(-8px); }
              20% { transform: translateX(8px); }
              30% { transform: translateX(-6px); }
              40% { transform: translateX(6px); }
              50% { transform: translateX(-4px); }
              60% { transform: translateX(4px); }
              70% { transform: translateX(-2px); }
              80% { transform: translateX(2px); }
              90% { transform: translateX(-1px); }
              100% { transform: translateX(0); }
            }
          `}</style>
        </div>
      )}
      {/* Animated background effects with abstract coins */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'radial-gradient(circle at 50% 50%, rgba(0, 255, 204, 0.3) 0%, transparent 70%)',
        animation: 'pulse 2s ease-in-out infinite alternate'
      }} />
      
      {/* ETH coin animations */}
      {(() => {
        // Create stable animation parameters that don't change on re-renders
        const ethCoins = [];
        for (let i = 0; i < 30; i++) {
          // Use a seed based on index to create consistent random values
          const seed = i * 12345;
          const left = (seed % 100) + (seed % 20) * 0.1;
          const top = ((seed * 6789) % 100) + ((seed * 6789) % 20) * 0.1;
          const size = 60 + (seed % 80);
          const duration = 15 + (seed % 10);
          const delay = 5 + (seed % 10);
          
          ethCoins.push(
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${left}%`,
                top: `${top}%`,
                width: `${size}px`,
                height: `${size}px`,
                animation: `float ${duration}s ease-in-out infinite`,
                animationDelay: `${delay}s`,
                opacity: 1,
                zIndex: 0,
                filter: 'drop-shadow(0 0 10px rgba(0, 255, 204, 0.5))'
              }}
            >
              <img 
                src="/eth-logo.png" 
                alt="ETH" 
                style={{ 
                  width: '100%', 
                  height: '100%',
                  objectFit: 'contain'
                }}
                onLoad={() => console.log('ETH logo loaded successfully')}
                onError={(e) => console.error('Failed to load ETH logo:', e)}
              />
            </div>
          );
        }
        return ethCoins;
      })()}
      
      {/* Main content */}
      {!showEscaped && (
        <div 
          style={{
            background: 'rgba(0, 255, 204, 0.2)',
            border: '2px solid #004d33',
            borderRadius: '20px',
            padding: '40px',
            textAlign: 'center',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 0 30px rgba(0, 255, 204, 0.5)',
            maxWidth: '500px',
            width: '90%',
            zIndex: 1,
            opacity: 0,
            animation: 'fadeInStats 0.9s cubic-bezier(0.4,0,0.2,1) 0.01s forwards',
          }}
        >
          {/* Pulsing icon22.png */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <img 
              src="/icon22.png" 
              alt="Snakstract Icon" 
              style={{
                height: '120px',
                opacity: '0.3',
                filter: 'drop-shadow(0 0 20px rgba(0, 255, 204, 0.8))',
                animation: 'pulseGlow 2s ease-in-out infinite alternate'
              }}
            />
          </div>

          {/* Escape title */}
          <h1 style={{
            color: '#004d33',
            fontSize: '48px',
            margin: '0 0 20px 0',
            textShadow: '0 0 20px rgba(0, 255, 204, 0.8)',
            fontWeight: 'bold'
          }}>
            ESCAPE SUCCESSFUL!
          </h1>

          {/* Escape details */}
          <div style={{
            background: 'rgba(0, 255, 204, 0.3)',
            border: '2px solid #004d33',
            borderRadius: '10px',
            padding: '20px',
            margin: '20px 0',
            color: '#003322'
          }}>
            <p style={{ margin: '10px 0', fontSize: '18px' }}>
              <strong>💰 ETH Escaped With:</strong> {isTestMode ? "0" : (claimableEthWithdraw > 0 ? claimableEthWithdraw.toFixed(4) : displayStake)} ETH
            </p>
            <p style={{ margin: '10px 0', fontSize: '18px' }}>
              <strong>🎯 Wager Amount:</strong> {isTestMode ? "0" : (displayStake ?? 0)} ETH
            </p>
            <p style={{ margin: '10px 0', fontSize: '18px' }}>
              <strong>⏱ Time Survived:</strong> {actualTimeSurvived}s
            </p>
            <p style={{ margin: '10px 0', fontSize: '18px' }}>
              <strong>🔮 Orbs Eaten:</strong> {orbsEaten ?? 0}
            </p>
            <p style={{ margin: '10px 0', fontSize: '18px' }}>
              <strong>💀 Players Defeated:</strong> {kills ?? 0}
            </p>
            <p style={{ margin: '10px 0', fontSize: '18px' }}>
              <strong>🎯 Quests:</strong> {Array.isArray(gameData.sessionCompletedQuests) ? gameData.sessionCompletedQuests.length : 
                (gameData.sessionCompletedQuests instanceof Set ? gameData.sessionCompletedQuests.size : 
                (typeof gameData.sessionCompletedQuests === 'number' ? gameData.sessionCompletedQuests : 0))}
            </p>
            <p style={{ margin: '10px 0', fontSize: '18px' }}>
              <strong>🎖️ Achievements:</strong> {achievementCount}
            </p>
            <p style={{ margin: '10px 0', fontSize: '18px' }}>
              <strong>🐍 SP Earned:</strong> {spEarned ?? 0} SP
            </p>
          </div>

          {/* Claim Button - only show if not already claimed */}
          {isConnected && !claimSuccess && !alreadyClaimed && (
            <div style={{ marginBottom: '2rem' }}>
              <button 
                onClick={() => { playClick(); handleClaim(); }}
                disabled={isClaiming || isClaimLoading}
                style={{
                  padding: '1.5rem 3rem',
                  background: isClaiming || isClaimLoading ? '#888' : '#00ffcc',
                  color: '#001a00',
                  border: '2px solid #00cc99',
                  borderRadius: '10px',
                  cursor: isClaiming || isClaimLoading ? 'not-allowed' : 'pointer',
                  fontSize: '1.3rem',
                  fontWeight: 'bold',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 0 15px rgba(0, 255, 204, 0.3)'
                }}
                onMouseEnter={(e) => {
                  if (!isClaiming && !isClaimLoading) {
                    e.target.style.transform = 'scale(1.05)';
                    e.target.style.boxShadow = '0 0 25px rgba(0, 255, 204, 0.5)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'scale(1)';
                  e.target.style.boxShadow = '0 0 15px rgba(0, 255, 204, 0.3)';
                }}
              >
                {isClaiming || isClaimLoading ? 'Claiming...' : (isTestMode ? 'Test Mode - No Claim Needed' : 'Claim Rewards')}
              </button>
              
              {/* Error Display */}
              {error && (
                <div style={{
                  background: 'rgba(255, 68, 68, 0.9)',
                  color: 'white',
                  padding: '15px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  maxWidth: '500px',
                  margin: '1rem auto 0',
                  whiteSpace: 'pre-wrap',
                  textAlign: 'center'
                }}>
                  {error}
                  <button 
                    onClick={() => { playClick(); setError(null); }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'white',
                      cursor: 'pointer',
                      marginLeft: '10px',
                      fontSize: '16px'
                    }}
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Test Mode Message */}
          {isTestMode && (
            <div style={{
              background: 'rgba(0, 255, 204, 0.9)',
              color: '#001a00',
              padding: '15px',
              borderRadius: '8px',
              fontSize: '16px',
              marginBottom: '2rem',
              textAlign: 'center'
            }}>
              🧪 Test Mode: No real ETH involved. Your wager and gains are simulated.
            </div>
          )}

          {/* Already Claimed Message */}
          {alreadyClaimed && (
            <div style={{
              background: 'rgba(0, 255, 204, 0.9)',
              color: '#001a00',
              padding: '15px',
              borderRadius: '8px',
              fontSize: '16px',
              marginBottom: '2rem',
              textAlign: 'center'
            }}>
              ✅ {isTestMode ? 'Test mode escape completed!' : (claimedDuringEscape ? 'Rewards claimed during escape!' : 'Rewards already claimed!')}
            </div>
          )}

          {/* Success Message */}
          {claimSuccess && !alreadyClaimed && (
            <div style={{
              background: 'rgba(0, 255, 204, 0.9)',
              color: '#001a00',
              padding: '15px',
              borderRadius: '8px',
              fontSize: '16px',
              marginBottom: '2rem',
              textAlign: 'center'
            }}>
              ✅ Rewards claimed successfully!
            </div>
          )}

          {/* Centered Return Button */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: '30px'
          }}>
            <button 
              onClick={() => { playClick(); navigate('/'); }}
              style={{
                background: 'linear-gradient(135deg, #00ffcc, #00cc99)',
                border: '2px solid #00ffcc',
                borderRadius: '10px',
                padding: '15px 30px',
                color: '#001a00',
                fontSize: '18px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 0 15px rgba(15, 255, 207, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'scale(1.05)';
                e.target.style.boxShadow = '0 0 25px rgba(0, 255, 204, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)';
                e.target.style.boxShadow = '0 0 15px rgba(0, 255, 204, 0.3)';
              }}
            >
              Return Now
            </button>
          </div>
        </div>
      )}

      {/* Audio elements */}
      <audio ref={escapeSoundRef} src="/sounds/escape.mp3" />
      <audio ref={chimeRef} src="/sounds/chime.mp3" preload="auto" />

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 0.3; }
          100% { opacity: 0.6; }
        }
        
        @keyframes pulseGlow {
          0% { 
            opacity: 0.2; 
            filter: drop-shadow(0 0 15px rgba(0, 255, 204, 0.6));
            transform: scale(0.95);
          }
          100% { 
            opacity: 0.4; 
            filter: drop-shadow(0 0 25px rgba(0, 255, 204, 1));
            transform: scale(1.05);
          }
        }
        
        @keyframes glow {
          0% { text-shadow: 0 0 20px rgba(0, 255, 204, 0.8); }
          100% { text-shadow: 0 0 30px rgba(0, 255, 204, 1); }
        }
        
        @keyframes float {
          0% { 
            transform: translateY(0px) rotate(0deg) scale(1); 
            opacity: 0.8;
          }
          12.5% { 
            transform: translateY(-8px) rotate(1deg) scale(1.02); 
            opacity: 0.9;
          }
          25% { 
            transform: translateY(-15px) rotate(2deg) scale(1.05); 
            opacity: 1;
          }
          37.5% { 
            transform: translateY(-20px) rotate(3deg) scale(1.08); 
            opacity: 1;
          }
          50% { 
            transform: translateY(-25px) rotate(5deg) scale(1.1); 
            opacity: 1;
          }
          62.5% { 
            transform: translateY(-20px) rotate(3deg) scale(1.08); 
            opacity: 1;
          }
          75% { 
            transform: translateY(-15px) rotate(2deg) scale(1.05); 
            opacity: 1;
          }
          87.5% { 
            transform: translateY(-8px) rotate(1deg) scale(1.02); 
            opacity: 0.9;
          }
          100% { 
            transform: translateY(0px) rotate(0deg) scale(1); 
            opacity: 0.8;
          }
        }
        @keyframes fadeInStats {
          0% { opacity: 0; transform: translateY(32px) scale(0.98); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}

export default EscapeScreen;