// Advanced Gameplay Scenarios for Snakstract

class GameplayScenario {
  constructor(name, description, duration = 300000) { // 5 minutes default
    this.name = name;
    this.description = description;
    this.duration = duration;
    this.startTime = null;
    this.isActive = false;
    this.conditions = [];
    this.rewards = { sp: 2000 }; // All scenarios give 2000 SP
    this.effects = [];
    this.achievementColor = '#0066ff'; // Blue achievement color
  }

  start() {
    this.startTime = Date.now();
    this.isActive = true;
    console.log(`🎮 Scenario started: ${this.name}`);
  }

  end() {
    this.isActive = false;
    console.log(`🏁 Scenario ended: ${this.name}`);
  }

  isComplete() {
    return this.isActive && (Date.now() - this.startTime) >= this.duration;
  }

  addCondition(condition) {
    this.conditions.push(condition);
  }

  addReward(type, value) {
    this.rewards[type] = value;
  }

  addEffect(effect) {
    this.effects.push(effect);
  }

  checkConditions(player, gameState) {
    return this.conditions.every(condition => condition(player, gameState));
  }

  applyEffects(player, gameState) {
    this.effects.forEach(effect => effect(player, gameState));
  }

  showAchievementMessage() {
    // Create blue achievement message
    const achievementDiv = document.createElement('div');
    achievementDiv.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 102, 255, 0.95);
      color: white;
      padding: 20px 30px;
      border-radius: 15px;
      font-size: 18px;
      font-weight: bold;
      text-align: center;
      z-index: 10000;
      box-shadow: 0 0 30px rgba(0, 102, 255, 0.8);
      border: 2px solid rgba(255, 255, 255, 0.3);
      backdrop-filter: blur(10px);
      animation: achievementPop 3s ease-in-out;
    `;
    
    achievementDiv.innerHTML = `
      <div style="font-size: 24px; margin-bottom: 10px;">🏆 ACHIEVEMENT UNLOCKED!</div>
      <div style="font-size: 20px; margin-bottom: 8px;">${this.name}</div>
      <div style="font-size: 14px; opacity: 0.9;">${this.description}</div>
      <div style="font-size: 16px; margin-top: 10px; color: #ffff00;">+2000 SP REWARD!</div>
    `;
    
    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes achievementPop {
        0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
        20% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
        80% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        100% { transform: translate(-50%, -50%) scale(0.9); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(achievementDiv);
    
    // Remove after animation
    setTimeout(() => {
      document.body.removeChild(achievementDiv);
      document.head.removeChild(style);
    }, 3000);
  }
}

// Scenario Manager
class ScenarioManager {
  constructor() {
    this.scenarios = new Map();
    this.activeScenarios = new Set();
    this.scenarioHistory = [];
    this.currentTime = Date.now();
  }

  registerScenario(scenario) {
    this.scenarios.set(scenario.name, scenario);
  }

  startScenario(name) {
    const scenario = this.scenarios.get(name);
    if (scenario && !scenario.isActive) {
      scenario.start();
      this.activeScenarios.add(scenario);
    }
  }

  update(player, gameState) {
    this.currentTime = Date.now();
    
    // Update active scenarios
    for (const scenario of this.activeScenarios) {
      if (scenario.isComplete()) {
        this.completeScenario(scenario, player, gameState);
      } else {
        scenario.applyEffects(player, gameState);
      }
    }
  }

  completeScenario(scenario, player, gameState) {
    scenario.end();
    this.activeScenarios.delete(scenario);
    
    // Show blue achievement message
    scenario.showAchievementMessage();
    
    // Apply rewards
    Object.entries(scenario.rewards).forEach(([type, value]) => {
      switch (type) {
        case 'sp':
          player.SP = (player.SP || 0) + value;
          break;
        case 'segments':
          const tail = player.segments[player.segments.length - 1];
          for (let i = 0; i < value; i++) {
            player.segments.push({ x: tail.x, y: tail.y });
          }
          break;
        case 'speed':
          player.speed = (player.speed || 1) + value;
          break;
      }
    });

    this.scenarioHistory.push({
      name: scenario.name,
      completedAt: this.currentTime,
      playerStats: {
        sp: player.SP,
        segments: player.segments.length,
        kills: player.kills
      }
    });

    console.log(`🎉 Scenario completed: ${scenario.name}`);
  }

  getActiveScenarios() {
    return Array.from(this.activeScenarios);
  }

  getAvailableScenarios() {
    return Array.from(this.scenarios.values());
  }
}

// Predefined Scenarios - All give 2000 SP and show blue achievement messages

// 1. Speed Demon - Survive at high speed
const speedDemonScenario = new GameplayScenario(
  "Speed Demon",
  "Survive for 3 minutes while maintaining high speed",
  180000 // 3 minutes
);

speedDemonScenario.addCondition((player, gameState) => {
  const timeSurvived = (Date.now() - player.joinedAt) / 1000;
  return timeSurvived >= 180; // 3 minutes
});

// 2. Orb Hunter - Collect many orbs quickly
const orbHunterScenario = new GameplayScenario(
  "Orb Hunter",
  "Collect 50 orbs within 2 minutes",
  120000 // 2 minutes
);

orbHunterScenario.addCondition((player, gameState) => {
  const timeSurvived = (Date.now() - player.joinedAt) / 1000;
  const orbsEaten = player.orbsEaten || 0;
  return orbsEaten >= 50 && timeSurvived <= 120;
});

// 4. Killer Instinct - Get multiple kills
const killerInstinctScenario = new GameplayScenario(
  "Killer Instinct",
  "Get 3 kills within 5 minutes",
  300000 // 5 minutes
);

killerInstinctScenario.addCondition((player, gameState) => {
  const timeSurvived = (Date.now() - player.joinedAt) / 1000;
  const kills = player.kills || 0;
  return kills >= 3 && timeSurvived <= 300;
});

// 5. Moving Orb Master - Collect moving orbs
const movingOrbMasterScenario = new GameplayScenario(
  "Moving Orb Master",
  "Collect 20 moving orbs within 4 minutes",
  240000 // 4 minutes
);

movingOrbMasterScenario.addCondition((player, gameState) => {
  const timeSurvived = (Date.now() - player.joinedAt) / 1000;
  const movingOrbsEaten = player.movingOrbsEaten || 0;
  return movingOrbsEaten >= 20 && timeSurvived <= 240;
});

// 6. Escape Artist - Multiple escapes
const escapeArtistScenario = new GameplayScenario(
  "Escape Artist",
  "Escape 2 times within 15 minutes",
  900000 // 15 minutes
);

escapeArtistScenario.addCondition((player, gameState) => {
  const escapes = player.escapes || 0;
  return escapes >= 2;
});

// 7. Giant Slayer - Survive while being large
const giantSlayerScenario = new GameplayScenario(
  "Giant Slayer",
  "Survive for 5 minutes with 50+ segments",
  300000 // 5 minutes
);

giantSlayerScenario.addCondition((player, gameState) => {
  const timeSurvived = (Date.now() - player.joinedAt) / 1000;
  const segments = player.segments ? player.segments.length : 0;
  return segments >= 50 && timeSurvived >= 300;
});

// 8. Speed Runner - Fast escape
const speedRunnerScenario = new GameplayScenario(
  "Speed Runner",
  "Escape within 2 minutes of starting",
  120000 // 2 minutes
);

speedRunnerScenario.addCondition((player, gameState) => {
  const timeSurvived = (Date.now() - player.joinedAt) / 1000;
  const hasEscaped = player.hasEscaped || false;
  return hasEscaped && timeSurvived <= 120;
});

// 9. Orb Chain - Collect orbs in sequence
const orbChainScenario = new GameplayScenario(
  "Orb Chain",
  "Collect 10 orbs within 30 seconds",
  30000 // 30 seconds
);

orbChainScenario.addCondition((player, gameState) => {
  const timeSurvived = (Date.now() - player.joinedAt) / 1000;
  const orbsEaten = player.orbsEaten || 0;
  return orbsEaten >= 10 && timeSurvived <= 30;
});

// 10. Endurance - Very long survival
const enduranceScenario = new GameplayScenario(
  "Endurance",
  "Survive for 20 minutes",
  1200000 // 20 minutes
);

enduranceScenario.addCondition((player, gameState) => {
  const timeSurvived = (Date.now() - player.joinedAt) / 1000;
  return timeSurvived >= 1200; // 20 minutes
});

export { 
  GameplayScenario, 
  ScenarioManager,
  speedDemonScenario,
  orbHunterScenario,
  killerInstinctScenario,
  movingOrbMasterScenario,
  escapeArtistScenario,
  giantSlayerScenario,
  speedRunnerScenario,
  orbChainScenario,
  enduranceScenario
}; 
 