import React, { useEffect, useState, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { AbstractWalletProvider } from "@abstract-foundation/agw-react";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from './config';
import { VolumeProvider, VolumeControls } from './components/VolumeControl';
import { useAccount, useWriteContract, useBalance, useDisconnect } from 'wagmi';
import { formatEther } from 'viem';

import MainScreen from './pages/MainScreen';
import GameScreen from './pages/GameScreen';
import EscapeScreen from './pages/EscapeScreen';
import DeathScreen from './pages/DeathScreen';
import ReferralTab from './pages/ReferralTab';
import ReferralTest from './pages/ReferralTest';
import HistoryTab from './pages/HistoryTab';
import Leaderboard from './pages/Leaderboard';
import Tutorial from './pages/Tutorial';
import Quests from './pages/Quests';
import NotFound from './pages/NotFound';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Support from './pages/Support';
import WalletButton from './components/WalletButton';
import WalletDisplay from './components/WalletDisplay';
import SPButton from './components/SPButton';
import AnimatedSnakes from './components/AnimatedSnakes';
import TwitterIcon from './components/TwitterIcon';
import LoadingScreen from './pages/LoadingScreen';
import ErrorBoundary from './components/ErrorBoundary';
import OthersPopup from './components/OthersPopup';
import useClickSound from './hooks/useClickSound';
import { SECURITY_CONFIG, ABSTRACT_MAINNET, ABSTRACT_TESTNET } from './config/security.js';

import './global.css';
import './ui-enhancements.css';

// Create proper chain objects for Abstract Wallet Provider
const abstractMainnetChain = {
  id: ABSTRACT_MAINNET.CHAIN_ID,
  name: 'Abstract Mainnet',
  network: 'abstract-mainnet',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [ABSTRACT_MAINNET.RPC_URL],
    },
    public: {
      http: [ABSTRACT_MAINNET.RPC_URL],
    },
  },
  blockExplorers: {
    default: {
      name: 'Abstract Explorer',
      url: ABSTRACT_MAINNET.EXPLORER,
    },
  },
};

const abstractTestnetChain = {
  id: ABSTRACT_TESTNET.CHAIN_ID,
  name: 'Abstract Testnet',
  network: 'abstract-testnet',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [ABSTRACT_TESTNET.RPC_URL],
    },
    public: {
      http: [ABSTRACT_TESTNET.RPC_URL],
    },
  },
  blockExplorers: {
    default: {
      name: 'Abstract Testnet Explorer',
      url: ABSTRACT_TESTNET.EXPLORER,
    },
  },
};

// Comprehensive crypto polyfill for Abstract SDK compatibility
if (typeof window !== 'undefined') {
  // Ensure crypto is available
  if (!window.crypto) {
    window.crypto = {
      getRandomValues: (arr) => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * 256);
        }
        return arr;
      }
    };
  }
  
  // Ensure crypto.subtle is available with all required methods
  if (!window.crypto.subtle) {
    window.crypto.subtle = {};
  }
  
  // Add missing crypto.subtle methods
  if (!window.crypto.subtle.importKey) {
    window.crypto.subtle.importKey = async (format, keyData, algorithm, extractable, keyUsages) => {
      return {
        type: 'secret',
        extractable,
        algorithm,
        usages: keyUsages
      };
    };
  }
  
  if (!window.crypto.subtle.exportKey) {
    window.crypto.subtle.exportKey = async (format, key) => {
      return new ArrayBuffer(32);
    };
  }
  
  if (!window.crypto.subtle.generateKey) {
    window.crypto.subtle.generateKey = async (algorithm, extractable, keyUsages) => {
      return {
        type: 'secret',
        extractable,
        algorithm,
        usages: keyUsages
      };
    };
  }
  
  if (!window.crypto.subtle.sign) {
    window.crypto.subtle.sign = async (algorithm, key, data) => {
      return new ArrayBuffer(64);
    };
  }
  
  if (!window.crypto.subtle.verify) {
    window.crypto.subtle.verify = async (algorithm, key, signature, data) => {
      return true;
    };
  }
  
  if (!window.crypto.subtle.encrypt) {
    window.crypto.subtle.encrypt = async (algorithm, key, data) => {
      return new ArrayBuffer(data.byteLength);
    };
  }
  
  if (!window.crypto.subtle.decrypt) {
    window.crypto.subtle.decrypt = async (algorithm, key, data) => {
      return new ArrayBuffer(32);
    };
  }
  
}

