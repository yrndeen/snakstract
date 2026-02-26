
import { getGameStats } from '../utils/gameStats';

export function handleEscape(gameState) {
  const stats = getGameStats(gameState);
  // Trigger success animation
  document.getElementById('escape-summary').innerHTML = `
    <h3>🚀 Escape Successful!</h3>
    <p><strong>ETH Escaped With:</strong> ${stats.ethEscaped} ETH</p>
    <p><strong>Your Stake:</strong> ${stats.stakeAmount} ETH</p>
    <p><strong>Time Spent:</strong> ${stats.timeSpent} seconds</p>
    <p><strong>Players Defeated:</strong> ${stats.playersDefeated}</p>
  `;
  // Redirect after 6 seconds
  setTimeout(() => {
    window.location.href = '/';
  }, 6000);
}
