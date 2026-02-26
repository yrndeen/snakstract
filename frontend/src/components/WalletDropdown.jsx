import React from 'react';
import './WalletDropdown.css';

const WalletDropdown = ({ onDisconnect, onBridge }) => {
  return (
    <div className="wallet-dropdown">
      <button onClick={onDisconnect}>Disconnect</button>
      <button onClick={onBridge}>Bridge ETH</button>
    </div>
  );
};

export default WalletDropdown;