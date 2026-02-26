// Quest tracking system for Snakstract
class QuestTracker {
  constructor() {
    // Singleton pattern - only create one instance
    if (QuestTracker.instance) {
      return QuestTracker.instance;
    }
    QuestTracker.instance = this;
    
    this.quests = [];
    this.playerProgress = {};
    this.completedQuests = {};
    this.completedQuestHistory = {}; // NEW: persistent history of completions
    this.claimedQuests = {};
    this.claimedSPRewards = {}; // Store claimed SP rewards per player
    
    // Initialize quest definitions
    this.initializeQuests();
    
    // Load saved data from localStorage
    this.loadFromStorage();

    // --- Reroll logic for daily/weekly/monthly quests ---
    const now = new Date();
    const todayKey = `${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()}`;
    const weekKey = `${now.getFullYear()}-W${getWeekNumber(now)}`;
    const monthKey = `${now.getFullYear()}-${now.getMonth()+1}`;
    const lastReset = JSON.parse(localStorage.getItem('questResets') || '{}');
    let changed = false;

    // Helper to reset quests by category
    const resetQuestsByCategory = (category) => {
      console.log(`[QuestTracker] Resetting quests for category: ${category}`);
      
      // Before resetting, save any unclaimed completed quests to a backup
      const unclaimedCompletedQuests = {};
      
      for (const player in this.completedQuests) {
        unclaimedCompletedQuests[player] = {};
        
        for (const questId in this.completedQuests[player]) {
          const quest = this.quests.find(q => q.id === questId);
          
          // If this is a quest of the category being reset and it's not claimed yet
          if (quest && quest.category === category && !this.completedQuests[player][questId].claimed) {
            console.log(`[QuestTracker] Found unclaimed completed quest for player ${player}: ${questId}`);
            unclaimedCompletedQuests[player][questId] = { ...this.completedQuests[player][questId] };
          }
        }
      }
      
      // Now perform the reset
      for (const player in this.playerProgress) {
        for (const quest of this.quests) {
          if (quest.category === category) {
            if (this.playerProgress[player][quest.id]) {
              console.log(`[QuestTracker] Resetting progress for player ${player}, quest ${quest.id}`);
              delete this.playerProgress[player][quest.id];
            }
            
            if (this.completedQuests[player] && this.completedQuests[player][quest.id]) {
              // Only delete if it's already been claimed
              if (this.completedQuests[player][quest.id].claimed) {
                console.log(`[QuestTracker] Removing claimed quest for player ${player}, quest ${quest.id}`);
                delete this.completedQuests[player][quest.id];
              } else {
                console.log(`[QuestTracker] Preserving unclaimed quest for player ${player}, quest ${quest.id}`);
                // Keep it - we'll handle this in the restoration step
              }
            }
            
            if (this.claimedQuests[player] && this.claimedQuests[player][quest.id]) {
              delete this.claimedQuests[player][quest.id];
            }
            
            // DO NOT delete from completedQuestHistory
          }
        }
      }
      
      // Restore any unclaimed completed quests that we backed up
      for (const player in unclaimedCompletedQuests) {
        for (const questId in unclaimedCompletedQuests[player]) {
          if (!this.completedQuests[player]) {
            this.completedQuests[player] = {};
          }
          
          console.log(`[QuestTracker] Restoring unclaimed quest for player ${player}, quest ${questId}`);
          this.completedQuests[player][questId] = unclaimedCompletedQuests[player][questId];
        }
      }
    };

    // Daily reset
    if (lastReset.daily !== todayKey) {
      resetQuestsByCategory('daily');
      lastReset.daily = todayKey;
      changed = true;
    }
    // Weekly reset
    if (lastReset.weekly !== weekKey) {
      resetQuestsByCategory('weekly');
      lastReset.weekly = weekKey;
      changed = true;
    }
    // Monthly reset
    if (lastReset.monthly !== monthKey) {
      resetQuestsByCategory('monthly');
      lastReset.monthly = monthKey;
      changed = true;
    }
    if (changed) {
      localStorage.setItem('questResets', JSON.stringify(lastReset));
      this.saveToStorage();
    }
    // --- End reroll logic ---
    
    // Force refresh quest requirements to ensure auto-generation runs
    // this.refreshQuestRequirements(); // Temporarily disabled to fix manual requirements
  }

  // Static method to get the singleton instance
  static getInstance() {
    if (!QuestTracker.instance) {
      QuestTracker.instance = new QuestTracker();
    }
    return QuestTracker.instance;
  }

  // Load data from localStorage
  loadFromStorage() {
    try {
      const savedProgress = localStorage.getItem('snakstract_quest_progress');
      const savedCompleted = localStorage.getItem('snakstract_quest_completed');
      const savedClaimed = localStorage.getItem('snakstract_quest_claimed');
      const savedSPRewards = localStorage.getItem('snakstract_quest_sp_rewards');
      const hist = localStorage.getItem('completedQuestHistory');
      
      if (savedProgress) {
        this.playerProgress = JSON.parse(savedProgress);
      }
      if (savedCompleted) {
        this.completedQuests = JSON.parse(savedCompleted);
      }
      if (savedClaimed) {
        this.claimedQuests = JSON.parse(savedClaimed);
      }
      if (savedSPRewards) {
        this.claimedSPRewards = JSON.parse(savedSPRewards);
      }
      if (hist) this.completedQuestHistory = JSON.parse(hist);
    } catch (error) {
      console.error('Error loading quest data from localStorage:', error);
    }
  }

  // Save data to localStorage
  saveToStorage() {
    try {
      localStorage.setItem('snakstract_quest_progress', JSON.stringify(this.playerProgress));
      localStorage.setItem('snakstract_quest_completed', JSON.stringify(this.completedQuests));
      localStorage.setItem('snakstract_quest_claimed', JSON.stringify(this.claimedQuests));
      localStorage.setItem('snakstract_quest_sp_rewards', JSON.stringify(this.claimedSPRewards));
      localStorage.setItem('completedQuestHistory', JSON.stringify(this.completedQuestHistory));
    } catch (error) {
      console.error('Error saving quest data to localStorage:', error);
    }
  }

