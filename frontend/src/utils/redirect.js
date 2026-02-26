
export function redirectToGameAfterStake(success) {
  if (success) {
    window.location.href = '/game';
  }
}

export function showEscapeSummary(escapeData) {
  const summary = document.createElement('div');
  summary.className = 'escape-summary';

  summary.innerHTML = `
    <h3>🎉 Escape Successful!</h3>
    <p>💰 ETH Escaped: ${escapeData.earnedEth}</p>
    <p>📊 Stake: ${escapeData.stake}</p>
    <p>⏱ Time Spent: ${escapeData.timeSpent}s</p>
    <p>☠️ Players Defeated: ${escapeData.kills}</p>
  `;

  document.body.appendChild(summary);

  setTimeout(() => {
    window.location.href = '/';
  }, 6000);
}
