import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function TermsOfService() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('acceptance');

  const sections = [
    { id: 'acceptance', title: 'Acceptance', icon: '✅' },
    { id: 'eligibility', title: 'Eligibility', icon: '👤' },
    { id: 'game-wagering', title: 'Game & Wagering', icon: '🎮' },
    { id: 'financial', title: 'Financial', icon: '💰' },
    { id: 'conduct', title: 'User Conduct', icon: '⚖️' },
    { id: 'disclaimers', title: 'Disclaimers', icon: '⚠️' },
    { id: 'liability', title: 'Liability', icon: '🛡️' },
    { id: 'indemnification', title: 'Indemnification', icon: '🤝' },
    { id: 'termination', title: 'Termination', icon: '🚪' },
    { id: 'governing-law', title: 'Governing Law', icon: '⚖️' },
    { id: 'miscellaneous', title: 'Miscellaneous', icon: '📋' }
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
        .terms-scroll::-webkit-scrollbar {
          width: 8px;
        }
        .terms-scroll::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #00ffcc 0%, #6c5ce7 100%);
          border-radius: 4px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .terms-scroll::-webkit-scrollbar-track {
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
          maxWidth: 1400,
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
            width: '300px',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRight: '1px solid rgba(0, 255, 204, 0.2)',
            padding: '2rem 0 0 0',
            display: 'flex',
            flexDirection: 'column',
            height: '100%'
          }}>
            <div style={{
              padding: '0 2rem 2rem 2rem',
              borderBottom: '1px solid rgba(0, 255, 204, 0.2)',
              marginBottom: '2rem',
              flexShrink: 0
            }}>
              <h1 style={{
                color: '#00ffcc',
                fontSize: '1.8rem',
                fontWeight: 'bold',
                margin: 0,
                textAlign: 'center',
                textShadow: '0 0 20px rgba(0, 255, 204, 0.5)'
              }}>
                📜 Terms of Service
              </h1>
              <p style={{
                color: '#aaa',
                fontSize: '0.9rem',
                textAlign: 'center',
                margin: '0.5rem 0 0 0'
              }}>
                Snakstract Legal Agreement
              </p>
              <p style={{
                color: '#666',
                fontSize: '0.8rem',
                textAlign: 'center',
                margin: '0.5rem 0 0 0'
              }}>
                Effective: October 26, 2023
              </p>
            </div>

            <nav style={{ flex: 1, padding: '0 1rem', overflowY: 'auto', minHeight: 0 }}>
              {sections.map((section) => (
                <div
                  key={section.id}
                  className={`nav-item ${activeSection === section.id ? 'active' : ''}`}
                  onClick={() => setActiveSection(section.id)}
                  style={{
                    padding: '0.75rem 1rem',
                    margin: '0.25rem 0',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    color: activeSection === section.id ? '#000' : '#fff',
                    fontWeight: activeSection === section.id ? 'bold' : 'normal',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <span style={{ fontSize: '1rem' }}>{section.icon}</span>
                  {section.title}
                </div>
              ))}
            </nav>

            <div style={{
              padding: '2rem',
              borderTop: '1px solid rgba(0, 255, 204, 0.2)',
              flexShrink: 0,
              marginTop: 'auto'
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
          <div className="terms-scroll" style={{
            flex: 1,
            padding: '3rem',
            overflowY: 'auto',
            position: 'relative'
          }}>
            {/* Welcome Message */}
            <div style={{
              background: 'rgba(0, 255, 204, 0.05)',
              border: '1px solid rgba(0, 255, 204, 0.2)',
              borderRadius: '16px',
              padding: '2rem',
              marginBottom: '2rem'
            }}>
              <h2 style={{ 
                color: '#00ffcc', 
                fontSize: '1.5rem', 
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                📋 Welcome to Snakstract
              </h2>
              <p style={{ color: '#ddd', margin: 0, lineHeight: '1.6' }}>
            Welcome to Snakstract ("the Game," "we," "us," or "our"), an online wager-based snake game operating on the Abstract Layer 2 (L2) network. By accessing, using, or interacting with Snakstract, you ("User," "you," or "your") agree to be bound by these Terms of Service ("Terms"). Please read them carefully. If you do not agree to these Terms, you may not access or use the Game.
          </p>
            </div>

            {/* Content Sections */}
            {activeSection === 'acceptance' && (
              <div className="section-card">
                <h2 style={{ 
                  color: '#00ffcc', 
                  fontSize: '2rem', 
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}>
                  ✅ Acceptance of Terms
                </h2>
                <div style={{
                  background: 'rgba(0, 255, 204, 0.05)',
                  border: '1px solid rgba(0, 255, 204, 0.2)',
                  borderRadius: '16px',
                  padding: '2rem'
                }}>
                  <p style={{ color: '#ddd', marginBottom: '1.5rem', lineHeight: '1.6' }}>
            By creating an account, participating in games, or otherwise using any part of Snakstract, you acknowledge that you have read, understood, and agree to be bound by these Terms, as well as our Privacy Policy. We reserve the right to modify these Terms at any time. Your continued use of the Game after any such modifications constitutes your acceptance of the new Terms.
          </p>
                  <div style={{
                    background: 'rgba(255, 193, 7, 0.1)',
                    padding: '1rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 193, 7, 0.3)'
                  }}>
                    <p style={{ color: '#ffc107', margin: 0, fontSize: '0.9rem' }}>
                      💡 <strong>Important:</strong> These terms are legally binding. Please read them carefully before using the game.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'eligibility' && (
              <div className="section-card">
                <h2 style={{ 
                  color: '#00ffcc', 
                  fontSize: '2rem', 
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}>
                  👤 Eligibility
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
                      <h4 style={{ color: '#00ffcc', marginBottom: '0.5rem' }}>🎂 Age Restriction</h4>
                      <p style={{ color: '#ddd', margin: 0 }}>You must be at least 18 years old, or the age of legal majority in your jurisdiction, whichever is greater, to use Snakstract.</p>
                    </div>
                    
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      padding: '1.5rem',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <h4 style={{ color: '#00ffcc', marginBottom: '0.5rem' }}>🌍 Jurisdictional Restrictions</h4>
                      <p style={{ color: '#ddd', margin: 0 }}>You are solely responsible for ensuring that your access to and use of Snakstract is compliant with all applicable laws, regulations, and ordinances in your jurisdiction. We do not make any representations or warranties regarding the legality of Snakstract in any jurisdiction. Access to the Game may be restricted in certain territories.</p>
                    </div>
                    
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      padding: '1.5rem',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <h4 style={{ color: '#00ffcc', marginBottom: '0.5rem' }}>🚫 No Prohibited Persons</h4>
                      <p style={{ color: '#ddd', margin: 0 }}>You represent and warrant that you are not on any trade or economic sanctions lists, such as the UN Security Council Sanctions list, or the list of Specially Designated Nationals maintained by OFAC.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'game-wagering' && (
              <div className="section-card">
                <h2 style={{ 
                  color: '#00ffcc', 
                  fontSize: '2rem', 
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}>
                  🎮 The Game and Wagering
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
                      <h4 style={{ color: '#00ffcc', marginBottom: '0.5rem' }}>🎯 Game Mechanism</h4>
                      <p style={{ color: '#ddd', margin: 0 }}>Snakstract is a skill-based snake game where players can wager Ethereum (ETH) on the Abstract L2 network. The outcome of the game is determined by player skill and in-game interactions.</p>
                    </div>
                    
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      padding: '1.5rem',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <h4 style={{ color: '#00ffcc', marginBottom: '0.5rem' }}>💰 Wagers</h4>
                      <p style={{ color: '#ddd', margin: 0 }}>All wagers are placed using ETH on the Abstract L2 network. By placing a wager, you agree that you are doing so voluntarily and at your own risk.</p>
                    </div>
                    
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      padding: '1.5rem',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <h4 style={{ color: '#00ffcc', marginBottom: '0.5rem' }}>🔗 Smart Contract Interaction</h4>
                      <p style={{ color: '#ddd', margin: 0 }}>All game logic, including wagering, winnings, and losses, is governed by a smart contract deployed on the Abstract L2 network. Your interaction with the Game involves direct interaction with this smart contract.</p>
                    </div>
                    
                    <div style={{
                      background: 'rgba(255, 68, 68, 0.1)',
                      padding: '1.5rem',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 68, 68, 0.3)'
                    }}>
                      <h4 style={{ color: '#ff4444', marginBottom: '0.5rem' }}>⚠️ Blockchain Risks</h4>
                      <p style={{ color: '#ddd', margin: 0 }}>You acknowledge and accept the inherent risks associated with blockchain technology, including but not limited to, smart contract vulnerabilities, network congestion, high gas fees, and potential for exploits. You understand that we are not responsible for any losses incurred due to these risks.</p>
                    </div>
                    
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      padding: '1.5rem',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <h4 style={{ color: '#00ffcc', marginBottom: '0.5rem' }}>❓ No Guarantees</h4>
                      <p style={{ color: '#ddd', margin: 0 }}>We make no guarantees regarding the profitability or success of your participation in the Game. Winnings are dependent on your skill and the outcomes of the games.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'financial' && (
              <div className="section-card">
                <h2 style={{ 
                  color: '#00ffcc', 
                  fontSize: '2rem', 
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}>
                  💰 Financial Aspects
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
                      <h4 style={{ color: '#00ffcc', marginBottom: '1rem' }}>💳 Deposits and Withdrawals</h4>
                      <div style={{
                        background: 'rgba(0, 255, 204, 0.1)',
                        padding: '1rem',
                        borderRadius: '8px',
                        border: '1px solid rgba(0, 255, 204, 0.3)'
                      }}>
                        <ul style={{ color: '#ddd', margin: 0, paddingLeft: '1.5rem' }}>
                          <li><strong>Deposits:</strong> ETH is deposited directly into the Game's smart contract for wagering.</li>
                          <li><strong>Withdrawals:</strong> Winnings can be withdrawn from the smart contract to your Abstract L2 wallet. While we facilitate the withdrawal process, we are not responsible for any delays or failures caused by network issues or your wallet provider.</li>
          </ul>
                      </div>
                    </div>
                    
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      padding: '1.5rem',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <h4 style={{ color: '#00ffcc', marginBottom: '0.5rem' }}>⛽ Fees</h4>
                      <p style={{ color: '#ddd', margin: 0 }}>You may be subject to network transaction fees (gas fees) imposed by the Abstract L2 network for any on-chain interactions (e.g., placing wagers, withdrawing winnings). We may also charge a small platform fee on winnings, which will be clearly communicated within the Game interface.</p>
                    </div>
                    
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      padding: '1.5rem',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <h4 style={{ color: '#00ffcc', marginBottom: '0.5rem' }}>💱 No Fiat Conversion</h4>
                      <p style={{ color: '#ddd', margin: 0 }}>Snakstract operates exclusively with cryptocurrencies (ETH on Abstract L2). We do not facilitate any conversion to or from fiat currency.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'conduct' && (
              <div className="section-card">
                <h2 style={{ 
                  color: '#00ffcc', 
                  fontSize: '2rem', 
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}>
                  ⚖️ User Conduct and Responsibilities
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
                      <h4 style={{ color: '#00ffcc', marginBottom: '0.5rem' }}>🎯 Fair Play</h4>
                      <p style={{ color: '#ddd', margin: 0 }}>You agree to play Snakstract fairly and honestly. Any attempt to exploit bugs, use unauthorized third-party software, or engage in any form of cheating is strictly prohibited and will result in immediate account termination and forfeiture of any winnings.</p>
                    </div>
                    
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      padding: '1.5rem',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <h4 style={{ color: '#00ffcc', marginBottom: '0.5rem' }}>🔐 Account Security</h4>
                      <p style={{ color: '#ddd', margin: 0 }}>You are solely responsible for maintaining the confidentiality of your wallet and private keys. We are not responsible for any loss arising from your failure to protect your wallet information.</p>
                    </div>
                    
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      padding: '1.5rem',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <h4 style={{ color: '#00ffcc', marginBottom: '0.5rem' }}>📋 Compliance</h4>
                      <p style={{ color: '#ddd', margin: 0 }}>You agree to comply with all applicable local, national, and international laws and regulations regarding your use of the Game.</p>
                    </div>
                    
                    <div style={{
                      background: 'rgba(255, 68, 68, 0.1)',
                      padding: '1.5rem',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 68, 68, 0.3)'
                    }}>
                      <h4 style={{ color: '#ff4444', marginBottom: '1rem' }}>🚫 Prohibited Activities</h4>
                      <p style={{ color: '#ddd', marginBottom: '1rem' }}>You agree not to:</p>
                      <ul style={{ color: '#ddd', margin: 0, paddingLeft: '1.5rem' }}>
                        <li>Use the Game for any illegal or fraudulent activities.</li>
                        <li>Impersonate any person or entity.</li>
                        <li>Interfere with or disrupt the integrity or performance of the Game or data contained therein.</li>
                        <li>Attempt to gain unauthorized access to any part of the Game or its related systems or networks.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'disclaimers' && (
              <div className="section-card">
                <h2 style={{ 
                  color: '#00ffcc', 
                  fontSize: '2rem', 
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}>
                  ⚠️ Disclaimers
                </h2>
                <div style={{
                  background: 'rgba(0, 255, 204, 0.05)',
                  border: '1px solid rgba(0, 255, 204, 0.2)',
                  borderRadius: '16px',
                  padding: '2rem'
                }}>
                  <div style={{ display: 'grid', gap: '1.5rem' }}>
                    <div style={{
                      background: 'rgba(255, 68, 68, 0.1)',
                      padding: '1.5rem',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 68, 68, 0.3)'
                    }}>
                      <h4 style={{ color: '#ff4444', marginBottom: '0.5rem' }}>📋 AS IS Basis</h4>
                      <p style={{ color: '#ddd', margin: 0 }}>Snakstract is provided on an "AS IS" and "AS AVAILABLE" basis, without any warranties of any kind, either express or implied, including but not limited to, implied warranties of merchantability, fitness for a particular purpose, or non-infringement.</p>
                    </div>
                    
                    <div style={{
                      background: 'rgba(255, 68, 68, 0.1)',
                      padding: '1.5rem',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 68, 68, 0.3)'
                    }}>
                      <h4 style={{ color: '#ff4444', marginBottom: '0.5rem' }}>🌐 No Guarantee of Uptime</h4>
                      <p style={{ color: '#ddd', margin: 0 }}>We do not guarantee that the Game will be available at all times or that it will be free from errors or interruptions.</p>
                    </div>
                    
                    <div style={{
                      background: 'rgba(255, 68, 68, 0.1)',
                      padding: '1.5rem',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 68, 68, 0.3)'
                    }}>
                      <h4 style={{ color: '#ff4444', marginBottom: '0.5rem' }}>🔗 Third-Party Services</h4>
                      <p style={{ color: '#ddd', margin: 0 }}>We are not responsible for the services or products provided by third parties, including but not limited to, Abstract L2 network services, wallet providers, or any bridge services.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'liability' && (
              <div className="section-card">
                <h2 style={{ 
                  color: '#00ffcc', 
                  fontSize: '2rem', 
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}>
                  🛡️ Limitation of Liability
                </h2>
                <div style={{
                  background: 'rgba(0, 255, 204, 0.05)',
                  border: '1px solid rgba(0, 255, 204, 0.2)',
                  borderRadius: '16px',
                  padding: '2rem'
                }}>
                  <div style={{
                    background: 'rgba(255, 68, 68, 0.1)',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 68, 68, 0.3)'
                  }}>
                    <p style={{ color: '#ddd', margin: 0, lineHeight: '1.6' }}>
                      To the fullest extent permitted by law, in no event shall Snakstract, its affiliates, directors, employees, or agents be liable for any indirect, punitive, incidental, special, consequential, or exemplary damages, including without limitation damages for loss of profits, goodwill, use, data, or other intangible losses, arising out of or relating to the use of, or inability to use, the Game.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'indemnification' && (
              <div className="section-card">
                <h2 style={{ 
                  color: '#00ffcc', 
                  fontSize: '2rem', 
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}>
                  🤝 Indemnification
                </h2>
                <div style={{
                  background: 'rgba(0, 255, 204, 0.05)',
                  border: '1px solid rgba(0, 255, 204, 0.2)',
                  borderRadius: '16px',
                  padding: '2rem'
                }}>
                  <div style={{
                    background: 'rgba(255, 68, 68, 0.1)',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 68, 68, 0.3)'
                  }}>
                    <p style={{ color: '#ddd', margin: 0, lineHeight: '1.6' }}>
                      You agree to indemnify, defend, and hold harmless Snakstract, its affiliates, officers, directors, employees, and agents from and against any and all claims, liabilities, damages, losses, costs, and expenses (including reasonable attorneys' fees) arising out of or in any way connected with your access to or use of the Game, your violation of these Terms, or your violation of any rights of another.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'termination' && (
              <div className="section-card">
                <h2 style={{ 
                  color: '#00ffcc', 
                  fontSize: '2rem', 
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}>
                  🚪 Termination
                </h2>
                <div style={{
                  background: 'rgba(0, 255, 204, 0.05)',
                  border: '1px solid rgba(0, 255, 204, 0.2)',
                  borderRadius: '16px',
                  padding: '2rem'
                }}>
                  <div style={{
                    background: 'rgba(255, 68, 68, 0.1)',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 68, 68, 0.3)'
                  }}>
                    <p style={{ color: '#ddd', margin: 0, lineHeight: '1.6' }}>
                      We may terminate or suspend your access to Snakstract immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach these Terms. Upon termination, your right to use the Game will immediately cease.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'governing-law' && (
              <div className="section-card">
                <h2 style={{ 
                  color: '#00ffcc', 
                  fontSize: '2rem', 
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}>
                  ⚖️ Governing Law and Dispute Resolution
                </h2>
                <div style={{
                  background: 'rgba(0, 255, 204, 0.05)',
                  border: '1px solid rgba(0, 255, 204, 0.2)',
                  borderRadius: '16px',
                  padding: '2rem'
                }}>
                  <div style={{
                    background: 'rgba(255, 68, 68, 0.1)',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 68, 68, 0.3)'
                  }}>
                    <p style={{ color: '#ddd', margin: 0, lineHeight: '1.6' }}>
                      These Terms shall be governed by and construed in accordance with the laws of [Your Jurisdiction Here, e.g., the laws of the State of Delaware, USA], without regard to its conflict of law principles. Any dispute arising from or relating to these Terms or the Game shall be resolved exclusively in the courts located in [Your Jurisdiction's City/County, e.g., New Castle County, Delaware, USA].
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'miscellaneous' && (
              <div className="section-card">
                <h2 style={{ 
                  color: '#00ffcc', 
                  fontSize: '2rem', 
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}>
                  📋 Miscellaneous
                </h2>
                <div style={{
                  background: 'rgba(0, 255, 204, 0.05)',
                  border: '1px solid rgba(0, 255, 204, 0.2)',
                  borderRadius: '16px',
                  padding: '2rem'
                }}>
                  <div style={{
                    background: 'rgba(0, 255, 204, 0.1)',
                    padding: '1rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(0, 255, 204, 0.3)'
                  }}>
                    <ul style={{ color: '#ddd', margin: 0, paddingLeft: '1.5rem' }}>
                      <li style={{ marginBottom: '0.5rem' }}><strong>Entire Agreement:</strong> These Terms constitute the entire agreement between you and Snakstract regarding your use of the Game.</li>
                      <li style={{ marginBottom: '0.5rem' }}><strong>Severability:</strong> If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions shall remain in full force and effect.</li>
                      <li style={{ marginBottom: '0.5rem' }}><strong>No Waiver:</strong> Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.</li>
          </ul>
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

export default TermsOfService; 