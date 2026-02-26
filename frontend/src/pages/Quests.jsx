import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { useAccount } from 'wagmi';
import useClickSound from '../hooks/useClickSound';
import QuestTracker from '../utils/questTracker';
import { useAchievements } from '../hooks/useAchievements';

const achievementImageMap = {
  'Speed Demon': 'sd.png',
  'Escape Artist': 'escapea.png',
  'Orb Hunter': 'orbhunter.png',
  'Endurance': 'endu.png',
  'Survivor': 'survivor.png',
  'Killer Instinct': 'killer.png',
  'Giant Slayer': 'gs.png',
  'Speed Runner': 'speed_runner.png',
  'Orb Chain': 'orbchain.png'
};

const achievementList = [
  {
    title: 'Speed Demon',
    image: 'sd.png',
    description: 'Boost for 25 seconds total in a single game.',
    reward: 2000
  },
  {
    title: 'Orb Hunter',
    image: 'orbhunter.png',
    description: 'Collect 50 orbs within 2 minutes.',
    reward: 2000
  },
  {
    title: 'Killer Instinct',
    image: 'killer.png',
    description: 'Get 3 kills within 5 minutes.',
    reward: 2000
  },
  {
    title: 'Moving Orb Master',
    image: 'mom.png',
    description: 'Collect 20 moving orbs within 4 minutes.',
    reward: 2000
  },
  {
    title: 'Giant Slayer',
    image: 'gs.png',
    description: 'Kill a player with 35+ segments.',
    reward: 2000
  },
  {
    title: 'Speed Runner',
    image: 'speed_runner.png',
    description: 'Escape within 2 minutes.',
    reward: 2000
  },
  {
    title: 'Orb Chain',
    image: 'orbchain.png',
    description: 'Collect 10 orbs within 30 seconds.',
    reward: 2000
  },
  {
    title: 'Endurance',
    image: 'endu.png',
    description: 'Survive for 20 minutes.',
    reward: 2000
  },
  {
    title: 'Escape Artist',
    image: 'escapea.png',
    description: 'Escape with 25+ segments, 0.02+ ETH, 2+ kills, 50+ orbs, and no deaths.',
    reward: 2000
  }
];

