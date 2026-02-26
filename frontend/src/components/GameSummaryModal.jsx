
import React from 'react';

function GameSummaryModal({ visible, stats, onClose }) {
  if (!visible) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h2>🏁 Game Summary</h2>
        <pre>{stats}</pre>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

export default GameSummaryModal;