  initializeQuests() {
    this.quests = [
      // Single-game quests
      {
        id: 'speed_demon_common',
        title: 'Speed Demon',
        description: 'Use boost for 23 seconds total in a single game while collecting at least 20 orbs',
        requirements: ['23s boost time', '20 orbs collected'],
        reward: 3000,
        rarity: 'common',
        category: 'achievements',
        icon: '⚡',
        type: 'single_game',
        criteria: {
          boostTime: 23,
          orbsCollected: 20
        }
      },
      {
        id: 'escape_artist_rare',
        title: 'Escape Artist',
        description: 'Escape with 25+ segments, 0.02+ ETH, 2+ kills, and 50+ orbs in a single game without dying',
        requirements: ['25+ segments', '0.02+ ETH collected', '2+ kills', '50+ orbs', 'Escape without dying once'],
        reward: 12000,
        rarity: 'rare',
        category: 'achievements',
        icon: '🏃',
        type: 'single_game',
        criteria: {
          segments: 25,
          ethCollected: 0.02,
          kills: 2,
          orbsCollected: 50,
          escaped: true
        }
      },
      {
        id: 'survival_master_epic',
        title: 'Survival Master',
        description: 'Survive for 15 minutes while maintaining 50+ segments, getting 3+ kills, and collecting 80+ orbs',
        requirements: ['15 minutes survival', '50+ segments maintained', '3+ kills', '80+ orbs collected', 'No boost usage for more than 60 seconds'],
        reward: 15000,
        rarity: 'epic',
        category: 'achievements',
        icon: '🛡️',
        type: 'single_game',
        criteria: {
          survivalTime: 900, // 15 minutes in seconds
          segments: 50,
          kills: 3,
          orbsCollected: 80,
          boostTime: 60
        }
      },
      {
        id: 'perfect_game_legendary',
        title: 'Perfect Game',
        description: 'Escape with 70+ segments, 0.05+ ETH, 5+ kills, 100+ orbs, no deaths',
        requirements: ['70+ segments', '0.05+ ETH', '5+ kills', '100+ orbs', 'No deaths', 'Escape'],
        reward: 35000,
        rarity: 'legendary',
        category: 'achievements',
        icon: '👑',
        type: 'single_game',
        criteria: {
          segments: 70,
          ethCollected: 0.05,
          kills: 5,
          orbsCollected: 100,
          escaped: true
        }
      },
      {
        id: 'orb_efficiency_common',
        title: 'Orb Efficiency',
        description: 'Collect 50+ orbs within 7 minutes',
        requirements: ['50 orbs', '7 minutes'],
        reward: 3000,
        rarity: 'common',
        category: 'orbs',
        icon: '🔮',
        type: 'single_game',
        criteria: {
          orbsCollected: 50,
          timeElapsed: 420 // 7 minutes in seconds
        }
      },

      {
        id: 'orb_streak_epic',
        title: 'Orb Streak',
        description: 'Collect 20+ orbs within 5 minutes without using boost',
        requirements: ['20 orbs', '5 minutes', 'No boost'],
        reward: 22000,
        rarity: 'epic',
        category: 'orbs',
        icon: '🔥',
        type: 'single_game',
        criteria: {
          orbsCollected: 20,
          timeElapsed: 300, // 5 minutes in seconds
          boostUsed: false
        }
      },
      {
        id: 'eth_efficiency_common',
        title: 'ETH Efficiency',
        description: 'Collect 5+ ETH orbs within 10 minutes',
        requirements: ['5 ETH orbs', '10 minutes'],
        reward: 3000,
        rarity: 'common',
        category: 'eth_orbs',
        icon: '💰',
        type: 'single_game',
        criteria: {
          ethOrbsCollected: 5,
          timeElapsed: 600 // 10 minutes in seconds
        }
      },
      {
        id: 'eth_streak_rare',
        title: 'ETH Streak',
        description: 'Collect 15+ ETH orbs within 20 minutes',
        requirements: ['15 ETH orbs', '20 minutes'],
        reward: 12000,
        rarity: 'rare',
        category: 'eth_orbs',
        icon: '💎',
        type: 'single_game',
        criteria: {
          ethOrbsCollected: 15,
          survivalTime: 1200 // 20 minutes in seconds
        }
      },
      {
        id: 'eth_mastery_epic',
        title: 'ETH Mastery',
        description: 'Collect 20+ ETH orbs and maintain 30+ segments',
        requirements: ['20 ETH orbs', '30 segments'],
        reward: 22000,
        rarity: 'epic',
        category: 'eth_orbs',
        icon: '🏆',
        type: 'single_game',
        criteria: {
          ethOrbsCollected: 20,
          segments: 30
        }
      },
      {
        id: 'eth_legend_legendary',
        title: 'ETH Legend',
        description: 'Escape with 50+ ETH orbs collected and 0.1+ ETH total',
        requirements: ['50 ETH orbs', '0.1 ETH total', 'Escape'],
        reward: 35000,
        rarity: 'legendary',
        category: 'eth_orbs',
        icon: '👑',
        type: 'single_game',
        criteria: {
          ethOrbsCollected: 50,
          ethTotal: 0.1,
          escaped: true
        }
      },
      {
        id: 'eth_god_ultra',
        title: 'ETH God',
        description: 'Escape with 100+ ETH orbs collected and 0.2+ ETH total',
        requirements: ['100 ETH orbs', '0.2 ETH total', 'Escape'],
        reward: 45000,
        rarity: 'ultra',
        category: 'eth_orbs',
        icon: '⚡',
        type: 'single_game',
        criteria: {
          ethOrbsCollected: 100,
          ethTotal: 0.2,
          escaped: true
        }
      },
      {
        id: 'first_blood_common',
        title: 'First Blood',
        description: 'Get 1 kill within 5 minutes of starting',
        requirements: ['1 kill', '5 minutes'],
        reward: 3000,
        rarity: 'common',
        category: 'kills',
        icon: '💀',
        type: 'single_game',
        criteria: {
          kills: 1,
          timeElapsed: 300 // 5 minutes in seconds
        }
      },
      {
        id: 'kill_streak_rare',
        title: 'Kill Streak',
        description: 'Get 3+ kills within 10 minutes',
        requirements: ['3 kills', '10 minutes'],
        reward: 12000,
        rarity: 'rare',
        category: 'kills',
        icon: '⚔️',
        type: 'single_game',
        criteria: {
          kills: 3,
          timeElapsed: 600 // 10 minutes in seconds
        }
      },
      {
        id: 'assassin_epic',
        title: 'Assassin',
        description: 'Get 5+ kills and collect 50+ orbs',
        requirements: ['5 kills', '50 orbs'],
        reward: 22000,
        rarity: 'epic',
        category: 'kills',
        icon: '🗡️',
        type: 'single_game',
        criteria: {
          kills: 5,
          orbsCollected: 50
        }
      },
      {
        id: 'warlord_legendary',
        title: 'Warlord',
        description: 'Escape with 10+ kills and 30+ segments',
        requirements: ['10 kills', '30 segments', 'Escape'],
        reward: 35000,
        rarity: 'legendary',
        category: 'kills',
        icon: '👑',
        type: 'single_game',
        criteria: {
          kills: 10,
          segments: 30,
          escaped: true
        }
      },
      {
        id: 'death_bringer_ultra',
        title: 'Death Bringer',
        description: 'Get 15+ kills and maintain 50+ segments',
        requirements: ['15 kills', '50 segments'],
        reward: 45000,
        rarity: 'ultra',
        category: 'kills',
        icon: '💀',
        type: 'single_game',
        criteria: {
          kills: 15,
          segments: 50
        }
      },
      {
        id: 'endurance_common',
        title: 'Endurance',
        description: 'Survive 7+ minutes, collect 30+ orbs, use boost less than 30 seconds',
        requirements: ['7 minutes', '30 orbs', 'Boost < 30s'],
        reward: 3000,
        rarity: 'common',
        category: 'survival',
        icon: '⏱️',
        type: 'single_game',
        criteria: {
          survivalTime: 420, // 7 minutes in seconds
          orbsCollected: 30,
          boostTime: 30
        }
      },
      {
        id: 'survival_expert_rare',
        title: 'Survival Expert',
        description: 'Survive 10+ minutes with 25+ segments and 2+ ETH orbs',
        requirements: ['10 minutes survival', '25 segments', '2 ETH orbs'],
        reward: 12000,
        rarity: 'rare',
        category: 'survival',
        icon: '🛡️',
        type: 'single_game',
        criteria: {
          survivalTime: 600, // 10 minutes in seconds
          segments: 25,
          ethOrbsCollected: 2
        }
      },
      {
        id: 'immortal_epic',
        title: 'Immortal',
        description: 'Survive 15+ minutes and collect 100+ orbs and 10+ ETH orbs',
        requirements: ['15 minutes', '100 orbs', '10 ETH orbs'],
        reward: 22000,
        rarity: 'epic',
        category: 'survival',
        icon: '💎',
        type: 'single_game',
        criteria: {
          survivalTime: 900, // 15 minutes in seconds
          orbsCollected: 100,
          ethOrbsCollected: 10
        }
      },
      {
        id: 'eternal_legendary',
        title: 'Eternal',
        description: 'Escape after surviving 18+ minutes with 47+ segments',
        requirements: ['18 minutes survival', '47 segments', 'Escape'],
        reward: 35000,
        rarity: 'legendary',
        category: 'survival',
        icon: '👑',
        type: 'single_game',
        criteria: {
          survivalTime: 1080, // 18 minutes in seconds
          segments: 47,
          escaped: true
        }
      },
      {
        id: 'time_lord_ultra',
        title: 'Time Lord',
        description: 'Survive 20+ minutes with 70+ segments',
        requirements: ['20 minutes survival', '70 segments'],
        reward: 45000,
        rarity: 'ultra',
        category: 'survival',
        icon: '⚡',
        type: 'single_game',
        criteria: {
          survivalTime: 1200, // 20 minutes in seconds
          segments: 70
        }
      },
      // Moving orb quests - Single game
      {
        id: 'moving_orb_collector_common',
        title: 'Moving Orb Collector',
        description: 'Collect 3+ moving orbs in a single game',
        requirements: ['3 moving orbs'],
        reward: 3000,
        rarity: 'common',
        category: 'orbs',
        icon: '🔄',
        type: 'single_game',
        criteria: {
          movingOrbsCollected: 3
        }
      },
      {
        id: 'moving_orb_hunter_rare',
        title: 'Moving Orb Hunter',
        description: 'Collect 8+ moving orbs in a single game',
        requirements: ['8 moving orbs'],
        reward: 12000,
        rarity: 'rare',
        category: 'orbs',
        icon: '🎯',
        type: 'single_game',
        criteria: {
          movingOrbsCollected: 8
        }
      },
      {
        id: 'moving_orb_master_epic',
        title: 'Moving Orb Master',
        description: 'Collect 15+ moving orbs and maintain 25+ segments',
        requirements: ['15 moving orbs', '25 segments'],
        reward: 22000,
        rarity: 'epic',
        category: 'orbs',
        icon: '💎',
        type: 'single_game',
        criteria: {
          movingOrbsCollected: 15,
          segments: 25
        }
      },
      {
        id: 'moving_orb_legend_legendary',
        title: 'Moving Orb Legend',
        description: 'Collect 25+ moving orbs and escape successfully',
        requirements: ['25 moving orbs', 'Escape'],
        reward: 35000,
        rarity: 'legendary',
        category: 'orbs',
        icon: '👑',
        type: 'single_game',
        criteria: {
          movingOrbsCollected: 25,
          escaped: true
        }
      },
      {
        id: 'moving_orb_god_ultra',
        title: 'Moving Orb God',
        description: 'Collect 30+ moving orbs and maintain 40+ segments',
        requirements: ['30 moving orbs', '40 segments'],
        reward: 45000,
        rarity: 'ultra',
        category: 'orbs',
        icon: '⚡',
        type: 'single_game',
        criteria: {
          movingOrbsCollected: 30,
          segments: 40
        }
      },
      // Multi-game quests
      {
        id: 'persistent_survivor_legendary',
        title: 'Persistent Survivor',
        description: 'Survive for 3 hours total across multiple games',
        requirements: ['3 hours survival', 'Multiple games'],
        reward: 40000,
        rarity: 'legendary',
        category: 'achievements',
        icon: '⏱️',
        type: 'multi_game',
        criteria: {
          survivalTime: 10800 // 3 hours in seconds
        }
      },
      // Moving orb multi-game quests
      {
        id: 'moving_orb_grinder_rare',
        title: 'Moving Orb Grinder',
        description: 'Collect 100+ moving orbs across multiple games',
        requirements: ['100 moving orbs', 'Multiple games'],
        reward: 12000,
        rarity: 'rare',
        category: 'achievements',
        icon: '🔄',
        type: 'multi_game',
        criteria: {
          movingOrbsCollected: 100
        }
      },
      {
        id: 'moving_orb_champion_epic',
        title: 'Moving Orb Champion',
        description: 'Collect 250+ moving orbs across multiple games',
        requirements: ['250 moving orbs', 'Multiple games'],
        reward: 22000,
        rarity: 'epic',
        category: 'achievements',
        icon: '🏆',
        type: 'multi_game',
        criteria: {
          movingOrbsCollected: 250
        }
      },
      {
        id: 'moving_orb_legendary_collector_legendary',
        title: 'Moving Orb Legendary Collector',
        description: 'Collect 500+ moving orbs across multiple games',
        requirements: ['500 moving orbs', 'Multiple games'],
        reward: 35000,
        rarity: 'legendary',
        category: 'achievements',
        icon: '👑',
        type: 'multi_game',
        criteria: {
          movingOrbsCollected: 500
        }
      },
      {
        id: 'moving_orb_mythic_ultra',
        title: 'Moving Orb Mythic',
        description: 'Collect 1000+ moving orbs across multiple games',
        requirements: ['1000 moving orbs', 'Multiple games'],
        reward: 45000,
        rarity: 'ultra',
        category: 'achievements',
        icon: '⚡',
        type: 'multi_game',
        criteria: {
          movingOrbsCollected: 1000
        }
      },

      // Multi-game speed/boost quests
      {
        id: 'persistent_speed_demon_rare',
        title: 'Persistent Speed Demon',
        description: 'Use boost for 5 minutes total across multiple games',
        requirements: ['5 minutes boost time', 'Multiple games'],
        reward: 12000,
        rarity: 'rare',
        category: 'achievements',
        icon: '⚡',
        type: 'multi_game',
        criteria: {
          boostTime: 300 // 5 minutes in seconds
        }
      },
      {
        id: 'persistent_speed_master_legendary',
        title: 'Persistent Speed Master',
        description: 'Use boost for 15 minutes total across multiple games',
        requirements: ['15 minutes boost time', 'Multiple games'],
        reward: 35000,
        rarity: 'legendary',
        category: 'achievements',
        icon: '⚡',
        type: 'multi_game',
        criteria: {
          boostTime: 900 // 15 minutes in seconds
        }
      },
      // Multi-game ETH orb quests
      {
        id: 'persistent_eth_collector_rare',
        title: 'Persistent ETH Collector',
        description: 'Collect 100 ETH orbs across multiple games',
        requirements: ['100 ETH orbs', 'Multiple games'],
        reward: 12000,
        rarity: 'rare',
        category: 'achievements',
        icon: '💰',
        type: 'multi_game',
        criteria: {
          ethOrbsCollected: 100
        }
      },
      {
        id: 'persistent_eth_master_legendary',
        title: 'Persistent ETH Master',
        description: 'Collect 500 ETH orbs across multiple games',
        requirements: ['500 ETH orbs', 'Multiple games'],
        reward: 35000,
        rarity: 'legendary',
        category: 'achievements',
        icon: '💰',
        type: 'multi_game',
        criteria: {
          ethOrbsCollected: 500
        }
      },
      {
        id: 'daily_killer_common',
        title: 'Daily Killer',
        description: 'Get 10 kills across multiple games today',
        requirements: ['10 kills', 'Multiple games', 'Today'],
        reward: 3000,
        rarity: 'common',
        category: 'daily',
        icon: '💀',
        type: 'multi_game',
        criteria: {
          kills: 10
        }
      },
      {
        id: 'weekly_escape_artist_rare',
        title: 'Weekly Escape Artist',
        description: 'Escape successfully 5 times this week',
        requirements: ['5 escapes', 'This week'],
        reward: 12000,
        rarity: 'rare',
        category: 'weekly',
        icon: '🏃',
        type: 'multi_game',
        criteria: {
          escapes: 5
        }
      },
      {
        id: 'monthly_survivor_epic',
        title: 'Monthly Survivor',
        description: 'Survive for 2 hours total this month',
        requirements: ['2 hours survival', 'This month'],
        reward: 22000,
        rarity: 'epic',
        category: 'monthly',
        icon: '⏱️',
        type: 'multi_game',
        criteria: {
          survivalTime: 7200 // 2 hours in seconds
        }
      },
      // Additional quests that were missing
      {
        id: 'daily_orb_collector_rare',
        title: 'Daily Orb Collector',
        description: 'Collect 100 orbs across multiple games today',
        requirements: ['100 orbs', 'Multiple games', 'Today'],
        reward: 12000,
        rarity: 'rare',
        category: 'daily',
        icon: '🔮',
        type: 'multi_game',
        criteria: {
          orbsCollected: 100
        }
      },
      {
        id: 'daily_eth_hunter_epic',
        title: 'Daily ETH Hunter',
        description: 'Collect 20 ETH orbs across multiple games today',
        requirements: ['20 ETH orbs', 'Multiple games', 'Today'],
        reward: 22000,
        rarity: 'epic',
        category: 'daily',
        icon: '💰',
        type: 'multi_game',
        criteria: {
          ethOrbsCollected: 20
        }
      },
      {
        id: 'daily_survivor_legendary',
        title: 'Daily Survivor',
        description: 'Survive for 15 minutes total today',
        requirements: ['15 minutes survival', 'Today'],
        reward: 35000,
        rarity: 'legendary',
        category: 'daily',
        icon: '⏱️',
        type: 'multi_game',
        criteria: {
          survivalTime: 900 // 15 minutes in seconds
        }
      },
      {
        id: 'weekly_massacre_common',
        title: 'Weekly Massacre',
        description: 'Get 50 kills across multiple games this week',
        requirements: ['50 kills', 'Multiple games', 'This week'],
        reward: 3000,
        rarity: 'common',
        category: 'weekly',
        icon: '💀',
        type: 'multi_game',
        criteria: {
          kills: 50
        }
      },
      {
        id: 'weekly_orb_master_rare',
        title: 'Weekly Orb Master',
        description: 'Collect 500 orbs across multiple games this week',
        requirements: ['500 orbs', 'Multiple games', 'This week'],
        reward: 12000,
        rarity: 'rare',
        category: 'weekly',
        icon: '🔮',
        type: 'multi_game',
        criteria: {
          orbsCollected: 500
        }
      },
      {
        id: 'weekly_eth_legend_epic',
        title: 'Weekly ETH Legend',
        description: 'Collect 100 ETH orbs across multiple games this week',
        requirements: ['100 ETH orbs', 'Multiple games', 'This week'],
        reward: 22000,
        rarity: 'epic',
        category: 'weekly',
        icon: '💰',
        type: 'multi_game',
        criteria: {
          ethOrbsCollected: 100
        }
      },
      {
        id: 'weekly_immortal_legendary',
        title: 'Weekly Immortal',
        description: 'Survive for 45 minutes total this week',
        requirements: ['45 minutes survival', 'This week'],
        reward: 35000,
        rarity: 'legendary',
        category: 'weekly',
        icon: '⏱️',
        type: 'multi_game',
        criteria: {
          survivalTime: 2700 // 45 minutes in seconds
        }
      },
      {
        id: 'monthly_genocide_common',
        title: 'Monthly Genocide',
        description: 'Get 200 kills across multiple games this month',
        requirements: ['200 kills', 'Multiple games', 'This month'],
        reward: 3000,
        rarity: 'common',
        category: 'monthly',
        icon: '💀',
        type: 'multi_game',
        criteria: {
          kills: 200
        }
      },
      {
        id: 'monthly_orb_god_rare',
        title: 'Monthly Orb God',
        description: 'Collect 2000 orbs across multiple games this month',
        requirements: ['2000 orbs', 'Multiple games', 'This month'],
        reward: 12000,
        rarity: 'rare',
        category: 'monthly',
        icon: '🔮',
        type: 'multi_game',
        criteria: {
          orbsCollected: 2000
        }
      },
      {
        id: 'monthly_eth_emperor_epic',
        title: 'Monthly ETH Emperor',
        description: 'Collect 500 ETH orbs across multiple games this month',
        requirements: ['500 ETH orbs', 'Multiple games', 'This month'],
        reward: 22000,
        rarity: 'epic',
        category: 'monthly',
        icon: '💰',
        type: 'multi_game',
        criteria: {
          ethOrbsCollected: 500
        }
      },
      {
        id: 'monthly_time_master_ultra',
        title: 'Monthly Time Master',
        description: 'Survive for 4 hours total this month',
        requirements: ['4 hours survival', 'This month'],
        reward: 45000,
        rarity: 'ultra',
        category: 'monthly',
        icon: '⏱️',
        type: 'multi_game',
        criteria: {
          survivalTime: 14400 // 4 hours in seconds
        }
      },
      {
        id: 'persistent_killer_common',
        title: 'Persistent Killer',
        description: 'Get 1000 kills across all time',
        requirements: ['1000 kills', 'All time'],
        reward: 3000,
        rarity: 'common',
        category: 'achievements',
        icon: '💀',
        type: 'multi_game',
        criteria: {
          kills: 1000
        }
      },
      {
        id: 'persistent_collector_rare',
        title: 'Persistent Collector',
        description: 'Collect 10000 orbs across all time',
        requirements: ['10000 orbs', 'All time'],
        reward: 12000,
        rarity: 'rare',
        category: 'achievements',
        icon: '🔮',
        type: 'multi_game',
        criteria: {
          orbsCollected: 10000
        }
      },
      {
        id: 'persistent_eth_hunter_epic',
        title: 'Persistent ETH Hunter',
        description: 'Collect 2000 ETH orbs across all time',
        requirements: ['2000 ETH orbs', 'All time'],
        reward: 22000,
        rarity: 'epic',
        category: 'achievements',
        icon: '💰',
        type: 'multi_game',
        criteria: {
          ethOrbsCollected: 2000
        }
      },
      // Multi-game death quests
      {
        id: 'death_counter_common',
        title: 'Fallen Five',
        description: 'Die 5 times across any number of games',
        requirements: ['5 deaths (any games)'],
        reward: 3000,
        rarity: 'common',
        category: 'deaths',
        icon: '💀',
        type: 'multi_game',
        criteria: {
          deaths: 5
        }
      },
      {
        id: 'death_counter_rare',
        title: 'Tenacious Spirit',
        description: 'Die 10 times across any number of games',
        requirements: ['10 deaths (any games)'],
        reward: 12000,
        rarity: 'rare',
        category: 'deaths',
        icon: '🪦',
        type: 'multi_game',
        criteria: {
          deaths: 10
        }
      },
      {
        id: 'death_counter_epic',
        title: 'Resilient Soul',
        description: 'Die 20 times across any number of games',
        requirements: ['20 deaths (any games)'],
        reward: 22000,
        rarity: 'epic',
        category: 'deaths',
        icon: '👻',
        type: 'multi_game',
        criteria: {
          deaths: 20
        }
      },
      {
        id: 'death_counter_legendary',
        title: 'Immortal Challenger',
        description: 'Die 50 times across any number of games',
        requirements: ['50 deaths (any games)'],
        reward: 35000,
        rarity: 'legendary',
        category: 'deaths',
        icon: '🦴',
        type: 'multi_game',
        criteria: {
          deaths: 50
        }
      },
      {
        id: 'death_counter_ultra',
        title: 'Ultra Perseverance',
        description: 'Die 100 times across any number of games',
        requirements: ['100 deaths (any games)'],
        reward: 45000,
        rarity: 'ultra',
        category: 'deaths',
        icon: '☠️',
        type: 'multi_game',
        criteria: {
          deaths: 100
        }
      },
      // Multi-game escape quests
      {
        id: 'escape_counter_common',
        title: 'Escape Artist',
        description: 'Escape 5 times across any number of games',
        requirements: ['5 escapes (any games)'],
        reward: 3000,
        rarity: 'common',
        category: 'survival',
        icon: '🏃',
        type: 'multi_game',
        criteria: {
          escapes: 5
        }
      },
      {
        id: 'escape_counter_rare',
        title: 'Frequent Escaper',
        description: 'Escape 10 times across any number of games',
        requirements: ['10 escapes (any games)'],
        reward: 12000,
        rarity: 'rare',
        category: 'survival',
        icon: '🏃‍♂️',
        type: 'multi_game',
        criteria: {
          escapes: 10
        }
      },
      {
        id: 'escape_counter_epic',
        title: 'Master Escaper',
        description: 'Escape 20 times across any number of games',
        requirements: ['20 escapes (any games)'],
        reward: 22000,
        rarity: 'epic',
        category: 'survival',
        icon: '🏃‍♀️',
        type: 'multi_game',
        criteria: {
          escapes: 20
        }
      },
      {
        id: 'escape_counter_legendary',
        title: 'Legendary Escaper',
        description: 'Escape 50 times across any number of games',
        requirements: ['50 escapes (any games)'],
        reward: 35000,
        rarity: 'legendary',
        category: 'survival',
        icon: '🏃',
        type: 'multi_game',
        criteria: {
          escapes: 50
        }
      },
      {
        id: 'escape_counter_ultra',
        title: 'Ultra Escaper',
        description: 'Escape 100 times across any number of games',
        requirements: ['100 escapes (any games)'],
        reward: 45000,
        rarity: 'ultra',
        category: 'survival',
        icon: '🏃‍♂️',
        type: 'multi_game',
        criteria: {
          escapes: 100
        }
      }
    ];
    // Move all persistent quests to achievements and reduce segment requirements by 85%, and keep description and requirements in sync
    this.quests = this.quests.map(q => {
      let newQuest = { ...q };
      // Move persistent to achievements
      if (newQuest.category === 'persistent') {
        newQuest.category = 'achievements';
      }
      // Segment reduction logic temporarily disabled to preserve manual requirements
      /*
      // Reduce segment requirements by 85% (multiply by 0.15)
      if (newQuest.criteria && typeof newQuest.criteria.segments === 'number') {
        let newSegments = Math.round(newQuest.criteria.segments * 0.15);
        // Remove segment requirement entirely for achievements
        if (newQuest.category === 'achievements') {
          // Remove from criteria
          const { segments, ...restCriteria } = newQuest.criteria;
          newQuest.criteria = restCriteria;
          // Remove from requirements text
          if (Array.isArray(newQuest.requirements)) {
            newQuest.requirements = newQuest.requirements.filter(req => !/segments/i.test(req));
          }
          // Remove from description
          if (typeof newQuest.description === 'string' && /segments/i.test(newQuest.description)) {
            newQuest.description = newQuest.description.replace(/,? ?\d+\+? segments?\b/gi, '');
            newQuest.description = newQuest.description.replace(/with +\d+\+? segments?/gi, '');
            newQuest.description = newQuest.description.replace(/maintaining +\d+\+? segments?/gi, '');
          }
        } else {
          newQuest.criteria = { ...newQuest.criteria, segments: newSegments };
          // Also update requirements text if it mentions segments
          if (Array.isArray(newQuest.requirements)) {
            newQuest.requirements = newQuest.requirements.map(req =>
              typeof req === 'string' && req.match(/segments/i)
                ? req.replace(/(\d+)/, m => newSegments)
                : req
            );
          }
          // Also update description if it mentions segments
          if (typeof newQuest.description === 'string' && newQuest.description.match(/segments/i)) {
            // Find the requirement string for segments
            let reqString = '';
            if (Array.isArray(newQuest.requirements)) {
              reqString = newQuest.requirements.find(r => /segments/i.test(r));
            }
            let segNum = newSegments;
            if (reqString) {
              const match = reqString.match(/(\d+)/);
              if (match) segNum = match[1];
            }
            // Replace all segment numbers in description with the new value
            newQuest.description = newQuest.description.replace(/(\d+)(\+)? segments?/gi, segNum + (RegExp.$2 || '') + ' segments');
            newQuest.description = newQuest.description.replace(/with +\d+\+? segments?/gi, 'with ' + segNum + ' segments');
            newQuest.description = newQuest.description.replace(/maintaining +\d+\+? segments?/gi, 'maintaining ' + segNum + ' segments');
          }
        }
      }
      */
      // --- NEW: Sync requirements and description with criteria ---
      // Temporarily disabled to preserve manual requirements
      /*
      if (newQuest.criteria) {
        const criteriaToText = {
          boostTime: v => {
            if (v === 1) return '1s boost time';
            return `${v}s boost time`;
          },
          orbsCollected: v => {
            if (v === 1) return '1 orb collected';
            return `${v} orbs collected`;
          },
          movingOrbsCollected: v => {
            if (v === 1) return '1 moving orb collected';
            return `${v} moving orbs collected`;
          },
          ethOrbsCollected: v => {
            if (v === 1) return '1 ETH orb collected';
            return `${v} ETH orbs collected`;
          },
          timeElapsed: v => {
            const minutes = Math.round(v/60);
            if (minutes === 1) return '1 minute';
            return `${minutes} minutes`;
          },
          survivalTime: v => {
            const minutes = Math.round(v/60);
            if (minutes >= 60) {
              const hours = Math.floor(minutes/60);
              const remainingMinutes = minutes % 60;
              return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m survival` : `${hours}h survival`;
            }
            return `${minutes} minutes survival`;
          },
          segments: v => {
            if (v === 1) return '1 segment';
            return `${v} segments`;
          },
          kills: v => {
            if (v === 1) return '1 kill';
            return `${v} kills`;
          },
          ethCollected: v => `${v} ETH collected`,
          ethTotal: v => `${v} ETH total`,
          escapes: v => {
            if (v === 1) return '1 escape';
            return `${v} escapes`;
          },
          boostUsed: v => v ? 'Boost used' : 'No boost',
          escaped: v => v ? 'Escape' : 'No escape',
        };
        // Build requirements array from criteria
        newQuest.requirements = Object.entries(newQuest.criteria).map(([key, val]) => {
          if (criteriaToText[key]) return criteriaToText[key](val);
          if (typeof val === 'number') return `${key}: ${val}`;
          if (typeof val === 'boolean') return `${key}: ${val}`;
          return `${key}: ${val}`;
        });
        // Build description from requirements
        newQuest.description = newQuest.requirements.join(', ');
      }
      */
      return newQuest;
    });
  }

