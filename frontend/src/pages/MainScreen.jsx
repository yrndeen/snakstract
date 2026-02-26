// Updated MainScreen without canvas background
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EscapeSummary from '../components/EscapeSummary';
import useClickSound from '../hooks/useClickSound';
import { useAccount } from 'wagmi';

const PRESET_WAGERS = [0.01, 0.05, 0.1];

function MainScreen() {
  const navigate = useNavigate();
  const [selectedWager, setSelectedWager] = useState(PRESET_WAGERS[0]);
  const [customWager, setCustomWager] = useState('');
  const [showEscapeSummary, setShowEscapeSummary] = useState(false);
  const [escapeData, setEscapeData] = useState(null);
  const playClick = useClickSound();
  const [peepGlow, setPeepGlow] = useState(false);
  const [peepHover, setPeepHover] = useState(false);
  const { address } = useAccount();

  const handleWagerSelect = (wager) => {
    setSelectedWager(wager);
    setCustomWager('');
  };

  const handleCustomWagerChange = (e) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
      setCustomWager(value);
      setSelectedWager(null);
    }
  };

  const handlePlayClick = () => {
    const wagerAmount = customWager || selectedWager;
    const isTestMode = customWager === '00000' || customWager === '11111';
    const testModeType = customWager === '00000' ? 'test123' : customWager === '11111' ? 'test321' : null;
    if (!isTestMode && (Number(wagerAmount) < 0.001 || Number(wagerAmount) > 6.9)) {
      alert('Wager must be between 0.001 and 6.9 ETH');
      return;
    }
    playClick();
    if (isTestMode) {
      navigate('/game', {
        state: {
          wagerAmount: isTestMode ? 0 : parseFloat(wagerAmount),
          isTestMode: isTestMode,
          testModeType: testModeType
        }
      });
    } else {
      // This part of the logic is now handled by the game itself or a different flow
      // For now, we'll just navigate to the game with the wager amount
      navigate('/game', {
        state: {
          wagerAmount: customWager || selectedWager
        }
      });
    }
  };

  const handleBridgeClick = () => {
    window.open('https://relay.link', '_blank');
  };

  return (
    <div className="main-screen" style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* Animated background effect */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        background: 'radial-gradient(ellipse at 60% 40%, #00ffcc33 0%, #181c2b 80%)',
        filter: 'blur(0px)',
        animation: 'pulse 8s infinite alternate',
      }} />
      <div className="main-content" style={{ zIndex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '90vh' }}>
        <div style={{
          background: 'rgba(24, 28, 43, 0.85)',
          borderRadius: '24px',
          boxShadow: '0 8px 32px 0 #00ffcc22',
          padding: '4rem 4rem',
          maxWidth: 800,
          width: '100%',
          border: '1.5px solid #00ffcc33',
          backdropFilter: 'blur(8px)',
          position: 'relative',
        }}>
          <h1 style={{
            color: '#00ffcc',
            fontSize: '2.7rem',
            fontWeight: 800,
            textAlign: 'center',
            marginBottom: '0.5rem',
            letterSpacing: '0.04em',
            textShadow: '0 0 18px #00ffcc88',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.25rem'
          }}>
            <img src="/snake_logo_icon.png" alt="Snakstract Logo" style={{ height: '3rem', maskImage: 'radial-gradient(circle, rgba(0,0,0,1) 20%, rgba(0,0,0,0) 100%)' }} />
            <span>Snakstract</span>
          </h1>
          <p style={{
            color: '#e0e0e0',
            fontSize: '1.15rem',
            textAlign: 'center',
            marginBottom: '1.5rem',
            textShadow: '0 0 8px #00ffcc22',
          }}>
            Dive into Snakstract, the cutting-edge L2 wager snake game. Stake your ETH, slither through challenges, and survive to win big on the Abstract network!
          </p>
          <p className="tagline">STAKE. SLITHER. SURVIVE.</p>
          <div className="game-options" style={{ 
            marginBottom: '2.5rem',
            background: `radial-gradient(circle at 50% 50%, rgba(24,28,43,0.85) 55%, rgba(24,28,43,1) 100%), url('/main_screen_bg.png') 40% 70% / cover no-repeat`,
            padding: '2rem',
            borderRadius: '16px',
            border: '1px solid #00ffcc22',
            position: 'relative',
            zIndex: 1
          }}>
            <h2 style={{
              color: '#00ffcc',
              fontSize: '1.3rem',
              fontWeight: 700,
              marginBottom: '1.2rem',
              textAlign: 'center',
              letterSpacing: '0.04em',
              textShadow: '0 0 8px #00ffcc88',
            }}>
              Select Wager Amount (ETH)
            </h2>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '1.2rem', flexWrap: 'wrap' }}>
              {PRESET_WAGERS.map((wager) => (
                <button
                  key={wager}
                  className={`wager-button${selectedWager === wager && !customWager ? ' selected' : ''}`}
                  style={{
                    background: selectedWager === wager && !customWager ? '#00ffcc' : '#181c2b',
                    color: selectedWager === wager && !customWager ? '#181c2b' : '#00ffcc',
                    border: '2px solid #00ffcc',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    padding: '0.7rem 1.7rem',
                    cursor: 'pointer',
                    boxShadow: selectedWager === wager && !customWager ? '0 0 12px #00ffcc88' : 'none',
                    transition: 'all 0.2s',
                    width: 120,
                  }}
                  onClick={() => { playClick(); handleWagerSelect(wager); }}
                >
                  {wager} ETH
                </button>
              ))}
              <input
                type="text"
                value={customWager}
                onChange={handleCustomWagerChange}
                placeholder=".001 min"
                style={{
                  background: '#181c2b',
                  border: '2px solid #00ffcc',
                  color: '#00ffcc',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  padding: '0.7rem 1.7rem',
                  width: 120,
                  outline: 'none',
                  boxShadow: customWager ? '0 0 16px 2px #00ffcc88, 0 0 32px 4px #00ffcc44' : '0 0 8px #00ffcc22',
                  transition: 'all 0.2s',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '1.2rem', justifyContent: 'center', marginTop: '1.5rem' }}>
              <button
                className="bridge-button"
                style={{
                  background: 'linear-gradient(90deg, #00ffcc 0%, #00cc99 100%)',
                  color: '#181c2b',
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.7rem 2.2rem',
                  cursor: 'pointer',
                  boxShadow: '0 0 12px #00ffcc88',
                  transition: 'all 0.2s',
                }}
                onClick={() => { playClick(); handleBridgeClick(); }}
              >
                Bridge ETH
              </button>
              <button
                className="play-button"
                style={{
                  background: 'linear-gradient(90deg, #00ffcc 0%, #00cc99 100%)',
                  color: '#181c2b',
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.7rem 2.2rem',
                  cursor: 'pointer',
                  boxShadow: '0 0 18px #00ffcc88',
                  transition: 'all 0.2s',
                  animation: 'glow 2s infinite',
                }}
                onClick={() => { playClick(); handlePlayClick(); }}
              >
                Play Now
              </button>
            </div>
          </div>
          {/* Upside-down peep.png, interactive with glow and animation */}
          <div style={{
            position: 'absolute',
            left: '50%',
            top: 'calc(100% - 10.2em)',
            transform: 'translateX(-50%) rotate(180deg)',
            width: '140px',
            height: '140px',
            zIndex: 0,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onMouseEnter={() => setPeepHover(true)}
          onMouseLeave={() => setPeepHover(false)}
          onClick={() => {
            setPeepGlow(true);
            setTimeout(() => setPeepGlow(false), 4400);
          }}
          >
            {/* Glow effect layers */}
            <div style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              background: peepGlow ? 'radial-gradient(circle, rgba(0,255,0,0.3) 0%, rgba(0,255,0,0.1) 50%, transparent 70%)' : 'none',
              animation: peepGlow ? 'peepGlowPulse 0.4s ease-in-out infinite alternate' : 'none',
              zIndex: -1,
            }} />
            <img 
              src="/peep.png" 
              alt="Peep" 
              style={{
                width: '100%',
                height: '100%',
                opacity: 0.8,
                filter: peepHover ? 'drop-shadow(0 0 30px #00ff00) drop-shadow(0 0 60px #00ff00) drop-shadow(0 0 90px #00ff00)' : 'drop-shadow(0 0 10px #00ffcc99) drop-shadow(0 0 20px #00ffcc66)',
                transition: 'filter 0.2s, opacity 0.2s',
                animation: peepGlow ? 'peepColorCycle 4.4s linear 1' : 'none',
              }}
            />
          </div>
          <style>{`
            @keyframes peepColorCycle {
              0% { filter: drop-shadow(0 0 25px #00ff00) drop-shadow(0 0 50px #00ff00) drop-shadow(0 0 75px #00ff00); }
              12.5% { filter: drop-shadow(0 0 30px #00ffff) drop-shadow(0 0 60px #00ffff) drop-shadow(0 0 90px #00ffff); }
              25% { filter: drop-shadow(0 0 35px #0080ff) drop-shadow(0 0 70px #0080ff) drop-shadow(0 0 105px #0080ff); }
              37.5% { filter: drop-shadow(0 0 40px #8000ff) drop-shadow(0 0 80px #8000ff) drop-shadow(0 0 120px #8000ff); }
              50% { filter: drop-shadow(0 0 45px #ff0080) drop-shadow(0 0 90px #ff0080) drop-shadow(0 0 135px #ff0080); }
              62.5% { filter: drop-shadow(0 0 50px #ff8000) drop-shadow(0 0 100px #ff8000) drop-shadow(0 0 150px #ff8000); }
              75% { filter: drop-shadow(0 0 55px #000000) drop-shadow(0 0 110px #000000) drop-shadow(0 0 165px #000000); }
              87.5% { filter: drop-shadow(0 0 60px #00ffcc) drop-shadow(0 0 120px #00ffcc) drop-shadow(0 0 180px #00ffcc); }
              100% { filter: drop-shadow(0 0 25px #00ff00) drop-shadow(0 0 50px #00ff00) drop-shadow(0 0 75px #00ff00); }
            }
            
            @keyframes peepGlowPulse {
              0% { 
                transform: scale(1);
                opacity: 0.4;
              }
              100% { 
                transform: scale(1.3);
                opacity: 0.8;
              }
            }
          `}</style>
        </div>
      </div>
      {showEscapeSummary && escapeData && (
        <EscapeSummary
          data={escapeData}
          onClose={() => setShowEscapeSummary(false)}
        />
      )}
    </div>
  );
}

export default MainScreen;
