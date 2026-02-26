import React, { useState, useEffect, useRef } from 'react';

const ESCAPE_HOLD_TIME = 3000; // ms
const TAP_RESET_TIME = 2000;   // ms

export default function EscapeProgressBar({ onEscape }) {
  const [tapCount, setTapCount] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [showBar, setShowBar] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const holdStartRef = useRef(null);
  const tapTimeoutRef = useRef(null);

  // Listen for key events
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.repeat) return; // Ignore auto-repeat

      if (e.key === 'e' || e.key === 'E' || e.key === 'Escape') {
        setShowBar(true);

        // If not yet 3 taps, increment tap count
        if (tapCount < 3) {
          setTapCount((prev) => Math.min(prev + 1, 3));
          // Reset tap timeout
          clearTimeout(tapTimeoutRef.current);
          tapTimeoutRef.current = setTimeout(() => {
            setTapCount(0);
            setShowBar(false);
          }, TAP_RESET_TIME);
        } else {
          // Start holding
          setIsHolding(true);
          holdStartRef.current = Date.now();
        }
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === 'e' || e.key === 'E' || e.key === 'Escape') {
        setIsHolding(false);
        setHoldProgress(0);
        // If not enough taps, show message
        if (tapCount < 3) {
          setShowMessage(true);
          setTimeout(() => setShowMessage(false), 2000);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      clearTimeout(tapTimeoutRef.current);
    };
    // eslint-disable-next-line
  }, [tapCount]);

  // Handle hold progress
  useEffect(() => {
    let raf;
    if (isHolding && tapCount === 3) {
      const update = () => {
        const elapsed = Date.now() - holdStartRef.current;
        setHoldProgress(Math.min(elapsed / ESCAPE_HOLD_TIME, 1));
        if (elapsed >= ESCAPE_HOLD_TIME) {
          setIsHolding(false);
          setHoldProgress(0);
          setTapCount(0);
          setShowBar(false);
          if (onEscape) onEscape();
        } else {
          raf = requestAnimationFrame(update);
        }
      };
      raf = requestAnimationFrame(update);
    } else {
      setHoldProgress(0);
    }
    return () => raf && cancelAnimationFrame(raf);
    // eslint-disable-next-line
  }, [isHolding, tapCount]);

  // Bar opacity logic
  const barOpacity = tapCount === 3 || isHolding ? 1 : 0.5;

  return (
    <>
      {/* On-screen message */}
      {showMessage && (
        <div style={{
          position: 'fixed',
          top: '30%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(24,28,43,0.95)',
          color: '#00ffcc',
          fontWeight: 700,
          fontSize: '1.3rem',
          padding: '1.2em 2.5em',
          borderRadius: '18px',
          boxShadow: '0 0 32px #00ffcc88',
          zIndex: 9999,
          textAlign: 'center',
          textShadow: '0 0 12px #00ffcc, 0 0 24px #00ffcc'
        }}>
          Tap <b>ESC</b> or <b>E</b> three times, then hold to escape!
        </div>
      )}

      {/* Progress bar */}
      {showBar && (
        <div style={{
          position: 'fixed',
          bottom: '8%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 340,
          height: 38,
          background: 'rgba(24,28,43,0.7)',
          borderRadius: 16,
          border: '2px solid #00ffcc88',
          boxShadow: '0 0 16px #00ffcc44',
          opacity: barOpacity,
          transition: 'opacity 0.3s',
          zIndex: 9998,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {/* Tap indicators */}
          <div style={{ display: 'flex', gap: 8, marginRight: 18 }}>
            {[1, 2, 3].map((n) => (
              <div key={n} style={{
                width: 18, height: 18,
                borderRadius: '50%',
                background: tapCount >= n ? '#00ffcc' : '#222b',
                border: '2px solid #00ffcc',
                boxShadow: tapCount >= n ? '0 0 8px #00ffcc' : 'none',
                transition: 'background 0.2s'
              }} />
            ))}
          </div>
          {/* Hold progress bar */}
          <div style={{
            flex: 1,
            height: 12,
            background: '#222b',
            borderRadius: 8,
            overflow: 'hidden',
            marginLeft: 8,
            marginRight: 8,
            border: '1.5px solid #00ffcc55',
            position: 'relative'
          }}>
            <div style={{
              width: `${holdProgress * 100}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #00ffcc 0%, #00bfff 100%)',
              borderRadius: 8,
              boxShadow: holdProgress > 0 ? '0 0 12px #00ffcc' : 'none',
              transition: 'width 0.1s'
            }} />
          </div>
        </div>
      )}
    </>
  );
} 