  // Update quest progress for a player
  updateProgress(playerAddress, questId, progressData) {
    if (!this.playerProgress[playerAddress]) {
      this.playerProgress[playerAddress] = {};
    }
    
    if (!this.playerProgress[playerAddress][questId]) {
      this.playerProgress[playerAddress][questId] = {};
    }
    
    // Update progress data
    this.playerProgress[playerAddress][questId] = {
      ...this.playerProgress[playerAddress][questId],
      ...progressData,
      lastUpdated: Date.now()
    };
    
    // Save to localStorage after each update
    this.saveToStorage();
  }

  // Check if a quest is completed based on criteria
  checkQuestCompletion(playerAddress, questId) {
    const quest = this.quests.find(q => q.id === questId);
    if (!quest) return false;
    
    const progress = this.playerProgress[playerAddress]?.[questId];
    if (!progress) return false;
    
    const criteria = quest.criteria;
    
    // Debug logging for quest completion check
    console.log(`[QuestTracker] Checking completion for ${questId}:`, {
      progress,
      criteria
    });
    
    // Additional logging for orb-related quests
    if (questId.includes('orb_') || criteria.orbsCollected) {
      console.log(`[QuestTracker] Orb quest check for ${questId}:`, {
        orbsCollected: progress.orbsCollected,
        requiredOrbs: criteria.orbsCollected,
        movingOrbsCollected: progress.movingOrbsCollected,
        requiredMovingOrbs: criteria.movingOrbsCollected
      });
    }
    
    // Check each criterion
    for (const [key, requiredValue] of Object.entries(criteria)) {
      const actualValue = progress[key];
      
      if (actualValue === undefined || actualValue === null) {
        console.log(`[QuestTracker] ${questId}: Failed - missing value for ${key}`);
        return false;
      }
      
      // Handle different types of comparisons
      if (typeof requiredValue === 'number') {
        if (actualValue < requiredValue) {
          console.log(`[QuestTracker] ${questId}: Failed - ${key} value ${actualValue} < required ${requiredValue}`);
          return false;
        }
      } else if (typeof requiredValue === 'boolean') {
        if (actualValue !== requiredValue) {
          console.log(`[QuestTracker] ${questId}: Failed - ${key} value ${actualValue} !== required ${requiredValue}`);
          return false;
        }
      }
    }
    
    console.log(`[QuestTracker] ${questId}: COMPLETED!`);
    return true;
  }

