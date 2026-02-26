import React, { useRef, useEffect, useState } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { Link } from 'react-router-dom';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config';
import { useVolume } from './VolumeControl';
import useClickSound from '../hooks/useClickSound';

const SPButton = () => {
  const { address, isConnected } = useAccount();
  const [userSP, setUserSP] = useState(0);

  useEffect(() => {
    if (!address) return;
    
    const fetchSP = () => {
      fetch('http://10.0.0.248:2567/leaderboard')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            const player = data.find(p => p.address.toLowerCase() === address.toLowerCase());
            const newSP = player?.SP || 0;
            console.log('SPButton fetched SP:', newSP, 'for address:', address);
            setUserSP(newSP);
          }
        })
        .catch(err => console.error('Failed to fetch SP:', err));
    };
    
    // Fetch immediately
    fetchSP();
    
    // Then fetch every 3 seconds for live updates
    const interval = setInterval(fetchSP, 3000);
    
    // Listen for SP updates from quest claims
    const handleSPUpdate = (event) => {
      console.log('SPButton received spUpdated event:', event.detail);
      console.log('Current address:', address);
      console.log('Event wallet:', event.detail?.wallet);
      console.log('Addresses match?', event.detail?.wallet?.toLowerCase() === address?.toLowerCase());
      
      if (event.detail && event.detail.wallet.toLowerCase() === address.toLowerCase()) {
        console.log('SP update event received, refreshing SP display');
        // Force immediate refresh
        setTimeout(() => fetchSP(), 100);
      } else {
        console.log('SP update event received but wallet mismatch:', {
          eventWallet: event.detail?.wallet,
          currentAddress: address
        });
      }
    };
    
    // Also listen for quest completion events
    const handleQuestCompleted = () => {
      console.log('SPButton received quest completion event, refreshing SP');
      // Temporarily clear SP to force visual update
      setUserSP(0);
      setTimeout(() => fetchSP(), 500);
    };
    
    window.addEventListener('spUpdated', handleSPUpdate);
    window.addEventListener('questCompleted', handleQuestCompleted);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('spUpdated', handleSPUpdate);
      window.removeEventListener('questCompleted', handleQuestCompleted);
    };
  }, [address]);

  const { volume } = useVolume();
  const playClick = useClickSound();

  // Debug output
  console.log('SPButton address:', address);
  console.log('SPButton userSP:', userSP);

  // Sound refs
  const clickSound = useRef(null);
  const chimeSound = useRef(null);

  // Format SP for display
  const formatSP = (sp) => {
    if (sp >= 1000) {
      return (sp / 1000).toFixed(2).replace(/\.00$/, '') + 'k';
    }
    return sp;
  };

  const handleClick = (e) => {
    // Only play click for non-claim/withdraw
    if (e.currentTarget.type !== 'claim' && e.currentTarget.type !== 'withdraw') playClick();
    if (e.currentTarget.type === 'claim' || e.currentTarget.type === 'withdraw') {
      if (chimeSound.current) {
        chimeSound.current.currentTime = 0;
        chimeSound.current.play();
      }
    }
  };

  useEffect(() => {
    if (clickSound.current) clickSound.current.volume = volume;
    if (chimeSound.current) chimeSound.current.volume = volume;
  }, [volume]);

  if (!isConnected) return null;

  return (
    <Link to="/history" style={{
      display: 'inline-block',
      marginLeft: 6,
      textDecoration: 'none',
    }}>
      <button
        style={{
          background: 'rgba(162,89,255,0.08)',
          color: '#a259ff',
          borderRadius: 14,
          padding: '0.13rem 0.7rem',
          fontWeight: 700,
          fontSize: '0.74rem',
          fontFamily: "'Orbitron', sans-serif",
          border: '2px solid #a259ff',
          cursor: 'pointer',
          letterSpacing: '0.04em',
          transition: 'background 0.18s, box-shadow 0.18s, color 0.18s',
          display: 'inline-block',
          minWidth: 0,
          width: 'fit-content',
          lineHeight: 1.2,
          boxShadow: '0 0 10px 2px #a259ff33',
          textShadow: '0 0 6px #a259ff44',
          position: 'relative',
        }}
        onMouseOver={e => {
          e.currentTarget.style.background = 'rgba(162,89,255,0.18)';
          e.currentTarget.style.color = '#fff';
          e.currentTarget.style.boxShadow = '0 0 16px 4px #a259ff77';
        }}
        onMouseOut={e => {
          e.currentTarget.style.background = 'rgba(162,89,255,0.08)';
          e.currentTarget.style.color = '#a259ff';
          e.currentTarget.style.boxShadow = '0 0 10px 2px #a259ff33';
        }}
        onClick={handleClick}
      >
        SP <span style={{ color: '#00ff88', fontWeight: 800, textShadow: '0 0 8px #00ff8855', marginLeft: 2 }}>{formatSP(userSP)}</span>
        <span style={{
          position: 'absolute',
          inset: 2,
          borderRadius: 10,
          border: '1.5px solid #a259ff',
          pointerEvents: 'none',
          boxSizing: 'border-box',
        }} />
      </button>
      {/* Audio elements */}
      <audio ref={clickSound} src="/sounds/click.mp3" preload="auto" volume={volume} />
      <audio ref={chimeSound} src="/sounds/chime.mp3" preload="auto" volume={volume} />
    </Link>
  );
};

export default SPButton; 