// Handle wallet provider conflicts - Remove the ethereum property redefinition
if (typeof window !== 'undefined') {
  // Prevent ethereum property redefinition errors by not redefining it
}

// Network context
export const NetworkContext = createContext();
export function useNetwork() {
  return useContext(NetworkContext);
}

function isMobileDevice() {
  return /Mobi|Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
}

function TwitterIconWrapper() {
  const location = useLocation();
  const hide = location.pathname === '/game' || location.pathname === '/escape';
  return hide ? null : <TwitterIcon />;
}

// Component to handle referral code from URL
function ReferralHandler() {
  const location = useLocation();
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const [referralCode, setReferralCode] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const { writeContract: setReferrerOnChain, isPending, isError, error: contractError } = useWriteContract({
    onSuccess: (data) => {
      setError(null);
      setIsProcessing(false);
      // Redirect to main screen after successful referral activation
      navigate('/', { replace: true });
    },
    onError: (err) => {
      setError(err.message || 'Failed to activate referral code');
      setIsProcessing(false);
      // Still redirect to main screen after error
      setTimeout(() => navigate('/', { replace: true }), 3000);
    }
  });

  useEffect(() => {
    // Check if URL path contains a referral code (5-character alphanumeric)
    // Format: snakstract.io/ABCDE
    const path = location.pathname;
    const referralMatch = path.match(/^\/([A-Z0-9]{5})$/);
    
    if (referralMatch) {
      const code = referralMatch[1];
      setReferralCode(code);
      
      // If wallet is connected, try to set the referrer
      if (isConnected && address) {
        handleReferralActivation(code);
      } else {
      }
    }
  }, [location.pathname, isConnected, address]);

  // Handle wallet connection after referral code is detected
  useEffect(() => {
    if (referralCode && isConnected && address && !isProcessing) {
      handleReferralActivation(referralCode);
    }
  }, [isConnected, address, referralCode]);

  const handleReferralActivation = async (code) => {
    if (!isConnected || !address) {
      setError('Please connect your wallet first');
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    
    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      setError('Referral activation timed out. Please try again.');
      setIsProcessing(false);
    }, 30000); // 30 second timeout
    
    try {
      await setReferrerOnChain({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'setReferrer',
        args: [code],
      });
      
      clearTimeout(timeoutId);
    } catch (error) {
      clearTimeout(timeoutId);
      setError('Failed to activate referral code: ' + (error.message || 'Unknown error'));
      setIsProcessing(false);
    }
  };

  // Show loading/processing state if handling referral
  if (referralCode && (isProcessing || isPending)) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(24, 28, 43, 0.95)',
        color: '#00ffcc',
        fontFamily: 'Orbitron, monospace',
        zIndex: 9999,
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ marginBottom: '1rem', textShadow: '0 0 10px #00ffcc' }}>
            Activating Referral Code: {referralCode}
          </h2>
          <p style={{ marginBottom: '1rem' }}>Please wait while we process your referral...</p>
          <p style={{ fontSize: '0.9rem', color: '#888' }}>This may take a few moments</p>
          {error && (
            <div style={{ color: '#ff4444', marginTop: '1rem', padding: '1rem', background: 'rgba(255, 68, 68, 0.1)', borderRadius: '8px' }}>
              {error}
            </div>
          )}
          {contractError && (
            <div style={{ color: '#ff4444', marginTop: '1rem', padding: '1rem', background: 'rgba(255, 68, 68, 0.1)', borderRadius: '8px' }}>
              Contract Error: {contractError.message}
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}

// Wallet Display Component
function ConnectedWalletDisplay() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { networkConfig } = useNetwork();
  const [balance, setBalance] = useState('0.0000');

  useEffect(() => {
    async function fetchBalance() {
      if (!address) return setBalance('0.0000');
      try {
        const response = await fetch(networkConfig.config.RPC_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_getBalance',
            params: [address, 'latest'],
            id: 1,
          }),
        });
        const data = await response.json();
        if (data.result) {
          setBalance((parseFloat(parseInt(data.result, 16) / 1e18).toFixed(4)));
        } else {
          setBalance('0.0000');
        }
      } catch (e) {
        setBalance('0.0000');
      }
    }
    fetchBalance();
  }, [address, networkConfig]);

  if (!isConnected || !address) {
    return null;
  }

  const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;

  const handleDisconnect = () => {
    disconnect();
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      background: 'rgba(0, 255, 204, 0.1)',
      border: '1px solid #00ffcc',
      borderRadius: '8px',
      padding: '0.5rem 1rem',
      fontFamily: 'Orbitron, monospace',
      fontSize: '0.9rem'
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
        <span style={{ color: '#00ffcc', fontWeight: 'bold' }}>{shortAddress}</span>
        <span style={{ color: '#888', fontSize: '0.8rem' }}>{balance} ETH</span>
      </div>
      <button
        onClick={handleDisconnect}
        style={{
          background: 'transparent',
          border: '1px solid #ff4444',
          color: '#ff4444',
          borderRadius: '4px',
          padding: '0.25rem 0.5rem',
          fontSize: '0.8rem',
          cursor: 'pointer',
          fontFamily: 'Orbitron, monospace'
        }}
        onMouseEnter={e => {
          e.target.style.background = '#ff4444';
          e.target.style.color = '#000';
        }}
        onMouseLeave={e => {
          e.target.style.background = 'transparent';
          e.target.style.color = '#ff4444';
        }}
      >
        Disconnect
      </button>
    </div>
  );
}

