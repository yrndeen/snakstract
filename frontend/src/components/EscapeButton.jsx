// src/components/EscapeButton.jsx
import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount, useWaitForTransactionReceipt } from 'wagmi';
import { useWriteContractSponsored } from "@abstract-foundation/agw-react";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config';
import { useNetwork } from '../App';

function EscapeButton({ stakeAmount, startTime, kills }) {
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const [holdingE, setHoldingE] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingTx, setPendingTx] = useState(null);
  const [error, setError] = useState(null);
  const holdInterval = useRef(null);
  const HOLD_DURATION = 3000; // ms
  const clickRef = useRef(null);
  const { networkConfig } = useNetwork();

  // Escape and claim winnings function with Abstract SDK
  const { writeContractSponsored: escapeGame, data: escapeTx, isPending: isEscapeLoading, error: escapeError } = useWriteContractSponsored({
    onSuccess: (data) => {
      console.log('Escape and claim transaction sent:', data.hash);
      setIsLoading(false);
      
      // Navigate to escape screen with transaction hash and game data
      navigate('/escape', {
        state: {
          txHash: data.hash,
          stakeAmount: stakeAmount,
          startTime: startTime,
          kills: kills,
          claimedDuringEscape: true // Flag to indicate winnings were claimed during escape
        }
      });
    },
    onError: (err) => {
      console.error('Escape and claim failed:', err);
      setError('Escape and claim failed: ' + (err.message || err));
      setIsLoading(false);
    }
  });

  // Wait for escape transaction to be mined
  useWaitForTransactionReceipt({
    hash: escapeTx?.hash,
    query: {
      enabled: !!escapeTx?.hash,
    },
    onSuccess: () => {
      console.log('Escape and claim transaction confirmed!');
      // Transaction is already handled in onSuccess above
    },
    onError: (err) => {
      console.error('Escape and claim transaction failed:', err);
      setError('Escape and claim transaction failed: ' + (err.message || err));
      setIsLoading(false);
    }
  });

  const handleEscape = async () => {
    if (clickRef.current) {
      clickRef.current.currentTime = 0;
      clickRef.current.play();
    }
    console.log("Attempting to escape and claim rewards...");
    console.log("Wallet connected:", isConnected);
    console.log("Address:", address);
    console.log("Stake amount:", stakeAmount);
    
    if (!isConnected) {
      setError('Please connect your wallet to escape and claim rewards.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    // Call escapeGame which will also handle claiming winnings
    const escapeData = {
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'escapeGame',
    };

    console.log("Escape and claim transaction data:", escapeData);
    console.log("escapeGame function:", typeof escapeGame);
    
    // Set a timeout to detect if the wallet popup is blank
    const timeoutId = setTimeout(() => {
      console.log("Timeout reached - wallet popup may be blank for escape and claim");
      setError("Abstract wallet popup appears to be blank for escape and claim. This usually means there's a crypto API issue. Please try:\n\n1. Refresh the page\n2. Use a different browser (Chrome, Firefox, Edge)\n3. Try in incognito/private mode\n4. Disable browser extensions\n5. Check if your browser supports Web Crypto API");
      setIsLoading(false);
    }, 5000); // 5 second timeout
    
    try {
      console.log("Calling escapeGame...");
      const result = escapeGame(escapeData);
      console.log("escapeGame result:", result);
      
      // Clear timeout if successful
      clearTimeout(timeoutId);
    } catch (error) {
      console.error("Abstract SDK escape and claim call failed:", error);
      clearTimeout(timeoutId);
      
      // Show manual transaction instructions since Abstract SDK is failing
      const manualInstructions = `
Abstract SDK Error: ${error.message || 'Crypto initialization failed'}

Since the Abstract SDK is having crypto API issues, here are manual instructions for escaping and claiming:

1. Open your Abstract wallet manually
2. Go to the "Send" or "Transaction" section
3. Use these transaction details:
   - To: ${CONTRACT_ADDRESS}
   - Value: 0 ETH (no value needed for escapeGame)
   - Data: 0x4a25d94a (escapeGame function selector)
   - Chain: {networkConfig.config.CHAIN_ID === 2741 ? 'Abstract Mainnet' : 'Abstract Testnet'} (Chain ID: {networkConfig.config.CHAIN_ID})

4. After the transaction is confirmed, refresh this page

Alternative solutions:
- Try a different browser (Chrome, Firefox, Edge)
- Use incognito/private mode
- Disable browser extensions
- Update your browser to the latest version
      `;
      
      setError(manualInstructions);
      setIsLoading(false);
    }
  };

  // Hold E to escape logic
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'e' || e.key === 'E') {
        if (!holdingE) {
          setHoldingE(true);
          setHoldProgress(0);
          let start = Date.now();
          holdInterval.current = setInterval(() => {
            const elapsed = Date.now() - start;
            setHoldProgress(Math.min(100, (elapsed / HOLD_DURATION) * 100));
            if (elapsed >= HOLD_DURATION) {
              clearInterval(holdInterval.current);
              setHoldingE(false);
              setHoldProgress(100);
              handleEscape();
            }
          }, 20);
        }
      }
    };
    const handleKeyUp = (e) => {
      if (e.key === 'e' || e.key === 'E') {
        setHoldingE(false);
        setHoldProgress(0);
        clearInterval(holdInterval.current);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      clearInterval(holdInterval.current);
    };
  }, [holdingE]);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button className="glow-button" onClick={handleEscape} disabled={isLoading || isEscapeLoading}>
        {isLoading || isEscapeLoading ? 'Escaping and Claiming...' : 'Escape & Claim Rewards'}
      </button>
      
      {/* Error Display */}
      {error && (
        <div style={{
          position: 'absolute',
          top: '-80px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(255, 68, 68, 0.9)',
          color: 'white',
          padding: '10px',
          borderRadius: '8px',
          fontSize: '12px',
          maxWidth: '300px',
          whiteSpace: 'pre-wrap',
          zIndex: 1000,
          textAlign: 'center'
        }}>
          {error}
          <button 
            onClick={() => setError(null)}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              marginLeft: '10px',
              fontSize: '14px'
            }}
          >
            ✕
          </button>
        </div>
      )}
      
      {holdingE && (
        <div style={{
          position: 'absolute',
          top: '-30px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100px',
          height: '4px',
          background: '#333',
          borderRadius: '2px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${holdProgress}%`,
            height: '100%',
            background: '#00ffcc',
            transition: 'width 0.02s linear'
          }} />
        </div>
      )}
      <audio ref={clickRef} src="/sounds/click.mp3" preload="auto" />
    </div>
  );
}

export default EscapeButton;