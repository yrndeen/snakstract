import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import useClickSound from '../hooks/useClickSound';
import { useNetwork } from '../App';

// Export the context so it can be used elsewhere
export const VolumeContext = React.createContext();

export function useVolume() {
  return useContext(VolumeContext);
}

// Network Toggle Component
function NetworkToggle() {
  const { isMainnet, setIsMainnet } = useNetwork();
  const playClick = useClickSound();

  const handleToggle = () => {
    playClick();
    setIsMainnet((prev) => !prev);
    // Here you would typically update the chain configuration
    console.log(`Switched to ${isMainnet ? 'testnet' : 'mainnet'}`);
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      background: 'rgba(20,20,20,0.45)',
      border: '1px solid rgba(0, 255, 204, 0.3)',
      borderRadius: '8px',
      padding: '4px 10px 4px 8px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      fontFamily: 'Orbitron, monospace',
      fontSize: '0.75rem',
      fontWeight: 'bold',
      boxShadow: '0 0 8px #00ffcc33',
      marginBottom: '8px'
    }}
    onClick={handleToggle}
    onMouseEnter={(e) => {
      e.currentTarget.style.borderColor = '#00ffcc';
      e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 255, 204, 0.3)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = 'rgba(0, 255, 204, 0.3)';
      e.currentTarget.style.boxShadow = '0 0 8px #00ffcc33';
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

// Volume Controls Component - rendered inside Router context
export function VolumeControls() {
  const { volume, muted, setVolume, setMuted, musicVolume, musicMuted, setMusicVolume, setMusicMuted } = useVolume();
  const playClick = useClickSound();
  // Remove location and isMainScreen check to always show controls

  return (
    <div style={{
      position: 'fixed',
      left: 12,
      bottom: 12,
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: '6px',
      userSelect: 'none',
      minHeight: 0,
      minWidth: 0,
    }}>
      <NetworkToggle />
      <div style={{
        background: 'rgba(20,20,20,0.60)',
        borderRadius: 8,
        padding: '3px 8px',
        boxShadow: '0 0 8px #00ffcc55',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        userSelect: 'none',
        minHeight: 0,
        minWidth: 0,
      }}>
        {/* SFX/Global Volume */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        <button
          onClick={() => { setMuted(m => !m); playClick(); }}
          style={{
            background: 'none',
            border: 'none',
            color: '#00ffcc',
              fontSize: 16,
            cursor: 'pointer',
            outline: 'none',
              marginRight: 1,
            padding: 0,
            minWidth: 0,
              transition: 'color 0.2s',
          }}
            aria-label={muted ? 'Unmute SFX' : 'Mute SFX'}
        >
          {muted ? '🔇' : '🔊'}
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={muted ? 0 : volume}
          onChange={e => {
            setVolume(parseFloat(e.target.value));
            if (muted && parseFloat(e.target.value) > 0) setMuted(false);
          }}
          style={{
              width: 48,
              height: 4,
              accentColor: '#00ffcc',
              cursor: 'pointer',
              margin: 0,
              padding: 0,
              minWidth: 0,
              background: 'linear-gradient(90deg, #00ffcc 0%, #0077ff 100%)',
              borderRadius: 4,
              boxShadow: '0 0 2px #00ffcc88',
              outline: 'none',
              border: 'none',
              transition: 'accent-color 0.2s',
            }}
          />
        </div>
        {/* Music Volume */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <button
            onClick={() => { setMusicMuted(m => !m); playClick(); }}
            style={{
              background: 'none',
              border: 'none',
              color: '#00ffcc',
              fontSize: 16,
              cursor: 'pointer',
              outline: 'none',
              marginRight: 1,
              padding: 0,
              minWidth: 0,
              transition: 'color 0.2s',
            }}
            aria-label={musicMuted ? 'Unmute Music' : 'Mute Music'}
          >
            {musicMuted ? '🎵❌' : '🎵'}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={musicMuted ? 0 : musicVolume}
            onChange={e => {
              setMusicVolume(parseFloat(e.target.value));
              if (musicMuted && parseFloat(e.target.value) > 0) setMusicMuted(false);
            }}
            style={{
              width: 48,
            height: 4,
            accentColor: '#00ffcc',
            cursor: 'pointer',
            margin: 0,
            padding: 0,
            minWidth: 0,
              background: 'linear-gradient(90deg, #00ffcc 0%, #ff00cc 100%)',
              borderRadius: 4,
              boxShadow: '0 0 2px #00ffcc88',
              outline: 'none',
              border: 'none',
              transition: 'accent-color 0.2s',
          }}
        />
        </div>
      </div>
    </div>
  );
}

export function VolumeProvider({ children }) {
  // Load from localStorage or default to 1 (100%)
  const [volume, setVolume] = useState(() => {
    const stored = localStorage.getItem('globalVolume');
    return stored !== null ? parseFloat(stored) : 1;
  });
  const [muted, setMuted] = useState(() => {
    const stored = localStorage.getItem('globalMuted');
    return stored === 'true';
  });
  // Music-specific volume
  const [musicVolume, setMusicVolume] = useState(() => {
    const stored = localStorage.getItem('musicVolume');
    return stored !== null ? parseFloat(stored) : 0.5;
  });
  const [musicMuted, setMusicMuted] = useState(() => {
    const stored = localStorage.getItem('musicMuted');
    return stored === 'true';
  });

  const musicRef = React.useRef(null);

  // Sync music volume and mute state
  React.useEffect(() => {
    if (musicRef.current) {
      musicRef.current.volume = musicMuted ? 0 : musicVolume;
      musicRef.current.muted = musicMuted;
    }
  }, [musicMuted, musicVolume]);

  // Auto-play music on mount (if not muted)
  React.useEffect(() => {
    if (musicRef.current && !musicMuted) {
      const playPromise = musicRef.current.play();
      if (playPromise) playPromise.catch(() => {}); // Ignore autoplay errors
    }
  }, [musicMuted]);

  // Pause music if muted, play if unmuted
  React.useEffect(() => {
    if (musicRef.current) {
      if (musicMuted) {
        musicRef.current.pause();
      } else {
        const playPromise = musicRef.current.play();
        if (playPromise) playPromise.catch(() => {});
      }
    }
  }, [musicMuted]);

  useEffect(() => {
    localStorage.setItem('globalVolume', volume);
  }, [volume]);
  useEffect(() => {
    localStorage.setItem('globalMuted', muted);
  }, [muted]);
  useEffect(() => {
    localStorage.setItem('musicVolume', musicVolume);
  }, [musicVolume]);
  useEffect(() => {
    localStorage.setItem('musicMuted', musicMuted);
  }, [musicMuted]);

  const value = {
    volume: muted ? 0 : volume,
    muted,
    setVolume,
    setMuted,
    musicVolume: musicMuted ? 0 : musicVolume,
    musicMuted,
    setMusicVolume,
    setMusicMuted,
  };

  return (
    <VolumeContext.Provider value={value}>
      {children}
      {/* Background music, hidden from UI */}
      <audio
        ref={musicRef}
        src="/sounds/gamemusic.mp3"
        preload="auto"
        loop
        style={{ display: 'none' }}
      />
    </VolumeContext.Provider>
  );
} 