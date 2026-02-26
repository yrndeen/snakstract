import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicy = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('introduction');

  const sections = [
    { id: 'introduction', title: 'Introduction', icon: '📋' },
    { id: 'information-collection', title: 'Information Collection', icon: '📊' },
    { id: 'information-use', title: 'Information Use', icon: '🎯' },
    { id: 'information-sharing', title: 'Information Sharing', icon: '🔗' },
    { id: 'data-security', title: 'Data Security', icon: '🔒' },
    { id: 'rights-choices', title: 'Rights & Choices', icon: '⚖️' },
    { id: 'cookies-tracking', title: 'Cookies & Tracking', icon: '🍪' },
    { id: 'international-transfers', title: 'International Transfers', icon: '🌍' },
    { id: 'policy-changes', title: 'Policy Changes', icon: '📝' },
    { id: 'contact', title: 'Contact Us', icon: '📞' }
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
        .privacy-scroll::-webkit-scrollbar {
          width: 8px;
        }
        .privacy-scroll::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #00ffcc 0%, #6c5ce7 100%);
          border-radius: 4px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .privacy-scroll::-webkit-scrollbar-track {
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
            padding: '2rem 0',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              padding: '0 2rem 2rem 2rem',
              borderBottom: '1px solid rgba(0, 255, 204, 0.2)',
              marginBottom: '2rem'
            }}>
              <h1 style={{
                color: '#00ffcc',
                fontSize: '1.8rem',
                fontWeight: 'bold',
                margin: 0,
                textAlign: 'center',
                textShadow: '0 0 20px rgba(0, 255, 204, 0.5)'
              }}>
                🔒 Privacy Policy
              </h1>
              <p style={{
                color: '#aaa',
                fontSize: '0.9rem',
                textAlign: 'center',
                margin: '0.5rem 0 0 0'
              }}>
                Data Protection & Privacy
              </p>
              <p style={{
                color: '#666',
                fontSize: '0.8rem',
                textAlign: 'center',
                margin: '0.5rem 0 0 0'
              }}>
                Last updated: {new Date().toLocaleDateString()}
              </p>
            </div>

            <nav style={{ flex: 1, padding: '0 1rem' }}>
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
          <div className="privacy-scroll" style={{
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
                🔒 Welcome to Snakstract Privacy Policy
              </h2>
              <p style={{ color: '#ddd', margin: 0, lineHeight: '1.6' }}>
                Welcome to Snakstract ("we," "our," or "us"). We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our blockchain-based snake game and related services.
              </p>
            </div>

            {/* Content Sections */}
            {activeSection === 'introduction' && (
              <div className="section-card">
                <h2 style={{ 
                  color: '#00ffcc', 
                  fontSize: '2rem', 
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}>
                  📋 Introduction
                </h2>
                <div style={{
                  background: 'rgba(0, 255, 204, 0.05)',
                  border: '1px solid rgba(0, 255, 204, 0.2)',
                  borderRadius: '16px',
                  padding: '2rem'
                }}>
                  <p style={{ color: '#ddd', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                    By using Snakstract, you agree to the collection and use of information in accordance with this policy.
                  </p>
                  <div style={{
                    background: 'rgba(255, 193, 7, 0.1)',
                    padding: '1rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 193, 7, 0.3)'
                  }}>
                    <p style={{ color: '#ffc107', margin: 0, fontSize: '0.9rem' }}>
                      💡 <strong>Important:</strong> This policy outlines how we handle your data in our blockchain-based gaming platform.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'information-collection' && (
              <div className="section-card">
                <h2 style={{ 
                  color: '#00ffcc', 
                  fontSize: '2rem', 
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}>
                  📊 Information We Collect
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
                      <h4 style={{ color: '#00ffcc', marginBottom: '0.5rem' }}>💳 Wallet Information</h4>
                      <p style={{ color: '#ddd', marginBottom: '1rem' }}>When you connect your wallet (Abstract Wallet, MetaMask, or other supported wallets), we may collect:</p>
                      <ul style={{ color: '#ddd', margin: 0, paddingLeft: '1.5rem' }}>
                        <li>Wallet addresses</li>
                        <li>Transaction history related to our game</li>
                        <li>Network information (chain ID, etc.)</li>
                      </ul>
                    </div>
                    
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      padding: '1.5rem',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <h4 style={{ color: '#00ffcc', marginBottom: '0.5rem' }}>🎮 Game Data</h4>
                      <p style={{ color: '#ddd', marginBottom: '1rem' }}>We collect game-related information including:</p>
                      <ul style={{ color: '#ddd', margin: 0, paddingLeft: '1.5rem' }}>
                        <li>Game scores and statistics</li>
                        <li>Player rankings and leaderboard data</li>
                        <li>Game session information</li>
                        <li>Referral codes and relationships</li>
                      </ul>
                    </div>
                    
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      padding: '1.5rem',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <h4 style={{ color: '#00ffcc', marginBottom: '0.5rem' }}>🔧 Technical Information</h4>
                      <p style={{ color: '#ddd', marginBottom: '1rem' }}>We automatically collect certain technical information:</p>
                      <ul style={{ color: '#ddd', margin: 0, paddingLeft: '1.5rem' }}>
                        <li>IP addresses</li>
                        <li>Browser type and version</li>
                        <li>Device information</li>
                        <li>Usage analytics and performance data</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'information-use' && (
              <div className="section-card">
                <h2 style={{ 
                  color: '#00ffcc', 
                  fontSize: '2rem', 
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}>
                  🎯 How We Use Your Information
                </h2>
                <div style={{
                  background: 'rgba(0, 255, 204, 0.05)',
                  border: '1px solid rgba(0, 255, 204, 0.2)',
                  borderRadius: '16px',
                  padding: '2rem'
                }}>
                  <p style={{ color: '#ddd', marginBottom: '1.5rem' }}>We use the collected information for the following purposes:</p>
                  <div style={{
                    background: 'rgba(0, 255, 204, 0.1)',
                    padding: '1rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(0, 255, 204, 0.3)'
                  }}>
                    <ul style={{ color: '#ddd', margin: 0, paddingLeft: '1.5rem' }}>
                      <li>To provide and maintain our game services</li>
                      <li>To process transactions and manage wagers</li>
                      <li>To display leaderboards and rankings</li>
                      <li>To handle referral programs and rewards</li>
                      <li>To improve game performance and user experience</li>
                      <li>To provide customer support</li>
                      <li>To detect and prevent fraud or abuse</li>
                      <li>To comply with legal obligations</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'information-sharing' && (
              <div className="section-card">
                <h2 style={{ 
                  color: '#00ffcc', 
                  fontSize: '2rem', 
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}>
                  🔗 Information Sharing and Disclosure
                </h2>
                <div style={{
                  background: 'rgba(0, 255, 204, 0.05)',
                  border: '1px solid rgba(0, 255, 204, 0.2)',
                  borderRadius: '16px',
                  padding: '2rem'
                }}>
                  <p style={{ color: '#ddd', marginBottom: '1.5rem' }}>We do not sell, trade, or otherwise transfer your personal information to third parties except in the following circumstances:</p>
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    <div style={{
                      background: 'rgba(255, 68, 68, 0.1)',
                      padding: '1rem',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 68, 68, 0.3)'
                    }}>
                      <p style={{ color: '#ddd', margin: 0 }}><strong>Blockchain Transparency:</strong> Game transactions are recorded on the blockchain and are publicly visible</p>
                    </div>
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      padding: '1rem',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <p style={{ color: '#ddd', margin: 0 }}><strong>Service Providers:</strong> We may share data with trusted third-party service providers who assist in operating our game</p>
                    </div>
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      padding: '1rem',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <p style={{ color: '#ddd', margin: 0 }}><strong>Legal Requirements:</strong> We may disclose information if required by law or to protect our rights and safety</p>
                    </div>
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      padding: '1rem',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <p style={{ color: '#ddd', margin: 0 }}><strong>Business Transfers:</strong> In the event of a merger or acquisition, user information may be transferred</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'data-security' && (
              <div className="section-card">
                <h2 style={{ 
                  color: '#00ffcc', 
                  fontSize: '2rem', 
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}>
                  🔒 Data Security
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
                      We implement appropriate security measures to protect your information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'rights-choices' && (
              <div className="section-card">
                <h2 style={{ 
                  color: '#00ffcc', 
                  fontSize: '2rem', 
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}>
                  ⚖️ Your Rights and Choices
                </h2>
                <div style={{
                  background: 'rgba(0, 255, 204, 0.05)',
                  border: '1px solid rgba(0, 255, 204, 0.2)',
                  borderRadius: '16px',
                  padding: '2rem'
                }}>
                  <p style={{ color: '#ddd', marginBottom: '1.5rem' }}>You have the following rights regarding your personal information:</p>
                  <div style={{
                    background: 'rgba(0, 255, 204, 0.1)',
                    padding: '1rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(0, 255, 204, 0.3)'
                  }}>
                    <ul style={{ color: '#ddd', margin: 0, paddingLeft: '1.5rem' }}>
                      <li><strong>Access:</strong> Request access to your personal data</li>
                      <li><strong>Correction:</strong> Request correction of inaccurate data</li>
                      <li><strong>Deletion:</strong> Request deletion of your data (subject to blockchain immutability)</li>
                      <li><strong>Portability:</strong> Request a copy of your data in a portable format</li>
                      <li><strong>Objection:</strong> Object to certain processing of your data</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'cookies-tracking' && (
              <div className="section-card">
                <h2 style={{ 
                  color: '#00ffcc', 
                  fontSize: '2rem', 
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}>
                  🍪 Cookies and Tracking
                </h2>
                <div style={{
                  background: 'rgba(0, 255, 204, 0.05)',
                  border: '1px solid rgba(0, 255, 204, 0.2)',
                  borderRadius: '16px',
                  padding: '2rem'
                }}>
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    <p style={{ color: '#ddd', margin: 0, lineHeight: '1.6' }}>
                      We may use cookies and similar tracking technologies to enhance your gaming experience, analyze usage patterns, and provide personalized content. You can control cookie settings through your browser preferences.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'international-transfers' && (
              <div className="section-card">
                <h2 style={{ 
                  color: '#00ffcc', 
                  fontSize: '2rem', 
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}>
                  🌍 International Data Transfers
                </h2>
                <div style={{
                  background: 'rgba(0, 255, 204, 0.05)',
                  border: '1px solid rgba(0, 255, 204, 0.2)',
                  borderRadius: '16px',
                  padding: '2rem'
                }}>
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    <p style={{ color: '#ddd', margin: 0, lineHeight: '1.6' }}>
                      Your information may be transferred to and processed in countries other than your own. We ensure that such transfers comply with applicable data protection laws and implement appropriate safeguards.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'policy-changes' && (
              <div className="section-card">
                <h2 style={{ 
                  color: '#00ffcc', 
                  fontSize: '2rem', 
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}>
                  📝 Changes to This Privacy Policy
                </h2>
                <div style={{
                  background: 'rgba(0, 255, 204, 0.05)',
                  border: '1px solid rgba(0, 255, 204, 0.2)',
                  borderRadius: '16px',
                  padding: '2rem'
                }}>
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    <p style={{ color: '#ddd', margin: 0, lineHeight: '1.6' }}>
                      We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. Your continued use of Snakstract after any changes constitutes acceptance of the updated policy.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'contact' && (
              <div className="section-card">
                <h2 style={{ 
                  color: '#00ffcc', 
                  fontSize: '2rem', 
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}>
                  📞 Contact Us
                </h2>
                <div style={{
                  background: 'rgba(0, 255, 204, 0.05)',
                  border: '1px solid rgba(0, 255, 204, 0.2)',
                  borderRadius: '16px',
                  padding: '2rem'
                }}>
                  <p style={{ color: '#ddd', marginBottom: '1.5rem' }}>If you have any questions about this Privacy Policy or our data practices, please contact us at:</p>
                  <div style={{
                    background: 'rgba(0, 255, 204, 0.1)',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    border: '1px solid rgba(0, 255, 204, 0.3)'
                  }}>
                    <div style={{ display: 'grid', gap: '1rem' }}>
                      <div style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        padding: '1rem',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}>
                        <p style={{ margin: '0.5rem 0', color: '#ddd' }}>
                          <strong>Discord:</strong> Join our Discord server for support
                        </p>
                        <a 
                          href="https://discord.gg/snakstract" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{
                            color: '#00ffcc',
                            textDecoration: 'none',
                            fontWeight: 'bold',
                            fontSize: '0.9rem'
                          }}
                        >
                          Join Discord →
                        </a>
                      </div>
                      <div style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        padding: '1rem',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}>
                        <p style={{ margin: '0.5rem 0', color: '#ddd' }}>
                          <strong>Twitter:</strong> @Snakstract
                        </p>
                        <a 
                          href="https://twitter.com/Snakstract" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{
                            color: '#00ffcc',
                            textDecoration: 'none',
                            fontWeight: 'bold',
                            fontSize: '0.9rem'
                          }}
                        >
                          Follow on Twitter →
                        </a>
                      </div>
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
};

export default PrivacyPolicy; 