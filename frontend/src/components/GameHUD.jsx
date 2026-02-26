import React from 'react';

function GameHUD({ ethCollected, kills, timeElapsed, killRewardActive, killRewardStartTime, killRewardDuration }) {
  // Calculate remaining kill reward time
  const getKillRewardTimeRemaining = () => {
    if (!killRewardActive || !killRewardStartTime || !killRewardDuration) return null;
    const timeSinceKill = Date.now() - killRewardStartTime;
    const timeRemaining = Math.max(0, killRewardDuration - timeSinceKill);
    return Math.ceil(timeRemaining / 1000); // Convert to seconds
  };

  const killRewardTimeRemaining = getKillRewardTimeRemaining();

  return (
    <div className="game-hud">
      <div>⏱ Time: {timeElapsed}s</div>
      <div>⚔️ Kills: {kills}</div>
      <div>💰 ETH Collected: {ethCollected}</div>
      {killRewardTimeRemaining !== null && killRewardTimeRemaining > 0 && (
        <div className="kill-reward-indicator" style={{
          color: '#00ff00',
          fontWeight: 'bold',
          textShadow: '0 0 10px #00ff00',
          animation: 'pulse 1s infinite'
        }}>
          🎯 Kill Reward: {killRewardTimeRemaining}s (2.4x Orb Pickup Radius)
        </div>
      )}
    </div>
  );
}

export default GameHUD;
