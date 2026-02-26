// src/components/EscapeResult.jsx
import React from 'react';

function EscapeResult({ summary }) {
  if (!summary) return null;

  return (
    <div className="escape-summary-card">
      <h2>{summary.message}</h2>
      <ul>
        <li>💰 ETH Escaped: {summary.ethEscaped}</li>
        <li>📦 Stake: {summary.stake}</li>
        <li>⏱️ Time Spent: {summary.timeSpent}</li>
        <li>⚔️ Players Defeated: {summary.playersDefeated}</li>
      </ul>
    </div>
  );
}

export default EscapeResult;