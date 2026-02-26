import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useClickSound from '../hooks/useClickSound';

const DeathScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [countdown, setCountdown] = useState(40);
  const [showPerished, setShowPerished] = useState(true);
  const playClick = useClickSound();
  const deathSoundRef = useRef(null);
  
  // Get session data from navigation state
  const gameData = location.state || {};
  const { isTestMode, wagerAmount, timeSurvived, orbsEaten, kills, spEarned, originalSP, killedBy, deathType } = gameData;
  
  // Calculate SP display values
  const finalSP = spEarned || 0;
  const originalSPValue = originalSP || finalSP;
  const spDeduction = originalSPValue - finalSP;
  
  // Track if we've already logged debug info to avoid doing it during render
  const debugLoggedRef = useRef(false);
  
  // Move debug logging to useEffect to avoid logging during render
  useEffect(() => {
    if (!debugLoggedRef.current) {
      console.log('DeathScreen - Full gameData:', gameData);
      console.log('DeathScreen - achievements:', gameData.achievements);
      console.log('DeathScreen - achievementSP:', gameData.achievementSP);
      console.log('DeathScreen - achievement count:', gameData.achievements ? Object.values(gameData.achievements).filter(Boolean).length : 0);
      console.log('DeathScreen - achievement keys:', gameData.achievements ? Object.keys(gameData.achievements) : 'none');
      console.log('DeathScreen - achievement values:', gameData.achievements ? Object.values(gameData.achievements) : 'none');
      debugLoggedRef.current = true;
    }
  }, [gameData]);

  // Show 'Perished' animation for 3 seconds
  useEffect(() => {
    setShowPerished(true);
    const timer = setTimeout(() => setShowPerished(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Play death sound when component mounts
  useEffect(() => {
    if (deathSoundRef.current) {
      deathSoundRef.current.currentTime = 0;
      deathSoundRef.current.play().catch(e => console.log('Death sound play failed:', e));
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  // Update all-time achievements in localStorage - same approach as EscapeScreen
  useEffect(() => {
    if (gameData.achievements && typeof gameData.achievements === 'object') {
      let persistent = {};
      try {
        persistent = JSON.parse(localStorage.getItem('achievements')) || {};
      } catch (err) {
        console.error('Error parsing achievements from localStorage:', err);
      }
      
      let changed = false;
      for (const key of Object.keys(gameData.achievements)) {
        if (gameData.achievements[key] && !persistent[key]) {
          persistent[key] = true;
          changed = true;
          console.log(`Adding achievement to persistent storage: ${key}`);
        }
      }
      
      if (changed) {
        try {
          localStorage.setItem('achievements', JSON.stringify(persistent));
          console.log('Updated achievements in localStorage');
        } catch (err) {
          console.error('Error saving achievements to localStorage:', err);
        }
      }
    }
  }, [gameData.achievements]);

  // Calculate achievement count once to avoid recalculations during render
  // Use the same approach as EscapeScreen for consistency
  const achievementCount = (gameData.achievements && typeof gameData.achievements === 'object' && !Array.isArray(gameData.achievements))
    ? Object.values(gameData.achievements).filter(Boolean).length 
    : 0;

  // Calculate quest count once to avoid recalculations during render - only count quests from this session
  const questCount = Array.isArray(gameData.sessionCompletedQuests) ? 
    gameData.sessionCompletedQuests.length : 
    (gameData.sessionCompletedQuests instanceof Set ? gameData.sessionCompletedQuests.size : 
    (typeof gameData.sessionCompletedQuests === 'number' ? gameData.sessionCompletedQuests : 0));

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(135deg, #1a0000, #330000, #1a0000)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Death sound */}
      <audio ref={deathSoundRef} src="/sounds/death.mp3" preload="auto" />
      
      {/* Animated background effects */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'radial-gradient(circle at 50% 50%, rgba(139, 0, 0, 0.3) 0%, transparent 70%)',
        animation: 'pulse 2s ease-in-out infinite alternate'
      }} />
      
      {/* Perished animation overlay */}
      {showPerished && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          pointerEvents: 'none',
          overflow: 'hidden',
        }}>
          {/* Red gradient overlay for extra drama */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'radial-gradient(circle at 50% 60%, rgba(255,0,0,0.18) 0%, rgba(0,0,0,0.0) 80%)',
            zIndex: 1,
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'relative',
            zIndex: 2,
            background: 'rgba(40,40,40,0.55)',
            borderRadius: '40px',
            padding: '3.5rem 7rem',
            boxShadow: '0 0 64px 16px rgba(255,0,0,0.22), 0 0 0 2px rgba(255,255,255,0.08) inset',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(12px) saturate(1.2)',
            animation: 'fadePerished 3s cubic-bezier(0.4,0,0.2,1), shakePerished 0.7s cubic-bezier(0.36,0.07,0.19,0.97) 2',
          }}>
            <span style={{
              color: '#1a0000',
              fontSize: '5.5rem',
              fontWeight: 900,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              textShadow: '0 0 48px #ff2222, 0 0 96px #ff2222, 0 0 16px #ff2222, 0 2px 0 #fff',
              filter: 'drop-shadow(0 0 32px #ff2222) drop-shadow(0 0 8px #ff2222)',
              fontFamily: 'Orbitron, Arial Black, Arial, sans-serif',
              userSelect: 'none',
              opacity: 0.97,
              transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
            }}>
              PERISHED
            </span>
          </div>
          <style>{`
            @keyframes fadePerished {
              0% { opacity: 1; transform: scale(1.18); }
              60% { opacity: 1; transform: scale(1); }
              100% { opacity: 0; transform: scale(0.98); }
            }
            @keyframes shakePerished {
              0% { transform: translateX(0); }
              10% { transform: translateX(-8px); }
              20% { transform: translateX(8px); }
              30% { transform: translateX(-6px); }
              40% { transform: translateX(6px); }
              50% { transform: translateX(-4px); }
              60% { transform: translateX(4px); }
              70% { transform: translateX(-2px); }
              80% { transform: translateX(2px); }
              90% { transform: translateX(-1px); }
              100% { transform: translateX(0); }
            }
          `}</style>
        </div>
      )}

      {/* Main content */}
      {!showPerished && (
        <div
          style={{
            background: 'rgba(139, 0, 0, 0.2)',
            border: '2px solid #8b0000',
            borderRadius: '20px',
            padding: '40px',
            textAlign: 'center',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 0 30px rgba(139, 0, 0, 0.5)',
            maxWidth: '500px',
            width: '90%',
            opacity: 0,
            animation: 'fadeInStats 0.9s cubic-bezier(0.4,0,0.2,1) 0.01s forwards',
          }}
        >
          {/* Death icon */}
          <div style={{
            fontSize: '80px',
            marginBottom: '20px',
            animation: 'shake 0.5s ease-in-out infinite'
          }}>
            💀
          </div>

          {/* Pulsing icon22.png */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <img 
              src="/icon22.png" 
              alt="Snakstract Icon" 
              style={{
                height: '120px',
                opacity: '0.3',
                filter: 'drop-shadow(0 0 20px rgba(255, 68, 68, 0.8))',
                animation: 'pulseGlow 2s ease-in-out infinite alternate'
              }}
            />
          </div>

          {/* Death title */}
          <h1 style={{
            color: '#ff4444',
            fontSize: '48px',
            margin: '0 0 20px 0',
            textShadow: '0 0 20px rgba(255, 68, 68, 0.8)',
            fontWeight: 'bold'
          }}>
            YOU DIED
          </h1>

          {/* Death details */}
          <div style={{
            background: 'rgba(139, 0, 0, 0.3)',
            border: '1px solid #8b0000',
            borderRadius: '10px',
            padding: '20px',
            margin: '20px 0',
            color: '#ffcccc'
          }}>
            <p style={{ margin: '10px 0', fontSize: '18px' }}>
              <strong>Cause of Death:</strong> {deathType === 'player' && killedBy ? `Killed by ${killedBy}` : 'Boundary Collision'}
            </p>
            <p style={{ margin: '10px 0', fontSize: '18px' }}>
              <strong>Wager Lost:</strong> {isTestMode ? "0" : (wagerAmount ?? 0)} ETH
            </p>
            <p style={{ margin: '10px 0', fontSize: '18px' }}>
              <strong>Time Survived:</strong> {timeSurvived ?? 0}s
            </p>
            <p style={{ margin: '10px 0', fontSize: '18px' }}>
              <strong>Orbs Eaten:</strong> {orbsEaten ?? 0}
            </p>
            <p style={{ margin: '10px 0', fontSize: '18px' }}>
              <strong>Players Defeated:</strong> {kills ?? 0}
            </p>
            <p style={{ margin: '10px 0', fontSize: '18px' }}>
              <strong>🎯 Quests:</strong> {questCount}
            </p>
            <p style={{ margin: '10px 0', fontSize: '18px' }}>
              <strong>🎖️ Achievements:</strong> {achievementCount}
            </p>
            <p style={{ margin: '10px 0', fontSize: '18px' }}>
              <strong>SP Earned:</strong> {originalSPValue} -{spDeduction} = <span style={{ 
                fontWeight: 'bold', 
                color: '#ff6666', 
                fontSize: '28px',
                textShadow: '1px 1px 0px #000000, -1px -1px 0px #000000, 1px -1px 0px #000000, -1px 1px 0px #000000',
                WebkitTextStroke: '0.5px #ff0000',
                verticalAlign: 'top',
                position: 'relative',
                top: '-1px'
              }}>{finalSP}</span>
            </p>
          </div>

          {/* Countdown */}
          <div style={{
            color: '#ff6666',
            fontSize: '20px',
            margin: '20px 0',
            fontWeight: 'bold'
          }}>
            Better luck next time!!!
          </div>

          {/* Centered Play Again Button */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: '30px'
          }}>
            <button
              onClick={() => { playClick(); navigate('/'); }}
              style={{
                padding: '1.2rem 2.5rem',
                background: '#ff4444',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 0 12px #ff4444',
                transition: 'all 0.2s ease',
                margin: '0 auto'
              }}
              onMouseEnter={e => e.target.style.background = '#ff2222'}
              onMouseLeave={e => e.target.style.background = '#ff4444'}
            >
              Play Again
            </button>
          </div>
        </div>
      )}
      <style>{`
        @keyframes fadeInStats {
          0% { opacity: 0; transform: translateY(32px) scale(0.98); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      {/* CSS Animations */}
      <style>{`
        @keyframes pulse {
          0% { opacity: 0.5; }
          100% { opacity: 1; }
        }
        
        @keyframes pulseGlow {
          0% { 
            opacity: 0.2; 
            filter: drop-shadow(0 0 15px rgba(255, 68, 68, 0.6));
            transform: scale(0.95);
          }
          100% { 
            opacity: 0.4; 
            filter: drop-shadow(0 0 25px rgba(255, 68, 68, 1));
            transform: scale(1.05);
          }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
      `}</style>
    </div>
  );
};

export default DeathScreen; 