  // Helper to determine if a quest is repeatable (daily, weekly, monthly)
  isRepeatableQuest(quest) {
    return (
      quest.category === 'daily' ||
      quest.category === 'weekly' ||
      quest.category === 'monthly'
    );
  }

  // Mark a quest as completed
  markQuestCompleted(playerAddress, questId) {
    const quest = this.quests.find(q => q.id === questId);
    if (!quest) return;
    if (!this.completedQuests[playerAddress]) {
      this.completedQuests[playerAddress] = {};
    }
    // For one-time quests, only allow completion once
    if (!this.isRepeatableQuest(quest) && this.completedQuests[playerAddress][questId]) {
      return; // Already completed, do not mark again
    }
    this.completedQuests[playerAddress][questId] = {
      completedAt: Date.now(),
      claimed: false
    };
    // --- Add to persistent history ---
    if (!this.completedQuestHistory[playerAddress]) {
      this.completedQuestHistory[playerAddress] = [];
    }
    this.completedQuestHistory[playerAddress].push({
      questId,
      completedAt: Date.now(),
      category: quest.category,
      period: this.getCurrentPeriodKey(quest.category)
    });
    this.saveToStorage(); // Save completed quests after each update
  }

  // Check if a quest is completed
  isQuestCompleted(playerAddress, questId) {
    console.log('[QuestTracker] Checking if quest', questId, 'is completed by', playerAddress + ':', !!(this.completedQuests[playerAddress]?.[questId]));
    
    // Fix for daily quests: If quest data is undefined but the quest exists in completedQuestHistory,
    // the quest should still be considered completed
    if (!this.completedQuests[playerAddress]?.[questId]) {
      // Check if this quest exists in the history
      const questInHistory = this.completedQuestHistory[playerAddress]?.some(entry => entry.questId === questId);
      if (questInHistory) {
        console.log('[QuestTracker] Quest found in history but not in completedQuests. It should be considered completed.');
        return true;
      }
    }
    
    return !!(this.completedQuests[playerAddress]?.[questId]);
  }

