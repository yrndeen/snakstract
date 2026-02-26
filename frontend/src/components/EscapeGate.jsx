import React, { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config';

function EscapeGate({ inGame, onEscape }) {
  const [timer, setTimer] = useState(5);
  const [canEscape, setCanEscape] = useState(false);
  const { address, isConnected } = useAccount();
  const [isLoading, setIsLoading] = useState(false);

  const { writeContract: endGameWrite, data: endGameTx, isPending: isEndGameLoading } = useWriteContract({
    onSuccess: (data) => {
      console.log('End game transaction sent:', data.hash);
    },
    onError: (err) => {
      alert('Escape failed: ' + (err.message || err));
      setIsLoading(false);
    }
  });

  const { writeContract: withdrawWrite, data: withdrawTx, isPending: isWithdrawLoading } = useWriteContract({
    onSuccess: (data) => {
      console.log('Withdraw transaction sent:', data.hash);
    },
    onError: (err) => {
      alert('Withdraw failed: ' + (err.message || err));
      setIsLoading(false);
    }
  });

  // Wait for endGame to be mined, then call withdraw
  useWaitForTransactionReceipt({
    hash: endGameTx?.hash,
    query: {
      enabled: !!endGameTx?.hash,
    },
    onSuccess: () => {
      withdrawWrite({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'withdraw',
      });
    },
    onError: (err) => {
      alert('Escape failed: ' + (err.message || err));
      setIsLoading(false);
    }
  });

  // Wait for withdraw to be mined, then call onEscape
  useWaitForTransactionReceipt({
    hash: withdrawTx?.hash,
    query: {
      enabled: !!withdrawTx?.hash,
    },
    onSuccess: () => {
      setIsLoading(false);
      if (onEscape) onEscape();
    },
    onError: (err) => {
      alert('Withdraw failed: ' + (err.message || err));
      setIsLoading(false);
    }
  });

  useEffect(() => {
    if (inGame) {
      const interval = setInterval(() => {
        setTimer(t => {
          if (t <= 1) {
            clearInterval(interval);
            setCanEscape(true);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
  }, [inGame]);

  const handleEscape = async () => {
    if (!isConnected) {
      alert('Please connect your wallet.');
      return;
    }
    setIsLoading(true);
    endGameWrite({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'endGame',
      args: [true],
    });
  };

  return (
    <div>
      {inGame && !canEscape ? (
        <p>⛔ In game... Escape available in {timer}s</p>
      ) : (
        <button 
          onClick={handleEscape} 
          disabled={isLoading || isEndGameLoading || isWithdrawLoading}
          style={{
            background: isLoading || isEndGameLoading || isWithdrawLoading ? '#666' : '#00ffcc',
            color: '#181c2b',
            border: 'none',
            borderRadius: '8px',
            padding: '0.7rem 1.5rem',
            fontWeight: 700,
            cursor: isLoading || isEndGameLoading || isWithdrawLoading ? 'not-allowed' : 'pointer',
          }}
        >
          {isLoading || isEndGameLoading || isWithdrawLoading ? 'Processing...' : 'Escape Now'}
        </button>
      )}
    </div>
  );
}

export default EscapeGate;