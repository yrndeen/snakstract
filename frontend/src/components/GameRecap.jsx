
import React from 'react';

function GameRecap({ escapedETH, stake, duration, playersDefeated }) {
  return (
    <div className="recap-panel">
      <h3>🏁 Escape Recap</h3>
      <p>💰 Escaped with: {escapedETH} ETH</p>
      <p>🎯 Stake: {stake} ETH</p>
      <p>⏱️ Duration: {duration} seconds</p>
      <p>💀 Players Defeated: {playersDefeated}</p>
    </div>
  );
}

export default GameRecap;
