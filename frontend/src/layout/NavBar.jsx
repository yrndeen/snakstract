import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import WalletButton from '../components/WalletButton';
import './NavBar.css';
import useClickSound from '../hooks/useClickSound';

function NavBar() {
  const location = useLocation();
  const hideNav = location.pathname === '/game' || location.pathname === '/escape';
  const playClick = useClickSound();

  if (hideNav) return null;

  return (
    <nav className="nav-bar">
      <div className="nav-left">
        <Link to="/" className="title-link" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img src="/icon22.png" alt="logo" style={{ height: '3.5rem' }} />
          <h1 className="game-title">SNAKSTRACT</h1>
        </Link>
        <Link to="/game" onClick={() => { playClick(); }}>Game</Link>
        <Link to="/quests" onClick={() => { playClick(); }}>Quests</Link>
        <Link to="/escape" onClick={() => { playClick(); }}>Escape</Link>
        <Link to="/referral" onClick={() => { playClick(); }}>Referral</Link>
        <Link to="/history" onClick={() => { playClick(); }}>History</Link>
        <Link to="/leaderboard" onClick={() => { playClick(); }}>Leaderboard</Link>
      </div>
      <div className="nav-right">
        <WalletButton />
      </div>
    </nav>
  );
}

export default NavBar;