// Network Toggle Component
function NetworkToggle() {
  const { isMainnet, setIsMainnet } = useNetwork();
  const playClick = useClickSound();

  const handleToggle = () => {
    playClick();
    setIsMainnet((prev) => !prev);
    // Here you would typically update the chain configuration
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      background: 'rgba(0, 0, 0, 0.3)',
      border: '1px solid rgba(0, 255, 204, 0.3)',
      borderRadius: '20px',
      padding: '0.25rem',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      fontFamily: 'Orbitron, monospace',
      fontSize: '0.75rem',
      fontWeight: 'bold'
    }}
    onClick={handleToggle}
    onMouseEnter={(e) => {
      e.currentTarget.style.borderColor = '#00ffcc';
      e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 255, 204, 0.3)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = 'rgba(0, 255, 204, 0.3)';
      e.currentTarget.style.boxShadow = 'none';
    }}
    >
      <span style={{
        color: isMainnet ? '#00ffcc' : '#666',
        transition: 'color 0.3s ease'
      }}>
        MAIN
      </span>
      <div style={{
        width: '24px',
        height: '12px',
        background: isMainnet ? '#00ffcc' : '#666',
        borderRadius: '6px',
        position: 'relative',
        transition: 'background 0.3s ease'
      }}>
        <div style={{
          width: '8px',
          height: '8px',
          background: '#000',
          borderRadius: '50%',
          position: 'absolute',
          top: '2px',
          left: isMainnet ? '14px' : '2px',
          transition: 'left 0.3s ease'
        }} />
      </div>
      <span style={{
        color: !isMainnet ? '#00ffcc' : '#666',
        transition: 'color 0.3s ease'
      }}>
        TEST
      </span>
    </div>
  );
}

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [showOthersPopup, setShowOthersPopup] = useState(false);
  const playClick = useClickSound();
  const [isMainnet, setIsMainnet] = useState(true);
  const networkConfig = {
    chain: isMainnet ? abstractMainnetChain : abstractTestnetChain,
    config: isMainnet ? ABSTRACT_MAINNET : ABSTRACT_TESTNET
  };

  useEffect(() => {
    // Clear any problematic localStorage flags that might cause connection issues
    localStorage.removeItem('walletDisconnected');
    localStorage.removeItem('walletConnected');
    
    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleOpenOthers = () => {
    setShowOthersPopup(true);
  };

  const handleCloseOthers = () => {
    setShowOthersPopup(false);
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (isMobileDevice()) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #181c2b 0%, #0f1419 100%)',
        color: '#00ffcc',
        fontFamily: 'Orbitron, monospace',
        textAlign: 'center',
        padding: '2rem'
      }}>
        <h2>Mobile Not Supported</h2>
        <p>Please use a desktop browser to play Snakstract.</p>
        <p style={{ fontSize: '0.9rem', color: '#888' }}>
          Mobile support coming soon!
        </p>
      </div>
    );
  }

  return (
    <NetworkContext.Provider value={{ isMainnet, setIsMainnet, networkConfig }}>
      <ErrorBoundary>
        <VolumeProvider>
          <AbstractWalletProvider 
            chain={networkConfig.chain}
            options={{
                autoConnect: false, // Disable auto-connect to prevent conflicts
              onError: (error) => {
                // Suppress ethereum redefinition errors
                if (error.message && error.message.includes('Cannot redefine property: ethereum')) {
                  return;
                }
              },
              onConnect: (data) => {
              },
              onDisconnect: () => {
              }
            }}
          >
            <Router>
              <AppContent 
                showOthersPopup={showOthersPopup}
                onOpenOthers={handleOpenOthers}
                onCloseOthers={handleCloseOthers}
                networkConfig={networkConfig}
              />
            </Router>
          </AbstractWalletProvider>
        </VolumeProvider>
      </ErrorBoundary>
    </NetworkContext.Provider>
  );
}

