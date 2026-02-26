import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Tutorial() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('getting-started');

  const sections = [
    { id: 'getting-started', title: 'Getting Started', icon: '🚀' },
    { id: 'gameplay', title: 'Gameplay Basics', icon: '🎮' },
    { id: 'escaping', title: 'Escaping & Withdrawing', icon: '🏃' },
    { id: 'sp-system', title: 'SP System', icon: '⭐' },
    { id: 'achievements', title: 'Achievements', icon: '🎖️' },
    { id: 'quests', title: 'Quests', icon: '🎯' },
    { id: 'notes', title: 'Important Notes', icon: '📝' }
  ];

  return (
    <div className="page-container" style={{ 
      minHeight: '100vh', 
      position: 'relative', 
      overflow: 'hidden',
      background: 'rgba(24,28,43,0.82)'
    }}>
      {/* Animated background particles */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'radial-gradient(circle at 20% 80%, rgba(0, 255, 204, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(108, 92, 231, 0.1) 0%, transparent 50%)',
        animation: 'pulse 8s ease-in-out infinite alternate'
      }} />

      {/* Custom scroll bar */}
      <style>{`
        .tutorial-scroll::-webkit-scrollbar {
          width: 8px;
        }
        .tutorial-scroll::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #00ffcc 0%, #6c5ce7 100%);
          border-radius: 4px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .tutorial-scroll::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
        }
        @keyframes pulse {
          0% { opacity: 0.3; }
          100% { opacity: 0.7; }
        }
        @keyframes slideIn {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .section-card {
          animation: slideIn 0.6s ease-out;
        }
        .nav-item {
          transition: all 0.3s ease;
        }
        .nav-item:hover {
          transform: translateX(5px);
        }
        .nav-item.active {
          background: linear-gradient(135deg, #00ffcc 0%, #6c5ce7 100%);
          box-shadow: 0 0 20px rgba(0, 255, 204, 0.3);
        }
      `}</style>

      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        padding: '2rem'
      }}>
        <div style={{
          display: 'flex',
          maxWidth: 1200,
          width: '100%',
          height: '85vh',
          background: 'rgba(24, 28, 43, 0.95)',
          borderRadius: '24px',
          border: '2px solid rgba(0, 255, 204, 0.2)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(0, 255, 204, 0.1)',
          backdropFilter: 'blur(20px)',
          overflow: 'hidden'
        }}>
          {/* Navigation Sidebar */}
          <div style={{
            width: '280px',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRight: '1px solid rgba(0, 255, 204, 0.2)',
            padding: '2rem 0',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              padding: '0 2rem 2rem 2rem',
              borderBottom: '1px solid rgba(0, 255, 204, 0.2)',
              marginBottom: '2rem'
            }}>
              <h1 style={{ color: '#00ffe0', fontSize: '2.2rem', fontWeight: 800, margin: 0, letterSpacing: '-1px', textShadow: '0 2px 16px #00ffe044, 0 0 1px #00ffe0', fontFamily: 'Orbitron, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <img src="/achieve.png" alt="Tutorial" style={{ height: '2em', verticalAlign: 'middle', display: 'inline-block', marginRight: '0.18em', filter: 'drop-shadow(0 0 8px #00ffcc) drop-shadow(0 0 16px #00ffcc66)' }} />
                Tutorial
              </h1>
              <p style={{
                color: '#aaa',
                fontSize: '0.9rem',
                textAlign: 'center',
                margin: '0.5rem 0 0 0'
              }}>
                Master the art of Snakstract
              </p>
            </div>

            <nav style={{ flex: 1, padding: '0 1rem' }}>
              {sections.map((section) => (
                <div
                  key={section.id}
                  className={`nav-item ${activeSection === section.id ? 'active' : ''}`}
                  onClick={() => setActiveSection(section.id)}
                  style={{
                    padding: '1rem 1.5rem',
                    margin: '0.5rem 0',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    color: activeSection === section.id ? '#000' : '#fff',
                    fontWeight: activeSection === section.id ? 'bold' : 'normal',
                    fontSize: '0.95rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}
                >
                  <span style={{ fontSize: '1.2rem' }}>{section.icon}</span>
                  {section.title}
                </div>
              ))}
            </nav>

            <div style={{
              padding: '2rem',
              borderTop: '1px solid rgba(0, 255, 204, 0.2)'
            }}>
              <button
                onClick={() => navigate('/')}
          style={{
            width: '100%',
                  padding: '1rem',
                  background: 'linear-gradient(135deg, #00ffcc 0%, #6c5ce7 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#000',
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(0, 255, 204, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 20px rgba(0, 255, 204, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 15px rgba(0, 255, 204, 0.3)';
                }}
              >
                🏠 Back to Game
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="tutorial-scroll" style={{
            flex: 1,
            padding: '3rem',
            overflowY: 'auto',
            position: 'relative'
          }}>
            {/* Mobile Warning */}
          <div style={{
            color: '#ff4444',
              background: 'rgba(255, 68, 68, 0.1)',
            border: '2px solid #ff4444',
              borderRadius: '16px',
              padding: '1.5rem',
              marginBottom: '2rem',
            textAlign: 'center',
              fontWeight: '600',
            fontSize: '1.1rem',
              backdropFilter: 'blur(10px)'
          }}>
              ⚠️ Snakstract is <strong>not supported on mobile devices</strong>. Please use a desktop browser for the best experience.
          </div>

            {/* Content Sections */}
            {activeSection === 'getting-started' && (
              <div className="section-card">
                <h2 style={{ 
                  color: '#00ffcc', 
                  fontSize: '2rem', 
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}>
                  🚀 Getting Started
                </h2>
                <div style={{
                  background: 'rgba(0, 255, 204, 0.05)',
                  border: '1px solid rgba(0, 255, 204, 0.2)',
                  borderRadius: '16px',
                  padding: '2rem',
                  marginBottom: '2rem'
                }}>
                  <div style={{ display: 'grid', gap: '1.5rem' }}>
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      padding: '1.5rem',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <h4 style={{ color: '#00ffcc', marginBottom: '0.5rem' }}>1. Connect Your Wallet</h4>
                      <p style={{ color: '#ddd', margin: 0 }}>Ensure your Abstract-compatible wallet (e.g., MetaMask, Abstract, Rainbow) is connected.</p>
          </div>

                    <div style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      padding: '1.5rem',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <h4 style={{ color: '#00ffcc', marginBottom: '0.5rem' }}>2. Stake ETH</h4>
                      <p style={{ color: '#ddd', marginBottom: '1rem' }}>Navigate to the main screen and stake ETH to join an active game session. This wager is your entry fee and potential reward.</p>
                      <div style={{
                        background: 'rgba(0, 255, 204, 0.1)',
                        padding: '1rem',
                        borderRadius: '8px',
                        border: '1px solid rgba(0, 255, 204, 0.3)'
                      }}>
                        <h5 style={{ color: '#00ffcc', marginBottom: '0.5rem' }}>Starting Segments Based on Wager:</h5>
                        <ul style={{ color: '#ddd', margin: 0, paddingLeft: '1.5rem' }}>
                          <li><strong>0.001 ETH</strong> = 4 segments</li>
                          <li><strong>0.3 ETH</strong> = 30 segments</li>
                          <li>Other amounts are calculated proportionally</li>
            </ul>
                      </div>
                    </div>
                    
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      padding: '1.5rem',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <h4 style={{ color: '#00ffcc', marginBottom: '0.5rem' }}>3. Enter Your Name</h4>
                      <p style={{ color: '#ddd', margin: 0 }}>Before entering the game, you'll be prompted to enter a player name. Choose something unique!</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'gameplay' && (
              <div className="section-card">
                <h2 style={{ 
                  color: '#00ffcc', 
                  fontSize: '2rem', 
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}>
                  🎮 Gameplay Basics
                </h2>
                <div style={{
                  background: 'rgba(0, 255, 204, 0.05)',
                  border: '1px solid rgba(0, 255, 204, 0.2)',
                  borderRadius: '16px',
                  padding: '2rem'
                }}>
                  <div style={{ display: 'grid', gap: '1.5rem' }}>
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      padding: '1.5rem',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <h4 style={{ color: '#00ffcc', marginBottom: '0.5rem' }}>🖱️ Movement</h4>
                      <p style={{ color: '#ddd', margin: 0 }}>Use the <strong>mouse</strong> to control your snake's direction. The snake turns smoothly toward your mouse input, allowing for precise maneuvers.</p>
                    </div>
                    
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      padding: '1.5rem',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <h4 style={{ color: '#00ffcc', marginBottom: '0.5rem' }}>⚡ Boosting</h4>
                      <p style={{ color: '#ddd', marginBottom: '1rem' }}>Hold the <strong>Left Mouse Button</strong> to activate a temporary speed boost. Boosting makes your snake move much faster, but it consumes your snake's segments and depletes the boost gauge.</p>
                      <div style={{
                        background: 'rgba(255, 193, 7, 0.1)',
                        padding: '1rem',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 193, 7, 0.3)'
                      }}>
                        <p style={{ color: '#ffc107', margin: 0, fontSize: '0.9rem' }}>
                          💡 <strong>Pro Tip:</strong> Use boost to escape danger or chase down opponents!
                        </p>
                      </div>
          </div>

                    <div style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      padding: '1.5rem',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <h4 style={{ color: '#00ffcc', marginBottom: '0.5rem' }}>💎 Collecting Orbs & Growth</h4>
                      <p style={{ color: '#ddd', marginBottom: '1rem' }}>
                        Orbs are scattered throughout the map. Collecting any orb will make your snake grow longer and increase your score. There are several types of orbs:
                      </p>
                      <ul style={{ color: '#ddd', marginBottom: '1rem', paddingLeft: '1.5rem' }}>
                        <li><strong>ETH Orbs (Green):</strong> Increase your snake's length and SP, and add to your potential winnings.</li>
                        <li><strong>Standard Orbs:</strong> Increase your snake's length and SP, but do not affect your ETH balance.</li>
                        <li><strong>Moving Orbs:</strong> These special orbs move around the map and provide enhanced rewards:
                          <ul style={{ color: '#ddd', marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                            <li><strong>Growth:</strong> Add 3-4 segments (more than standard orbs)</li>
                            <li><strong>SP Bonus:</strong> Award 10 SP (double the standard orb reward)</li>
                            <li><strong>Speed Bonus:</strong> 70% chance to receive a 50% speed increase for 40 seconds</li>
                          </ul>
                        </li>
            </ul>
                      <div style={{
                        background: 'rgba(0, 255, 204, 0.1)',
                        padding: '1rem',
                        borderRadius: '8px',
                        border: '1px solid rgba(0, 255, 204, 0.3)'
                      }}>
                        <p style={{ color: '#00ffcc', margin: 0, fontSize: '0.95rem' }}>
                          The more orbs you collect, the longer and more powerful your snake becomes. Try to balance growth with survival!
                        </p>
                      </div>
                    </div>
                    
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      padding: '1.5rem',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <h4 style={{ color: '#00ffcc', marginBottom: '0.5rem' }}>💎 Collecting ETH</h4>
                      <p style={{ color: '#ddd', margin: 0 }}>Green orbs that appear on the map are ETH. Consume them to grow your snake and increase your SP. The more ETH you collect, the higher your potential winnings.</p>
                    </div>
                    
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      padding: '1.5rem',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <h4 style={{ color: '#00ffcc', marginBottom: '0.5rem' }}>🛡️ Survive</h4>
                      <p style={{ color: '#ddd', margin: 0 }}>The primary goal is to survive as long as possible. If your snake's head hits a wall or another snake's body, you're out!</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'escaping' && (
              <div className="section-card">
                <h2 style={{ 
                  color: '#00ffcc', 
                  fontSize: '2rem', 
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}>
                  🏃 Escaping & Withdrawing
                </h2>
                <div style={{
                  background: 'rgba(0, 255, 204, 0.05)',
                  border: '1px solid rgba(0, 255, 204, 0.2)',
                  borderRadius: '16px',
                  padding: '2rem'
                }}>
                  <div style={{ display: 'grid', gap: '1.5rem' }}>
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      padding: '1.5rem',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <h4 style={{ color: '#00ffcc', marginBottom: '0.5rem' }}>🚪 Escaping</h4>
                      <p style={{ color: '#ddd', margin: 0 }}>You can escape at any time by double-tapping the <strong>E</strong> key on your keyboard. A progress bar will appear and automatically fill over 3 seconds. Once complete, your game will end and you can withdraw your ETH.</p>
          </div>

                    <div style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      padding: '1.5rem',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <h4 style={{ color: '#00ffcc', marginBottom: '0.5rem' }}>💳 Manual Withdrawals</h4>
                      <p style={{ color: '#ddd', margin: 0 }}>If your withdrawal transaction fails or you miss the prompt, you can always go to the <strong>History</strong> tab and use the <strong>Withdraw Funds</strong> button to claim your ETH.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'sp-system' && (
              <div className="section-card">
                <h2 style={{ 
                  color: '#00ffcc', 
                  fontSize: '2rem', 
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}>
                  ⭐ Snake Points (SP) System
                </h2>
                <div style={{
                  background: 'rgba(0, 255, 204, 0.05)',
                  border: '1px solid rgba(0, 255, 204, 0.2)',
                  borderRadius: '16px',
                  padding: '2rem'
                }}>
                  <div style={{ display: 'grid', gap: '1.5rem' }}>
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      padding: '1.5rem',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <h4 style={{ color: '#00ffcc', marginBottom: '0.5rem' }}>❓ What are Snake Points?</h4>
                      <p style={{ color: '#ddd', margin: 0 }}>Snake Points (SP) are earned for skillful play and tracked on-chain for each wallet. They represent your Abstract XP on the Abstract L2 chain. More features for SP are coming soon!</p>
          </div>

                    <div style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      padding: '1.5rem',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <h4 style={{ color: '#00ffcc', marginBottom: '1rem' }}>🎯 How to Earn SP:</h4>
                      <div style={{
                        background: 'rgba(0, 255, 204, 0.1)',
                        padding: '1rem',
                        borderRadius: '8px',
                        border: '1px solid rgba(0, 255, 204, 0.3)'
                      }}>
                        <ul style={{ color: '#ddd', margin: 0, paddingLeft: '1.5rem' }}>
                <li>Eat an orb: <strong>5 SP</strong></li>
                <li>Survive 1 minute: <strong>10 SP</strong></li>
                <li>Kill another player (direct hit): <strong>500 SP</strong></li>
                <li>Cause another player to die (collision): <strong>200 SP</strong></li>
                          <li>Win the game (Escape Achivement): <strong>2000 SP</strong></li>
                <li>Successfully escape and claim ETH: <strong>200 SP</strong></li>
                <li>Kill and take ETH (eliminate + claim): <strong>1000 SP</strong></li>
                          <li>Complete an achievement: <strong>2000 SP</strong></li>
              </ul>
                      </div>
                    </div>
                    
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      padding: '1.5rem',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <h4 style={{ color: '#00ffcc', marginBottom: '0.5rem' }}>📋 Important Notes</h4>
                      <ul style={{ color: '#ddd', margin: 0, paddingLeft: '1.5rem' }}>
              <li>SP is awarded automatically for these actions and cannot be transferred between wallets.</li>
              <li>SP is visible in your game history and on the leaderboard as "SP (Points)".</li>
            </ul>
          </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'achievements' && (
              <div className="section-card">
                <h2 style={{ 
                  color: '#00ffcc', 
                  fontSize: '2rem', 
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}>
                  🎖️ Achievements System
                </h2>
                <div style={{
                  background: 'rgba(0, 255, 204, 0.05)',
                  border: '1px solid rgba(0, 255, 204, 0.2)',
                  borderRadius: '16px',
                  padding: '2rem'
                }}>
                  <div style={{ display: 'grid', gap: '1.5rem' }}>
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      padding: '1.5rem',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <h4 style={{ color: '#00ffcc', marginBottom: '0.5rem' }}>❓ What are Achievements?</h4>
                      <p style={{ color: '#ddd', margin: 0 }}>Achievements are special challenges that reward you with <strong>+2000 SP</strong> when completed! They add extra goals and excitement to your gameplay.</p>
                    </div>
                    
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      padding: '1.5rem',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <h4 style={{ color: '#00ffcc', marginBottom: '1rem' }}>🎯 Available Achievements:</h4>
                      <div style={{
                        background: 'rgba(255, 193, 7, 0.1)',
                        padding: '1rem',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 193, 7, 0.3)'
                      }}>
                        <ul style={{ color: '#ddd', margin: 0, paddingLeft: '1.5rem' }}>
                          <li><strong>Speed Demon:</strong> Fully deplete boost at least 3 times AND survive for 3 minutes at top speed</li>
                          <li><strong>Orb Hunter:</strong> Collect 50 orbs within 2 minutes</li>
                          <li><strong>Survivor:</strong> Survive for 10 minutes</li>
                          <li><strong>Killer Instinct:</strong> Get 3 kills within 5 minutes</li>
                          <li><strong>Moving Orb Master:</strong> Collect 20 moving orbs within 4 minutes</li>
                          <li><strong>Giant Slayer:</strong> Survive for 5 minutes with 50+ segments</li>
                          <li><strong>Speed Runner:</strong> Escape within 2 minutes of starting</li>
                          <li><strong>Orb Chain:</strong> Collect 10 orbs within 30 seconds</li>
                          <li><strong>Endurance:</strong> Survive for 20 minutes</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      padding: '1.5rem',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <h4 style={{ color: '#00ffcc', marginBottom: '0.5rem' }}>🎁 Achievement Rewards</h4>
                      <p style={{ color: '#ddd', marginBottom: '1rem' }}>When you complete an achievement, a blue achievement message will appear on screen and you'll receive +2000 SP instantly!</p>
                      <div style={{
                        background: 'rgba(108, 92, 231, 0.1)',
                        padding: '1rem',
                        borderRadius: '8px',
                        border: '1px solid rgba(108, 92, 231, 0.3)'
                      }}>
                        <p style={{ color: '#6c5ce7', margin: 0, fontSize: '0.9rem' }}>
                          🧪 <strong>Testing Achievements:</strong> You can test achievements using the Achievement Tester (🧪 button) in the game screen to practice and see which ones you can complete.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'quests' && (
              <div className="section-card">
                <h2 style={{ 
                  color: '#00ffcc', 
                  fontSize: '2rem', 
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}>
                  🎯 Quests System
                </h2>
                <div style={{
                  background: 'rgba(0, 255, 204, 0.05)',
                  border: '1px solid rgba(0, 255, 204, 0.2)',
                  borderRadius: '16px',
                  padding: '2rem'
                }}>
                  <div style={{ display: 'grid', gap: '1.5rem' }}>
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      padding: '1.5rem',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <h4 style={{ color: '#00ffcc', marginBottom: '0.5rem' }}>❓ What are Quests?</h4>
                      <p style={{ color: '#ddd', margin: 0 }}>Quests are special challenges that reward you with SP based on their rarity! They provide long-term goals and additional ways to earn rewards beyond regular gameplay.</p>
                    </div>
                    
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      padding: '1.5rem',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <h4 style={{ color: '#00ffcc', marginBottom: '1rem' }}>🎨 Quest Rarities & Rewards:</h4>
                      <div style={{
                        background: 'rgba(255, 193, 7, 0.1)',
                        padding: '1rem',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 193, 7, 0.3)'
                      }}>
                        <ul style={{ color: '#ddd', margin: 0, paddingLeft: '1.5rem' }}>
                          <li><strong style={{color: '#4ade80'}}>Common (Green):</strong> 1,000 - 5,000 SP rewards</li>
                          <li><strong style={{color: '#60a5fa'}}>Rare (Blue):</strong> 5,000 - 15,000 SP rewards</li>
                          <li><strong style={{color: '#a855f7'}}>Epic (Purple):</strong> 15,000 - 25,000 SP rewards</li>
                          <li><strong style={{color: '#f59e0b'}}>Legendary (Orange):</strong> 25,000 - 40,000 SP rewards</li>
                          <li><strong style={{color: '#f87171'}}>Ultra (Red):</strong> 40,000 - 50,000 SP rewards</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      padding: '1.5rem',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <h4 style={{ color: '#00ffcc', marginBottom: '1rem' }}>📋 Quest Categories:</h4>
                      <div style={{
                        background: 'rgba(0, 255, 204, 0.1)',
                        padding: '1rem',
                        borderRadius: '8px',
                        border: '1px solid rgba(0, 255, 204, 0.3)'
                      }}>
                        <ul style={{ color: '#ddd', margin: 0, paddingLeft: '1.5rem' }}>
                          <li><strong>🎖️ Achievements:</strong> Special challenges like "Escape Artist" and "Persistent Survivor"</li>
                          <li><strong>🔮 Orbs:</strong> Collect orbs efficiently and in streaks</li>
                          <li><strong>💰 ETH Orbs:</strong> Master ETH collection and efficiency</li>
                          <li><strong>💀 Kills:</strong> Eliminate other players and build kill streaks</li>
                          <li><strong>⏱️ Survival:</strong> Survive for extended periods and build endurance</li>
                          <li><strong>📅 Daily/Weekly/Monthly:</strong> Time-based challenges with regular resets</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      padding: '1.5rem',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <h4 style={{ color: '#00ffcc', marginBottom: '1rem' }}>🎮 Quest Types:</h4>
                      <div style={{
                        background: 'rgba(108, 92, 231, 0.1)',
                        padding: '1rem',
                        borderRadius: '8px',
                        border: '1px solid rgba(108, 92, 231, 0.3)'
                      }}>
                        <ul style={{ color: '#ddd', margin: 0, paddingLeft: '1.5rem' }}>
                          <li><strong>Single-Game Quests:</strong> Complete objectives within one game session</li>
                          <li><strong>Multi-Game Quests:</strong> Track progress across multiple games with progress bars</li>
                          <li><strong>Progressive Quests:</strong> Build up achievements over time (survival time, kills, etc.)</li>
                          <li><strong>Time-Based Quests:</strong> Daily, weekly, and monthly challenges that reset automatically</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      padding: '1.5rem',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <h4 style={{ color: '#00ffcc', marginBottom: '0.5rem' }}>✅ How to Complete Quests:</h4>
                      <ul style={{ color: '#ddd', margin: 0, paddingLeft: '1.5rem' }}>
                        <li>Play games normally - quest progress is tracked automatically</li>
                        <li>Visit the <strong>Quests</strong> page to see your progress on each quest</li>
                        <li>When a quest is completed, click the "Claim SP" button to receive your reward</li>
                        <li>Multi-game quests show progress bars and accumulate across sessions</li>
                        <li>Daily/Weekly/Monthly quests reset automatically at their respective intervals</li>
                        <li>Completed quests are marked with a checkmark and show "Claim SP" button</li>
                      </ul>
                    </div>
                    
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      padding: '1.5rem',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <h4 style={{ color: '#00ffcc', marginBottom: '0.5rem' }}>💡 Quest Tips:</h4>
                      <ul style={{ color: '#ddd', margin: 0, paddingLeft: '1.5rem' }}>
                        <li>Focus on quests that align with your playstyle</li>
                        <li>Multi-game quests are great for long-term progression</li>
                        <li>Daily quests provide consistent rewards for regular players</li>
                        <li>Higher rarity quests offer better rewards but are more challenging</li>
                        <li>Check the Quests page regularly to claim completed quests</li>
            </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'notes' && (
              <div className="section-card">
                <h2 style={{ 
                  color: '#00ffcc', 
                  fontSize: '2rem', 
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}>
                  📝 Important Notes
                </h2>
                <div style={{
                  background: 'rgba(0, 255, 204, 0.05)',
                  border: '1px solid rgba(0, 255, 204, 0.2)',
                  borderRadius: '16px',
                  padding: '2rem'
                }}>
                  <div style={{ display: 'grid', gap: '1.5rem' }}>
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      padding: '1.5rem',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <h4 style={{ color: '#00ffcc', marginBottom: '0.5rem' }}>🌐 Game Server</h4>
                      <p style={{ color: '#ddd', margin: 0 }}>Snakstract runs on a decentralized game server. Ensure your connection is stable for the best experience.</p>
                    </div>
                    
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      padding: '1.5rem',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <h4 style={{ color: '#00ffcc', marginBottom: '0.5rem' }}>⛽ Gas Fees</h4>
                      <p style={{ color: '#ddd', margin: 0 }}>Be aware that blockchain transactions (staking, escaping, claiming) will incur gas fees.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Tutorial;