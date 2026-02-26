import React from 'react';
import useClickSound from '../hooks/useClickSound';

const TWITTER_URL = 'https://twitter.com/snakstract'; // Replace with your actual Twitter URL
const RELAY_URL = 'https://relay.link';
// Place your logo in the public directory and use the correct path below
const RELAY_LOGO_SRC = '/relay_logo.png'; // Update this if you use a different filename

const ICON_SIZE = 40;
const LOGO_SIZE = 22; // Make the relay.link logo image a little smaller inside the button

const TwitterIcon = () => {
  const playClick = useClickSound();

  return (
    <div style={{
      position: 'fixed',
      right: 16,
      bottom: 16,
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'row',
      gap: 14,
    }}>
      {/* X (Twitter) logo */}
      <a
        href={TWITTER_URL}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          background: 'rgba(24,28,43,0.85)',
          borderRadius: '50%',
          boxShadow: '0 2px 8px #00ffcc44',
          padding: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'box-shadow 0.2s',
          width: ICON_SIZE,
          height: ICON_SIZE,
        }}
        aria-label="Follow Snakstract on X"
      >
        <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="20" cy="20" r="20" fill="#181c2b" />
          <path d="M27.7 11H32L23.9 20.2L33.5 31H26.3L20.5 24.1L13.9 31H9.6L18.2 21.2L8.9 11H16.3L21.6 17.3L27.7 11ZM26.4 28.9H28.4L16.2 13H14.1L26.4 28.9Z" fill="#fff" />
        </svg>
      </a>
      {/* relay.link logo as image */}
      <a
        href={RELAY_URL}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          background: 'rgba(24,28,43,0.85)',
          borderRadius: '50%',
          boxShadow: '0 2px 8px #00ffcc44',
          padding: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'box-shadow 0.2s',
          width: ICON_SIZE,
          height: ICON_SIZE,
        }}
        aria-label="Visit relay.link"
      >
        <img src={RELAY_LOGO_SRC} alt="relay.link logo" style={{ width: LOGO_SIZE, height: LOGO_SIZE, borderRadius: 8, display: 'block' }} />
      </a>
    </div>
  );
};

export default TwitterIcon; 