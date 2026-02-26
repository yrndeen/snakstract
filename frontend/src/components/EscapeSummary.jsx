import React from 'react';
import './EscapeSummary.css';

function EscapeSummary({ stake, ethEarned, timeSurvived, playersDefeated, spEarned }) {
  return (
    <div className="escape-summary-card">
      <h3>🚀 Escape Summary</h3>
      <p><strong>💰 ETH Escaped:</strong> {ethEarned} ETH</p>
      <p><strong>🎯 Stake:</strong> {stake} ETH</p>
      <p><strong>⏱ Time Survived:</strong> {timeSurvived}s</p>
      <p><strong>💀 Players Defeated:</strong> {playersDefeated}</p>
      {spEarned !== undefined && (
        <p><strong>🐍 SP Earned:</strong> {spEarned} SP</p>
      )}
    </div>
  );
}

export default EscapeSummary;
