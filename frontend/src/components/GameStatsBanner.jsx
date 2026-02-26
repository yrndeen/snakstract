
import React from 'react';

function GameStatsBanner({ stats }) {
  if (!stats) return null;
  return (
    <div className="game-stats-banner">
      <p>🏁 Escaped with: {stats.ethEscaped}</p>
      <p>⏱️ Time Spent: {stats.timeSpent}</p>
      <p>💀 Players Defeated: {stats.playersDefeated}</p>
    </div>
  );
}

export default GameStatsBanner;
