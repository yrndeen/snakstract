import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import WalletButton from './WalletButton';
import TwitterIcon from './TwitterIcon';

function SharedLayout({ children }) {
  const location = useLocation();
  const isGameOrEscape = location.pathname === '/game' || location.pathname === '/escape';

  if (isGameOrEscape) return children;

  return (
    <div className="page-container fade-in">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px' }}>
        <h1 style={{ textAlign: 'center', flex: 1 }}>SNAKSTRACT</h1>
        <WalletButton />
      </header>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/game">Game</Link>
        <Link to="/escape">Escape</Link>
        <Link to="/referral">Referral</Link>
        <Link to="/history">History</Link>
        <Link to="/leaderboard">Leaderboard</Link>
      </nav>
      {children}
      <TwitterIcon />
    </div>
  );
}

export default SharedLayout;
