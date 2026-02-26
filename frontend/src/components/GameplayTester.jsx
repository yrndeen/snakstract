import React, { useState, useEffect } from 'react';
import { 
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
} from '../utils/gameplayScenarios.js';

const GameplayTester = ({ isVisible = false, onScenarioStart }) => {
  const [scenarioManager] = useState(new ScenarioManager());
  const [activeScenarios, setActiveScenarios] = useState([]);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Register all scenarios
  useEffect(() => {
    const scenarios = [
      speedDemonScenario,
      orbHunterScenario,
      killerInstinctScenario,
      movingOrbMasterScenario,
      escapeArtistScenario,
      giantSlayerScenario,
      speedRunnerScenario,
      orbChainScenario,
      enduranceScenario
    ];

    scenarios.forEach(scenario => {
      scenarioManager.registerScenario(scenario);
    });
  }, [scenarioManager]);

  const scenarios = scenarioManager.getAvailableScenarios();

  const handleScenarioStart = (scenarioName) => {
    scenarioManager.startScenario(scenarioName);
    setActiveScenarios(scenarioManager.getActiveScenarios());
    if (onScenarioStart) {
      onScenarioStart(scenarioName);
    }
  };

  const formatDuration = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      left: '10px',
      background: 'rgba(24, 28, 43, 0.95)',
      borderRadius: '8px',
      padding: '12px',
      width: isExpanded ? '350px' : '250px',
      maxHeight: '80vh',
      overflowY: 'auto',
      boxShadow: '0 4px 20px rgba(0, 102, 255, 0.3)',
      border: '1px solid rgba(0, 102, 255, 0.2)',
      backdropFilter: 'blur(10px)',
      zIndex: 1000,
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#ffffff',
      transition: 'all 0.3s ease'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px',
        cursor: 'pointer'
      }} onClick={() => setIsExpanded(!isExpanded)}>
        <div style={{ fontWeight: 'bold', color: '#0066ff' }}>
          🏆 Achievement Tester
        </div>
        <div style={{ fontSize: '10px', color: '#888' }}>
          {isExpanded ? '▼' : '▶'}
        </div>
      </div>

      {/* Active Scenarios */}
      {activeScenarios.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '6px', color: '#0066ff' }}>
            🎮 Active Achievements ({activeScenarios.length})
          </div>
          {activeScenarios.map((scenario, index) => (
            <div key={index} style={{
              background: 'rgba(0, 102, 255, 0.1)',
              padding: '6px',
              borderRadius: '4px',
              marginBottom: '4px',
              border: '1px solid rgba(0, 102, 255, 0.2)'
            }}>
              <div style={{ fontWeight: 'bold', fontSize: '11px' }}>
                {scenario.name}
              </div>
              <div style={{ fontSize: '10px', color: '#ccc' }}>
                {scenario.description}
              </div>
              <div style={{ fontSize: '10px', color: '#888' }}>
                Duration: {formatDuration(scenario.duration)}
              </div>
              <div style={{ fontSize: '10px', color: '#ffff00' }}>
                Reward: +2000 SP
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Expanded Content */}
      {isExpanded && (
        <>
          {/* Scenarios Section */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#0066ff' }}>
              🏆 Available Achievements
            </div>
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {scenarios.map((scenario, index) => (
                <div key={index} style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '8px',
                  borderRadius: '4px',
                  marginBottom: '6px',
                  cursor: 'pointer',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  transition: 'all 0.2s ease'
                }} 
                onMouseEnter={(e) => e.target.style.background = 'rgba(0, 102, 255, 0.1)'}
                onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.05)'}
                onClick={() => handleScenarioStart(scenario.name)}>
                  <div style={{ fontWeight: 'bold', fontSize: '11px', marginBottom: '4px' }}>
                    {scenario.name}
                  </div>
                  <div style={{ fontSize: '10px', color: '#ccc', marginBottom: '4px' }}>
                    {scenario.description}
                  </div>
                  <div style={{ fontSize: '10px', color: '#888' }}>
                    Duration: {formatDuration(scenario.duration)}
                  </div>
                  <div style={{ fontSize: '10px', color: '#ffff00' }}>
                    Reward: +2000 SP
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#0066ff' }}>
              ⚡ Quick Start
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              <button style={{
                background: 'rgba(0, 102, 255, 0.2)',
                border: '1px solid rgba(0, 102, 255, 0.3)',
                color: '#ffffff',
                padding: '6px',
                borderRadius: '4px',
                fontSize: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(0, 102, 255, 0.3)'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(0, 102, 255, 0.2)'}
              onClick={() => handleScenarioStart('Speed Demon')}>
                🚀 Speed Demon
              </button>
              
              <button style={{
                background: 'rgba(0, 102, 255, 0.2)',
                border: '1px solid rgba(0, 102, 255, 0.3)',
                color: '#ffffff',
                padding: '6px',
                borderRadius: '4px',
                fontSize: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(0, 102, 255, 0.3)'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(0, 102, 255, 0.2)'}
              onClick={() => handleScenarioStart('Orb Hunter')}>
                🎯 Orb Hunter
              </button>
              
              <button style={{
                background: 'rgba(0, 102, 255, 0.2)',
                border: '1px solid rgba(0, 102, 255, 0.3)',
                color: '#ffffff',
                padding: '6px',
                borderRadius: '4px',
                fontSize: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(0, 102, 255, 0.3)'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(0, 102, 255, 0.2)'}
              onClick={() => handleScenarioStart('Killer Instinct')}>
                ⚔️ Killer Instinct
              </button>
              
              <button style={{
                background: 'rgba(0, 102, 255, 0.2)',
                border: '1px solid rgba(0, 102, 255, 0.3)',
                color: '#ffffff',
                padding: '6px',
                borderRadius: '4px',
                fontSize: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(0, 102, 255, 0.3)'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(0, 102, 255, 0.2)'}
              onClick={() => handleScenarioStart('Endurance')}>
                🏃 Endurance
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div style={{ fontSize: '10px', color: '#888', lineHeight: '1.4' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#0066ff' }}>
              📋 Instructions:
            </div>
            <div>• Click achievements to start them</div>
            <div>• Complete objectives to earn +2000 SP</div>
            <div>• Blue achievement messages will appear</div>
            <div>• Use quick start for popular achievements</div>
            <div>• Achievements auto-complete when conditions are met</div>
          </div>
        </>
      )}
    </div>
  );
};

export default GameplayTester; 
 