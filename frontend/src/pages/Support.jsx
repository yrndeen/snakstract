import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useNetwork } from '../App';

const Support = () => {
  const [activeTab, setActiveTab] = useState('faq');
  const [expandedFaq, setExpandedFaq] = useState(null);
  const { networkConfig } = useNetwork();

  const faqData = [
    {
      id: 1,
      question: "How do I connect my wallet?",
      answer: "Click the 'Connect Wallet' button in the top right corner. You can choose between Abstract Wallet or MetaMask. Make sure your wallet is unlocked and you have some ETH for gas fees."
    },
    {
      id: 2,
      question: "How do I start playing?",
      answer: "After connecting your wallet, navigate to the 'Play' section. You can place a wager (minimum 0.001 ETH) and start the game. Use arrow keys or WASD to control your snake."
    },
    {
      id: 3,
      question: "What happens if I lose connection during a game?",
      answer: "If you lose connection, your game session will be paused. You can reconnect and resume your game within 5 minutes. After that, the game will be forfeited."
    },
    {
      id: 4,
      question: "How do referrals work?",
      answer: "You can set a referral code when you first connect your wallet. When someone uses your referral code, you'll earn a percentage of their wagers. You can also use other players' referral codes to get bonuses."
    },
    {
      id: 5,
      question: "How do I withdraw my winnings?",
      answer: "Winnings are automatically sent to your connected wallet address. You can view your transaction history in the 'History' tab. Make sure you have enough ETH for gas fees."
    },
    {
      id: 6,
      question: "What is the minimum wager?",
      answer: "The minimum wager is 0.001 ETH. The maximum wager depends on your wallet balance and the current game limits."
    },
    {
      id: 7,
      question: "How do I report a bug or issue?",
      answer: "You can report bugs through our #bug-reports channel in discord or follow us on Twitter @snakstract for updates. Please include as much detail as possible."
    },
    {
      id: 8,
      question: "Is my wallet information safe?",
      answer: "Yes, we never store your private keys. We only interact with your wallet through secure connections. All transactions are processed on the blockchain for transparency."
    },
    {
      id: 9,
      question: "What is Snakstract?",
      answer: "It's a PvP snake survival game built on the blockchain."
    },
    {
      id: 10,
      question: "What wallet do I need?",
      answer: "You can use MetaMask, Abstract, Rainbow, or other Web3 wallets."
    },
    {
      id: 11,
      question: "What if my escape claim transaction fails?",
      answer: "If your on-chain escape claim transaction fails or gets stuck, don't worry! You can go to the History tab and use the Withdraw button next to the relevant game entry. This will allow you to manually claim your accumulated ETH."
    },
    {
      id: 12,
      question: "How do I claim my ETH?",
      answer: "When you escape or are eliminated, you will be prompted to withdraw your ETH. If you miss the prompt or the transaction fails, you can always claim your ETH from the History tab using the Withdraw Funds button."
    },
    {
      id: 13,
      question: "How do Survival Rewards work?",
      answer: "A portion of every player's fee is pooled as the Survival Rewards Pot. If you earn ETH (profit > 0) or survive at least 5 minutes in a game, you become eligible for the next survival reward payout. When you withdraw, your share of the pot is distributed to you based on your survival time and in-game actions. The pot and eligibility list are reset after each payout. Survival rewards are no longer given to a single random winner, but are distributed fairly among all eligible players."
    },
    {
      id: 14,
      question: "How do I escape during a game?",
      answer: "You can escape at any time by double-tapping the E key on your keyboard. A progress bar will appear and automatically fill over 3 seconds. Once complete, your game will end and you can withdraw your ETH."
    },
    {
      id: 15,
      question: "Can I play on mobile?",
      answer: "No, Snakstract is not supported on mobile devices. Please use a desktop browser."
    },
    {
      id: 16,
      question: "How do I earn Snake Points (SP)?",
      answer: "Snake Points (SP) are earned for skillful play and are tracked on-chain for each wallet. They represent your Abstract XP on the Abstract L2 chain. More features for SP are coming soon! You earn SP for: Eating an orb: 5 SP, Surviving 1 minute: 10 SP, Killing another player (direct hit): 500 SP, Causing another player to die (collision): 200 SP, Winning the game (last survivor): 2000 SP, Successfully escaping and claiming ETH: 200 SP, Killing and taking ETH (eliminate + claim): 1000 SP. SP is shown as 'SP (Points)' in your game history and on the leaderboard."
    },
    {
      id: 17,
      question: "How do I move and boost in Snakstract?",
      answer: "You control your snake using the mouse only. The snake turns smoothly toward your mouse input for precise maneuvers. Keyboard keys (Arrow Keys, WASD) no longer move the player. To boost, hold the Left Mouse Button. Boosting makes your snake move much faster, but it consumes your snake's segments and depletes the boost gauge. Once the gauge is empty, you'll need to wait for a cooldown before boosting again. (Spacebar no longer activates boost.)"
    },
    {
      id: 18,
      question: "How do starting segments work based on wager?",
      answer: "Your starting snake size is determined by your wager amount! Higher wagers give you more starting segments: 0.001 ETH = 4 segments, 0.3 ETH = 30 segments, Other amounts are calculated proportionally between these values. This system gives higher-staking players a competitive advantage while maintaining game balance. The more you wager, the bigger your starting snake will be!"
    }
  ];

  const troubleshootingSteps = [
    {
      title: "Wallet Connection Issues",
      steps: [
        "Make sure your wallet extension is installed and unlocked",
        "Try refreshing the page and reconnecting",
        "Check if you're on the correct network (" + (networkConfig.config.CHAIN_ID === 2741 ? 'Abstract Mainnet' : 'Abstract Testnet') + ")",
        "Clear your browser cache and try again"
      ]
    },
    {
      title: "Game Performance Issues",
      steps: [
        "Check your internet connection",
        "Try using a different browser",
        "Disable browser extensions that might interfere",
        "Make sure your browser is up to date"
      ]
    },
    {
      title: "Transaction Issues",
      steps: [
        "Ensure you have enough ETH for gas fees",
        "Check if the transaction is pending in your wallet",
        "Try increasing the gas limit if transactions fail",
        "Wait a few minutes and try again"
      ]
    }
  ];

  const toggleFaq = (id) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #181c2b 0%, #0f1419 100%)',
      color: '#00ffcc',
      fontFamily: 'Orbitron, monospace',
      padding: '2rem',
      lineHeight: '1.6'
    }}>
      <div style={{
        maxWidth: '1000px',
        margin: '0 auto',
        background: 'rgba(0, 255, 204, 0.05)',
        border: '1px solid #00ffcc',
        borderRadius: '12px',
        padding: '2rem',
        boxShadow: '0 0 30px rgba(0, 255, 204, 0.1)',
        maxHeight: '80vh',
        overflowY: 'auto'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ 
            fontSize: '2.5rem', 
            marginBottom: '1rem',
            textShadow: '0 0 20px #00ffcc',
            background: 'linear-gradient(135deg, #00ffcc 0%, #c07eff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Support Center
          </h1>
          <p style={{ color: '#888', fontSize: '1.1rem' }}>
            Need help? We're here to assist you!
          </p>
        </div>

        {/* Tab Navigation */}
        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          marginBottom: '2rem',
          borderBottom: '1px solid #333',
          paddingBottom: '1rem'
        }}>
          {[
            { id: 'faq', label: 'FAQ' },
            { id: 'troubleshooting', label: 'Troubleshooting' },
            { id: 'contact', label: 'Contact Us' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: activeTab === tab.id 
                  ? 'linear-gradient(135deg, #00ffcc 0%, #c07eff 100%)' 
                  : 'transparent',
                color: activeTab === tab.id ? '#000' : '#00ffcc',
                border: activeTab === tab.id ? 'none' : '1px solid #00ffcc',
                borderRadius: '8px',
                padding: '0.75rem 1.5rem',
                cursor: 'pointer',
                fontFamily: 'Orbitron, monospace',
                fontWeight: 'bold',
                transition: 'all 0.3s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* FAQ Tab */}
        {activeTab === 'faq' && (
          <div>
            <h2 style={{ color: '#00ffcc', fontSize: '1.8rem', marginBottom: '1.5rem' }}>
              Frequently Asked Questions
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {faqData.map(faq => (
                <div 
                  key={faq.id}
                  style={{
                    border: '1px solid #333',
                    borderRadius: '8px',
                    overflow: 'hidden'
                  }}
                >
                  <button
                    onClick={() => toggleFaq(faq.id)}
                    style={{
                      width: '100%',
                      background: 'rgba(0, 255, 204, 0.1)',
                      border: 'none',
                      padding: '1rem',
                      textAlign: 'left',
                      color: '#00ffcc',
                      fontFamily: 'Orbitron, monospace',
                      fontSize: '1rem',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <span>{faq.question}</span>
                    <span style={{ 
                      transform: expandedFaq === faq.id ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.3s ease'
                    }}>
                      ▼
                    </span>
                  </button>
                  {expandedFaq === faq.id && (
                    <div style={{
                      padding: '1rem',
                      background: 'rgba(0, 0, 0, 0.3)',
                      color: '#ccc',
                      borderTop: '1px solid #333'
                    }}>
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Troubleshooting Tab */}
        {activeTab === 'troubleshooting' && (
          <div>
            <h2 style={{ color: '#00ffcc', fontSize: '1.8rem', marginBottom: '1.5rem' }}>
              Troubleshooting Guide
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {troubleshootingSteps.map((section, index) => (
                <div key={index} style={{
                  border: '1px solid #333',
                  borderRadius: '8px',
                  padding: '1.5rem',
                  background: 'rgba(0, 255, 204, 0.05)'
                }}>
                  <h3 style={{ 
                    color: '#c07eff', 
                    fontSize: '1.3rem', 
                    marginBottom: '1rem',
                    borderBottom: '1px solid #333',
                    paddingBottom: '0.5rem'
                  }}>
                    {section.title}
                  </h3>
                  <ol style={{ color: '#ccc', paddingLeft: '1.5rem' }}>
                    {section.steps.map((step, stepIndex) => (
                      <li key={stepIndex} style={{ marginBottom: '0.5rem' }}>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contact Tab */}
        {activeTab === 'contact' && (
          <div>
            <h2 style={{ color: '#00ffcc', fontSize: '1.8rem', marginBottom: '1.5rem' }}>
              Contact Us
            </h2>
            
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
              {/* Contact Methods */}
              <div style={{ maxWidth: '600px', width: '100%' }}>
                <h3 style={{ color: '#c07eff', fontSize: '1.3rem', marginBottom: '1rem', textAlign: 'center' }}>
                  Get in Touch
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{
                    background: 'rgba(0, 255, 204, 0.1)',
                    border: '1px solid #00ffcc',
                    borderRadius: '8px',
                    padding: '1.5rem',
                    textAlign: 'center'
                  }}>
                    <h4 style={{ color: '#00ffcc', marginBottom: '0.5rem', fontSize: '1.2rem' }}>Discord</h4>
                    <p style={{ color: '#ccc', margin: '0 0 1rem 0' }}>Join our community for real-time support and bug reports</p>
                    <a 
                      href="https://discord.gg/snakstract" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{
                        color: '#00ffcc',
                        textDecoration: 'none',
                        fontWeight: 'bold',
                        fontSize: '1.1rem',
                        padding: '0.5rem 1rem',
                        border: '1px solid #00ffcc',
                        borderRadius: '4px',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={e => {
                        e.target.style.background = '#00ffcc';
                        e.target.style.color = '#000';
                      }}
                      onMouseLeave={e => {
                        e.target.style.background = 'transparent';
                        e.target.style.color = '#00ffcc';
                      }}
                    >
                      Join Discord →
                    </a>
                  </div>
                  
                  <div style={{
                    background: 'rgba(0, 255, 204, 0.1)',
                    border: '1px solid #00ffcc',
                    borderRadius: '8px',
                    padding: '1.5rem',
                    textAlign: 'center'
                  }}>
                    <h4 style={{ color: '#00ffcc', marginBottom: '0.5rem', fontSize: '1.2rem' }}>Twitter</h4>
                    <p style={{ color: '#ccc', margin: '0 0 1rem 0' }}>Follow us for updates and support</p>
                    <a 
                      href="https://twitter.com/Snakstract" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{
                        color: '#00ffcc',
                        textDecoration: 'none',
                        fontWeight: 'bold',
                        fontSize: '1.1rem',
                        padding: '0.5rem 1rem',
                        border: '1px solid #00ffcc',
                        borderRadius: '4px',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={e => {
                        e.target.style.background = '#00ffcc';
                        e.target.style.color = '#000';
                      }}
                      onMouseLeave={e => {
                        e.target.style.background = 'transparent';
                        e.target.style.color = '#00ffcc';
                      }}
                    >
                      @Snakstract →
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '3rem' }}>
          <Link 
            to="/" 
            style={{
              background: 'linear-gradient(135deg, #00ffcc 0%, #c07eff 100%)',
              color: '#000',
              padding: '0.75rem 2rem',
              borderRadius: '8px',
              textDecoration: 'none',
              fontFamily: 'Orbitron, monospace',
              fontWeight: 'bold',
              display: 'inline-block',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(0, 255, 204, 0.3)'
            }}
            onMouseEnter={e => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 20px rgba(0, 255, 204, 0.4)';
            }}
            onMouseLeave={e => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 15px rgba(0, 255, 204, 0.3)';
            }}
          >
            Back to Game
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Support; 