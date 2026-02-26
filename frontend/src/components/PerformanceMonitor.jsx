import React, { useState, useEffect, useRef } from 'react';
import { PerformanceOptimizer } from '../utils/performanceOptimizer.js';

const PerformanceMonitor = ({ isVisible = false }) => {
  const [stats, setStats] = useState({
    fps: 60,
    targetFps: 60,
    frameSkip: 1,
    memory: 0,
    renderTime: 0,
    optimizationLevel: 'High'
  });
  
  const [scenarios, setScenarios] = useState([]);
  const [gameModes, setGameModes] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const optimizerRef = useRef(null);
  const animationFrameRef = useRef(null);
  const lastUpdateRef = useRef(0);

  useEffect(() => {
    if (!isVisible) return;

    optimizerRef.current = new PerformanceOptimizer();
    
    const updateStats = (currentTime) => {
      if (currentTime - lastUpdateRef.current < 100) return; // Update every 100ms
      lastUpdateRef.current = currentTime;
      
      if (optimizerRef.current) {
        const performanceStats = optimizerRef.current.getPerformanceStats();
        setStats(prev => ({
          ...prev,
          ...performanceStats,
          memory: performance.memory ? performance.memory.usedJSHeapSize / 1024 / 1024 : 0,
          renderTime: currentTime - lastUpdateRef.current
        }));
      }
      
      animationFrameRef.current = requestAnimationFrame(updateStats);
    };
    
    animationFrameRef.current = requestAnimationFrame(updateStats);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (optimizerRef.current) {
        optimizerRef.current.cleanup();
      }
    };
  }, [isVisible]);

  const getPerformanceColor = (fps) => {
    if (fps >= 55) return '#00ff44';
    if (fps >= 45) return '#ffff00';
    if (fps >= 30) return '#ff8800';
    return '#ff0000';
  };

  const getOptimizationLevel = (fps, frameSkip) => {
    if (fps >= 55 && frameSkip === 1) return 'High';
    if (fps >= 45 && frameSkip <= 2) return 'Medium';
    if (fps >= 30) return 'Low';
    return 'Critical';
  };

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(24, 28, 43, 0.95)',
      borderRadius: '8px',
      padding: '12px',
      minWidth: isExpanded ? '300px' : '200px',
      boxShadow: '0 4px 20px rgba(0, 255, 204, 0.3)',
      border: '1px solid rgba(0, 255, 204, 0.2)',
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
        marginBottom: '8px',
        cursor: 'pointer'
      }} onClick={() => setIsExpanded(!isExpanded)}>
        <div style={{ fontWeight: 'bold', color: '#00ffcc' }}>
          🚀 Performance Monitor
        </div>
        <div style={{ fontSize: '10px', color: '#888' }}>
          {isExpanded ? '▼' : '▶'}
        </div>
      </div>

      {/* Basic Stats */}
      <div style={{ marginBottom: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span>FPS:</span>
          <span style={{ color: getPerformanceColor(stats.fps) }}>
            {Math.round(stats.fps)}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span>Target:</span>
          <span>{stats.targetFps}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span>Frame Skip:</span>
          <span>{stats.frameSkip}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span>Memory:</span>
          <span>{stats.memory.toFixed(1)} MB</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span>Level:</span>
          <span style={{ 
            color: stats.optimizationLevel === 'High' ? '#00ff44' : 
                   stats.optimizationLevel === 'Medium' ? '#ffff00' : 
                   stats.optimizationLevel === 'Low' ? '#ff8800' : '#ff0000'
          }}>
            {stats.optimizationLevel}
          </span>
        </div>
      </div>

      {/* Performance Bar */}
      <div style={{
        width: '100%',
        height: '4px',
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '2px',
        marginBottom: '8px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${Math.min(100, (stats.fps / 60) * 100)}%`,
          height: '100%',
          background: `linear-gradient(90deg, ${getPerformanceColor(stats.fps)}, ${getPerformanceColor(stats.fps)}88)`,
          transition: 'width 0.3s ease'
        }} />
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '8px' }}>
          <div style={{ marginBottom: '8px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#00ffcc' }}>
              Optimization Details
            </div>
            <div style={{ fontSize: '10px', lineHeight: '1.4' }}>
              <div>Pool Objects: {Object.values(stats.poolSizes || {}).reduce((a, b) => a + b, 0)}</div>
              <div>Spatial Grid: {stats.spatialGridSize || 0} cells</div>
              <div>Visible Objects: {stats.visibleObjects || 0}</div>
              <div>Render Time: {stats.renderTime.toFixed(1)}ms</div>
            </div>
          </div>

          {/* Active Scenarios */}
          {scenarios.length > 0 && (
            <div style={{ marginBottom: '8px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#00ffcc' }}>
                Active Scenarios
              </div>
              {scenarios.map((scenario, index) => (
                <div key={index} style={{ fontSize: '10px', marginBottom: '2px' }}>
                  🎮 {scenario.name}
                </div>
              ))}
            </div>
          )}

          {/* Active Game Modes */}
          {gameModes.length > 0 && (
            <div style={{ marginBottom: '8px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#00ffcc' }}>
                Game Modes
              </div>
              {gameModes.map((mode, index) => (
                <div key={index} style={{ fontSize: '10px', marginBottom: '2px' }}>
                  🎯 {mode.name}
                </div>
              ))}
            </div>
          )}

          {/* Performance Tips */}
          <div style={{ fontSize: '10px', color: '#888', lineHeight: '1.4' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>💡 Tips:</div>
            {stats.fps < 30 && <div>• Reduce zoom level for better performance</div>}
            {stats.fps < 45 && <div>• Close other browser tabs</div>}
            {stats.memory > 100 && <div>• Refresh page to clear memory</div>}
            {stats.frameSkip > 1 && <div>• Performance mode active</div>}
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceMonitor; 
 