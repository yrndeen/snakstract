import React, { useState, useEffect } from 'react';

export default function LoadingScreen() {
  const [loadingText, setLoadingText] = useState('Loading SNAKSTRACT');
  const [taglineText, setTaglineText] = useState('.... STAKE. SLITHER. SURVIVE. ....');

  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingText(prev => {
        if (prev === 'Loading SNAKSTRACT') return 'Loading SNAKSTRACT.';
        if (prev === 'Loading SNAKSTRACT.') return 'Loading SNAKSTRACT..';
        if (prev === 'Loading SNAKSTRACT..') return 'Loading SNAKSTRACT...';
        return 'Loading SNAKSTRACT';
      });
      
      setTaglineText(prev => {
        if (prev === 'STAKE. SLITHER. SURVIVE.') return '..STAKE. SLITHER. SURVIVE..';
        if (prev === '..STAKE. SLITHER. SURVIVE..') return '...STAKE. SLITHER. SURVIVE....';
        if (prev === '...STAKE. SLITHER. SURVIVE...') return '....STAKE. SLITHER. SURVIVE....';
        return 'STAKE. SLITHER. SURVIVE.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="page-container" style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #181c2b 0%, #0f1419 100%)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
      fontFamily: 'Orbitron, monospace',
      color: '#00ffcc'
    }}>
      {/* Loading text in top left */}
      <div style={{
        position: 'absolute',
        top: '2rem',
        left: '2rem',
        fontSize: '1.5rem',
        fontWeight: 'bold',
        textShadow: '0 0 10px #00ffcc',
        color: '#00ffcc'
      }}>
        {loadingText}
      </div>

      {/* Tagline in bottom right */}
      <div style={{
        position: 'absolute',
        bottom: '2rem',
        right: '2rem',
        fontSize: '1.2rem',
        fontWeight: 'bold',
        textShadow: '0 0 10px #c07eff',
        color: '#c07eff'
      }}>
        {taglineText}
      </div>
    </div>
  );
}