  // Check if a quest is claimed
  isQuestClaimed(playerAddress, questId) {
    console.log('[QuestTracker] Checking if quest', questId, 'is claimed by', playerAddress + ':', !!(this.completedQuests[playerAddress]?.[questId]?.claimed));
    console.log('[QuestTracker] Quest data:', this.completedQuests[playerAddress]?.[questId]);
    
    // Fix for daily quests: If quest data is undefined but the quest exists in completedQuestHistory,
    // the quest should still be claimable (not considered claimed)
    if (!this.completedQuests[playerAddress]?.[questId]) {
      // Check if this quest exists in the history
      const questInHistory = this.completedQuestHistory[playerAddress]?.some(entry => entry.questId === questId);
      if (questInHistory) {
        console.log('[QuestTracker] Quest found in history but not in completedQuests. Recreating entry...');
        
        // Find the quest to get its category
        const quest = this.quests.find(q => q.id === questId);
        if (quest) {
          // Recreate the entry in completedQuests
          if (!this.completedQuests[playerAddress]) {
            this.completedQuests[playerAddress] = {};
          }
          
          this.completedQuests[playerAddress][questId] = {
            completedAt: Date.now(), // Use current time since we don't know the original
            claimed: false // Not claimed yet
          };
          
          console.log('[QuestTracker] Recreated quest entry:', this.completedQuests[playerAddress][questId]);
          this.saveToStorage();
          return false; // Not claimed
        }
      }
    }
    
    return !!(this.completedQuests[playerAddress]?.[questId]?.claimed);
  }

