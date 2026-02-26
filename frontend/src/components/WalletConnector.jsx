import React, { useEffect, useState } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { formatEther } from 'viem';

export default function WalletConnector() {
  const [showDropdown, setShowDropdown] = useState(false);
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({
    address: address,
  });

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert('Please install MetaMask or another Web3 wallet');
        return;
      }
      
      await window.ethereum.request({ method: 'eth_requestAccounts' });
    } catch (e) {
      console.error('Connection failed:', e);
    }
  };

  const disconnectWallet = () => {
    if (window.ethereum) {
      window.ethereum.request({ method: 'eth_requestAccounts' });
    }
    setShowDropdown(false);
  };

  const abbreviate = (addr) => addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';

  return (
    <div className="wallet-connector">
      {!isConnected ? (
        <button onClick={connectWallet} className="connect-button">
          Connect Wallet
        </button>
      ) : (
        <div className="wallet-info">
          <div className="wallet-address" onClick={() => setShowDropdown(!showDropdown)}>
            {abbreviate(address)}
            <span className="dropdown-arrow">▼</span>
          </div>
          {balance && (
            <div className="wallet-balance">
              {formatEther(balance.value)} ETH
            </div>
          )}
          {showDropdown && (
            <div className="wallet-dropdown">
              <button onClick={disconnectWallet}>Disconnect</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
