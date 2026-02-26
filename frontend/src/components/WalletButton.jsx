import React, { useState, useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';
import { useVolume } from './VolumeControl';
import useClickSound from '../hooks/useClickSound';
import WalletPopup from './WalletPopup';

const WalletButton = () => {
  const { isConnected } = useAccount();
  const clickSound = useRef(null);
  const { volume } = useVolume();
  const playClick = useClickSound();
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    if (clickSound.current) clickSound.current.volume = volume;
  }, [volume]);

  const handleClick = (e) => {
    if (clickSound.current) {
      clickSound.current.currentTime = 0;
      clickSound.current.play();
    }
    if (e.target.tagName === 'BUTTON') {
      e.target.blur();
    }
  };

  if (isConnected) {
    // Render nothing here; wallet info/disconnect UI is handled elsewhere
    return null;
  }

  return (
    <>
        <button 
        onClick={() => setShowPopup(true)}
        style={{
          background: 'linear-gradient(135deg, #00ffcc 0%, #c07eff 100%)',
          color: '#000',
          border: 'none',
          borderRadius: '8px',
          padding: '0.7rem 1.5rem',
          fontSize: '1rem',
          fontFamily: 'Orbitron, monospace',
          fontWeight: 'bold',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,255,204,0.15)',
          marginRight: '0.5rem',
        }}
        >
        Connect Wallet
        </button>
      <WalletPopup isOpen={showPopup} onClose={() => setShowPopup(false)} />

      <audio ref={clickSound} src="/sounds/click.mp3" preload="auto" volume={volume} />
    </>
  );
};

export default WalletButton;