  // Claim quest reward
  claimQuestReward(playerAddress, questId) {
    console.log('[QuestTracker] Attempting to claim reward for quest', questId, 'by', playerAddress);
    
    const quest = this.quests.find(q => q.id === questId);
    if (!quest) {
      console.log('[QuestTracker] Quest not found:', questId);
      return null;
    }
    
    // Check if the quest is completed
    let isCompleted = this.isQuestCompleted(playerAddress, questId);
    
    // If not found in completedQuests but exists in history, consider it completed
    if (!isCompleted) {
      const questInHistory = this.completedQuestHistory[playerAddress]?.some(entry => entry.questId === questId);
      if (questInHistory) {
        console.log('[QuestTracker] Quest found in history but not marked as completed. Fixing...');
        
        // Recreate the entry in completedQuests
        if (!this.completedQuests[playerAddress]) {
          this.completedQuests[playerAddress] = {};
        }
        
        this.completedQuests[playerAddress][questId] = {
          completedAt: Date.now(), // Use current time since we don't know the original
          claimed: false // Not claimed yet
        };
        
        console.log('[QuestTracker] Recreated completion entry:', this.completedQuests[playerAddress][questId]);
        this.saveToStorage();
        isCompleted = true;
      }
    }
    
    if (!isCompleted) {
      console.log('[QuestTracker] Quest not completed:', questId);
      return null;
    }
    
    // Check if the quest is already claimed
    if (this.isQuestClaimed(playerAddress, questId)) {
      console.log('[QuestTracker] Quest already claimed:', questId);
      return null;
    }
    
    // For one-time quests, only allow claim once
    if (!this.isRepeatableQuest(quest) && this.completedQuests[playerAddress][questId]?.claimed) {
      console.log('[QuestTracker] One-time quest already claimed:', questId);
      return null;
    }
    
    // Mark as claimed
    this.completedQuests[playerAddress][questId].claimed = true;
    console.log('[QuestTracker] Marked quest as claimed:', questId);
    
    // Store the SP reward for later distribution
    if (!this.claimedSPRewards[playerAddress]) {
      this.claimedSPRewards[playerAddress] = 0;
    }
    this.claimedSPRewards[playerAddress] += quest.reward;
    console.log('[QuestTracker] Added reward to claimedSPRewards:', quest.reward, 'Total:', this.claimedSPRewards[playerAddress]);
    
    this.saveToStorage(); // Save claimed quests and SP rewards after each update
    return quest.reward;
  }

