import React, { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import useClickSound from '../hooks/useClickSound';
import { useNetwork } from '../App';
import QuestTracker from '../utils/questTracker';

function Leaderboard() {
  const [players, setPlayers] = useState([]);
  const { address: connectedAddress, isConnected } = useAccount();
  const playClick = useClickSound();
  const { networkConfig } = useNetwork();

  useEffect(() => {
    const fetchLeaderboard = () => {
      fetch('http://10.0.0.248:2567/leaderboard')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            setPlayers(data);
          } else if (data && typeof data.players === 'object') {
            setPlayers(Object.values(data.players));
          } else {
            setPlayers([]);
          }
        })
        .catch(() => setPlayers([]));
    };
    
    // Fetch immediately
    fetchLeaderboard();
    
    // Listen for SP updates from quest claims
    const handleSPUpdate = (event) => {
      fetchLeaderboard(); // Refresh immediately
    };
    
    window.addEventListener('spUpdated', handleSPUpdate);
    
    return () => {
      window.removeEventListener('spUpdated', handleSPUpdate);
    };
  }, []);

  // Helper to get address from player object
  const getAddress = (player) => player.address || player.wallet || '';

  // Deduplicate players by address (wallet)
  const dedupedPlayers = Object.values(
    players.reduce((acc, player) => {
      const addr = getAddress(player).toLowerCase();
      if (!acc[addr]) acc[addr] = player;
      return acc;
    }, {})
  );

  // Calculate win rate for each player
  const playersArray = Object.values(dedupedPlayers);
  playersArray.forEach(player => {
    player.winRate = player.gamesPlayed > 0 ? Math.round((player.winCount / player.gamesPlayed) * 100) : 0;
  });

  // Sum up all SP points for each wallet
  const totalSP = playersArray.reduce((total, player) => total + (player.SP || 0), 0);

  // Find the connected wallet's stats
  const userSP = playersArray.find(p => getAddress(p).toLowerCase() === (connectedAddress || '').toLowerCase())?.SP || 0;

  const questTracker = QuestTracker.getInstance();
  const getCompletedQuestCount = (address) => {
    if (!address) return 0;
    const completed = questTracker.completedQuests[address?.toLowerCase?.() || address] || {};
    return Object.keys(completed).length;
  };

  return (
    <div className="page-container" style={{ minHeight: '100vh', background: 'rgba(24,28,43,0.82)', fontFamily: 'Orbiton, sans-serif' }}>
      {/* Animated background */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'radial-gradient(circle at 20% 80%, rgba(0,255,204,0.08) 0%, transparent 60%), radial-gradient(circle at 80% 20%, rgba(108,92,231,0.08) 0%, transparent 60%)', zIndex: 0 }} />
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', minHeight: '100vh', padding: '3rem 0' }}>
        <div style={{ maxWidth: 1100, width: '100%', background: 'rgba(24,28,43,0.08)', borderRadius: '32px', border: '1.5px solid rgba(0,255,204,0.04)', boxShadow: '0 12px 48px 0 rgba(0,255,204,0.01), 0 1.5px 8px 0 rgba(0,0,0,0.01)', backdropFilter: 'blur(4px)', padding: '0 0 4rem 0', position: 'relative', zIndex: 1 }}>
          <div style={{ padding: '2.5rem 3.5rem 1.5rem 3.5rem', borderBottom: '1px solid rgba(0,255,204,0.10)', textAlign: 'center', background: 'rgba(0,255,204,0.04)' }}>
            <h1 style={{ color: '#00ffe0', fontSize: '2.2rem', fontWeight: 800, margin: 0, letterSpacing: '-1px', textShadow: '0 2px 16px #00ffe044, 0 0 1px #00ffe0', fontFamily: 'Orbitron, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <img src="/trophy.png" alt="Trophy" style={{ height: '2em', verticalAlign: 'middle', display: 'inline-block', marginRight: '0.18em', filter: 'drop-shadow(0 0 7px #00ffe0) drop-shadow(0 0 14px #00ffe088)' }} />
              Leaderboard
            </h1>
          </div>
          <div style={{ padding: '2.5rem 3.5rem 0 3.5rem' }}>
      <style>{`
              .rank-badge {
                display: inline-block;
                min-width: 1em;
                padding: 0.04em 0.22em;
                font-size: 0.74em;
                font-weight: 900;
                border-radius: 0.38em;
                margin-right: 0.10em;
                text-align: center;
                box-shadow: 0 2px 12px 0 rgba(0,0,0,0.10), 0 1.5px 8px 0 rgba(0,0,0,0.08), 0 0 0 2px rgba(255,255,255,0.08) inset;
                border: 1.2px solid rgba(255,255,255,0.22);
                letter-spacing: 0.08em;
                font-family: 'Orbitron', sans-serif;
                transition: all 0.2s;
                backdrop-filter: blur(8px) saturate(1.2);
                background: linear-gradient(120deg, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0.07) 100%);
                position: relative;
                overflow: hidden;
                color: #181c2a;
              }
              .rank-badge:before {
                content: '';
                position: absolute;
                inset: 0;
                border-radius: inherit;
                pointer-events: none;
                background: radial-gradient(circle at 60% 30%, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.04) 80%);
                z-index: 1;
              }
              .rank-badge.gold {
                background: linear-gradient(135deg, rgba(255,224,102,0.38) 0%, rgba(255,215,0,0.22) 100%), linear-gradient(120deg, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0.07) 100%);
                color: #4d3900;
                border: 1.2px solid #ffe066;
                text-shadow: 0 0 8px #ffe06699, 0 1px 0 #fff;
              }
              .rank-badge.silver {
                background: linear-gradient(135deg, rgba(224,224,224,0.38) 0%, rgba(189,189,189,0.22) 100%), linear-gradient(120deg, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0.07) 100%);
                color: #222;
                border: 1.2px solid #e0e0e0;
                text-shadow: 0 0 8px #e0e0e099, 0 1px 0 #fff;
              }
              .rank-badge.bronze {
                background: linear-gradient(135deg, rgba(230,185,128,0.38) 0%, rgba(201,123,54,0.22) 100%), linear-gradient(120deg, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0.07) 100%);
                color: #3a2200;
                border: 1.2px solid #e6b980;
                text-shadow: 0 0 8px #e6b98099, 0 1px 0 #fff;
              }
              .rank-badge.regular {
                background: linear-gradient(135deg, rgba(35,41,70,0.38) 0%, rgba(57,62,92,0.22) 100%), linear-gradient(120deg, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0.07) 100%);
                color: #7fd6c7;
                border: 1.2px solid #232946;
                text-shadow: 0 0 8px #00ffe055, 0 1px 0 #fff;
        }
      `}</style>
          {/* Connected wallet's stats table - now at the top */}
          {isConnected && connectedAddress && (
              <div className="leaderboard-container" style={{ marginBottom: '3rem' }}>
                <h3 style={{ 
                  color: '#a259ff', 
                  textAlign: 'center', 
                  marginBottom: '1.5rem', 
                  textShadow: '0 0 12px rgba(162, 89, 255, 0.5), 0 0 24px rgba(162, 89, 255, 0.3)',
                  fontSize: '1.8rem',
                  fontWeight: 'bold',
                  fontFamily: "'Orbitron', sans-serif",
                  letterSpacing: '0.05em'
                }}>
                Your Stats
              </h3>
                <div className="leaderboard-table-container" style={{ 
                  width: '100%',
                  overflowX: 'hidden',
                  padding: '0'
                }}>
                  <table className="leaderboard-table" style={{
                    width: '100%',
                    tableLayout: 'fixed'
                  }}>
                  <thead>
                    <tr>
                        <th style={{ width: '12%', fontSize: '0.75rem', fontFamily: "'Orbitron', sans-serif", fontWeight: '600' }}>Rank</th>
                        <th style={{ width: '20%', fontSize: '0.75rem', fontFamily: "'Orbitron', sans-serif", fontWeight: '600' }}>Player</th>
                        <th style={{ width: '12%', fontSize: '0.75rem', fontFamily: "'Orbitron', sans-serif", fontWeight: '600' }}>Profit</th>
                        <th style={{ width: '14%', fontSize: '0.75rem', fontFamily: "'Orbitron', sans-serif", fontWeight: '600' }}>Games Played</th>
                        <th style={{ width: '11%', fontSize: '0.75rem', fontFamily: "'Orbitron', sans-serif", fontWeight: '600' }}>Win Rate</th>
                        <th style={{ width: '11%', fontSize: '0.75rem', fontFamily: "'Orbitron', sans-serif", fontWeight: '600' }}>Kills</th>
                        <th style={{ width: '8%', fontSize: '0.75rem', fontFamily: "'Orbitron', sans-serif", fontWeight: '600' }}>🎖️</th>
                        <th style={{ width: '8%', fontSize: '0.75rem', fontFamily: "'Orbitron', sans-serif", fontWeight: '600' }}>Quests</th>
                        <th style={{ width: '12%', fontSize: '0.75rem', fontFamily: "'Orbitron', sans-serif", fontWeight: '600' }}>SP Points</th>
                    </tr>
                  </thead>
                  <tbody>
                      {playersArray.filter(p => getAddress(p).toLowerCase() === (connectedAddress || '').toLowerCase()).map((player, index) => {
                        const rank = playersArray.findIndex(p => getAddress(p).toLowerCase() === (connectedAddress || '').toLowerCase()) + 1;
                      return (
                          <tr key={getAddress(player)} style={{ 
                            background: 'linear-gradient(135deg, rgba(162,89,255,0.1) 0%, rgba(162,89,255,0.15) 100%)',
                            border: '1px solid rgba(162, 89, 255, 0.2)'
                          }}>
                            <td>
                              <span className={`rank-badge ${rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : 'regular'}`}>
                                #{rank}
                              </span>
                            </td>
                            <td>
                              <a
                                href={`${networkConfig.config.EXPLORER.replace('docs.abs.xyz', 'docs[dot]abs[dot]xyz')}/address/${getAddress(player)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ 
                                  color: '#00ffcc', 
                                  textDecoration: 'none',
                                  fontFamily: "'Orbitron', sans-serif",
                                  fontWeight: '600',
                                  textShadow: '0 0 8px rgba(0, 255, 204, 0.5)',
                                  transition: 'all 0.3s ease',
                                  fontSize: '0.65rem',
                                  background: 'linear-gradient(135deg, rgba(0,255,204,0.1) 0%, rgba(0,255,204,0.2) 100%)',
                                  borderRadius: '6px',
                                  boxShadow: '0 0 12px rgba(0, 255, 204, 0.3)',
                                  padding: '0.2rem 0.6rem',
                                  display: 'inline-block',
                                  border: '1px solid rgba(0, 255, 204, 0.3)'
                                }}
                                title={getAddress(player)}
                                onMouseEnter={(e) => {
                                  e.target.style.textShadow = '0 0 12px rgba(0, 255, 204, 0.8)';
                                  e.target.style.transform = 'scale(1.05)';
                                  e.target.style.boxShadow = '0 0 20px rgba(0, 255, 204, 0.5)';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.textShadow = '0 0 8px rgba(0, 255, 204, 0.5)';
                                  e.target.style.transform = 'scale(1)';
                                  e.target.style.boxShadow = '0 0 12px rgba(0, 255, 204, 0.3)';
                                }}
                              >
                                {getAddress(player).slice(0, 6)}...{getAddress(player).slice(-4)}
                              </a>
                            </td>
                            <td style={{ 
                              fontFamily: "'Orbitron', sans-serif", 
                              fontWeight: '600', 
                              color: player.ethEarned > 0 ? '#00ff88' : '#ff4444', 
                              fontSize: '0.75rem' 
                            }}>
                              {player.ethEarned > 0 ? `${player.ethEarned.toFixed(3)}+ ETH` : '0.000 ETH'}
                            </td>
                            <td style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: '600', fontSize: '0.75rem' }}>{player.gamesPlayed}</td>
                            <td style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: '600', fontSize: '0.75rem' }}>{player.winRate}%</td>
                            <td style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: '600', fontSize: '0.75rem', color: '#000000', textShadow: '0 0 8px rgba(255, 0, 0, 0.8)' }}>
                              {player.kills !== undefined ? player.kills : '0'}
                            </td>
                            <td style={{ textAlign: 'center', fontFamily: "'Orbitron', sans-serif", fontWeight: '600', fontSize: '0.75rem' }}>
                              {typeof player.achievements === 'number' ? player.achievements : 0}
                            </td>
                            <td style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: '600', color: '#ffe066', fontSize: '0.75rem' }}>
                              {typeof player.questsCompleted === 'number' ? player.questsCompleted : 0}
                            </td>
                            <td style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: '600', color: '#a259ff', fontSize: '0.75rem' }}>
                              {player.SP !== undefined ? `${player.SP} SP` : '0 SP'}
                            </td>
                        </tr>
                      );
                    })}
                      {playersArray.filter(p => getAddress(p).toLowerCase() === (connectedAddress || '').toLowerCase()).length === 0 && (
                        <tr>
                          <td colSpan="8" style={{ 
                            textAlign: 'center', 
                            color: '#888',
                            fontFamily: "'Orbitron', sans-serif",
                            fontSize: '0.75rem',
                            padding: '2rem'
                          }}>
                            No stats found for your wallet.
                          </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
                <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                  <span style={{
                    color: '#00fff7',
                    fontWeight: 700,
                    textShadow: '0 0 20px #00fff7, 0 0 40px #00fff7, 0 0 60px #00fff7',
                    fontSize: '1.8rem',
                    letterSpacing: '0.05em',
                    padding: '0.3em 1em',
                    borderRadius: '1.2em',
                    background: 'linear-gradient(135deg, rgba(0,255,247,0.1) 0%, rgba(0,255,247,0.2) 100%)',
                    boxShadow: '0 0 30px rgba(0, 255, 247, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                    display: 'inline-block',
                    fontFamily: "'Orbitron', sans-serif",
                    border: '1px solid rgba(0, 255, 247, 0.3)',
                    className: 'pulse-animation'
                  }}>
                    Global SP {totalSP}
                  </span>
                </div>
            </div>
          )}
            
          <div className="leaderboard-container">
              <h3 style={{ 
                color: '#00ff88', 
                textAlign: 'center', 
                marginBottom: '0.7rem', 
                marginTop: '0', 
                textShadow: '0 0 12px rgba(0, 255, 136, 0.5), 0 0 24px rgba(0, 255, 136, 0.3)', 
                fontWeight: 700, 
                fontSize: '1.8rem', 
                letterSpacing: '0.05em',
                fontFamily: "'Orbitron', sans-serif"
              }}>
              Public Stats
            </h3>
              {/* Table section with background image and custom scrollbars */}
              <div className="leaderboard-table-bg" style={{ position: 'relative', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.10)', marginTop: '0' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, backgroundImage: "url('/main_screen_bg.png')", backgroundRepeat: 'no-repeat', backgroundPosition: 'center', backgroundSize: 'cover', opacity: 0.18 }} />
                <div className="leaderboard-scroll" style={{ position: 'relative', zIndex: 1, maxHeight: '420px', overflowY: 'auto', overflowX: 'auto', borderRadius: '24px' }}>
                  <style>{`
                    .leaderboard-scroll::-webkit-scrollbar {
                      width: 8px;
                      height: 8px;
                    }
                    .leaderboard-scroll::-webkit-scrollbar-thumb {
                      background: linear-gradient(180deg, #00ffcc 0%, #a259ff 100%);
                      border-radius: 4px;
                      border: 1px solid rgba(0,255,204,0.15);
                    }
                    .leaderboard-scroll::-webkit-scrollbar-track {
                      background: rgba(24,28,43,0.18);
                      border-radius: 4px;
                    }
                  `}</style>
                  <table className="leaderboard-table" style={{ width: '100%', tableLayout: 'fixed', background: 'rgba(24,28,43,0.72)' }}>
                <thead>
                  <tr>
                        <th style={{ width: '12%', fontSize: '0.75rem', fontFamily: "'Orbitron', sans-serif", fontWeight: '600' }}>Rank</th>
                        <th style={{ width: '20%', fontSize: '0.75rem', fontFamily: "'Orbitron', sans-serif", fontWeight: '600' }}>Player</th>
                        <th style={{ width: '12%', fontSize: '0.75rem', fontFamily: "'Orbitron', sans-serif", fontWeight: '600' }}>Profit</th>
                        <th style={{ width: '14%', fontSize: '0.75rem', fontFamily: "'Orbitron', sans-serif", fontWeight: '600' }}>Games Played</th>
                        <th style={{ width: '11%', fontSize: '0.75rem', fontFamily: "'Orbitron', sans-serif", fontWeight: '600' }}>Win Rate</th>
                        <th style={{ width: '11%', fontSize: '0.75rem', fontFamily: "'Orbitron', sans-serif", fontWeight: '600' }}>Kills</th>
                        <th style={{ width: '8%', fontSize: '0.75rem', fontFamily: "'Orbitron', sans-serif", fontWeight: '600' }}>🎖️</th>
                        <th style={{ width: '8%', fontSize: '0.75rem', fontFamily: "'Orbitron', sans-serif", fontWeight: '600' }}>Quests</th>
                        <th style={{ width: '12%', fontSize: '0.75rem', fontFamily: "'Orbitron', sans-serif", fontWeight: '600' }}>SP Points</th>
                  </tr>
                </thead>
                <tbody>
                      {playersArray.length > 0 ? (
                        playersArray.map((player, index) => {
                          const rank = index + 1;
                          return (
                            <tr key={getAddress(player)}>
                              <td>
                                <span className={`rank-badge ${rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : 'regular'}`}>
                                  #{rank}
                                </span>
                              </td>
                              <td>
                                <a
                                  href={`${networkConfig.config.EXPLORER.replace('docs.abs.xyz', 'docs[dot]abs[dot]xyz')}/address/${getAddress(player)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ 
                                    color: '#00ffcc', 
                                    textDecoration: 'none',
                                    fontFamily: "'Orbitron', sans-serif",
                                    fontWeight: '600',
                                    textShadow: '0 0 8px rgba(0, 255, 204, 0.5)',
                                    transition: 'all 0.3s ease',
                                    fontSize: '0.65rem',
                                    background: 'linear-gradient(135deg, rgba(0,255,204,0.1) 0%, rgba(0,255,204,0.2) 100%)',
                                    borderRadius: '6px',
                                    boxShadow: '0 0 12px rgba(0, 255, 204, 0.3)',
                                    padding: '0.2rem 0.6rem',
                                    display: 'inline-block',
                                    border: '1px solid rgba(0, 255, 204, 0.3)'
                                  }}
                                  title={getAddress(player)}
                                  onMouseEnter={(e) => {
                                    e.target.style.textShadow = '0 0 12px rgba(0, 255, 204, 0.8)';
                                    e.target.style.transform = 'scale(1.05)';
                                    e.target.style.boxShadow = '0 0 20px rgba(0, 255, 204, 0.5)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.target.style.textShadow = '0 0 8px rgba(0, 255, 204, 0.5)';
                                    e.target.style.transform = 'scale(1)';
                                    e.target.style.boxShadow = '0 0 12px rgba(0, 255, 204, 0.3)';
                                  }}
                                >
                                  {getAddress(player).slice(0, 6)}...{getAddress(player).slice(-4)}
                                </a>
                              </td>
                              <td style={{ 
                                fontFamily: "'Orbitron', sans-serif", 
                                fontWeight: '600', 
                                color: player.ethEarned > 0 ? '#00ff88' : '#ff4444', 
                                fontSize: '0.75rem' 
                              }}>
                                {player.ethEarned > 0 ? `${player.ethEarned.toFixed(3)}+ ETH` : '0.000 ETH'}
                              </td>
                              <td style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: '600', fontSize: '0.75rem' }}>{player.gamesPlayed}</td>
                              <td style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: '600', fontSize: '0.75rem' }}>{player.winRate}%</td>
                              <td style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: '600', fontSize: '0.75rem', color: '#000000', textShadow: '0 0 8px rgba(255, 0, 0, 0.8)' }}>
                                {player.kills !== undefined ? player.kills : '0'}
                              </td>
                              <td style={{ textAlign: 'center', fontFamily: "'Orbitron', sans-serif", fontWeight: '600', fontSize: '0.75rem' }}>
                                {typeof player.achievements === 'number' ? player.achievements : 0}
                              </td>
                              <td style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: '600', color: '#ffe066', fontSize: '0.75rem' }}>
                                {typeof player.questsCompleted === 'number' ? player.questsCompleted : 0}
                              </td>
                              <td style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: '600', color: '#a259ff', fontSize: '0.75rem' }}>
                                {player.SP !== undefined ? `${player.SP} SP` : '0 SP'}
                              </td>
                      </tr>
                          );
                        })
                  ) : (
                    <tr>
                          <td colSpan="8" style={{ 
                            textAlign: 'center', 
                            color: '#888',
                            fontFamily: "'Orbitron', sans-serif",
                            fontSize: '0.75rem',
                            padding: '2rem'
                          }}>
                            No data available.
                          </td>
                    </tr>
                  )}
                </tbody>
              </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Leaderboard;
