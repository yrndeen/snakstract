import React from "react";

export default function SignatureModal({ open, onSign, message, isSigning }) {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        background: '#111', color: '#fff', borderRadius: 16, padding: 40, minWidth: 340, boxShadow: '0 0 32px #00ffe0'
      }}>
        <h2 style={{ marginBottom: 16 }}>Signature Required</h2>
        <p style={{ marginBottom: 24 }}>
          Please sign this message to prove you control your wallet and to continue joining the game.
        </p>
        <pre style={{
          background: '#222', color: '#0ff', padding: 12, borderRadius: 8, fontSize: 14, marginBottom: 24, wordBreak: 'break-all'
        }}>{message}</pre>
        <button
          onClick={onSign}
          disabled={isSigning}
          style={{
            background: '#00ffe0', color: '#111', fontWeight: 700, fontSize: 18, border: 'none', borderRadius: 8, padding: '12px 32px', cursor: 'pointer'
          }}
        >
          {isSigning ? 'Waiting for Signature...' : 'Sign'}
        </button>
      </div>
    </div>
  );
} 