  // Get total claimed SP rewards for a player
  getClaimedSPRewards(playerAddress) {
    return this.claimedSPRewards[playerAddress] || 0;
  }

  // Clear claimed SP rewards for a player (called when distributing them)
  clearClaimedSPRewards(playerAddress) {
    if (this.claimedSPRewards[playerAddress]) {
      const totalSP = this.claimedSPRewards[playerAddress];
      this.claimedSPRewards[playerAddress] = 0;
      this.saveToStorage();
      return totalSP;
    }
    return 0;
  }

  // Get quest progress for display
  getQuestProgress(playerAddress, questId) {
    const quest = this.quests.find(q => q.id === questId);
    if (!quest) return null;
    
    const progress = this.playerProgress[playerAddress]?.[questId];
    if (!progress) return null;
    
    // Debug logging for quest progress
    console.log(`[QuestTracker] Getting progress for ${questId}:`, progress);
    
    // Additional logging for orb-related quests
    if (questId.includes('orb_') || quest.criteria?.orbsCollected) {
      console.log(`[QuestTracker] Orb quest progress for ${questId}:`, {
        orbsCollected: progress.orbsCollected,
        requiredOrbs: quest.criteria.orbsCollected,
        movingOrbsCollected: progress.movingOrbsCollected,
        requiredMovingOrbs: quest.criteria.movingOrbsCollected,
        timeElapsed: progress.timeElapsed,
        survivalTime: progress.survivalTime
      });
    }
    
    const criteria = quest.criteria;
    
    // For multi-game quests, calculate actual percentage progress
    if (quest.type === 'multi_game') {
      let totalPercentage = 0;
      let criteriaCount = 0;
      
      for (const [key, requiredValue] of Object.entries(criteria)) {
        criteriaCount++;
        const actualValue = progress[key] || 0;
        
        if (typeof requiredValue === 'number') {
          // Calculate percentage for this criterion
          const criterionPercentage = Math.min((actualValue / requiredValue) * 100, 100);
          totalPercentage += criterionPercentage;
        } else if (typeof requiredValue === 'boolean') {
          // Boolean criteria are either 0% or 100%
          totalPercentage += actualValue === requiredValue ? 100 : 0;
        }
      }
      
      const averagePercentage = criteriaCount > 0 ? totalPercentage / criteriaCount : 0;
      
      return {
        ...progress,
        percentage: Math.round(averagePercentage)
      };
    } else {
      // For single-game quests, use binary completion (original logic)
      let totalCriteria = 0;
      let completedCriteria = 0;
      
      for (const [key, requiredValue] of Object.entries(criteria)) {
        totalCriteria++;
        const actualValue = progress[key];
        
        if (actualValue !== undefined && actualValue !== null) {
          if (typeof requiredValue === 'number') {
            if (actualValue >= requiredValue) {
              completedCriteria++;
            }
          } else if (typeof requiredValue === 'boolean') {
            if (actualValue === requiredValue) {
              completedCriteria++;
            }
          }
        }
      }
      
      const percentage = totalCriteria > 0 ? (completedCriteria / totalCriteria) * 100 : 0;
      
      return {
        ...progress,
        percentage: Math.min(percentage, 100)
      };
    }
  }

