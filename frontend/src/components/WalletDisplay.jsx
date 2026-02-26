import React from 'react';

function WalletDisplay({ address, balance, onDisconnect }) {
  const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;

  const handleDisconnect = () => {
    if (window.ethereum) {
      // Clear any stored wallet data
      localStorage.removeItem('walletConnected');
      // Call the disconnect function
      onDisconnect();
    }
  };

  return (
    <div className="wallet-display">
      <div className="wallet-info">
        <span className="wallet-address">{shortAddress}</span>
        <span className="wallet-balance">{parseFloat(balance).toFixed(4)} ETH</span>
      </div>
      <div className="wallet-actions">
        <button 
          className="disconnect-button" 
          onClick={handleDisconnect}
        >
          Disconnect
        </button>
        <a 
          href="https://relay.link" 
          target="_blank" 
          rel="noopener noreferrer"
          className="bridge-button"
        >
          Bridge ETH
        </a>
      </div>
    </div>
  );
}

export default WalletDisplay;