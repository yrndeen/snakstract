
// src/utils/gameStats.js

export function calculateGameStats(startTime, endTime, defeatedPlayers, stakeAmount) {
  const timeSpent = Math.floor((endTime - startTime) / 1000); // seconds
  return {
    ethEscaped: stakeAmount * 2, // Example: double the stake if successful
    stake: stakeAmount,
    timeSpent,
    playersDefeated: defeatedPlayers,
  };
}
