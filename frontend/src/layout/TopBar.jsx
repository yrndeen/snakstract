import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import WalletButton from '../components/WalletButton';
import useClickSound from '../hooks/useClickSound';

export default function TopBar() {
  const location = useLocation();
  const hideOnGamePages = location.pathname === '/game' || location.pathname === '/escape';
  const playClick = useClickSound();

  if (hideOnGamePages) return null;

  return (
    <div style={{
      backgroundColor: '#111',
      padding: '12px 20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '1px solid #00ffcc33',
      zIndex: 2
    }}>
      <h1 style={{ color: '#00ffcc', margin: 0 }}>SNAKSTRACT</h1>
      <nav style={{ display: 'flex', gap: '15px' }}>
        <Link to="/">Home</Link>
        <Link to="/game">Game</Link>
        <Link to="/quests">Quests</Link>
        <Link to="/escape">Escape</Link>
        <Link to="/referral">Referral</Link>
        <Link to="/history">History</Link>
        <Link to="/leaderboard">Leaderboard</Link>
      </nav>
      <WalletButton />
    </div>
  );
}