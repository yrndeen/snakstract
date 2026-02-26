import React, { useState } from 'react';
import { useConnect } from 'wagmi';
import { useLoginWithAbstract } from "@abstract-foundation/agw-react";
import { injected } from 'wagmi/connectors';
import { useNetwork } from '../App';

const WalletPopup = ({ isOpen, onClose }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const { connect } = useConnect();
  const { login } = useLoginWithAbstract();
  const { networkConfig } = useNetwork();

  const handleAbstractWallet = async () => {
    setIsConnecting(true);
    setConnectionError(null);
    try {
      console.log('Connecting to Abstract Wallet...');
      await login();
      console.log('Abstract Wallet connected successfully');
      setIsConnecting(false);
      onClose();
    } catch (error) {
      console.error('Abstract Wallet connection failed:', error);
      setConnectionError('Failed to connect to Abstract Wallet: ' + (error.message || 'Unknown error'));
      setIsConnecting(false);
    }
  };

  const handleMetaMask = async () => {
    setIsConnecting(true);
    setConnectionError(null);
    try {
      console.log('Connecting to MetaMask...');
      
      // Check if MetaMask is installed
      if (typeof window.ethereum === 'undefined') {
        throw new Error('MetaMask not found. Please install MetaMask extension.');
      }

      // Use wagmi's injected connector to connect MetaMask
      await connect({ connector: injected() });
      console.log('MetaMask connected successfully via wagmi');
      setIsConnecting(false);
      onClose();
    } catch (error) {
      console.error('MetaMask connection failed:', error);
      setConnectionError('Failed to connect to MetaMask: ' + (error.message || 'Unknown error'));
      setIsConnecting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'flex-end',
      zIndex: 10000,
      backdropFilter: 'blur(5px)',
      paddingTop: '80px', // Position under navbar
      paddingRight: '20px'
    }} onClick={onClose}>
      <div style={{
        background: 'linear-gradient(135deg, #181c2b 0%, #0f1419 100%)',
        border: '2px solid #00ffcc',
        borderRadius: '12px',
        padding: '2rem',
        minWidth: '400px',
        maxWidth: '500px',
        boxShadow: '0 0 30px rgba(0, 255, 204, 0.3)',
        fontFamily: 'Orbitron, monospace',
        color: '#00ffcc'
      }} onClick={e => e.stopPropagation()}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.5rem', textShadow: '0 0 10px #00ffcc' }}>
            Connect Wallet
          </h2>
          <p style={{ color: '#888', fontSize: '0.9rem' }}>Network: {networkConfig.config.CHAIN_ID === 2741 ? 'Abstract Mainnet' : 'Abstract Testnet'}</p>
          <p style={{ margin: 0, color: '#888', fontSize: '0.9rem' }}>
            Choose your preferred wallet to connect
          </p>
        </div>
        {connectionError && (
          <div style={{
            background: 'rgba(255, 68, 68, 0.1)',
            border: '1px solid #ff4444',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1.5rem',
            color: '#ff4444',
            fontSize: '0.9rem'
          }}>
            {connectionError}
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <button
            onClick={handleAbstractWallet}
            disabled={isConnecting}
            style={{
              background: isConnecting ? '#666' : 'linear-gradient(135deg, #00ffcc 0%, #00cc99 100%)',
              color: '#000',
              border: 'none',
              borderRadius: '8px',
              padding: '1rem',
              fontSize: '1rem',
              fontFamily: 'Orbitron, monospace',
              fontWeight: 'bold',
              cursor: isConnecting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.3s ease',
              boxShadow: isConnecting ? 'none' : '0 4px 15px rgba(0, 255, 204, 0.3)'
            }}
          >
            {isConnecting ? (
              <>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid #000',
                  borderTop: '2px solid transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                Connecting...
              </>
            ) : (
              <>
                <img 
                  src="/abs.png" 
                  alt="Abstract" 
                  style={{ 
                    width: '20px', 
                    height: '20px',
                    borderRadius: '50%',
                    border: '0.9px solid #000'
                  }} 
                />
                Connect Abstract Wallet
              </>
            )}
          </button>
          <button
            onClick={handleMetaMask}
            disabled={isConnecting}
            style={{
              background: isConnecting ? '#666' : 'linear-gradient(135deg, #f6851b 0%, #e2761b 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '1rem',
              fontSize: '1rem',
              fontFamily: 'Orbitron, monospace',
              fontWeight: 'bold',
              cursor: isConnecting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.3s ease',
              boxShadow: isConnecting ? 'none' : '0 4px 15px rgba(246, 133, 27, 0.3)'
            }}
          >
            {isConnecting ? (
              <>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid #fff',
                  borderTop: '2px solid transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                Connecting...
              </>
            ) : (
              <>
                <img 
                  src="/mta.png" 
                  alt="MetaMask" 
                  style={{ width: '20px', height: '20px' }} 
                />
                Connect MetaMask
              </>
            )}
          </button>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: '1px solid #666',
            color: '#666',
            borderRadius: '6px',
            padding: '0.5rem 1rem',
            fontSize: '0.9rem',
            fontFamily: 'Orbitron, monospace',
            cursor: 'pointer',
            marginTop: '1.5rem',
            width: '100%',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={e => {
            e.target.style.borderColor = '#00ffcc';
            e.target.style.color = '#00ffcc';
          }}
          onMouseLeave={e => {
            e.target.style.borderColor = '#666';
            e.target.style.color = '#666';
          }}
        >
          Cancel
        </button>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default WalletPopup; 