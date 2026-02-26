import React from 'react';

function GameStatsOverlay({ stats }) {
  if (!stats) return null;

  return (
    <div className="game-overlay">
      <h3>🏁 Escape Summary</h3>
      <ul>
        <li>⏱ Time in Game: {stats.timeInGame}s</li>
        <li>💰 ETH Escaped With: {stats.ethEscaped} ETH</li>
        <li>🎯 Players Defeated: {stats.playersDefeated}</li>
        <li>📤 Stake: {stats.stakeAmount} ETH</li>
      </ul>
    </div>
  );
}

export default GameStatsOverlay;