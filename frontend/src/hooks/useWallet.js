import { useState, useEffect } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { formatEther } from 'viem';

export function useWallet() {
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState(null);
  const { address, isConnected } = useAccount();
  const { data: balanceData } = useBalance({
    address: address,
  });

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', () => window.location.reload());
    }
  }, []);

  async function connect() {
    if (!window.ethereum) return alert("Web3 wallet not detected");

    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (address) {
        setAccount(address);
        if (balanceData) {
          setBalance(formatEther(balanceData.value));
        }
      }
    } catch (error) {
      console.error('Connection error:', error);
    }
  }

  function disconnect() {
    setAccount(null);
    setBalance(null);
  }

  // Update balance when it changes
  useEffect(() => {
    if (balanceData) {
      setBalance(formatEther(balanceData.value));
    }
  }, [balanceData]);

  // Update account when it changes
  useEffect(() => {
    if (address) {
      setAccount(address);
    }
  }, [address]);

  return { account, balance, connect, disconnect };
}