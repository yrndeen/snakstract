import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CONTRACT_ADDRESS } from '../config';
import { useNetwork } from '../App';

const OthersPopup = ({ isOpen, onClose }) => {
  const [activePage, setActivePage] = useState('menu');

  // Reset to menu when popup is opened
  useEffect(() => {
    if (isOpen) {
      setActivePage('menu');
    }
  }, [isOpen]);

  const handlePageChange = (page) => {
    setActivePage(page);
  };

  const handleBackToMenu = () => {
    setActivePage('menu');
  };

  const handleViewFull = () => {
    onClose(); // Close the popup when viewing full page
  };

  const { networkConfig } = useNetwork();

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
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      backdropFilter: 'blur(5px)'
    }} onClick={onClose}>
      <div
        style={{
          background: 'linear-gradient(135deg, #181c2b 0%, #0f1419 100%)',
          border: '2px solid #00ffcc',
          borderRadius: '12px',
          padding: '2rem',
          minWidth: '400px',
          maxWidth: '600px',
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 0 30px rgba(0, 255, 204, 0.3)',
          fontFamily: 'Orbitron, monospace',
          color: '#00ffcc',
          position: 'relative',
          zIndex: 1
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Background image overlay, always fits the box */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 0,
            background: "url('/background.png') center center / 140% auto no-repeat",
            opacity: 0.10,
            pointerEvents: 'none',
            borderRadius: '12px',
          }}
        />
        {/* All popup content goes here, above the background */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Header */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '2rem',
            borderBottom: '1px solid #333',
            paddingBottom: '1rem'
          }}>
            <h2 style={{ 
              margin: 0, 
              fontSize: '1.5rem', 
              textShadow: '0 0 10px #00ffcc',
              background: 'linear-gradient(135deg, #00ffcc 0%, #c07eff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              {activePage === 'menu' && 'Others'}
              {activePage === 'terms' && 'Terms of Service'}
              {activePage === 'privacy' && 'Privacy Policy'}
              {activePage === 'support' && 'Support'}
              {activePage === 'contract' && 'Smart Contract'}
            </h2>
            {activePage !== 'menu' && (
              <button
                onClick={handleBackToMenu}
                style={{
                  background: 'transparent',
                  border: '1px solid #666',
                  color: '#666',
                  borderRadius: '6px',
                  padding: '0.5rem 1rem',
                  fontSize: '0.9rem',
                  fontFamily: 'Orbitron, monospace',
                  cursor: 'pointer',
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
                ← Back
              </button>
            )}
          </div>

          {/* Menu */}
          {activePage === 'menu' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <button
                onClick={() => handlePageChange('terms')}
                style={{
                  background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '1rem',
                  fontSize: '1rem',
                  fontFamily: 'Orbitron, monospace',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(255, 107, 107, 0.3)'
                }}
                onMouseEnter={e => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 20px rgba(255, 107, 107, 0.4)';
                }}
                onMouseLeave={e => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 15px rgba(255, 107, 107, 0.3)';
                }}
              >
                📄 Terms of Service
              </button>
              
              <button
                onClick={() => handlePageChange('privacy')}
                style={{
                  background: 'linear-gradient(135deg, #c07eff 0%, #a855f7 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '1rem',
                  fontSize: '1rem',
                  fontFamily: 'Orbitron, monospace',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(192, 126, 255, 0.3)'
                }}
                onMouseEnter={e => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 20px rgba(192, 126, 255, 0.4)';
                }}
                onMouseLeave={e => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 15px rgba(192, 126, 255, 0.3)';
                }}
              >
                🔒 Privacy Policy
              </button>
              
              <button
                onClick={() => handlePageChange('contract')}
                style={{
                  background: 'linear-gradient(135deg, #00ffcc 0%, #00cc99 100%)',
                  color: '#000',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '1rem',
                  fontSize: '1rem',
                  fontFamily: 'Orbitron, monospace',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(0, 255, 204, 0.3)'
                }}
                onMouseEnter={e => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 20px rgba(0, 255, 204, 0.4)';
                }}
                onMouseLeave={e => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 15px rgba(0, 255, 204, 0.3)';
                }}
              >
                📋 Smart Contract
              </button>
              
              <Link
                to="/support"
                onClick={onClose}
                style={{
                  background: 'linear-gradient(135deg, #f6851b 0%, #e2761b 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '1rem',
                  fontSize: '1rem',
                  fontFamily: 'Orbitron, monospace',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(246, 133, 27, 0.3)',
                  textDecoration: 'none'
                }}
                onMouseEnter={e => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 20px rgba(246, 133, 27, 0.4)';
                }}
                onMouseLeave={e => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 15px rgba(246, 133, 27, 0.3)';
                }}
              >
                🆘 Support
              </Link>
            </div>
          )}

          {/* Terms Content */}
          {activePage === 'terms' && (
            <div style={{ color: '#ccc', lineHeight: '1.6' }}>
              <p style={{ marginBottom: '1rem' }}>
                Welcome to Snakstract! By using our blockchain-based snake game, you agree to these terms of service.
              </p>
              <h3 style={{ color: '#00ffcc', marginBottom: '0.5rem' }}>Game Rules</h3>
              <ul style={{ marginBottom: '1rem', paddingLeft: '1.5rem' }}>
                <li>Players must connect a valid wallet to participate</li>
                <li>Minimum wager is 0.001 ETH</li>
                <li>Game results are determined by blockchain transactions</li>
                <li>Cheating or exploiting bugs is strictly prohibited</li>
              </ul>
              <h3 style={{ color: '#00ffcc', marginBottom: '0.5rem' }}>Financial Terms</h3>
              <ul style={{ marginBottom: '1rem', paddingLeft: '1.5rem' }}>
                <li>All transactions are final and irreversible</li>
                <li>Gas fees are the responsibility of the player</li>
                <li>Winnings are automatically distributed to your wallet</li>
              </ul>
              <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                <Link 
                  to="/terms" 
                  onClick={handleViewFull}
                  style={{
                    background: 'linear-gradient(135deg, #00ffcc 0%, #c07eff 100%)',
                    color: '#000',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontFamily: 'Orbitron, monospace',
                    fontWeight: 'bold',
                    display: 'inline-block'
                  }}
                >
                  View Full Terms
                </Link>
              </div>
            </div>
          )}

          {/* Privacy Content */}
          {activePage === 'privacy' && (
            <div style={{ 
              color: '#ccc', 
              lineHeight: '1.6',
              maxHeight: '400px',
              overflowY: 'auto',
              paddingRight: '10px'
            }}>
              <p style={{ marginBottom: '1rem' }}>
                We are committed to protecting your privacy and ensuring the security of your personal information.
              </p>
              <h3 style={{ color: '#00ffcc', marginBottom: '0.5rem' }}>Data Collection</h3>
              <ul style={{ marginBottom: '1rem', paddingLeft: '1.5rem' }}>
                <li>Wallet addresses for game functionality</li>
                <li>Game statistics and leaderboard data</li>
                <li>Transaction history for transparency</li>
                <li>Technical information for service improvement</li>
              </ul>
              <h3 style={{ color: '#00ffcc', marginBottom: '0.5rem' }}>Data Protection</h3>
              <ul style={{ marginBottom: '1rem', paddingLeft: '1.5rem' }}>
                <li>We never store your private keys</li>
                <li>All data is encrypted and secure</li>
                <li>Blockchain transactions are publicly visible</li>
                <li>You control your own data</li>
              </ul>
              <h3 style={{ color: '#00ffcc', marginBottom: '0.5rem' }}>Additional Information</h3>
              <p style={{ marginBottom: '1rem' }}>
                Our privacy practices are designed to ensure that your personal information is protected while maintaining the transparency required for blockchain-based gaming. We use industry-standard security measures to protect your data and regularly review our privacy practices to ensure compliance with applicable laws and regulations.
              </p>
              <p style={{ marginBottom: '1rem' }}>
                We may update this privacy policy from time to time to reflect changes in our practices or applicable laws. We will notify you of any material changes by posting the updated policy on our website and updating the "Last updated" date.
              </p>
              <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                <Link 
                  to="/privacy" 
                  onClick={handleViewFull}
                  style={{
                    background: 'linear-gradient(135deg, #00ffcc 0%, #c07eff 100%)',
                    color: '#000',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontFamily: 'Orbitron, monospace',
                    fontWeight: 'bold',
                    display: 'inline-block'
                  }}
                >
                  View Full Privacy Policy
                </Link>
              </div>
            </div>
          )}

          {/* Smart Contract Content */}
          {activePage === 'contract' && (
            <div style={{ color: '#ccc', lineHeight: '1.6' }}>
              <p style={{ marginBottom: '1rem' }}>
                Snakstract is powered by smart contracts deployed on the Abstract Mainnet. All game logic and transactions are executed on-chain for transparency and fairness.
              </p>
              
              <div style={{
                background: 'rgba(0, 255, 204, 0.1)',
                border: '1px solid #00ffcc',
                borderRadius: '8px',
                padding: '1.5rem',
                marginBottom: '1.5rem'
              }}>
                <h3 style={{ color: '#00ffcc', marginBottom: '1rem', fontSize: '1.2rem' }}>
                  🏗️ Smart Contract Address
                </h3>
                <div style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid #333',
                  borderRadius: '6px',
                  padding: '1rem',
                  fontFamily: 'monospace',
                  fontSize: '0.9rem',
                  wordBreak: 'break-all',
                  marginBottom: '1rem'
                }}>
                  {CONTRACT_ADDRESS}
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(CONTRACT_ADDRESS);
                    // You could add a toast notification here
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #00ffcc 0%, #00cc99 100%)',
                    color: '#000',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.5rem 1rem',
                    fontSize: '0.9rem',
                    fontFamily: 'Orbitron, monospace',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    marginRight: '0.5rem'
                  }}
                >
                  Copy Address
                </button>
                <a
                  href={`https://docs[dot]abs[dot]xyz/address/${CONTRACT_ADDRESS}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: 'transparent',
                    border: '1px solid #00ffcc',
                    color: '#00ffcc',
                    borderRadius: '6px',
                    padding: '0.5rem 1rem',
                    fontSize: '0.9rem',
                    fontFamily: 'Orbitron, monospace',
                    textDecoration: 'none',
                    display: 'inline-block'
                  }}
                >
                  View on Explorer
                </a>
              </div>

              <h3 style={{ color: '#00ffcc', marginBottom: '0.5rem' }}>Contract Features</h3>
              <ul style={{ marginBottom: '1rem', paddingLeft: '1.5rem' }}>
                <li>Provably fair game mechanics</li>
                <li>Automatic wager processing</li>
                <li>Referral system with rewards</li>
                <li>Leaderboard and statistics tracking</li>
                <li>Secure fund management</li>
              </ul>

              <h3 style={{ color: '#00ffcc', marginBottom: '0.5rem' }}>Security</h3>
              <ul style={{ marginBottom: '1rem', paddingLeft: '1.5rem' }}>
                <li>Audited smart contract code</li>
                <li>Time-locked admin functions</li>
                <li>Emergency pause functionality</li>
                <li>Transparent transaction history</li>
              </ul>

              <h3 style={{ color: '#00ffcc', marginBottom: '0.5rem' }}>Network Information</h3>
              <div style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid #333',
                borderRadius: '6px',
                padding: '1rem',
                marginBottom: '1rem'
              }}>
                <p style={{ margin: '0.5rem 0' }}><strong>Network:</strong> {networkConfig.config.CHAIN_ID === 2741 ? 'Abstract Mainnet' : 'Abstract Testnet'}</p>
                <p style={{ margin: '0.5rem 0' }}><strong>Chain ID:</strong> {networkConfig.config.CHAIN_ID}</p>
                <p style={{ margin: '0.5rem 0' }}><strong>Currency:</strong> ETH</p>
                <p style={{ margin: '0.5rem 0' }}><strong>Block Explorer:</strong> {networkConfig.config.EXPLORER.replace('docs.abs.xyz', 'docs[dot]abs[dot]xyz')}</p>
              </div>

              <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                <a
                  href={`https://docs[dot]abs[dot]xyz/address/${CONTRACT_ADDRESS}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleViewFull}
                  style={{
                    background: 'linear-gradient(135deg, #00ffcc 0%, #c07eff 100%)',
                    color: '#000',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontFamily: 'Orbitron, monospace',
                    fontWeight: 'bold',
                    display: 'inline-block'
                  }}
                >
                  View Full Contract Details
                </a>
              </div>
            </div>
          )}

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
              marginTop: '2rem',
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
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default OthersPopup; 