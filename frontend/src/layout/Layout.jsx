import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import WalletButton from '../components/WalletButton';
import TwitterIcon from '../components/TwitterIcon';

const Layout = () => {
  const { pathname } = useLocation();
  const hideNav = pathname === '/game' || pathname === '/escape';

  return (
    <div className="page-container">
      {!hideNav && (
        <>
          <div style={{ textAlign: 'center', marginBottom: 10 }}>
            <h1 style={{ color: '#00ffcc' }}>SNAKSTRACT</h1>
          </div>
          <nav>
            <a href="/">Home</a>
            <a href="/game">Game</a>
            <a href="/escape">Escape</a>
            <a href="/referral">Referral</a>
            <a href="/history">History</a>
            <a href="/leaderboard">Leaderboard</a>
            <div style={{ float: 'right', marginRight: 20 }}>
              <WalletButton />
            </div>
          </nav>
        </>
      )}
      <Outlet />
      {!hideNav && <TwitterIcon />}
    </div>
  );
};

export default Layout;
