import React from 'react';
import { Link } from 'react-router-dom';

function NavBar() {
  return (
    <nav className="tab-nav">
      <Link to="/" className="title-link" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <img src="/icon22.png" alt="logo" style={{ height: '3.5rem' }} />
      <h1 className="title">SNAKSTRACT</h1>
      </Link>
      <div className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/game">Game</Link>
        <Link to="/quests">Quests</Link>
        <Link to="/escape">Escape</Link>
        <Link to="/referral">Referral</Link>
        <Link to="/history">History</Link>
        <Link to="/leaderboard">Leaderboard</Link>
      </div>
    </nav>
  );
}

export default NavBar;