// Separate component to handle location detection inside Router context
function AppContent({ showOthersPopup, onOpenOthers, onCloseOthers, networkConfig }) {
  const location = useLocation();
  const playClick = useClickSound();
  // Load achievements from localStorage if available
  const [achievements, setAchievements] = useState(() => {
    try {
      const saved = localStorage.getItem('achievements');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load achievements from localStorage:', e);
    }
    return {
      'Speed Demon': false,
      'Orb Hunter': false,
      'Survivor': false,
      'Killer Instinct': false,
      'Moving Orb Master': false,
      'Giant Slayer': false,
      'Orb Chain': false,
      'Endurance': false,
      'Escape Artist': false
    };
  });

  // Save achievements to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('achievements', JSON.stringify(achievements));
    } catch (e) {
      console.error('Failed to save achievements to localStorage:', e);
    }
  }, [achievements]);

  // Check if game canvas is active (user is on game screen)
  const isGameActive = location.pathname === '/game';
  const isMainScreen = location.pathname === '/';

  return (
    <>
      <ReferralHandler />
          <div className="app-container">
        <AnimatedSnakes isGameActive={isGameActive} />
            <nav className="main-nav">
              <div className="nav-left">
                <Link to="/" className="nav-link">Play</Link>
                <Link to="/quests" className="nav-link">Quests</Link>
                <Link to="/history" className="nav-link">History</Link>
                <Link to="/leaderboard" className="nav-link">Leaderboard</Link>
                <Link to="/referrals" className="nav-link">Referrals</Link>
                <Link to="/tutorial" className="nav-link">Tutorial</Link>
              <button 
                onClick={onOpenOthers}
                className="nav-link"
                style={{
                  color: '#4a148c',
                  opacity: 1,
                  border: '1px solid #333333',
                  borderRadius: '4px',
                  padding: '2px 6px',
                  fontSize: '1rem'
                }}
                onMouseEnter={e => {
                  e.target.style.color = '#87ceeb';
                  e.target.style.opacity = '1';
                }}
                onMouseLeave={e => {
                  e.target.style.color = '#4a148c';
                  e.target.style.opacity = '1';
                }}
              >
                Others
              </button>
              </div>
              <div className="nav-right" style={{ display: 'flex', alignItems: 'center', gap: '0.18rem', justifyContent: 'flex-end', minWidth: 0 }}>
                <Link to="/" className="logo-text" style={{ display: 'flex', alignItems: 'center', gap: '0.18rem', textDecoration: 'none', marginRight: '0.12rem' }}>
                  <img src="/icon22.png" alt="logo" style={{ height: '3.5rem', maskImage: 'radial-gradient(circle, rgba(0,0,0,1) 20%, rgba(0,0,0,0) 100%)' }} />
                  <span style={{ WebkitTextStroke: '0.5px #c07eff' }}>SNAKSTRACT</span>
                </Link>
                <div className="wallet-section" style={{ display: 'flex', alignItems: 'center', gap: '0.18rem', minWidth: 0 }}>
                <ConnectedWalletDisplay />
                  <WalletButton />
                  <SPButton />
                </div>
              </div>
            </nav>
            <main className="content">
              <Routes>
                <Route path="/" element={<MainScreen />} />
                <Route path="/game" element={
                  <ErrorBoundary>
                    <GameScreen achievements={achievements} setAchievements={setAchievements} />
                  </ErrorBoundary>
                } />
                <Route path="/escape" element={<EscapeScreen />} />
                <Route path="/death" element={<DeathScreen />} />
                <Route path="/referrals" element={<ReferralTab />} />
              <Route path="/referral-test" element={<ReferralTest />} />
                <Route path="/quests" element={<Quests achievements={achievements} />} />
                <Route path="/history" element={<HistoryTab />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/tutorial" element={<Tutorial />} />
                <Route path="/terms" element={<TermsOfService />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/support" element={<Support />} />
              {/* Handle referral codes - this route will be caught by ReferralHandler */}
              <Route path="/:referralCode" element={<MainScreen />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <TwitterIconWrapper />
            <VolumeControls />
          </div>
        <OthersPopup isOpen={showOthersPopup} onClose={onCloseOthers} />
    </>
  );
}

export default App;

