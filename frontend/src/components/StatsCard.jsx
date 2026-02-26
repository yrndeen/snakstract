import React from 'react';
import { formatTime, abbreviateAddress } from '../pages/utils/statsFormatter';
import './StatsCard.css';

function StatsCard({ stake, ethEscaped, duration, kills, player }) {
  return (
    <div className="stats-card">
      <h3>🏁 Game Summary</h3>
      <p><strong>Player:</strong> {abbreviateAddress(player)}</p>
      <p><strong>Stake:</strong> {stake} ETH</p>
      <p><strong>Escaped With:</strong> {ethEscaped} ETH</p>
      <p><strong>Time Survived:</strong> {formatTime(duration)}</p>
      <p><strong>Players Defeated:</strong> {kills}</p>
    </div>
  );
}

export default StatsCard;