function Quests() {
  const navigate = useNavigate();
  const location = useLocation();
  const { address, isConnected } = useAccount();
  const playClick = useClickSound();
  const [activeSection, setActiveSection] = useState('all');
  const [questTracker] = useState(() => QuestTracker.getInstance());
  const [completedQuests, setCompletedQuests] = useState({});
  const [claimedQuests, setClaimedQuests] = useState({});
  const [achievementSP, setAchievementSP] = useState(0); // Replace with context if available
  const [notifications, setNotifications] = useState([]); // Simple notification system
  const [showAchievementsModal, setShowAchievementsModal] = useState(false);
  const [achievements] = useAchievements();
  console.log('Initial state setup with achievements:', achievements);

  // Set active tab from navigation state on mount
  useEffect(() => {
    if (location.state && location.state.tab) {
      setActiveSection(location.state.tab);
    }
  }, [location.state]);

  // Auto-dismiss notifications after 3 seconds
  useEffect(() => {
    if (notifications.length > 0) {
      const timer = setTimeout(() => {
        setNotifications(prev => prev.slice(1)); // Remove the oldest notification
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [notifications]);
  
  // Update achievements when props change or when localStorage changes
  useEffect(() => {
    console.log('Props achievements changed:', achievements);
    
    // The useAchievements hook manages its own state, so we just need to ensure it's updated.
    // The modal and badge display will reflect the latest achievements from the hook.
  }, [achievements]);
  
  // Add a listener for storage events to update when localStorage changes
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'achievements') {
        try {
          const achievementsData = JSON.parse(e.newValue);
          if (achievementsData) {
            console.log('Storage event detected, achievements in storage:', achievementsData);
            // The useAchievements hook will automatically update its state
          }
        } catch (err) {
          console.error('Error handling storage event:', err);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also check localStorage on mount and periodically
    const checkLocalStorage = () => {
      try {
        const achievementsStr = localStorage.getItem('achievements');
        if (achievementsStr) {
          const achievementsData = JSON.parse(achievementsStr);
          if (achievementsData) {
            console.log('Checking localStorage, found achievements:', achievementsData);
            
            // The useAchievements hook will automatically update its state
          }
        }
      } catch (err) {
        console.error('Error checking localStorage:', err);
      }
    };
    
    // Check immediately
    checkLocalStorage();
    
    // Then check every 500ms for more responsive updates
    const interval = setInterval(checkLocalStorage, 500);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Load quest completion status on mount and refresh periodically
  useEffect(() => {
    if (address) {
      const updateQuestData = () => {
        const completed = questTracker.completedQuests[address] || {};
        const claimed = {};
        Object.keys(completed).forEach(questId => {
          claimed[questId] = completed[questId]?.claimed || false;
        });
        setCompletedQuests(completed);
        setClaimedQuests(claimed);
        
        // Remove the code that forces modal re-render
        // This was causing the modal to open and close instantly
        
        // Also check for achievements in localStorage
        try {
          const achievementsStr = localStorage.getItem('achievements');
          if (achievementsStr) {
            const achievementsData = JSON.parse(achievementsStr);
            if (achievementsData) {
              console.log('Checking achievements in updateQuestData:', achievementsData);
              // The useAchievements hook will automatically update its state
            }
          }
        } catch (err) {
          console.error('Error reading achievements from localStorage:', err);
        }
      };
      
      // Update immediately when component mounts
      updateQuestData();
      
      // Then update every 500ms for real-time progress
      const refreshInterval = setInterval(updateQuestData, 500);
      
      // Also update when page becomes visible
      const handleVisibilityChange = () => {
        if (!document.hidden) {
          updateQuestData();
        }
      };
      
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      return () => {
        clearInterval(refreshInterval);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [address, questTracker, showAchievementsModal]);

  // Minimal debug: confirm singleton and address
  useEffect(() => {
    if (questTracker && address) {
      // eslint-disable-next-line no-console
      console.log('[QuestDebug] Quests QuestTracker instance:', questTracker, 'address:', address);
    }
  }, [questTracker, address]);

  // Handle quest claim
  const handleClaimQuest = async (questId) => {
    if (!address) {
      return;
    }
    
    playClick();
    
    const reward = questTracker.claimQuestReward(address, questId);
    
    if (reward) {
      // Update local state
      setClaimedQuests(prev => ({ ...prev, [questId]: true }));
      setCompletedQuests(prev => ({
        ...prev,
        [questId]: { ...prev[questId], claimed: true }
      }));

      // Immediately add SP to achievementSP
      const newAchievementSP = achievementSP + reward;
      setAchievementSP(newAchievementSP);

      // Find quest name for logging
      const questObj = quests.find(q => q.id === questId);
      const questName = questObj ? questObj.title : '';

      // Send SP update to server via HTTP POST
      try {
        const response = await fetch('http://10.0.0.248:2567/update-sp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            wallet: address,
            spToAdd: reward,
            name: 'Quest Player', // You can customize this name
            questId: questId,
            questName: questName
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          
          // Trigger immediate refresh of SP display components
          // Dispatch a custom event that SPButton and other components can listen to
          const event = new CustomEvent('spUpdated', { 
            detail: { 
              wallet: address, 
              newTotalSP: result.newTotalSP,
              spAdded: reward 
            } 
          });
          window.dispatchEvent(event);
          
          // Also dispatch a quest completion event as fallback
          window.dispatchEvent(new CustomEvent('questCompleted', { 
            detail: { 
              wallet: address, 
              questId: questId,
              reward: reward 
            } 
          }));
        } else {
          console.error('Failed to update SP on server, status:', response.status);
          const errorText = await response.text();
          console.error('Error response:', errorText);
        }
      } catch (error) {
        console.error('Error updating SP:', error);
      }

      // Show notification for this quest
      const notificationId = Date.now() + Math.random();
      setNotifications(prev => [
        ...prev,
        {
          id: notificationId,
          quest: questId,
          message: `🎉 Claimed ${reward.toLocaleString()} SP for quest!`,
          timestamp: Date.now(),
          reward
        }
      ]);
    }
  };

  // Get quest progress for multi-game quests
  const getQuestProgress = (questId) => {
    if (!address) return null;
    return questTracker.getQuestProgress(address, questId);
  };

  // Check if quest is completed
  const isQuestCompleted = (questId) => {
    if (!address) return false;
    return questTracker.isQuestCompleted(address, questId);
  };

  // Check if quest is claimed
  const isQuestClaimed = (questId) => {
    if (!address) return false;
    return questTracker.isQuestClaimed(address, questId);
  };

  // Get quest definitions from QuestTracker
  const quests = questTracker.getAllQuests();

  // Replace 'seasonal' with 'completed' in sections (remove persistent)
  const sections = [
    { id: 'all', title: 'All Quests', icon: '🎯' },
    { id: 'achievements', title: 'Achievements', icon: '🎖️' },
    { id: 'orbs', title: 'Orbs', icon: '🔮' },
    { id: 'eth_orbs', title: 'ETH Orbs', icon: '💰' },
    { id: 'kills', title: 'Kills', icon: '💀' },
    { id: 'survival', title: 'Survival', icon: '⏱️' },
    { id: 'daily', title: 'Daily', icon: '📅' },
    { id: 'weekly', title: 'Weekly', icon: '📆' },
    { id: 'monthly', title: 'Monthly', icon: '🗓️' },
    { id: 'completed', title: 'Completed', icon: '✅' }
  ];

  // Helper function to get rarity order (lower number = higher priority)
  const getRarityOrder = (rarity) => {
    const rarityOrder = {
      common: 1,
      rare: 2,
      epic: 3,
      legendary: 4,
      ultra: 5
    };
    return rarityOrder[rarity] || 6;
  };

  // Helper function to get quest progress percentage
  const getQuestProgressPercentage = (questId) => {
    if (!address) return 0;
    const progress = getQuestProgress(questId);
    return progress ? progress.percentage : 0;
  };

  // Replace the filteredQuests assignment with logic to include deaths in survival tab
  const filteredQuests = activeSection === 'all' 
    ? quests.filter(q => q.category !== 'seasonal')
    : activeSection === 'survival'
      ? quests.filter(quest => (quest.category === 'survival' || quest.category === 'deaths') && quest.category !== 'seasonal')
    : quests.filter(quest => quest.category === activeSection && quest.category !== 'seasonal');

  // Sort quests: by rarity, then by progress, then completed at bottom
  const sortedQuests = [...filteredQuests].sort((a, b) => {
    const aCompleted = isQuestCompleted(a.id);
    const bCompleted = isQuestCompleted(b.id);
    
    // Completed quests go to bottom
    if (aCompleted && !bCompleted) return 1;
    if (!aCompleted && bCompleted) return -1;
    
    // For non-completed quests, sort by rarity first
    const aRarityOrder = getRarityOrder(a.rarity);
    const bRarityOrder = getRarityOrder(b.rarity);
    
    if (aRarityOrder !== bRarityOrder) {
      return aRarityOrder - bRarityOrder;
    }
    
    // Within same rarity, sort by progress (higher progress first)
    const aProgress = getQuestProgressPercentage(a.id);
    const bProgress = getQuestProgressPercentage(b.id);
    
    return bProgress - aProgress;
  });

  // Completed quests for the user (excluding seasonal)
  const completedQuestList = quests.filter(q => isQuestCompleted(q.id) && q.category !== 'seasonal');

  // Sort completed quests by completion time (most recent first)
  const sortedCompletedQuests = [...completedQuestList].sort((a, b) => {
    const aCompletionTime = questTracker.completedQuests[address]?.[a.id]?.completedAt || 0;
    const bCompletionTime = questTracker.completedQuests[address]?.[b.id]?.completedAt || 0;
    return bCompletionTime - aCompletionTime;
  });

  // Table for completed quests (for 'completed' section)
  const renderCompletedTable = () => {
    // Use persistent history if available
    let history = [];
    if (questTracker.completedQuestHistory && questTracker.completedQuestHistory[address]) {
      history = questTracker.completedQuestHistory[address]
        .map(entry => {
          const q = quests.find(q => q.id === entry.questId);
          return q ? { ...q, completedAt: entry.completedAt } : null;
        })
        .filter(Boolean)
        .sort((a, b) => b.completedAt - a.completedAt);
        // Show all completions, not just last 10
    }
    // Fallback to old logic if no history
    const displayList = history.length > 0 ? history : sortedCompletedQuests;
    return (
      <div style={{ marginTop: '2rem' }}>
        <h2 style={{ color: '#00ffcc', fontFamily: 'Orbitron, sans-serif', marginBottom: '1.5rem', letterSpacing: '0.01em', textShadow: '0 2px 32px #00ffe055, 0 0 1px #00ffe0', display: 'flex', alignItems: 'center', gap: '0.18em' }}>
          Recently Completed Quests
          <img src="/background.png" alt="Background" style={{ height: '3.6em', marginLeft: '0.18em', verticalAlign: 'middle', display: 'inline-block', filter: 'drop-shadow(0 0 8px #00ffe0) drop-shadow(0 0 16px #00ffe066)' }} />
        </h2>
        <div style={{
          overflowX: 'auto',
          borderRadius: '24px',
          boxShadow: '0 8px 32px 0 rgba(0,255,204,0.10), 0 1.5px 8px 0 rgba(162,89,255,0.10)',
          background: 'rgba(24,28,43,0.32)',
          backdropFilter: 'blur(16px)',
          border: '1.5px solid rgba(0,255,204,0.10)',
          padding: '1.5rem',
          marginBottom: '2rem',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ color: '#00ffcc', fontWeight: 700, fontSize: '1.1em', padding: '0.8rem' }}>Quest</th>
                <th style={{ color: '#a259ff', fontWeight: 700, fontSize: '1.1em', padding: '0.8rem' }}>Category</th>
                <th style={{ color: '#fff', fontWeight: 700, fontSize: '1.1em', padding: '0.8rem' }}>Rarity</th>
                <th style={{ color: '#00ffcc', fontWeight: 700, fontSize: '1.1em', padding: '0.8rem' }}>Reward</th>
                <th style={{ color: '#fff', fontWeight: 700, fontSize: '1.1em', padding: '0.8rem' }}>Completed</th>
                <th style={{ color: '#aaa', fontWeight: 700, fontSize: '1.1em', padding: '0.8rem' }}>Period</th>
              </tr>
            </thead>
            <tbody>
              {displayList.map(q => (
                <tr key={q.id + (q.completedAt || '') + (q.period || '')} style={{ borderBottom: '1px solid #222', background: 'rgba(255,255,255,0.03)', boxShadow: '0 2px 8px 0 rgba(162,89,255,0.04)' }}>
                  <td style={{ padding: '0.8rem', color: '#fff', fontWeight: 600, borderLeft: '2px solid #a259ff', borderRadius: '12px 0 0 12px', background: 'rgba(162,89,255,0.04)' }}>{q.title}</td>
                  <td style={{ padding: '0.8rem', color: '#00ffcc', fontWeight: 500 }}>{q.category}</td>
                  <td style={{ padding: '0.8rem', fontWeight: 700 }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '0.3em 1.1em',
                      borderRadius: '16px',
                      fontWeight: 700,
                      fontSize: '0.95em',
                      background: getRarityGradient(q.rarity),
                      color: '#181c2b', // dark text for contrast
                      boxShadow: '0 0 12px ' + getRarityColor(q.rarity) + '44',
                      textShadow: '0 0 8px ' + getRarityColor(q.rarity) + '22',
                      border: '1.5px solid ' + getRarityColor(q.rarity),
                      letterSpacing: '0.04em',
                    }}>{q.rarity}</span>
                  </td>
                  <td style={{ padding: '0.8rem', color: '#a259ff', fontWeight: 700 }}>+{q.reward.toLocaleString()} SP</td>
                  <td style={{ padding: '0.8rem', color: '#00ffcc', fontWeight: 600 }}>
                    {q.completedAt ? new Date(q.completedAt).toLocaleString() : 'Completed'}
                    {!isQuestClaimed(q.id) && (
                      <button
                        onClick={() => handleClaimQuest(q.id)}
                        style={{
                          marginLeft: '1em',
                          background: 'linear-gradient(135deg, #00ffcc 0%, #6c5ce7 100%)',
                          color: '#181c2b',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '0.4em 1.2em',
                          fontWeight: 700,
                          fontSize: '1em',
                          cursor: 'pointer',
                          boxShadow: '0 0 8px #00ffcc55',
                          transition: 'background 0.2s, color 0.2s',
                        }}
                      >
                        Claim SP
                      </button>
                    )}
                  </td>
                  <td style={{ padding: '0.8rem', color: '#aaa', fontWeight: 500 }}>
                    {q.period || ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const getRarityColor = (rarity) => {
    const colors = {
      common: '#4ade80',
      rare: '#60a5fa',
      epic: '#a855f7',
      legendary: '#f59e0b', // golden orange
      ultra: '#f87171'      // light red
    };
    return colors[rarity] || '#4ade80';
  };

  const getRarityGradient = (rarity) => {
    const gradients = {
      common: 'linear-gradient(135deg, #4ade80, #22c55e)',
      rare: 'linear-gradient(135deg, #60a5fa, #3b82f6)',
      epic: 'linear-gradient(135deg, #a855f7, #9333ea)',
      legendary: 'linear-gradient(135deg, #f59e0b, #d97706)', // golden orange
      ultra: 'linear-gradient(135deg, #f87171, #ef4444)'      // light red
    };
    return gradients[rarity] || 'linear-gradient(135deg, #4ade80, #22c55e)';
  };

  if (!isConnected) {
    return (
      <div className="page-container" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0e1a 0%, #1a1f2e 50%, #0a0e1a 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <div style={{ background: 'rgba(24, 28, 43, 0.95)', borderRadius: '24px', padding: '3rem 4rem', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', border: '2px solid rgba(0,255,204,0.2)' }}>
            <h2 style={{ color: '#00ffcc', marginBottom: '1rem' }}>Connect Your Wallet</h2>
            <p style={{ color: '#ccc' }}>Please connect your wallet to view your quests.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ 
      minHeight: '100vh', 
      position: 'relative', 
      overflow: 'hidden',
      background: 'rgba(24,28,43,0.68)'
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
        .quests-scroll::-webkit-scrollbar {
          width: 8px;
        }
        .quests-scroll::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #00ffcc 0%, #6c5ce7 100%);
          border-radius: 4px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .quests-scroll::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes pulse {
          0% { opacity: 0.3; }
          100% { opacity: 0.7; }
        }
        @keyframes slideIn {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .quest-card {
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
        .quest-title {
          background: linear-gradient(135deg, #00ffcc 0%, #6c5ce7 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-size: 2.5rem;
          font-weight: bold;
          text-align: center;
          margin-bottom: 1rem;
          text-shadow: 0 0 30px rgba(0, 255, 204, 0.5);
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
          height: '90vh',
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
              <h1 style={{ color: '#00ffe0', fontSize: '2.2rem', fontWeight: 800, margin: 0, letterSpacing: '-1px', textShadow: '0 2px 16px #00ffe044, 0 0 1px #00ffe0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <img src="/quests.png" alt="Quests" style={{ height: '2em', verticalAlign: 'middle', display: 'inline-block', marginRight: '0.18em', filter: 'drop-shadow(0 0 4px #00ffe0) drop-shadow(0 0 8px #00ffe066)' }} />
                Quests
              </h1>
            </div>

            <nav style={{ flex: 1, padding: '0 1rem' }}>
              {sections.map((section) => (
                <div
                  key={section.id}
                  className={`nav-item ${activeSection === section.id ? 'active' : ''}`}
                  onClick={() => {
                    setActiveSection(section.id);
                    playClick();
                  }}
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
          </div>

          {/* Content Area */}
          <div className="quests-scroll" style={{
            flex: 1,
            padding: '3rem',
            overflowY: 'auto',
            position: 'relative'
          }}>
            {activeSection === 'completed' ? (
              renderCompletedTable()
            ) : (
              // Quest Grid
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
                gap: '2rem',
                padding: '1rem 0'
              }}>
                {/* Badges Button for Achievements section */}
                {activeSection === 'achievements' && (
                  <div style={{ position: 'absolute', top: '0.5rem', right: '2.5rem', zIndex: 10 }}>
                    <button
                      onClick={() => setShowAchievementsModal(true)}
                      style={{
                        background: 'linear-gradient(135deg, #00ffcc, #a259ff)',
                        color: '#181c2b',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '0.12rem 0.7rem',
                        boxShadow: '0 0 6px #00ffe044',
                        cursor: 'pointer',
                        letterSpacing: '0.5px',
                        textShadow: '0 1px 4px #00ffe044, 0 0 1px #00ffe0',
                        opacity: 0.85,
                        height: '1.6rem',
                        minHeight: 'unset',
                        lineHeight: '1.1',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      🏅Achievement Badges
                    </button>
                  </div>
                )}
                {sortedQuests.map((quest, index) => (
                  <div
                    key={quest.id}
                    className="quest-card"
                    style={{
                      background: isQuestCompleted(quest.id) ? 'rgba(128, 128, 128, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                      border: `2px solid ${getRarityColor(quest.rarity)}`,
                      borderRadius: '20px',
                      padding: '2rem',
                      position: 'relative',
                      overflow: 'hidden',
                      backdropFilter: 'blur(10px)',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      opacity: isQuestCompleted(quest.id) ? 0.7 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (!isQuestCompleted(quest.id)) {
                        e.target.style.transform = 'translateY(-5px)';
                        e.target.style.boxShadow = `0 10px 30px rgba(0, 0, 0, 0.3), 0 0 20px ${getRarityColor(quest.rarity)}40`;
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    {/* Rarity border glow */}
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: getRarityGradient(quest.rarity),
                      opacity: 0.1,
                      borderRadius: '20px',
                      zIndex: -1
                    }} />

                    {/* Quest header */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      marginBottom: '1.5rem'
                    }}>
                      <div style={{
                        fontSize: '2.5rem',
                        filter: 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.3))'
                      }}>
                        {quest.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h3 style={{
                          color: isQuestCompleted(quest.id) ? '#888' : getRarityColor(quest.rarity),
                          fontSize: '1.4rem',
                          fontWeight: 'bold',
                          margin: '0 0 0.5rem 0',
                          textShadow: isQuestCompleted(quest.id) ? 'none' : `0 0 10px ${getRarityColor(quest.rarity)}40`
                        }}>
                          {quest.title}
                        </h3>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <span style={{
                            background: getRarityGradient(quest.rarity),
                            color: '#000',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '20px',
                            fontSize: '0.8rem',
                            fontWeight: 'bold',
                            textTransform: 'uppercase'
                          }}>
                            {quest.rarity}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quest description */}
                    <p style={{
                      color: isQuestCompleted(quest.id) ? '#888' : '#ddd',
                      fontSize: '1rem',
                      lineHeight: '1.6',
                      marginBottom: '1.5rem'
                    }}>
                      {quest.description}
                    </p>

                    {/* Requirements */}
                    <div style={{
                      background: 'rgba(0, 0, 0, 0.3)',
                      borderRadius: '12px',
                      padding: '1rem',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <h4 style={{
                        color: '#00ffcc',
                        fontSize: '1rem',
                        margin: '0 0 0.75rem 0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        📋 Requirements:
                      </h4>
                      <ul style={{
                        color: '#ddd',
                        margin: 0,
                        paddingLeft: '1.5rem',
                        fontSize: '0.9rem'
                      }}>
                        {quest.requirements.map((req, idx) => (
                          <li key={idx} style={{ marginBottom: '0.25rem' }}>
                            {req}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Quest completion status and claim button */}
                    {isQuestCompleted(quest.id) ? (
                      <div style={{
                        position: 'absolute',
                        top: '5rem',
                        right: '1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                        alignItems: 'flex-end'
                      }}>
                        {isQuestClaimed(quest.id) ? (
                          <div style={{
                            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                            color: '#000',
                            padding: '0.5rem 1rem',
                            borderRadius: '20px',
                            fontSize: '0.9rem',
                            fontWeight: 'bold',
                            boxShadow: '0 0 15px rgba(34, 197, 94, 0.4)'
                          }}>
                            ✅ Claimed
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleClaimQuest(quest.id);
                            }}
                            style={{
                              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                              color: '#000',
                              border: 'none',
                              padding: '0.5rem 1rem',
                              borderRadius: '20px',
                              fontSize: '0.9rem',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              boxShadow: '0 0 15px rgba(245, 158, 11, 0.4)',
                              transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.transform = 'scale(1.05)';
                              e.target.style.boxShadow = '0 0 20px rgba(245, 158, 11, 0.6)';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.transform = 'scale(1)';
                              e.target.style.boxShadow = '0 0 15px rgba(245, 158, 11, 0.4)';
                            }}
                          >
                            🎁 Claim SP
                          </button>
                        )}
                      </div>
                    ) : (
                      <div style={{
                        position: 'absolute',
                        top: '5rem',
                        right: '1rem',
                        background: getRarityGradient(quest.rarity),
                        color: '#000',
                        padding: '0.5rem 1rem',
                        borderRadius: '20px',
                        fontSize: '0.9rem',
                        fontWeight: 'bold',
                        boxShadow: `0 0 15px ${getRarityColor(quest.rarity)}40`
                      }}>
                        +{quest.reward.toLocaleString()} SP
                      </div>
                    )}

                    {/* Progress bar for multi-game quests */}
                    {quest.type === 'multi_game' && !isQuestCompleted(quest.id) && (
                      <div style={{
                        marginTop: '1rem',
                        padding: '0.5rem',
                        background: 'rgba(0, 0, 0, 0.2)',
                        borderRadius: '8px'
                      }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '0.5rem'
                        }}>
                          <span style={{ color: '#00ffcc', fontSize: '0.8rem' }}>Progress</span>
                          <span style={{ color: '#fff', fontSize: '0.8rem' }}>
                            {(() => {
                              const progress = getQuestProgress(quest.id);
                              return progress ? `${Math.round(progress.percentage)}%` : '0%';
                            })()}
                          </span>
                        </div>
                        <div style={{
                          width: '100%',
                          height: '8px',
                          background: 'rgba(255, 255, 255, 0.1)',
                          borderRadius: '4px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${(() => {
                              const progress = getQuestProgress(quest.id);
                              return progress ? progress.percentage : 0;
                            })()}%`,
                            height: '100%',
                            background: getRarityGradient(quest.rarity),
                            borderRadius: '4px',
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* No empty state message here */}
          </div>
        </div>
      </div>
      {notifications.map(n => (
        <div key={n.id} style={{
          position: 'fixed',
          top: 80 + notifications.indexOf(n) * 48,
          right: 32,
          background: 'linear-gradient(90deg, #00ffcc 0%, #a259ff 100%)',
          color: '#000',
          borderRadius: 12,
          padding: '1rem 2rem',
          fontWeight: 700,
          fontSize: '1.1rem',
          boxShadow: '0 4px 24px #00ffcc44',
          zIndex: 9999,
          marginBottom: 8,
          animation: 'fadeIn 0.5s',
        }}>
          {n.message}
        </div>
      ))}
      {showAchievementsModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(24,28,43,0.55)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 0.3s',
        }}>
                      <div style={{
            background: 'rgba(34, 40, 60, 0.65)',
            borderRadius: 32,
            boxShadow: '0 8px 40px #00ffe044, 0 0 60px #a259ff33, 0 1.5px 16px #fff1',
            padding: '2.7rem 2.7rem 2.2rem 2.7rem',
            minWidth: 380,
            maxWidth: 900,
            width: '96vw',
            maxHeight: '82vh',
            overflowY: 'auto',
            position: 'relative',
            border: '1.5px solid rgba(0,255,224,0.18)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            transition: 'box-shadow 0.3s',
          }}>
            <button
              onClick={() => setShowAchievementsModal(false)}
              style={{
                position: 'absolute', top: 18, right: 18,
                background: 'rgba(0,255,224,0.13)',
                color: '#00ffe0', fontWeight: 800, fontSize: '1.25rem',
                border: 'none', borderRadius: '50%', width: 40, height: 40,
                cursor: 'pointer', boxShadow: '0 0 12px #00ffe044',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.2s, color 0.2s',
              }}
              onMouseEnter={e => { e.target.style.background = 'rgba(0,255,224,0.22)'; e.target.style.color = '#fff'; }}
              onMouseLeave={e => { e.target.style.background = 'rgba(0,255,224,0.13)'; e.target.style.color = '#00ffe0'; }}
            >✕</button>
            <h2 style={{
              color: '#00ffe0', fontFamily: 'Orbitron, sans-serif',
              fontWeight: 900, fontSize: '2.1rem', marginBottom: '1.2rem',
              letterSpacing: '-1px', textShadow: '0 2px 24px #00ffe044, 0 0 1px #00ffe0',
              textAlign: 'center',
              background: 'linear-gradient(90deg, #00ffe0 0%, #a259ff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 8px #00ffe0cc)'
            }}>
              🏅 Achievement Badges
            </h2>
            {(() => {
              console.log('Rendering achievements modal with:', achievements);
              const acquired = achievementList.filter(a => achievements[a.title]);
              console.log('Acquired achievements:', acquired.map(a => a.title));
              const totalSP = acquired.reduce((sum, a) => {
                // Force a number type for the count
                const count = parseInt(achievements[a.title]) || 1;
                console.log(`Achievement ${a.title}: count=${count}, reward=${a.reward}, total=${count * a.reward}`);
                return sum + count * (a.reward || 0);
              }, 0);
              // Soft color palette for glows
              const cardGlows = [
                '0 0 16px 2px #00ffe055',
                '0 0 16px 2px #a259ff55',
                '0 0 16px 2px #ffb34755',
                '0 0 16px 2px #43cea255',
                '0 0 16px 2px #ffd20055',
                '0 0 16px 2px #fa71cd55',
                '0 0 16px 2px #30cfd055',
                '0 0 16px 2px #ff585855',
                '0 0 16px 2px #00c3ff55',
              ];
              return (
                <>
                  <div style={{ marginBottom: '1.2rem', color: '#fff', fontWeight: 700, textAlign: 'center', fontSize: '1.1rem', letterSpacing: '0.5px' }}>
                    Total Badges: <span style={{ color: '#00ffe0', fontSize: '1.3em', textShadow: '0 0 8px #00ffe0aa' }}>
                      {acquired.reduce((sum, a) => {
                        // Force a number type for the count
                        const count = parseInt(achievements[a.title]) || 1;
                        return sum + count;
                      }, 0)}
                    </span>
                    <br />
                    Total SP Rewarded: <span style={{ color: '#a259ff', fontSize: '1.1em', textShadow: '0 0 8px #a259ffaa' }}>{totalSP.toLocaleString()} SP</span>
                  </div>
                  {acquired.length === 0 ? (
                    <div style={{ color: '#aaa', fontStyle: 'italic', marginBottom: 16, textAlign: 'center' }}>
                      No achievements earned yet. Play more to unlock badges!
                    </div>
                  ) : (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                      gap: '1rem',
                      marginTop: 8,
                      maxHeight: '50vh',
                      overflowY: 'auto',
                      padding: '0.5rem',
                      justifyItems: 'center'
                    }}
                    className="no-scrollbar">
                      {acquired.map((a, idx) => {
                        // Force a number type for the count
                        const count = parseInt(achievements[a.title]) || 1;
                        console.log(`Rendering badge for ${a.title}: count=${count}`);
                        const totalSP = count * (a.reward || 0);
                        // Soft color palette for backgrounds and glows
                        const cardBgColors = [
                          'rgba(0,255,224,0.13)', // teal
                          'rgba(162,89,255,0.13)', // purple
                          'rgba(255,179,71,0.13)', // orange
                          'rgba(67,206,162,0.13)', // green
                          'rgba(255,210,0,0.13)', // yellow
                          'rgba(250,113,205,0.13)', // pink
                          'rgba(48,207,208,0.13)', // blue
                          'rgba(255,88,88,0.13)', // red
                          'rgba(0,195,255,0.13)', // cyan
                        ];
                        const cardGlows = [
                          '0 0 16px 2px #00ffe055',
                          '0 0 16px 2px #a259ff55',
                          '0 0 16px 2px #ffb34755',
                          '0 0 16px 2px #43cea255',
                          '0 0 16px 2px #ffd20055',
                          '0 0 16px 2px #fa71cd55',
                          '0 0 16px 2px #30cfd055',
                          '0 0 16px 2px #ff585855',
                          '0 0 16px 2px #00c3ff55',
                        ];
                        const bg = cardBgColors[idx % cardBgColors.length];
                        const glow = cardGlows[idx % cardGlows.length];
                        return (
                          <div key={a.title} style={{
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center',
                            background: bg,
                            borderRadius: 16,
                            padding: '1rem',
                            boxShadow: `0 2px 18px #0008, ${glow}`,
                            border: '1.5px solid rgba(255,255,255,0.18)',
                            backdropFilter: 'blur(8px)',
                            WebkitBackdropFilter: 'blur(8px)',
                            transition: 'transform 0.18s, box-shadow 0.18s',
                            height: '100%',
                            width: '100%',
                            maxWidth: '140px',
                            position: 'relative',
                            cursor: 'pointer',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.045)'; e.currentTarget.style.boxShadow = `0 8px 32px #00ffe044, 0 0 24px #a259ff33, ${glow}`; }}
                          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = `0 2px 18px #0008, ${glow}`; }}
                          >
                            {/* Dark glow behind image */}
                            <div style={{
                              position: 'absolute',
                              top: 8,
                              left: '50%',
                              transform: 'translateX(-50%)',
                              width: 70,
                              height: 45,
                              borderRadius: '50%',
                              background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.15) 100%)',
                              filter: 'blur(8px)',
                              zIndex: 0,
                              pointerEvents: 'none',
                            }} />
                            <img
                              src={`/${a.image}`}
                              alt={a.title}
                              style={{
                                width: 48, 
                                height: 48, 
                                objectFit: 'contain', 
                                marginBottom: '0.75rem',
                                filter: 'drop-shadow(0 0 12px #fff8)', 
                                borderRadius: 8,
                                background: 'rgba(255,255,255,0.10)',
                                boxShadow: '0 0 12px #fff4',
                                transition: 'box-shadow 0.2s',
                                border: 'none',
                                position: 'relative',
                                zIndex: 1,
                              }}
                              onError={e => { e.target.onerror = null; e.target.src = '/achieve.png'; }}
                            />
                            <div style={{ flex: 1, width: '100%', textAlign: 'center' }}>
                              <div style={{ 
                                color: '#fff', 
                                fontWeight: 900, 
                                fontSize: '0.9rem', 
                                marginBottom: '0.5rem', 
                                letterSpacing: '-0.5px', 
                                textShadow: '0 0 8px #00ffe0cc' 
                              }}>
                                {a.title}
                              </div>
                              <div style={{ 
                                color: '#f3f3f3', 
                                fontSize: '0.8rem', 
                                marginBottom: '0.75rem', 
                                fontWeight: 500, 
                                textShadow: '0 0 4px #a259ff44', 
                                lineHeight: '1.2' 
                              }}>
                                {a.description}
                              </div>
                              <div style={{ 
                                color: '#00ffe0', 
                                fontWeight: 700, 
                                fontSize: '0.85rem', 
                                marginBottom: '0.25rem', 
                                textShadow: '0 0 4px #00ffe088' 
                              }}>
                                +{a.reward.toLocaleString()} SP
                              </div>
                              <div style={{ 
                                color: '#fff', 
                                fontWeight: 700, 
                                fontSize: '0.8rem', 
                                marginBottom: '0.25rem' 
                              }}>
                                x{count}
                              </div>
                              <div style={{ 
                                color: '#a259ff', 
                                fontWeight: 900, 
                                fontSize: '0.9rem', 
                                textShadow: '0 0 8px #a259ff88' 
                              }}>
                                {totalSP.toLocaleString()} SP
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

export default Quests; 