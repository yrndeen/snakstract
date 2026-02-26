import { useState, useEffect } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { formatEther } from 'viem';

export function useWallet() {
  const [walletAddress, setWalletAddress] = useState(null);
  const [ethBalance, setEthBalance] = useState(null);
  const [error, setError] = useState(null);
  const [provider, setProvider] = useState(null);
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({
    address: address,
  });

  const connect = async () => {
    setError(null);
    try {
      if (!window.ethereum) {
        throw new Error('Please install MetaMask or another Web3 wallet');
      }

      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });

      setProvider(window.ethereum);
      
      if (address) {
        setWalletAddress(address);
        if (balance) {
          setEthBalance(formatEther(balance.value));
        }
      }
      
      localStorage.setItem('walletConnected', 'true');

      // Add event listeners
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
          disconnect();
        } else {
          setWalletAddress(accounts[0]);
        }
      });

      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });

    } catch (err) {
      setError(err.message || 'Failed to connect wallet');
      console.error('Wallet connection error:', err);
    }
  };

  const disconnect = async () => {
    try {
      setWalletAddress(null);
      setEthBalance(null);
      setError(null);
      localStorage.removeItem('walletConnected');
      setProvider(null);
    } catch (err) {
      console.error('Wallet disconnection error:', err);
    }
  };

  useEffect(() => {
    const checkConnection = async () => {
      if (localStorage.getItem('walletConnected') === 'true' && window.ethereum) {
        try {
          // Check if we're already connected
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            connect();
          } else {
            localStorage.removeItem('walletConnected');
          }
        } catch (err) {
          console.error('Error checking connection:', err);
          localStorage.removeItem('walletConnected');
        }
      }
    };

    checkConnection();
    
    return () => {
      if (window.ethereum?.removeAllListeners) {
        window.ethereum.removeAllListeners();
      }
    };
  }, []);

  // Update balance when it changes
  useEffect(() => {
    if (balance) {
      setEthBalance(formatEther(balance.value));
    }
  }, [balance]);

  // Update address when it changes
  useEffect(() => {
    if (address) {
      setWalletAddress(address);
    }
  }, [address]);

  return { walletAddress, ethBalance, error, connect, disconnect };
}