  // Get all player progress
  getPlayerProgress(playerAddress) {
    return this.playerProgress[playerAddress] || {};
  }

  // Reset single-game quest progress when game ends
  resetSingleGameProgress(playerAddress) {
    if (!this.playerProgress[playerAddress]) return;
    
    console.log('[QuestTracker] Resetting single-game quest progress for', playerAddress);
    console.log('[QuestTracker] Progress before reset:', JSON.stringify(this.playerProgress[playerAddress]));
    
    // Remove single-game quest progress
    Object.keys(this.playerProgress[playerAddress]).forEach(questId => {
      const quest = this.quests.find(q => q.id === questId);
      if (quest && quest.type === 'single_game') {
        console.log(`[QuestTracker] Resetting progress for quest: ${questId}`);
        delete this.playerProgress[playerAddress][questId];
      }
    });
    
    console.log('[QuestTracker] Progress after reset:', JSON.stringify(this.playerProgress[playerAddress]));
    this.saveToStorage(); // Save progress after resetting
  }

  // Get all quests
  getAllQuests() {
    return this.quests;
  }

  // Get quest by ID
  getQuest(questId) {
    return this.quests.find(q => q.id === questId);
  }

  // Helper to get current period key for a quest category
  getCurrentPeriodKey(category) {
    const now = new Date();
    if (category === 'daily') return `${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()}`;
    if (category === 'weekly') return `${now.getFullYear()}-W${getWeekNumber(now)}`;
    if (category === 'monthly') return `${now.getFullYear()}-${now.getMonth()+1}`;
    return 'alltime';
  }

  // Force refresh quest requirements to ensure auto-generation runs
  // Temporarily disabled to preserve manual requirements
  refreshQuestRequirements() {
    // Auto-generation disabled to preserve manual quest requirements
    return;
  }
}

// Helper to get ISO week number
function getWeekNumber(d) {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1)/7);
  return weekNo;
}

export default QuestTracker; 