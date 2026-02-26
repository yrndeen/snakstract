import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import WalletButton from './WalletButton';

function TopBar() {
  const location = useLocation();
  const hideOnPages = ['/game', '/escape'];
  const shouldRender = !hideOnPages.includes(location.pathname);

  if (!shouldRender) return null;

  return (
    <nav className="top-nav">
      <div className="title">SNAKSTRACT</div>
      <div className="tabs">
        <Link to="/">Home</Link>
        <Link to="/game">Game</Link>
        <Link to="/referral">Referral</Link>
        <Link to="/history">History</Link>
        <Link to="/leaderboard">Leaderboard</Link>
      </div>
      <WalletButton />
    </nav>
  );
}

export default TopBar;