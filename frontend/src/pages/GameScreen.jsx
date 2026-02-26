import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config';
import { useVolume } from '../components/VolumeControl';
import useClickSound from '../hooks/useClickSound';
import { useNetwork } from '../App';
import PerformanceMonitor from '../components/PerformanceMonitor';
import GameplayTester from '../components/GameplayTester';
import './GameScreen.css';
import { useENSorAddress } from '../hooks/useENSorAddress';
import { ethers } from 'ethers';
import { useAchievements } from '../hooks/useAchievements';

// Achievement image mapping
const achievementImageMap = {
  'Speed Demon': 'sd.png',
  'Orb Hunter': 'orbhunter.png',
  'Killer Instinct': 'killer.png',
  'Moving Orb Master': 'mom.png',
  'Giant Slayer': 'gs.png',
  'Speed Runner': 'speed_runner.png',
  'Orb Chain': 'orbchain.png',
  'Endurance': 'endu.png',
  'Escape Artist': 'escapea.png'
};

// ...other imports


// Game server URL - change this to your production server
const GAME_SERVER_URL = process.env.REACT_APP_GAME_SERVER || "ws://localhost:2567";

function GameScreen() {
  // Session-based achievements for the current game session
  const [sessionAchievements, setSessionAchievements] = useState({
    'Speed Demon': false,
    'Escape Artist': false,
    'Orb Hunter': false,
    'Endurance': false,
    'Killer Instinct': false,
    'Giant Slayer': false,
    'Speed Runner': false,
    'Orb Chain': false,
    'Moving Orb Master': false
  });

  function resetSessionAchievements() {
  console.log('🔄 Resetting session achievements');
  setSessionAchievements({
    'Speed Demon': false,
    'Escape Artist': false,
    'Orb Hunter': false,
    'Endurance': false,
    'Killer Instinct': false,
    'Giant Slayer': false,
    'Speed Runner': false,
    'Orb Chain': false,
    'Moving Orb Master': false
  });
  
  // Reset the notification tracking ref
  achievementNotificationShownRef.current = {
    'Speed Demon': false,
    'Escape Artist': false,
    'Orb Hunter': false,
    'Endurance': false,
    'Killer Instinct': false,
    'Giant Slayer': false,
    'Speed Runner': false,
    'Orb Chain': false,
    'Moving Orb Master': false
  };
  
  // Also clear any pending notifications
  console.log('🔄 Clearing achievement notifications');
  setAchievementNotifications([]);
}

  const [isPlayer, setIsPlayer] = useState(false);
  const [ethDrops, setEthDrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [gameState, setGameState] = useState(null);
  const [joined, setJoined] = useState(false);
  const [room, setRoom] = useState(null);
  const [client, setClient] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [hasAttemptedConnection, setHasAttemptedConnection] = useState(false);
  const canvasRef = useRef(null);
  const navigate = useNavigate();
  const safeNavigate = (path, options) => {
    try {
      if (path !== '/notfound') {
        navigate(path, options);
      } else {
        console.error('Attempted to navigate to /notfound - prevented');
      }
    } catch (err) {
      console.error('Navigation error:', err);
    }
  };
  const location = useLocation();
  const wagerAmount = location.state?.wagerAmount;
  const isTestMode = location.state?.isTestMode || false;
  const testModeType = location.state?.testModeType;
  const expectedTestName = testModeType === 'test123' ? 'test123' : testModeType === 'test321' ? 'test321' : 'test123';
  const [playerName, setPlayerName] = useState("");
  const [showNamePrompt, setShowNamePrompt] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [nameTakenError, setNameTakenError] = useState(false);
  const nameTakenTimerRef = useRef(null);
  const achievementNotificationShownRef = useRef({
    'Speed Demon': false,
    'Escape Artist': false,
    'Orb Hunter': false,
    'Endurance': false,
    'Killer Instinct': false,
    'Giant Slayer': false,
    'Speed Runner': false,
    'Orb Chain': false,
    'Moving Orb Master': false
  });
  const [segmentLossFlash, setSegmentLossFlash] = useState(false);
  const [pendingTx, setPendingTx] = useState(null);
  const [isBoosting, setIsBoosting] = useState(false);
  const [pressedKeys, setPressedKeys] = useState(new Set());
  const [lastDirection, setLastDirection] = useState({ dx: 1, dy: 0 });
  const [mouseTarget, setMouseTarget] = useState({ x: 1000, y: 600 }); // Center by default
  const lastSentDirectionRef = useRef({ dx: 1, dy: 0 });
  const [cameraX, setCameraX] = useState(0);
  const [cameraY, setCameraY] = useState(0);
  const [showDeathScreen, setShowDeathScreen] = useState(false);
  const [deathTimer, setDeathTimer] = useState(0);
  const [ethOrbWinnings, setEthOrbWinnings] = useState(0);
  const [totalClaimableEth, setTotalClaimableEth] = useState(0);
  const prevEthOrbWinnings = useRef(0);
  const [glow, setGlow] = useState(false);
  
  // Move the useAccount hook up here before it's used
  const { address, isConnected } = useAccount();
 
  useEffect(() => {
    async function fetchEthOrbWinnings() {
      if (!address || !window.ethereum) return;
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      const orbWinnings = await contract.ethOrbWinnings(address);
      const orbWinningsEth = Number(ethers.utils.formatEther(orbWinnings));
      setEthOrbWinnings(orbWinningsEth);
      setTotalClaimableEth(orbWinningsEth + Number(wagerAmount || 0));
      if (orbWinningsEth > prevEthOrbWinnings.current) {
        setGlow(true);
        setTimeout(() => setGlow(false), 1200);
      }
      prevEthOrbWinnings.current = orbWinningsEth;
    }
    fetchEthOrbWinnings();
  }, [address, wagerAmount]);

  // Session tracking for stats
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [orbsEaten, setOrbsEaten] = useState(0);
  const [ethOrbsEaten, setEthOrbsEaten] = useState(0); // Track ETH orb pickups separately
  const [ethEarned, setEthEarned] = useState(0); // Add ETH tracking
  const [kills, setKills] = useState(0);
  const [timeSurvived, setTimeSurvived] = useState(0);
  const [spEarned, setSpEarned] = useState(0);
  
  // Escape functionality
  const [escapeProgress, setEscapeProgress] = useState(0);
  const [isEscaping, setIsEscaping] = useState(false);
  const escapeTimerRef = useRef(null);
  const escapeKeyDownTimeRef = useRef(null);
  const [escapePending, setEscapePending] = useState(false);
  
  // Death state
  const [isDead, setIsDead] = useState(false);

  // World dimensions (much larger than visible area)
  const WORLD_SIZE = 12000; // Increased from 8000 to 12000 for bigger boundary
  const VISIBLE_WIDTH = 1800;
  const VISIBLE_HEIGHT = 1100;

  // Add after orbsEaten state:
  const [playerSnakeSize, setPlayerSnakeSize] = useState(12); // Default radius
  const [ethOrbs, setEthOrbs] = useState([]); // ETH orbs from dead snakes
  const [popAnimations, setPopAnimations] = useState([]); // Track pop animations for disappearing segments
  const [previousSegmentCounts, setPreviousSegmentCounts] = useState({}); // Track previous segment counts for each player
  const [lastKilledPlayerSegments, setLastKilledPlayerSegments] = useState(null);
  const [killGlowEffects, setKillGlowEffects] = useState({});
  const [currentZoom, setCurrentZoom] = useState(1); // Track current camera zoom level
  const [showLargeSnakeWarning, setShowLargeSnakeWarning] = useState(false);
  const [largeSnakeWarningText, setLargeSnakeWarningText] = useState('');
  const [previousSegmentCount, setPreviousSegmentCount] = useState(0);
  const largeSnakeWarningTimerRef = useRef(null);
  
  // Performance optimization
  const [showPerformanceMonitor, setShowPerformanceMonitor] = useState(false);
  const [showGameplayTester, setShowGameplayTester] = useState(false);
  const performanceOptimizerRef = useRef(null);
  const orbOptimizerRef = useRef(null);
  const snakeOptimizerRef = useRef(null);
  const scenarioManagerRef = useRef(null);
  const prevOrbsEatenRef = useRef(0);
  const prevEthOrbsEatenRef = useRef(0); // Add missing ref for ETH orbs
  const prevKillsForBonusRef = useRef(0); // Add missing ref for kill bonus
  
  // Achievement tracking
  const [showAchievementList, setShowAchievementList] = useState(true);
  const [showMinimap, setShowMinimap] = useState(true);
  const [showMovementTracker, setShowMovementTracker] = useState(true);
  
  // Achievement notifications and SP tracking
  const [achievementSP, setAchievementSP] = useState(0);
  const [achievementNotifications, setAchievementNotifications] = useState([]);
  
  // Quest tracking with dynamic import
  const [questTracker, setQuestTracker] = useState(null);
  const [questNotifications, setQuestNotifications] = useState([]);
  const [completedQuests, setCompletedQuests] = useState([]);
  
  // Track if multi-game quests have been updated for this session
  const multiGameQuestsUpdatedRef = useRef(false);
  
  // Track quests completed in the current game session
  const [sessionCompletedQuests, setSessionCompletedQuests] = useState(new Set());
  
  // Load QuestTracker dynamically
  useEffect(() => {
    import('../utils/questTracker.js')
      .then(module => {
        setQuestTracker(module.default.getInstance());
      })
      .catch(error => {
        console.error('Failed to load QuestTracker:', error);
      });
  }, []);
  
  // Achievement tracking with both state and ref for better compatibility
  const [achievements, updateAchievement] = useAchievements();
  
  // Speed Demon tracking
  const [speedDemonCount, setSpeedDemonCount] = useState(0);
  
  // Boost tracking for Speed Demon achievement
  const [boostCount, setBoostCount] = useState(0);

  const { volume } = useVolume();

  const playClick = useClickSound();

  const { networkConfig } = useNetwork();

  const { data: joinGameTx, writeContract, isPending: isJoinGameLoading, error: joinGameError } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ 
    hash: joinGameTx?.hash 
  });

  // Boost system - redesigned with 7s free boost, then 3s cooldown
  const BOOST_FREE_DURATION = 7000; // 7 seconds free boost
  const BOOST_COOLDOWN = 3000; // 3 seconds cooldown after free period
  const [boostActive, setBoostActive] = useState(false);
  const [boostCooldown, setBoostCooldown] = useState(0);
  const [boostFreeTimeRemaining, setBoostFreeTimeRemaining] = useState(BOOST_FREE_DURATION);
  const [totalBoostTimeUsed, setTotalBoostTimeUsed] = useState(0);
  const boostInitializedRef = useRef(false); // Use ref instead of state to avoid race conditions
  
  // Create a wrapper for setBoostFreeTimeRemaining to log all changes
  const setBoostFreeTimeRemainingWithLog = (value) => {
    console.log('[BOOST] Setting boostFreeTimeRemaining to:', value, 'from:', boostFreeTimeRemaining);
    setBoostFreeTimeRemaining(value);
  };
  
  const canBoost = boostCooldown === 0 && !isDead && !escapePending && (boostFreeTimeRemaining > 0 || !boostInitializedRef.current);

  const startBoost = () => {
    console.log('[BOOST] startBoost called. boostInitialized:', boostInitializedRef.current, 'boostFreeTimeRemaining:', boostFreeTimeRemaining);
    if (!canBoost) return;
    setBoostActive(true);
    if (client) client.send(JSON.stringify({ type: 'boost', active: true }));
    setSegmentLossFlash(true);
    setTimeout(() => setSegmentLossFlash(false), 300);
    
    // Only initialize if boost hasn't been initialized yet (i.e., after cooldown)
    if (!boostInitializedRef.current) {
      boostStartTimeRef.current = Date.now();
      console.log('[BOOST] Initializing new boost cycle. Resetting boostFreeTimeRemaining to', BOOST_FREE_DURATION);
      setBoostFreeTimeRemainingWithLog(BOOST_FREE_DURATION);
      setTotalBoostTimeUsed(0);
      console.log('[BOOST] Setting boostInitialized to true (new boost cycle)');
      boostInitializedRef.current = true;
    } else {
      console.log('[BOOST] Resuming boost. Remaining time:', boostFreeTimeRemaining);
    }
    // If boostInitialized is true, we preserve the existing boostFreeTimeRemaining value
    
    // Only set up intervals if not already running
    if (!freeTimeTimerRef.current) {
      freeTimeTimerRef.current = setInterval(() => {
        setTotalBoostTimeUsed(prevTotal => {
          const newTotal = prevTotal + 100;
          if (questTracker && address) {
            updateSingleGameQuests();
            updateMultiGameQuests();
            checkQuestCompletions();
          }
          if (newTotal >= BOOST_FREE_DURATION) {
            // Boost ran out naturally - stop boost and start cooldown
            setBoostActive(false);
            boostInitializedRef.current = false; // Reset for next boost cycle
            if (client) client.send(JSON.stringify({ type: 'boost', active: false }));
            if (freeTimeTimerRef.current) {
              clearInterval(freeTimeTimerRef.current);
              freeTimeTimerRef.current = null;
            }
            if (segmentRemovalTimerRef.current) {
              clearInterval(segmentRemovalTimerRef.current);
              segmentRemovalTimerRef.current = null;
            }
            console.log('[BOOST] Boost ran out naturally. Setting boostFreeTimeRemaining to 0');
            setBoostFreeTimeRemainingWithLog(0);
    setBoostCooldown(BOOST_COOLDOWN);
            if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    cooldownTimerRef.current = setInterval(() => {
      setBoostCooldown(prev => {
        if (prev <= 100) {
          clearInterval(cooldownTimerRef.current);
          cooldownTimerRef.current = null;
          return 0;
        }
        return prev - 100;
              });
            }, 100);
            console.log('[BOOST] Setting boostInitialized to false (boost ran out naturally)');
            boostInitializedRef.current = false; // Reset for next boost cycle
            return 0;
          }
          return newTotal;
        });
        setBoostFreeTimeRemaining(prev => {
          const newValue = prev - 100;
          // Prevent negative values
          if (newValue <= 0) console.log('[BOOST] Timer reached zero in interval.');
          return Math.max(0, newValue);
      });
    }, 100);
    }
    if (!segmentRemovalTimerRef.current) {
      segmentRemovalTimerRef.current = setInterval(() => {
        if (client) {
          client.send(JSON.stringify({ type: 'removeSegment' }));
          client.send(JSON.stringify({ type: 'removeSegment' }));
          client.send(JSON.stringify({ type: 'removeSegment' }));
        }
      }, 1000);
    }
  };

  const stopBoost = () => {
    console.log('[BOOST] stopBoost called. boostActive:', boostActive, 'boostFreeTimeRemaining:', boostFreeTimeRemaining);
    if (!boostActive) return;
    setBoostActive(false);
    if (client) client.send(JSON.stringify({ type: 'boost', active: false }));
    setSegmentLossFlash(true);
    setTimeout(() => setSegmentLossFlash(false), 300);
    
    // Clear timers but preserve the remaining boost time
    if (freeTimeTimerRef.current) {
      clearInterval(freeTimeTimerRef.current);
      freeTimeTimerRef.current = null;
    }
    if (segmentRemovalTimerRef.current) {
      clearInterval(segmentRemovalTimerRef.current);
      segmentRemovalTimerRef.current = null;
    }
    // Don't reset boostFreeTimeRemaining - preserve the current value
    // Don't reset totalBoostTimeUsed - preserve the current value
    // Don't reset boostInitialized - keep it true so we don't reinitialize
    // Manual stop - no cooldown, just pause the boost
  };

  // Replace toggleBoost with new logic
  const handleBoostButton = () => {
    if (boostActive) {
      stopBoost();
    } else {
      startBoost();
    }
  };

  const handleMouseDown = (e) => {
    if (e.button === 0 && !isDead) {
      e.preventDefault();
      if (boostActive) {
        stopBoost();
      } else {
        startBoost();
      }
    }
  };

  // --- ACHIEVEMENT REPORTING PATCH ---
  // Send achievementSP to server immediately when it increases
  const prevAchievementSP = useRef(0);
  
  // Add missing refs that are being used but not defined
  const boostTimerRef = useRef(null);
  const freeTimeTimerRef = useRef(null);
  const boostStartTimeRef = useRef(null);
  const segmentRemovalTimerRef = useRef(null);
  const cooldownTimerRef = useRef(null);
  
  // Add prevStatsRef for quest tracking delta calculations
  const prevStatsRef = useRef({
    kills: 0,
    orbsEaten: 0,
    ethOrbsEaten: 0,
    timeSurvived: 0,
  });
  
  useEffect(() => {
    if (client && achievementSP > prevAchievementSP.current) {
      client.send(JSON.stringify({ type: 'achievementSP', achievementSP }));
      prevAchievementSP.current = achievementSP;
    }
  }, [achievementSP, client]);
  // Also send on death/escape
  useEffect(() => {
    if ((isDead || escapePending) && client) {
      client.send(JSON.stringify({ type: 'achievementSP', achievementSP }));
    }
  }, [isDead, escapePending, achievementSP, client]);

  // Escape functionality
  const escapeSoundRef = useRef(null);
  const startEscape = () => {
    if (isEscaping) return;
    console.log('Starting escape sequence...');
    setIsEscaping(true);
    setEscapeProgress(0);
    let escapeSoundPlayed = false;
    let immunityStarted = false;
    escapeKeyDownTimeRef.current = Date.now();
    escapeTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - escapeKeyDownTimeRef.current;
      const progress = Math.min((elapsed / 3000) * 100, 100); // 3 seconds
      setEscapeProgress(progress);
      
      // Start immunity at 1.5 seconds (50% progress)
      if (!immunityStarted && elapsed >= 1500) {
        immunityStarted = true;
        if (client && client.readyState === WebSocket.OPEN) {
          console.log('Starting immunity - sending escapeStart message...');
          client.send(JSON.stringify({ type: 'escapeStart' }));
        }
      }
      
      // Play escape sound at 2 seconds (66%) only once
      if (!escapeSoundPlayed && progress >= 66) {
        escapeSoundPlayed = true;
        if (escapeSoundRef.current) {
          escapeSoundRef.current.currentTime = 0;
          escapeSoundRef.current.play();
        }
      }
      
      if (progress >= 100) {
        // Escape complete
        clearInterval(escapeTimerRef.current);
        setIsEscaping(false);
        setEscapeProgress(0);
        // Send escape message to server to get final stats
    if (client && client.readyState === WebSocket.OPEN) {
          console.log('Sending escape message to server...');
          setEscapePending(true);
          
          // Import the handleEscape function from escapeGameLogic
          import('../contract/escapeGameLogic').then(({ handleEscape }) => {
            // Call the handleEscape function (no blockchain transaction)
            handleEscape().then(() => {
              console.log('Escape handled on frontend');
            }).catch(error => {
              console.error('Error handling escape:', error);
            });
          });
          
          // Add Escape Artist achievement before counting
          setSessionAchievements(prev => ({ ...prev, ['Escape Artist']: true }));
          try {
            updateAchievement('Escape Artist', true);
          } catch (err) {
            console.error('Failed to update achievement:', err);
          }
          
          // Count achievements after adding Escape Artist
          const achievementCount = Object.values(sessionAchievements).filter(Boolean).length;
          
          client.send(JSON.stringify({ type: 'escape', achievements: achievementCount }));
          console.log('Escape message sent with achievement count:', achievementCount);
          // Set a timeout in case server doesn't respond
          const escapeTimeout = setTimeout(() => {
            console.log('Escape timeout - using fallback data');
            setEscapePending(false);
            safeNavigate('/escape', {
              state: {
                isTestMode: isTestMode,
                wagerAmount: wagerAmount || 0,
                stakeAmount: wagerAmount || 0,
                escaped: true,
                // Real session data
                timeSurvived: timeSurvived,
                orbsEaten: orbsEaten,
                kills: kills,
                spEarned: spEarned,
                sessionStartTime,
                achievements,
                achievementSP,
                sessionCompletedQuests: Array.from(sessionCompletedQuests)
              }
            });
          }, 3000); // 3 second timeout
          // Store timeout reference to clear it if server responds
          window.escapeTimeoutRef = escapeTimeout;
        } else {
          console.log('No client connection, using fallback escape');
          console.log('Client state:', client);
          console.log('Client readyState:', client?.readyState);
          // Fallback if no server connection
          safeNavigate('/escape', {
            state: {
              isTestMode: isTestMode,
              wagerAmount: wagerAmount || 0,
              stakeAmount: wagerAmount || 0,
              escaped: true,
              // Real session data
              timeSurvived: timeSurvived,
              orbsEaten: orbsEaten,
              kills: kills,
              spEarned: spEarned,
              sessionStartTime,
              achievements,
              achievementSP,
              sessionCompletedQuests: Array.from(sessionCompletedQuests)
            }
          });
    }
      }
    }, 50);
  };

  const stopEscape = () => {
    console.log('stopEscape called');
    if (escapeTimerRef.current) {
      clearInterval(escapeTimerRef.current);
      escapeTimerRef.current = null;
    }
    setIsEscaping(false);
    setEscapeProgress(0);
    // Stop escape sound if playing
    if (escapeSoundRef.current) {
      escapeSoundRef.current.pause();
      escapeSoundRef.current.currentTime = 0;
    }
  };

  // Mouse movement handler with improved precision
  useEffect(() => {
    function handleMouseMove(e) {
      if (!joined || !canvasRef.current || isDead) return; // Don't move if dead
      
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // Update mouse target for smooth movement
      setMouseTarget({ x: mouseX, y: mouseY });
    }

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, [joined, isDead]);

  // Camera and zoom system - INDIVIDUAL PER PLAYER
  useEffect(() => {
    if (!gameState || !gameState.players) return;
    
    const playerId = Object.keys(gameState.players).find(
      id => gameState.players[id].wallet?.toLowerCase() === (address?.toLowerCase() || "0x0000000000000000000000000000000000000000")
    );
    
    if (!playerId || !gameState.players[playerId] || !gameState.players[playerId].segments.length) return;
    
    const player = gameState.players[playerId];
    const head = player.segments[0];
    const segmentCount = player.segments.length;
    
    // Calculate zoom factor for this specific player only
    let zoomFactor = 1;
    
    if (segmentCount >= 40) {
      // Progressive zoom scaling - more aggressive for larger snakes
      const zoomStart = 40;
      const maxZoom = 12.0; // Increased from 8.0 to 12.0 for even more zoom out
      
      if (segmentCount >= 100) {
        // Very large snakes (100+ segments) - aggressive zooming
        const largeSnakeSegments = segmentCount - 100;
        const largeSnakeZoom = 1 + (60 * 0.008) + (largeSnakeSegments * 0.015); // Progressive scaling
        zoomFactor = Math.min(maxZoom, largeSnakeZoom);
      } else if (segmentCount >= 60) {
        // Large snakes (60-99 segments) - moderate zooming
        const mediumSnakeSegments = segmentCount - 60;
        const mediumSnakeZoom = 1 + (20 * 0.008) + (mediumSnakeSegments * 0.012);
        zoomFactor = Math.min(maxZoom, mediumSnakeZoom);
      } else {
        // Medium snakes (40-59 segments) - gentle zooming
        const smallSnakeSegments = segmentCount - zoomStart;
        zoomFactor = Math.min(maxZoom, 1 + smallSnakeSegments * 0.008);
      }
    }
    
    // Add additional zoom based on game area coverage
    const worldRadius = WORLD_SIZE / 2;
    const playerDistanceFromCenter = Math.sqrt(head.x * head.x + head.y * head.y);
    const centerProximityFactor = Math.max(0, (worldRadius - playerDistanceFromCenter) / worldRadius);
    
    // Slight additional zoom when near center (more dangerous area)
    if (centerProximityFactor > 0.3) {
      zoomFactor *= (1 + centerProximityFactor * 0.15); // Increased from 0.1 to 0.15 for better center zoom
    }
    
    // Enhanced zoom smoothing for better performance
    setCurrentZoom(prevZoom => {
      // Smoother zoom transitions for better LOD performance
      const zoomSmoothing = 0.08; // Reduced from 0.1 for smoother transitions
      const newZoom = prevZoom + (zoomFactor - prevZoom) * zoomSmoothing;
      
      // Center camera on player (account for zoom level) - moved inside zoom update
      setCameraX(head.x - (VISIBLE_WIDTH * newZoom) / 2);
      setCameraY(head.y - (VISIBLE_HEIGHT * newZoom) / 2);
      
      return newZoom;
    });
  }, [gameState, address]);

  // Animation loop for mouse-based movement (relative to camera) - IMPROVED PRECISION
  useEffect(() => {
    if (!joined || !client || !gameState || !gameState.players || isDead) return; // Don't move if dead
    let animationId;
    // Store the current direction for smoothing
    let currentDirection = { dx: lastSentDirectionRef.current.dx, dy: lastSentDirectionRef.current.dy };
    const TURN_SPEED = 0.4; // Increased from 0.3 for more responsive turning
    function updateDirection() {
      const playerId = Object.keys(gameState.players).find(
        id => gameState.players[id].wallet?.toLowerCase() === (address?.toLowerCase() || "0x0000000000000000000000000000000000000000")
      );
      if (!playerId) {
        animationId = requestAnimationFrame(updateDirection);
        return;
      }
      const snake = gameState.players[playerId];
      if (!snake || !snake.segments || snake.segments.length === 0) {
        animationId = requestAnimationFrame(updateDirection);
        return;
      }
      const head = snake.segments[0];
      
      // Convert mouse position to world coordinates (relative to camera)
      // Use currentZoom for accurate coordinate conversion
      const worldMouseX = (mouseTarget.x * currentZoom) + cameraX;
      const worldMouseY = (mouseTarget.y * currentZoom) + cameraY;
      
      const dx = worldMouseX - head.x;
      const dy = worldMouseY - head.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      
      if (len > 1) {
        // Desired direction (normalized)
        const ndx = dx / len;
        const ndy = dy / len;
        
        // Interpolate current direction toward desired direction
        currentDirection.dx += (ndx - currentDirection.dx) * TURN_SPEED;
        currentDirection.dy += (ndy - currentDirection.dy) * TURN_SPEED;
        
        // Normalize after interpolation
        const clen = Math.sqrt(currentDirection.dx * currentDirection.dx + currentDirection.dy * currentDirection.dy);
        if (clen > 0) {
          currentDirection.dx /= clen;
          currentDirection.dy /= clen;
        }
        
        // Only send if direction changed significantly
        const last = lastSentDirectionRef.current;
        if (Math.abs(currentDirection.dx - last.dx) > 0.003 || Math.abs(currentDirection.dy - last.dy) > 0.003) {
          client.send(JSON.stringify({ type: 'move', direction: { dx: currentDirection.dx, dy: currentDirection.dy } }));
          lastSentDirectionRef.current = { dx: currentDirection.dx, dy: currentDirection.dy };
        }
      }
      animationId = requestAnimationFrame(updateDirection);
    }
    animationId = requestAnimationFrame(updateDirection);
    return () => cancelAnimationFrame(animationId);
  }, [mouseTarget, cameraX, cameraY, joined, client, gameState, address, isDead, currentZoom]);
  // --- END SLITHER.IO CAMERA SYSTEM ---

  useEffect(() => {
    // Prevent multiple connection attempts
    if (hasAttemptedConnection || isConnecting || client) {
      return;
    }

    async function joinGameServer() {
      // Prevent multiple connections
      if (isConnecting || client) {
        console.log("Already connecting or connected, skipping...");
        return;
      }

      setLoading(true);
      setError("");
      setIsConnecting(true);
      setHasAttemptedConnection(true);
      
      try {
        console.log("Attempting to join game server...");
        // Bypass ethers for testing mode
        const wallet = address || "0x0000000000000000000000000000000000000000";
        const playerNameToUse = playerName || "TestPlayer";
        
        console.log("Creating WebSocket connection to:", GAME_SERVER_URL);
        const newClient = new WebSocket(GAME_SERVER_URL);
        setClient(newClient);
        
        newClient.onopen = () => {
          console.log("WebSocket connected successfully");
          setIsConnecting(false);
          
          // Send join message
          console.log("Sending join message with:", { wallet, name: playerNameToUse });
          newClient.send(JSON.stringify({
            type: 'join',
            wallet: wallet,
            name: playerNameToUse
          }));
        };
        
        newClient.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            console.log("Received message:", message);
            
            if (message.type === 'state') {
              console.log("Game state received:", message.data);
              setGameState(message.data);
              
              // Add detailed achievement debugging
              if (message.data && message.data.players) {
                const playerId = Object.keys(message.data.players).find(
                  id => message.data.players[id].wallet?.toLowerCase() === (address?.toLowerCase() || "0x0000000000000000000000000000000000000000")
                );
                
                if (playerId && message.data.players[playerId]) {
                  const player = message.data.players[playerId];
                  console.log('🎯 ACHIEVEMENT DEBUG - Player Stats:', {
                    normalOrbsEaten: player.normalOrbsEaten || 0,
                    movingOrbsEaten: player.movingOrbsEaten || 0,
                    kills: player.kills || 0,
                    timeSurvived: Math.floor((Date.now() - (player.sessionStartTime || sessionStartTime)) / 1000),
                    segments: player.segments ? player.segments.length : 0,
                    ethEarned: player.ethEarned || 0,
                    boostTimeUsed: totalBoostTimeUsed
                  });
                  
                  // Log achievement criteria checks
                  console.log('🎯 ACHIEVEMENT DEBUG - Criteria Checks:', {
                    'Orb Hunter': `${player.normalOrbsEaten || 0}/50 orbs, ${Math.floor((Date.now() - (player.sessionStartTime || sessionStartTime)) / 1000)}/120s`,
                    'Killer Instinct': `${player.kills || 0}/3 kills, ${Math.floor((Date.now() - (player.sessionStartTime || sessionStartTime)) / 1000)}/300s`,
                    'Moving Orb Master': `${player.movingOrbsEaten || 0}/20 orbs, ${Math.floor((Date.now() - (player.sessionStartTime || sessionStartTime)) / 1000)}/240s`,
                    'Speed Demon': `${totalBoostTimeUsed}/25000ms boost time`,
                    'Orb Chain': `${player.normalOrbsEaten || 0}/10 orbs, ${Math.floor((Date.now() - (player.sessionStartTime || sessionStartTime)) / 1000)}/30s`,
                    'Endurance': `${Math.floor((Date.now() - (player.sessionStartTime || sessionStartTime)) / 1000)}/1200s survived`,
                    'Giant Slayer': `${lastKilledPlayerSegments || 0}/35 segments killed`
                  });
                  
                  // Log current session achievements
                  console.log('🎯 ACHIEVEMENT DEBUG - Current Session Achievements:', sessionAchievements);
                }
              }
              
              // Check for players with active kill rewards (red glow effect)
              if (message.data && message.data.players) {
                const currentTime = Date.now();
                const newKillGlowEffects = {};
                
                // Debug: Log what player data we're receiving
                const playerIds = Object.keys(message.data.players);
                if (playerIds.length > 0) {
                  const samplePlayerId = playerIds[0];
                  const samplePlayer = message.data.players[samplePlayerId];
                  console.log(`Received game state. Sample player ${samplePlayerId}:`, {
                    killRewardActive: samplePlayer.killRewardActive,
                    killRewardStartTime: samplePlayer.killRewardStartTime,
                    killRewardDuration: samplePlayer.killRewardDuration,
                    hasKillReward: !!(samplePlayer.killRewardActive && samplePlayer.killRewardStartTime && samplePlayer.killRewardDuration)
                  });
                }
                
                for (const [id, player] of Object.entries(message.data.players)) {
                  if (player.killRewardActive && player.killRewardStartTime && player.killRewardDuration) {
                    const elapsed = currentTime - player.killRewardStartTime;
                    if (elapsed < player.killRewardDuration) {
                      // Player has active kill reward - show red glow
                      newKillGlowEffects[id] = {
                        startTime: player.killRewardStartTime,
                        duration: player.killRewardDuration,
                        intensity: 1.0
                      };
                      console.log(`Setting kill glow for player ${id}, elapsed: ${elapsed}ms, duration: ${player.killRewardDuration}ms`);
                    } else {
                      console.log(`Kill reward expired for player ${id}, elapsed: ${elapsed}ms, duration: ${player.killRewardDuration}ms`);
                    }
                  }
                }
                
                // Only update if there are changes to prevent unnecessary re-renders
                setKillGlowEffects(prev => {
                  const prevKeys = Object.keys(prev);
                  const newKeys = Object.keys(newKillGlowEffects);
                  
                  if (prevKeys.length !== newKeys.length) {
                    console.log(`Kill glow effects changed: ${prevKeys.length} -> ${newKeys.length}`);
                    return newKillGlowEffects;
                  }
                  
                  for (const key of prevKeys) {
                    if (!newKillGlowEffects[key] || 
                        prev[key].startTime !== newKillGlowEffects[key].startTime ||
                        prev[key].duration !== newKillGlowEffects[key].duration) {
                      console.log(`Kill glow effect updated for player ${key}`);
                      return newKillGlowEffects;
                    }
                  }
                  
                  return prev; // No changes
                });
              }
              
              // Track orb collisions for session stats
              if (message.data && message.data.players) {
                const playerId = Object.keys(message.data.players).find(
                  id => message.data.players[id].wallet?.toLowerCase() === (address?.toLowerCase() || "0x0000000000000000000000000000000000000000")
                );
                
                if (playerId && message.data.players[playerId]) {
                  const player = message.data.players[playerId];
                  // Debug: Log SP values
                  console.log('Player SP debug:', {
                    playerId,
                    playerName: player.name,
                    SP: player.SP,
                    orbsEaten: player.normalOrbsEaten || 0,
                    kills: player.kills,
                    timeSurvived: Math.floor((Date.now() - (player.joinedAt || Date.now())) / 1000)
                  });
          
                  // Update previous segment count
                  const currentSegmentCount = player.segments ? player.segments.length : 0;
                  setPreviousSegmentCount(currentSegmentCount);
                  if (questTracker && address) {
                    updateSingleGameQuests();
                    updateMultiGameQuests();
                    checkQuestCompletions();
                  }
                  
                  // Update previous segment counts for all players
                  setPreviousSegmentCounts(prev => ({
                    ...prev,
                    [playerId]: currentSegmentCount
                  }));
                  
                  // Update orbs eaten directly from server data
                  // Fix: Check both possible property names for normal orbs
                  const newOrbsEaten = player.normalOrbsEaten || player.normalorbsEaten || 0;
                  if (newOrbsEaten > prevOrbsEatenRef.current) {
                    console.log('🔮 Orb eaten! Playing orb sound. New:', newOrbsEaten, 'Previous:', prevOrbsEatenRef.current);
                    setOrbsEaten(newOrbsEaten);
                    
                    // Force immediate check for orb-related achievements
                    // Only trigger Orb Chain achievement once per session
                    if (newOrbsEaten >= 10 && timeSurvived <= 30 && !sessionAchievements['Orb Chain'] && !achievementNotificationShownRef.current['Orb Chain']) {
                      try {
                        console.log('🎯 Quick check: Orb Chain achievement condition met!');
                        // Mark as achieved to prevent multiple notifications
                        setSessionAchievements(prev => ({ ...prev, ['Orb Chain']: true }));
                        // Mark as shown to prevent duplicate notifications
                        achievementNotificationShownRef.current['Orb Chain'] = true;
                        updateAchievement('Orb Chain', true);
                        setAchievementSP(prev => prev + 2000);
                        
                              // Add notification with correct achievement name for image lookup
                      setAchievementNotifications(prev => {
                        console.log('📢 Adding Orb Chain notification to:', prev);
                        const newNotifications = [...prev, {
                          id: Date.now() + Math.random(),
                          achievement: 'Orb Chain', // Exact name matching achievementImageMap
                          message: 'Orb Chain Achievement Unlocked! +2000 SP',
                          timestamp: Date.now()
                        }];
                        console.log('📢 New notifications array:', newNotifications);
                        return newNotifications;
                      });
                        setTimeout(() => playAchievementSound(), 50);
                      } catch (err) {
                        console.error('Error processing Orb Chain achievement:', err);
                      }
                    }
                    
                    // Only trigger Orb Hunter achievement once per session
                    if (newOrbsEaten >= 50 && timeSurvived <= 120 && !sessionAchievements['Orb Hunter'] && !achievementNotificationShownRef.current['Orb Hunter']) {
                      try {
                        console.log('🎯 Quick check: Orb Hunter achievement condition met!');
                        // Mark as achieved to prevent multiple notifications
                        setSessionAchievements(prev => ({ ...prev, ['Orb Hunter']: true }));
                        // Mark as shown to prevent duplicate notifications
                        achievementNotificationShownRef.current['Orb Hunter'] = true;
                        updateAchievement('Orb Hunter', true);
                        setAchievementSP(prev => prev + 2000);
                        
                        // Add notification with correct achievement name for image lookup
                        setAchievementNotifications(prev => [...prev, {
                          id: Date.now() + Math.random(),
                          achievement: 'Orb Hunter', // Exact name matching achievementImageMap
                          message: 'Orb Hunter Achievement Unlocked! +2000 SP',
                          timestamp: Date.now()
                        }]);
                        setTimeout(() => playAchievementSound(), 50);
                      } catch (err) {
                        console.error('Error processing Orb Hunter achievement:', err);
                      }
                    }
                    
                    if (questTracker && address) {
                      updateSingleGameQuests();
                      updateMultiGameQuests();
                      checkQuestCompletions();
                    }
                    prevOrbsEatenRef.current = newOrbsEaten;
                    // Play orb sound immediately
                    playSound(orbSound, volume * 0.32);
                  }
                  // Update ETH orbs eaten from server data
                  // Fix: Check both possible property names for ETH orbs
                  const newEthOrbsEaten = player.ethOrbsEaten || player.ethorbsEaten || 0;
                  if (newEthOrbsEaten > prevEthOrbsEatenRef.current) {
                    console.log('💰 ETH orb eaten! Playing ETH orb sound. New:', newEthOrbsEaten, 'Previous:', prevEthOrbsEatenRef.current);
                    setEthOrbsEaten(newEthOrbsEaten);
                    
                                      // Check for Moving Orb Master achievement - only trigger once per session
                  const movingOrbsCount = player.movingOrbsEaten || player.movingorbsEaten || 0;
                  if (movingOrbsCount >= 20 && timeSurvived <= 240 && !sessionAchievements['Moving Orb Master'] && !achievementNotificationShownRef.current['Moving Orb Master']) {
                    try {
                      console.log('🎯 Quick check: Moving Orb Master achievement condition met!');
                      // Mark as achieved to prevent multiple notifications
                      setSessionAchievements(prev => ({ ...prev, ['Moving Orb Master']: true }));
                      // Mark as shown to prevent duplicate notifications
                      achievementNotificationShownRef.current['Moving Orb Master'] = true;
                      updateAchievement('Moving Orb Master', true);
                      setAchievementSP(prev => prev + 2000);
                      
                      // Add notification with correct achievement name for image lookup
                      setAchievementNotifications(prev => [...prev, {
                        id: Date.now() + Math.random(),
                        achievement: 'Moving Orb Master', // Exact name matching achievementImageMap
                        message: 'Moving Orb Master Achievement Unlocked! +2000 SP',
                        timestamp: Date.now()
                      }]);
                      setTimeout(() => playAchievementSound(), 50);
                    } catch (err) {
                      console.error('Error processing Moving Orb Master achievement:', err);
                    }
                  }
                    
                    if (questTracker && address) {
                      updateSingleGameQuests();
                      updateMultiGameQuests();
                      checkQuestCompletions();
                    }
                    prevEthOrbsEatenRef.current = newEthOrbsEaten;
                    // Play ETH orb sound immediately
                    playSound(ethOrbSound, volume * 0.32);
                  }
                  // Update other stats from server
                  setEthEarned(player.ethEarned || 0);
                  
                  // Fix: Check for kills property and ensure it's properly tracked
                  const newKills = player.kills || 0;
                  if (newKills > prevKillsForBonusRef.current) {
                    console.log('💀 Kill bonus! Playing kill bonus sound. New:', newKills, 'Previous:', prevKillsForBonusRef.current);
                    setKills(newKills);
                    prevKillsForBonusRef.current = newKills;
                    
                    // Check for Giant Slayer achievement immediately on kill
                    if (player.lastKilledPlayerSegments && player.lastKilledPlayerSegments >= 35) {
                      console.log('🎯 Giant Slayer achievement check on kill:', player.lastKilledPlayerSegments);
                      setLastKilledPlayerSegments(player.lastKilledPlayerSegments);
                      
                      // Immediately trigger Giant Slayer achievement - only once per session
                      if (!sessionAchievements['Giant Slayer'] && !achievementNotificationShownRef.current['Giant Slayer']) {
                        try {
                          console.log('🎯 Quick check: Giant Slayer achievement condition met!');
                          // Mark as achieved to prevent multiple notifications
                          setSessionAchievements(prev => ({ ...prev, ['Giant Slayer']: true }));
                          // Mark as shown to prevent duplicate notifications
                          achievementNotificationShownRef.current['Giant Slayer'] = true;
                          updateAchievement('Giant Slayer', true);
                          setAchievementSP(prev => prev + 2000);
                          
                          // Add notification with correct achievement name for image lookup
                          setAchievementNotifications(prev => [...prev, {
                            id: Date.now() + Math.random(),
                            achievement: 'Giant Slayer', // Exact name matching achievementImageMap
                            message: 'Giant Slayer Achievement Unlocked! +2000 SP',
                            timestamp: Date.now()
                          }]);
                          setTimeout(() => playAchievementSound(), 50);
                        } catch (err) {
                          console.error('Error processing Giant Slayer achievement:', err);
                        }
                      }
                    }
                    
                    // Check for Killer Instinct achievement - only trigger once per session
                    if (newKills >= 3 && timeSurvived <= 300 && !sessionAchievements['Killer Instinct'] && !achievementNotificationShownRef.current['Killer Instinct']) {
                      try {
                        console.log('🎯 Quick check: Killer Instinct achievement condition met!');
                        // Mark as achieved to prevent multiple notifications
                        setSessionAchievements(prev => ({ ...prev, ['Killer Instinct']: true }));
                        // Mark as shown to prevent duplicate notifications
                        achievementNotificationShownRef.current['Killer Instinct'] = true;
                        updateAchievement('Killer Instinct', true);
                        setAchievementSP(prev => prev + 2000);
                        
                        // Add notification with correct achievement name for image lookup
                        setAchievementNotifications(prev => [...prev, {
                          id: Date.now() + Math.random(),
                          achievement: 'Killer Instinct', // Exact name matching achievementImageMap
                          message: 'Killer Instinct Achievement Unlocked! +2000 SP',
                          timestamp: Date.now()
                        }]);
                        setTimeout(() => playAchievementSound(), 50);
                      } catch (err) {
                        console.error('Error processing Killer Instinct achievement:', err);
                      }
                    }
                    
                    // Play kill bonus sound with delay
                    setTimeout(() => playSound(killBonusSound, volume * 0.4), 500);
                  } else {
                    setKills(newKills);
                  }
                  if (questTracker && address) {
                    updateSingleGameQuests();
                    updateMultiGameQuests();
                    checkQuestCompletions();
                  }
                  const newTimeSurvived = Math.floor((Date.now() - (player.sessionStartTime || sessionStartTime)) / 1000);
                  setTimeSurvived(newTimeSurvived);
                  
                  // Check for time-based achievements
                  // Only trigger Endurance achievement once per session
                  if (newTimeSurvived >= 1200 && !sessionAchievements['Endurance'] && !achievementNotificationShownRef.current['Endurance']) {
                    try {
                      console.log('🎯 Quick check: Endurance achievement condition met!');
                      // Mark as achieved and shown to prevent multiple notifications
                      setSessionAchievements(prev => ({ ...prev, ['Endurance']: true }));
                      achievementNotificationShownRef.current['Endurance'] = true;
                      updateAchievement('Endurance', true);
                      setAchievementSP(prev => prev + 2000);
                      
                      // Add notification with correct achievement name for image lookup
                      setAchievementNotifications(prev => [...prev, {
                        id: Date.now() + Math.random(),
                        achievement: 'Endurance', // Exact name matching achievementImageMap
                        message: 'Endurance Achievement Unlocked! +2000 SP',
                        timestamp: Date.now()
                      }]);
                      setTimeout(() => playAchievementSound(), 50);
                    } catch (err) {
                      console.error('Error processing Endurance achievement:', err);
                    }
                  }
                  
                  if (questTracker && address) {
                    updateSingleGameQuests();
                    updateMultiGameQuests();
                    checkQuestCompletions();
                  }
                }
              }
            }
            
            if (message.type === 'joined') {
              console.log("Player joined successfully:", message);
              setJoined(true);
              setLoading(false);
              setIsPlayer(true);
              setError("");
              setIsDead(false); // Reset dead state for new session
              // Initialize session tracking
              setSessionStartTime(Date.now());
              setOrbsEaten(0);
              setEthOrbsEaten(0); // Reset ETH orbs eaten
              prevOrbsEatenRef.current = 0; // Reset ref for sound triggering
              prevEthOrbsEatenRef.current = 0; // Reset ref for sound triggering
              setKills(0);
              setTimeSurvived(0);
              setSpEarned(0);
              // Reset multi-game quest tracking for new session
              multiGameQuestsUpdatedRef.current = false;
              // Initialize sessionCompletedQuests with all completed quests so far
              setSessionCompletedQuests(new Set());
              
              // Reset session achievements for new game
              resetSessionAchievements();
              
              // Distribute claimed quest SP rewards
              if (questTracker && address) {
                const claimedSP = questTracker.getClaimedSPRewards(address);
                if (claimedSP > 0) {
                  console.log(`Distributing ${claimedSP} SP from claimed quest rewards`);
                  const newAchievementSP = achievementSP + claimedSP;
                  setAchievementSP(newAchievementSP);
                  questTracker.clearClaimedSPRewards(address);
                  
                  // Immediately send updated achievement SP to server
                  if (client && client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ type: 'achievementSP', achievementSP: newAchievementSP }));
                    console.log(`Sent quest SP update to server: ${newAchievementSP}`);
                  }
                  
                  // Show notification for quest SP distribution
                  setQuestNotifications(prev => [...prev, {
                    id: Date.now() + Math.random(),
                    quest: 'Quest Rewards',
                    message: `💰 Quest Rewards Distributed: +${claimedSP.toLocaleString()} SP`,
                    timestamp: Date.now(),
                    reward: claimedSP
                  }]);
                }
              }
              // --- Camera reset on join ---
              if (message.player && message.player.spawn) {
                setCameraX(message.player.spawn.x - VISIBLE_WIDTH / 2);
                setCameraY(message.player.spawn.y - VISIBLE_HEIGHT / 2);
              } else if (message.data && message.data.players) {
                // Fallback: center on new snake if possible
                const playerId = Object.keys(message.data.players).find(
                  id => message.data.players[id].wallet?.toLowerCase() === (address?.toLowerCase() || "0x0000000000000000000000000000000000000000")
                );
                if (playerId && message.data.players[playerId] && message.data.players[playerId].segments.length > 0) {
                  const head = message.data.players[playerId].segments[0];
                  setCameraX(head.x - VISIBLE_WIDTH / 2);
                  setCameraY(head.y - VISIBLE_HEIGHT / 2);
                }
              }
            }
            
            if (message.type === 'kill_notification') {
              console.log("Received kill notification:", message);
              // Set the segment count of the player we just killed
              if (message.killedPlayerSegments !== undefined) {
                console.log(`You killed a player with ${message.killedPlayerSegments} segments!`);
                setLastKilledPlayerSegments(message.killedPlayerSegments);
              }
            }
            
            if (message.type === 'death') {
              console.log("Player died, navigating to /death");
              // Add this to capture killed player's segment count for Giant Slayer achievement
              if (message.killedPlayerSegments !== undefined) {
                setLastKilledPlayerSegments(message.killedPlayerSegments);
              }
              setIsDead(true);
              if (questTracker && address) {
                // Increment deaths for multi-game death quests
                const prevDeaths = questTracker.getPlayerProgress(address)['death_counter_ultra']?.deaths || 0;
                questTracker.updateProgress(address, 'death_counter_common', { deaths: prevDeaths + 1 });
                questTracker.updateProgress(address, 'death_counter_rare', { deaths: prevDeaths + 1 });
                questTracker.updateProgress(address, 'death_counter_epic', { deaths: prevDeaths + 1 });
                questTracker.updateProgress(address, 'death_counter_legendary', { deaths: prevDeaths + 1 });
                questTracker.updateProgress(address, 'death_counter_ultra', { deaths: prevDeaths + 1 });
                updateSingleGameQuests();
                updateMultiGameQuests();
                checkQuestCompletions();
              }
              // Play collision sound with enhanced playback
              playSound(collisionSound, volume * 0.5);
              // Stop any ongoing escape attempt
              if (escapeTimerRef.current) {
                clearInterval(escapeTimerRef.current);
                escapeTimerRef.current = null;
              }
              setIsEscaping(false);
              setEscapeProgress(0);
                    // Send death message to server with session achievements count
      const achievementCount = Object.values(sessionAchievements).filter(Boolean).length;
      if (client && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'death', achievements: achievementCount }));
      }
              // Use server-sent stats if available, fallback to local state
              const sessionData = {
                isTestMode,
                wagerAmount,
                timeSurvived: message.timeSurvived ?? Math.floor((Date.now() - sessionStartTime) / 1000),
                orbsEaten: message.orbsEaten ?? orbsEaten,
                kills: message.kills ?? kills,
                spEarned: message.SP ?? spEarned,
                sessionStartTime,
                achievements: achievements,
                achievementSP,
                sessionCompletedQuests: Array.from(sessionCompletedQuests)
              };
              // Ensure quest completions are checked right before navigating
              checkQuestCompletions();
              setTimeout(() => {
                safeNavigate('/death', { state: sessionData });
              }, 1000);
              return;
            }
            
            if (message.type === 'escape') {
              console.log("Player escaped, navigating to /escape");
              console.log("Full escape message received:", message);
              setEscapePending(false);
              // Clear the escape timeout since server responded
              if (window.escapeTimeoutRef) {
                clearTimeout(window.escapeTimeoutRef);
                window.escapeTimeoutRef = null;
              }
              // Use only server-provided values for stats
              const sessionData = {
                isTestMode,
                wagerAmount,
                stakeAmount: wagerAmount || 0,
                escaped: true,
                timeSurvived: message.timeSurvived || 0,
                orbsEaten: message.orbsEaten || 0,
                kills: message.kills || 0,
                spEarned: message.SP || 0,
                playerName: message.name || '',
                wallet: message.wallet || '',
                startTime: message.sessionStartTime || sessionStartTime,
                achievements: achievements,
                achievementSP,
                sessionCompletedQuests: Array.from(sessionCompletedQuests)
              };
              console.log("Session data being passed to escape screen:", sessionData);
              // Disconnect immediately and navigate
              if (client && client.readyState === WebSocket.OPEN) {
                client.close(); // Disconnect from server immediately
                setClient(null);
              }
              setGameState(null); // Clear local game state
              setJoined(false);
              setIsPlayer(false);
              setIsDead(false);
              setOrbsEaten(0);
              setEthOrbsEaten(0); // Reset ETH orbs eaten
              prevOrbsEatenRef.current = 0; // Reset ref for sound triggering
              prevEthOrbsEatenRef.current = 0; // Reset ref for sound triggering
              setKills(0);
              setTimeSurvived(0);
              setSpEarned(0);
              // setSessionStartTime(null); // Do not reset here
              // Ensure quest completions are checked right before navigating
              checkQuestCompletions();
              safeNavigate('/escape', { state: sessionData });
              return;
            }
            
            if (message.type === 'error') {
              setError(message.message || 'Unknown error');
              setLoading(false);
              setIsPlayer(false);
              setJoined(false);
              setIsConnecting(false);
              if (message.message && message.message.includes('Name already taken')) {
                setNameTakenError(true);
                if (nameTakenTimerRef.current) clearTimeout(nameTakenTimerRef.current);
                nameTakenTimerRef.current = setTimeout(() => setNameTakenError(false), 3000);
              }
            }
            
            if (message.type === 'gameState') {
              setGameState(data);
              // Update local stats from server
              if (data.players && data.players[playerId]) {
                const player = data.players[playerId];
                const newOrbsEaten = player.normalorbsEaten || 0;
                const newEthOrbsEaten = player.ethOrbsEaten || 0;
                const newKills = player.kills || 0;
                
                // Check for orb sound triggers
                if (newOrbsEaten > prevOrbsEatenRef.current) {
                  setOrbsEaten(newOrbsEaten);
                  prevOrbsEatenRef.current = newOrbsEaten;
                  playSound(orbSound, volume * 0.32);
                } else {
                  setOrbsEaten(newOrbsEaten);
                }
                
                // Check for ETH orb sound triggers
                if (newEthOrbsEaten > prevEthOrbsEatenRef.current) {
                  setEthOrbsEaten(newEthOrbsEaten);
                  prevEthOrbsEatenRef.current = newEthOrbsEaten;
                  playSound(ethOrbSound, volume * 0.32);
                } else {
                  setEthOrbsEaten(newEthOrbsEaten);
                }
                
                // Check for kill bonus sound triggers
                if (newKills > prevKillsForBonusRef.current) {
                  setKills(newKills);
                  prevKillsForBonusRef.current = newKills;
                  setTimeout(() => playSound(killBonusSound, volume * 0.4), 500);
                } else {
                  setKills(newKills);
                }
                
                setEthEarned(player.ethEarned || 0);
                setTimeSurvived(Math.floor((Date.now() - (player.sessionStartTime || sessionStartTime)) / 1000));
                if (questTracker && address) {
                  updateSingleGameQuests();
                  updateMultiGameQuests();
                  checkQuestCompletions();
                }
              }
              // We now use the kill_notification message instead of checking gameState
              // This code is no longer needed as we receive direct kill notifications
            }
          } catch (error) {
            console.error("Error parsing message:", error);
          }
        };
        
        newClient.onerror = (error) => {
          console.error("WebSocket error:", error);
          setError("WebSocket connection error");
          setIsPlayer(false);
          setJoined(false);
          setIsConnecting(false);
        };
        
        newClient.onclose = () => {
          console.log("WebSocket connection closed");
          setIsPlayer(false);
          setIsConnecting(false);
          setJoined(false); // Only set here
          setClient(null);
        };
        
      } catch (err) {
        console.error("Game server connection error:", err);
        setError("Game server connection failed. Please try again.");
        setIsPlayer(false);
        setIsConnecting(false);
      }
    }

    // Only join if not showing name prompt
    if (!showNamePrompt) {
      joinGameServer();
    }

    return () => {
      if (client && client.readyState === WebSocket.OPEN) {
        client.close();
      }
    };
  }, [showNamePrompt, playerName, address, hasAttemptedConnection]); // Added hasAttemptedConnection to prevent re-runs

  // Timer for session tracking
  useEffect(() => {
    if (!sessionStartTime || !joined) return;
    
    const timer = setInterval(() => {
      const currentTime = Date.now();
      const timeElapsed = Math.floor((currentTime - sessionStartTime) / 1000);
      setTimeSurvived(timeElapsed);
      
      // Calculate SP from time survived (10 SP per minute)
      const minutesSurvived = Math.floor(timeElapsed / 60);
      const spFromTime = minutesSurvived * 10;
      
      // Calculate SP from orbs - get moving and normal orb counts from gameState
      let movingOrbsEaten = 0;
      let normalOrbsEaten = 0;
      
      if (gameState && gameState.players) {
        const playerId = Object.keys(gameState.players).find(
          id => gameState.players[id].wallet?.toLowerCase() === (address?.toLowerCase() || "0x0000000000000000000000000000000000000000")
        );
        if (playerId && gameState.players[playerId]) {
          const player = gameState.players[playerId];
          movingOrbsEaten = player.movingOrbsEaten || 0;
          normalOrbsEaten = player.normalOrbsEaten || 0;
        }
      }
      
      // Calculate total SP: moving orbs (10 SP each) + normal orbs (5 SP each) + time (10 SP per minute) + kills (500 SP each) + achievements
      const totalSP = (movingOrbsEaten * 10) + (normalOrbsEaten * 5) + spFromTime + (kills * 500) + achievementSP;
      setSpEarned(totalSP);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [sessionStartTime, joined, orbsEaten, kills, achievementSP, gameState, address]);

  // Separate useEffect for animation loop
  useEffect(() => {
    let animationId;

    function draw() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Set canvas size to visible area
      canvas.width = VISIBLE_WIDTH;
      canvas.height = VISIBLE_HEIGHT;

      // Apply global zoom transformation
      ctx.save();
      ctx.scale(1 / currentZoom, 1 / currentZoom);

      // Calculate dynamic visibility bounds based on current zoom level
      const baseVisibilityRange = 1200;
      const zoomVisibilityMultiplier = Math.max(1.5, currentZoom * 3);
      const visibilityRange = baseVisibilityRange * zoomVisibilityMultiplier;
      
      // Enhanced visibility bounds for zoomed view
      const minX = -visibilityRange * 1.5;
      const maxX = VISIBLE_WIDTH + visibilityRange * 1.5;
      const minY = -visibilityRange * 1.5;
      const maxY = VISIBLE_HEIGHT + visibilityRange * 1.5;

      // Draw circular world boundary - optimized
      const centerX = WORLD_SIZE / 2 - cameraX;
      const centerY = WORLD_SIZE / 2 - cameraY;
      const radius = WORLD_SIZE / 2;
      
      // Only draw boundary if it's visible
      if (centerX >= minX - radius && centerX <= maxX + radius && 
          centerY >= minY - radius && centerY <= maxY + radius) {
      
      // Simplified boundary drawing - reduced layers
      ctx.strokeStyle = '#ff000066';
      ctx.lineWidth = 12; // Reduced from 15
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.stroke();
      
      // Draw inner green boundary
      ctx.strokeStyle = '#00ffcc';
      ctx.lineWidth = 3; // Reduced from 4
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.stroke();
      
      // Simplified pulsing effect - reduced frequency
      const pulseIntensity = Math.sin(Date.now() / 1200) * 0.2 + 0.8; // Reduced from 1000 to 1200, reduced intensity
      ctx.strokeStyle = `rgba(255, 0, 0, ${0.2 * pulseIntensity})`; // Reduced from 0.3
      ctx.lineWidth = 4; // Reduced from 6
      ctx.shadowColor = '#ff0000';
      ctx.shadowBlur = 8; // Reduced from 15
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.shadowBlur = 0;
      }

      // Draw grid - only if zoomed out enough and less frequently
      if (currentZoom >= 1.0) { // Increased from 0.8 to reduce grid rendering
      ctx.strokeStyle = '#00ffcc08'; // Reduced from 11
      ctx.lineWidth = 1;
      const gridSize = 150; // Increased from 100 to reduce grid density
      const startX = Math.floor(cameraX / gridSize) * gridSize - cameraX;
      const startY = Math.floor(cameraY / gridSize) * gridSize - cameraY;
      for (let x = startX; x < VISIBLE_WIDTH + gridSize; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, VISIBLE_HEIGHT);
        ctx.stroke();
      }
      for (let y = startY; y < VISIBLE_HEIGHT + gridSize; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(VISIBLE_WIDTH, y);
        ctx.stroke();
        }
      }

      // Draw orbs if gameState exists (only visible ones with enhanced range)
      if (gameState && gameState.orbs) {
        for (const orb of gameState.orbs) {
          // Convert world coordinates to screen coordinates
          const screenX = orb.x - cameraX;
          const screenY = orb.y - cameraY;
          
          // Enhanced visibility check for zoomed view with much larger bounds
          if (screenX >= minX && screenX <= maxX && 
              screenY >= minY && screenY <= maxY) {
            // Enhanced LOD system for better performance at high zoom levels
            const distanceFromCenter = Math.sqrt(screenX * screenX + screenY * screenY);
            const maxRenderDistance = visibilityRange * 2.0; // Reduced from 2.5
            
            // More aggressive LOD - hide most orbs when zoomed out (player is large)
            const lodDistance = maxRenderDistance * (1 - Math.min(currentZoom / 3, 0.7)); // Reduced from 4 to 3
            if (distanceFromCenter > lodDistance) continue;
            
            // Enhanced distance-based opacity for smooth fade-out
            const opacityDistance = maxRenderDistance * 0.6; // Reduced from 0.7
            const opacity = distanceFromCenter > opacityDistance 
              ? Math.max(0.1, 1 - (distanceFromCenter - opacityDistance) / (maxRenderDistance - opacityDistance))
              : 1;
            ctx.save();
            
            const isMovingOrb = orb.moving;
            const baseRadius = isMovingOrb ? 12 : 8; // Reduced from 15/10
            
            // Calculate orb scaling based on current player's segment count
            let orbScaleMultiplier = 1.0;
            if (gameState && gameState.players) {
              const playerId = Object.keys(gameState.players).find(
                id => gameState.players[id].wallet?.toLowerCase() === (address?.toLowerCase() || "0x0000000000000000000000000000000000000000")
              );
              if (playerId && gameState.players[playerId]) {
                const playerSegmentCount = gameState.players[playerId].segments.length;
                if (playerSegmentCount >= 30) {
                  // Orbs get bigger as you grow over 30 segments
                  const scaleFactor = Math.min(playerSegmentCount / 30, 1.5); // Cap at 1.5x size
                  orbScaleMultiplier = scaleFactor;
                }
              }
            }
            
            // Apply orb scaling to base radius
            const scaledBaseRadius = baseRadius * orbScaleMultiplier;
            
            // Much more aggressive zoom scaling - orbs stay very visible even at 200+ segments
            // For very large snakes (high zoom), we want orbs to remain clearly visible
            const zoomScaleFactor = Math.max(0.8, Math.min(2.0, 1 / currentZoom));
            const zoomAdjustedRadius = scaledBaseRadius * zoomScaleFactor;
            
            // Simplified pulsing effect - reduced frequency
            const pulse = Math.sin(Date.now() / 600 + orb.x * 0.01 + orb.y * 0.01) * 0.8; // Reduced from 500 to 600, reduced multipliers and intensity
            const finalRadius = zoomAdjustedRadius + pulse;
            
            // Generate random color based on orb position for consistency
            const colorSeed = Math.floor(orb.x * 50 + orb.y * 50); // Reduced from 100 to 50
            const hue = (colorSeed * 137.5) % 360;
            const saturation = 70 + (colorSeed % 30);
            const lightness = 60 + (colorSeed % 20);
            
            const orbColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
            const orbColorTransparent = `hsla(${hue}, ${saturation}%, ${lightness}%, 0.34)`; // Made 66% transparent
            
            // For moving orbs, use fixed color and add pulse glow
            if (isMovingOrb) {
              // Fixed color for moving orbs (no animation)
              const movingOrbColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
              const movingOrbColorTransparent = `hsla(${hue}, ${saturation}%, ${lightness}%, 0.34)`; // Made 66% transparent
              
              // Simplified pulse glow for moving orbs
              const pulseIntensity = Math.sin(Date.now() / 600 + orb.x * 0.02) * 0.3 + 0.7; // Reduced frequency and intensity
              const pulseGlowRadius = finalRadius * (1.2 + pulseIntensity * 0.15); // Reduced glow size
              
              // Pulse glow layer
          ctx.beginPath();
              ctx.arc(screenX, screenY, pulseGlowRadius, 0, 2 * Math.PI);
              ctx.fillStyle = movingOrbColorTransparent;
              ctx.globalAlpha = 0.15 * pulseIntensity * opacity; // Reduced opacity
          ctx.fill();
                
                // Main moving orb body
                ctx.beginPath();
                ctx.arc(screenX, screenY, finalRadius, 0, 2 * Math.PI);
                ctx.fillStyle = movingOrbColor;
                ctx.globalAlpha = 0.2 * opacity; // Reduced opacity
                ctx.fill();
                
                // Simplified sparkle effect for moving orbs
                const sparkleAngle = (Date.now() / 500 + orb.x * 0.02) % (2 * Math.PI); // Reduced frequency
                const sparkleRadius = finalRadius * 1.1; // Reduced sparkle distance
                const sparkleX = screenX + Math.cos(sparkleAngle) * sparkleRadius;
                const sparkleY = screenY + Math.sin(sparkleAngle) * sparkleRadius;
                
                ctx.beginPath();
                ctx.arc(sparkleX, sparkleY, 0.6, 0, 2 * Math.PI); // Reduced sparkle size
                ctx.fillStyle = '#ffffff';
                ctx.globalAlpha = 0.4 * opacity; // Reduced opacity
                ctx.fill();
                
                // Add outline for moving orbs
                ctx.beginPath();
                ctx.arc(screenX, screenY, finalRadius, 0, 2 * Math.PI);
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1;
                ctx.globalAlpha = 0.2 * opacity; // Reduced opacity
                ctx.stroke();
            } else {
              // Normal orbs - simplified rendering
              const glowRadius = finalRadius * 1.2; // Reduced from 1.3
              
              // Single glow layer for better performance
              ctx.beginPath();
              ctx.arc(screenX, screenY, glowRadius, 0, 2 * Math.PI);
              ctx.fillStyle = orbColorTransparent;
              ctx.globalAlpha = 0.08 * opacity; // Reduced from 0.1
              ctx.fill();
              
              // Main orb body
              ctx.beginPath();
              ctx.arc(screenX, screenY, finalRadius, 0, 2 * Math.PI);
              ctx.fillStyle = orbColor;
              ctx.globalAlpha = 0.25 * opacity; // Reduced from 0.3
              ctx.fill();
            }
            
            ctx.globalAlpha = 1;
            ctx.restore();
          }
        }
      }

      // Draw ETH orbs from dead snakes with enhanced visibility
      ethOrbs.forEach(orb => {
        const screenX = orb.x - cameraX;
        const screenY = orb.y - cameraY;
        
        // Enhanced visibility check with much larger bounds
        if (screenX >= minX && screenX <= maxX && 
            screenY >= minY && screenY <= maxY) {
          
          // Enhanced LOD system for ETH orbs
          const distanceFromCenter = Math.sqrt(screenX * screenX + screenY * screenY);
          const maxRenderDistance = visibilityRange * 1.8; // Reduced from 2.0
          
          // More aggressive LOD based on distance and zoom
          const lodDistance = maxRenderDistance * (1 - Math.min(currentZoom / 2.5, 0.8)); // Reduced from 3 to 2.5
          if (distanceFromCenter > lodDistance) {
            return; // Skip rendering for distant ETH orbs
          }
          
          // Enhanced distance-based opacity for smooth fade-out
          const opacityDistance = maxRenderDistance * 0.5; // Reduced from 0.6
          const opacity = distanceFromCenter > opacityDistance 
            ? Math.max(0.1, 1 - (distanceFromCenter - opacityDistance) / (maxRenderDistance - opacityDistance))
            : 1;
          
        ctx.save();
          // Get current player's segment count to scale ETH orbs proportionally
          const currentPlayerId = Object.keys(gameState.players).find(
            id => gameState.players[id].wallet?.toLowerCase() === (address?.toLowerCase() || "0x0000000000000000000000000000000000000000")
          );
          const currentPlayer = currentPlayerId ? gameState.players[currentPlayerId] : null;
          const playerSegmentCount = currentPlayer ? currentPlayer.segments.length : 10; // Default to 10 if not found
          
          // Scale ETH orb size based on current player's size (minimum 2x, scales up with player size)
          const playerSizeMultiplier = Math.max(2, Math.min(6, playerSegmentCount / 20)); // Scale from 2x to 6x based on player size
          const baseRadius = (orb.size || 6) * playerSizeMultiplier;
          
          // Check if ETH orb has expired
          const currentTime = Date.now();
          const isExpired = orb.isExpired || (orb.expirationTime && currentTime >= orb.expirationTime);
          
          // Debug logging for ETH orb expiration
          if (orb.isEthOrb && orb.id) {
            const timeRemaining = orb.expirationTime ? (orb.expirationTime - currentTime) / 1000 : 'No expiration time';
            if (orb.id === 'debug-eth-orb') {
              console.log(`ETH Orb Debug - ID: ${orb.id}, Expired: ${isExpired}, Time Remaining: ${timeRemaining}s, ExpirationTime: ${orb.expirationTime}, CurrentTime: ${currentTime}`);
            }
          }
          
          // Reduce zoom scaling effect for ETH orbs - make them more visible for larger snakes
          const zoomAdjustedRadius = baseRadius * Math.max(0.8, 1 / Math.sqrt(currentZoom)); // Less aggressive zoom scaling
          const pulse = Math.sin(Date.now() / 500 + orb.id.charCodeAt(0)) * 0.5; // Subtle pulse
          const finalRadius = zoomAdjustedRadius + pulse;
          
          // Check if this is a converted ETH orb (now a normal orb)
          if (orb.convertedToNormal || isExpired) {
            // Render as small grey orb (2x smaller)
            const expiredRadius = finalRadius / 2;
            ctx.fillStyle = 'rgba(136, 136, 136, 0.7)';
        ctx.beginPath();
            ctx.arc(screenX, screenY, expiredRadius, 0, Math.PI * 2);
        ctx.fill();
            // Add simple highlight
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.beginPath();
            ctx.arc(screenX - expiredRadius * 0.3, screenY - expiredRadius * 0.3, expiredRadius * 0.2, 0, Math.PI * 2);
            ctx.fill();
          } else if (!isExpired) {
            // ETH orb is still active - show green glow and glass effect
            // Create green glow effect (reduced by 40% as requested)
            const glowIntensity = currentZoom > 2 ? 0.06 : 0.12; // Reduced by 40% from previous values
            const glowGradient = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, finalRadius * 1.2);
            glowGradient.addColorStop(0, `rgba(0, 255, 0, ${glowIntensity})`); // Reduced glow by 40%
            glowGradient.addColorStop(0.8, `rgba(0, 255, 0, ${glowIntensity * 0.25})`); // Reduced glow by 40%
            glowGradient.addColorStop(1, 'rgba(0, 255, 0, 0)');
            
            ctx.fillStyle = glowGradient;
        ctx.beginPath();
            ctx.arc(screenX, screenY, finalRadius * 1.2, 0, Math.PI * 2);
        ctx.fill();
            
            // Draw simplified clean glass orb background
            const glassGradient = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, finalRadius);
            glassGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)'); // Clean white center
            glassGradient.addColorStop(0.8, 'rgba(0, 255, 0, 0.08)'); // Very subtle green tint
            glassGradient.addColorStop(1, 'rgba(0, 255, 0, 0.01)'); // Minimal edge
            
            ctx.fillStyle = glassGradient;
            ctx.beginPath();
            ctx.arc(screenX, screenY, finalRadius, 0, Math.PI * 2);
            ctx.fill();
            
            // Add simple glass highlight
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.beginPath();
            ctx.arc(screenX - finalRadius * 0.3, screenY - finalRadius * 0.3, finalRadius * 0.2, 0, Math.PI * 2);
        ctx.fill();
            
            // Draw ETH icon inside the orb with maximum visibility
            const ethIcon = new Image();
            ethIcon.src = '/eth-logo.png';
            
            if (ethIcon.complete) {
              const iconSize = finalRadius * 0.8; // Even larger icon for maximum visibility
              ctx.save();
              ctx.globalAlpha = 1.0 * opacity; // Full opacity for clear visibility
              ctx.drawImage(ethIcon, screenX - iconSize/2, screenY - iconSize/2, iconSize, iconSize);
              ctx.restore();
            } else {
              // Fallback: draw ETH text if image not loaded
              ctx.fillStyle = '#000000'; // Black text for maximum contrast
              ctx.font = `bold ${Math.max(14, finalRadius * 0.4)}px Arial`; // Larger, bolder text
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.globalAlpha = 1.0 * opacity;
              ctx.fillText('ETH', screenX, screenY);
            }
          } else {
            // ETH orb has expired - render as normal orb (converted from ETH orb)
            const normalOrbColor = orb.color || '#888888';
            const normalOrbGradient = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, finalRadius);
            normalOrbGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
            normalOrbGradient.addColorStop(0.8, `${normalOrbColor}80`);
            normalOrbGradient.addColorStop(1, `${normalOrbColor}20`);
            
            ctx.fillStyle = normalOrbGradient;
            ctx.beginPath();
            ctx.arc(screenX, screenY, finalRadius, 0, Math.PI * 2);
            ctx.fill();
            
            // Add simple highlight
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.beginPath();
            ctx.arc(screenX - finalRadius * 0.3, screenY - finalRadius * 0.3, finalRadius * 0.2, 0, Math.PI * 2);
            ctx.fill();
          }
          
        ctx.restore();
        
        // Update ETH orb position with velocity
        orb.x += orb.velocity.x * 0.08; // Reduced from 0.1
        orb.y += orb.velocity.y * 0.08; // Reduced from 0.1
        orb.velocity.x *= 0.98; // Increased friction from 0.99
        orb.velocity.y *= 0.98; // Increased friction from 0.99
        }
      });

      // Draw snakes and player names/SP if gameState exists (only visible ones with enhanced range)
      if (gameState && gameState.players) {
        for (const id in gameState.players) {
          const player = gameState.players[id];
          if (!player.alive) continue;
          
          // Check if snake is visible with enhanced range
          const head = player.segments[0];
          const headScreenX = head.x - cameraX;
          const headScreenY = head.y - cameraY;
          
          if (headScreenX >= minX && headScreenX <= maxX && 
              headScreenY >= minY && headScreenY <= maxY) {
          ctx.save();
            
            // Calculate individual zoom factor for this player based on their segment count
            let playerZoomFactor = 1;
            const segmentCount = player.segments.length;
            
            if (segmentCount >= 40) {
              // Progressive zoom scaling - more aggressive for larger snakes
              const zoomStart = 40;
              const maxZoom = 12.0; // Increased from 8.0 to 12.0 for even more zoom out
              
              if (segmentCount >= 100) {
                // Very large snakes (100+ segments) - aggressive zooming
                const largeSnakeSegments = segmentCount - 100;
                const largeSnakeZoom = 1 + (60 * 0.008) + (largeSnakeSegments * 0.015); // Progressive scaling
                playerZoomFactor = Math.min(maxZoom, largeSnakeZoom);
              } else if (segmentCount >= 60) {
                // Large snakes (60-99 segments) - moderate zooming
                const mediumSnakeSegments = segmentCount - 60;
                const mediumSnakeZoom = 1 + (20 * 0.008) + (mediumSnakeSegments * 0.012);
                playerZoomFactor = Math.min(maxZoom, mediumSnakeZoom);
              } else {
                // Medium snakes (40-59 segments) - gentle zooming
                const smallSnakeSegments = segmentCount - zoomStart;
                playerZoomFactor = Math.min(maxZoom, 1 + smallSnakeSegments * 0.008);
              }
            }
            
            // Add additional zoom based on game area coverage for this player
            const worldRadius = WORLD_SIZE / 2;
            const playerDistanceFromCenter = Math.sqrt(head.x * head.x + head.y * head.y);
            const centerProximityFactor = Math.max(0, (worldRadius - playerDistanceFromCenter) / worldRadius);
            
            if (centerProximityFactor > 0.3) {
              playerZoomFactor *= (1 + centerProximityFactor * 0.15);
            }
            
            // Enhanced LOD system for better performance at high zoom levels
            const distanceFromCenter = Math.sqrt(headScreenX * headScreenX + headScreenY * headScreenY);
            const maxRenderDistance = visibilityRange * 2.5; // Increased from 2 to 2.5 for better coverage
            
            // More aggressive LOD based on distance and this player's zoom
            const lodDistance = maxRenderDistance * (1 - Math.min(playerZoomFactor / 3, 0.7)); // Use player's zoom factor
            if (distanceFromCenter > lodDistance) {
              continue; // Skip rendering for distant snakes
            }
            
            // Enhanced distance-based opacity for smooth fade-out
            const opacityDistance = maxRenderDistance * 0.8;
            const opacity = distanceFromCenter > opacityDistance 
              ? Math.max(0.1, 1 - (distanceFromCenter - opacityDistance) / (maxRenderDistance - opacityDistance))
              : 1;
            
            // Calculate distance from camera for LOD (Level of Detail)
            const distanceFromCamera = Math.sqrt(headScreenX * headScreenX + headScreenY * headScreenY);
            const isFarAway = distanceFromCamera > visibilityRange * 0.7;
            
            // Calculate distance-based opacity for better visual hierarchy
            const distanceOpacity = Math.max(0.3, 1 - (distanceFromCamera / visibilityRange) * 0.7);
            
            // --- Randomized snake skin ---
            // Use a unique color per snake (already in snake.color), add gradient
            for (let i = 0; i < player.segments.length; i++) {
              const seg = player.segments[i];
              const screenX = seg.x - cameraX;
              const screenY = seg.y - cameraY;
              
              // Enhanced segment culling for much better performance
              const segmentDistance = Math.sqrt(screenX * screenX + screenY * screenY);
              const segmentLodDistance = maxRenderDistance * (1 - Math.min(playerZoomFactor / 4, 0.8)); // Use player's zoom factor
              if (segmentDistance > segmentLodDistance) {
                continue; // Skip distant segments
              }
              
              // Skip segments that are too far away for performance
              if (Math.abs(screenX) > maxX + 200 || Math.abs(screenY) > maxY + 200) { // Increased from 100 to 200
                continue;
              }
              
              let radius = (12 + segmentCount * 0.14) - i * 0.15; // Calculate size based on this player's segment count
              
              // Scale radius based on this player's zoom level for better visibility
              radius *= Math.max(0.8, playerZoomFactor * 0.5); // Use player's zoom factor
              
              // Make first segment larger and overlap with head for connection
              if (i === 0) {
                radius = (12 + segmentCount * 0.14) * 0.92 * Math.max(0.8, playerZoomFactor * 0.5); // Use player's actual size
              }
              
              // Simplified rendering for far away snakes
              if (isFarAway) {
                // Simple segment for distant snakes with distance-based opacity
                ctx.save();
                ctx.globalAlpha = distanceOpacity * 0.7 * opacity; // Apply both distance and LOD opacity
              ctx.beginPath();
              ctx.arc(screenX, screenY, radius, 0, 2 * Math.PI);
                ctx.fillStyle = player.color;
                ctx.fill();
                
                // Add subtle glow for distant snakes
                ctx.beginPath();
                ctx.arc(screenX, screenY, radius * 1.2, 0, 2 * Math.PI);
                ctx.strokeStyle = player.color;
                ctx.lineWidth = 1;
                ctx.globalAlpha = distanceOpacity * 0.3 * opacity; // Apply LOD opacity
                ctx.stroke();
                ctx.restore();
                continue;
              }
              
              // Add boost glow effect to all segments when boosting
              if (player.isBoosting) {
                const boostPulse = Math.sin(Date.now() / 100 + i * 0.5) * 0.3 + 1.2;
                const boostGlowRadius = radius * 1.8 * boostPulse;
                
                // Boost glow gradient - reduced by 50%
                const boostGlow = ctx.createRadialGradient(screenX, screenY, radius * 0.5, screenX, screenY, boostGlowRadius);
                boostGlow.addColorStop(0, `${player.color}12`); // Reduced from 20 to 12 (40% reduction)
                boostGlow.addColorStop(0.6, `${player.color}06`); // Reduced from 10 to 6 (40% reduction)
                boostGlow.addColorStop(1, `${player.color}00`);
                
                ctx.save();
                ctx.globalAlpha = 0.18 * opacity; // Reduced from 0.3 to 0.18 (40% reduction)
                ctx.beginPath();
                ctx.arc(screenX, screenY, boostGlowRadius, 0, 2 * Math.PI);
                ctx.fillStyle = boostGlow;
                ctx.shadowColor = player.color;
                ctx.shadowBlur = 9 * boostPulse; // Reduced from 15 to 9 (40% reduction)
              ctx.fill();
              ctx.globalAlpha = 1;
              ctx.shadowBlur = 0;
                ctx.restore();
            }
            
              // Modern segment design - clean and sleek with lightning effects
              ctx.save();
              
              // Lightning effect - electrical discharge around segments (LOD optimized)
              const lightningTime = Date.now() * 0.008; // Reduced from 0.01
              const lightningIntensity = Math.sin(lightningTime + i * 0.3) * 0.5 + 0.5; // Reduced from 0.5 to 0.3
              const lightningRadius = radius * (1.1 + lightningIntensity * 0.2); // Reduced from 1.2+0.3 to 1.1+0.2
              
              // Check for kill glow effect
              const killGlow = killGlowEffects[id];
              let killGlowIntensity = 0;
              if (killGlow) {
                const elapsed = Date.now() - killGlow.startTime;
                const progress = Math.min(elapsed / killGlow.duration, 1);
                if (progress >= 1) {
                  // Remove expired kill glow
                  setKillGlowEffects(prev => {
                    const newEffects = { ...prev };
                    delete newEffects[id];
                    return newEffects;
                  });
                } else {
                  killGlowIntensity = (1 - progress) * killGlow.intensity;
                }
              }
              
              // Lightning glow gradient
              const lightningGradient = ctx.createRadialGradient(screenX, screenY, radius * 0.5, screenX, screenY, lightningRadius);
              lightningGradient.addColorStop(0, `${player.color}36`); // Reduced from 60 to 36 (40% reduction)
              lightningGradient.addColorStop(0.4, `${player.color}18`); // Reduced from 30 to 18 (40% reduction)
              lightningGradient.addColorStop(0.7, `${player.color}09`); // Reduced from 15 to 9 (40% reduction)
              lightningGradient.addColorStop(1, `${player.color}00`);
              
              ctx.globalAlpha = (0.24 + lightningIntensity * 0.18) * opacity; // Reduced from 0.4+0.3 to 0.24+0.18 (40% reduction)
              ctx.beginPath();
              ctx.arc(screenX, screenY, lightningRadius, 0, 2 * Math.PI);
              ctx.fillStyle = lightningGradient;
              ctx.shadowColor = player.color;
              ctx.shadowBlur = 6 + lightningIntensity * 6; // Reduced from 10+10 to 6+6 (40% reduction)
              ctx.fill();
              
              // Red kill glow effect - REMOVED
              /*
              if (killGlowIntensity > 0) {
                const killGlowRadius = radius * (1.5 + killGlowIntensity * 0.5);
                const killGlowGradient = ctx.createRadialGradient(screenX, screenY, radius * 0.5, screenX, screenY, killGlowRadius);
                killGlowGradient.addColorStop(0, `rgba(255, 0, 0, ${0.8 * killGlowIntensity})`); // Restored from 0.096 to 0.8
                killGlowGradient.addColorStop(0.3, `rgba(255, 0, 0, ${0.6 * killGlowIntensity})`); // Restored from 0.072 to 0.6
                killGlowGradient.addColorStop(0.7, `rgba(255, 0, 0, ${0.3 * killGlowIntensity})`); // Restored from 0.036 to 0.3
                killGlowGradient.addColorStop(1, `rgba(255, 0, 0, 0)`);
                
                ctx.globalAlpha = killGlowIntensity * 0.8 * opacity; // Restored from 0.096 to 0.8
                ctx.beginPath();
                ctx.arc(screenX, screenY, killGlowRadius, 0, 2 * Math.PI);
                ctx.fillStyle = killGlowGradient;
                ctx.shadowColor = '#ff0000';
                ctx.shadowBlur = 30 + killGlowIntensity * 40; // Restored from 3.6+4.8 to 30+40
                ctx.fill();
              }
              */
              
              // Electrical arcs around segments (LOD optimized - fewer arcs for distant segments)
              let arcCount = 0;
              if (segmentCount >= 6) {
                arcCount = segmentCount >= 17 ? 2 : 1;
                if (player.kills >= 5) {
                  arcCount = 3;
                }
              }
              // Apply LOD - reduce arcs for distant segments
              if (segmentDistance > maxRenderDistance * 0.5) {
                arcCount = 0;
              } else if (segmentDistance > maxRenderDistance * 0.3) {
                arcCount = Math.min(arcCount, 1);
              }
              
              for (let arc = 0; arc < arcCount; arc++) {
                const arcAngle = (arc / arcCount) * Math.PI * 2 + lightningTime * 0.3;
                const arcStartX = screenX + Math.cos(arcAngle) * radius * 0.8;
                const arcStartY = screenY + Math.sin(arcAngle) * radius * 0.8;
                const arcEndX = screenX + Math.cos(arcAngle) * lightningRadius;
                const arcEndY = screenY + Math.sin(arcAngle) * lightningRadius;
                
                // Draw lightning arc
                ctx.beginPath();
                ctx.moveTo(arcStartX, arcStartY);
                ctx.lineTo(arcEndX, arcEndY);
                ctx.strokeStyle = player.color;
                ctx.lineWidth = 2 + lightningIntensity * 2;
                ctx.shadowColor = player.color;
                ctx.shadowBlur = 6 + lightningIntensity * 6;
                ctx.globalAlpha = opacity;
                ctx.stroke();
              }
              
              ctx.globalAlpha = 1;
              ctx.shadowBlur = 0;
              
              // Main segment body - solid color with subtle shadow
              ctx.beginPath();
              ctx.arc(screenX, screenY, radius, 0, 2 * Math.PI);
              ctx.fillStyle = player.color;
              ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
              ctx.shadowBlur = 4.8; // Reduced from 8 to 4.8 (40% reduction)
              ctx.globalAlpha = opacity; // Apply LOD opacity
                ctx.fill();
              
              // Inner highlight for depth (LOD optimized)
              if (segmentDistance <= maxRenderDistance * 0.8) { // Only render highlights for closer segments
                const highlightRadius = radius * 0.7;
                const highlightGradient = ctx.createRadialGradient(
                  screenX - radius * 0.3, screenY - radius * 0.3, 0,
                  screenX, screenY, highlightRadius
                );
                highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
                highlightGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
                highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                
                ctx.beginPath();
                ctx.arc(screenX, screenY, highlightRadius, 0, 2 * Math.PI);
                ctx.fillStyle = highlightGradient;
                ctx.globalAlpha = opacity; // Apply LOD opacity
                ctx.fill();
              }
              
              // Subtle border for definition
              ctx.beginPath();
              ctx.arc(screenX, screenY, radius, 0, 2 * Math.PI);
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
              ctx.lineWidth = 1;
              ctx.globalAlpha = opacity; // Apply LOD opacity
              ctx.stroke();
              
              // Enhanced glow when boosting
              if (player.isBoosting) {
                ctx.beginPath();
                ctx.arc(screenX, screenY, radius, 0, 2 * Math.PI);
                ctx.strokeStyle = player.color;
                ctx.lineWidth = 2;
                ctx.shadowColor = player.color;
                ctx.shadowBlur = 9; // Reduced from 15 to 9 (40% reduction)
                ctx.globalAlpha = opacity; // Apply LOD opacity
                ctx.stroke();
              }
              
              ctx.restore();
            }
            
            // Draw head AFTER segments so it appears connected and on top
            if (player.segments.length > 0) {
              const head = player.segments[0];
              const headScreenX = head.x - cameraX;
              const headScreenY = head.y - cameraY;
              
              // --- Blue pulse for immunity ---
              if (player.isImmuneToCollision) {
                const pulse = Math.sin(Date.now() / 500) * 0.5 + 1.2; // Reduced from 250 to 500
                const playerActualSize = 12 + segmentCount * 0.14;
                // Outer big blue/teal glow
                ctx.save();
                const outerGlowRadius = playerActualSize * 2.2 + 24 * pulse;
                const outerGrad = ctx.createRadialGradient(
                  headScreenX, headScreenY, playerActualSize * 0.7,
                  headScreenX, headScreenY, outerGlowRadius
                );
                outerGrad.addColorStop(0, 'rgba(0,255,255,0.06)'); // Reduced from 0.10 to 0.06 (40% reduction)
                outerGrad.addColorStop(0.4, 'rgba(0,191,255,0.078)'); // Reduced from 0.13 to 0.078 (40% reduction)
                outerGrad.addColorStop(0.7, 'rgba(0,255,255,0.108)'); // Reduced from 0.18 to 0.108 (40% reduction)
                outerGrad.addColorStop(1, 'rgba(0,255,255,0.0)'); // Edge: fully transparent
                ctx.globalAlpha = 0.192 + 0.108 * pulse; // Reduced from 0.32+0.18 to 0.192+0.108 (40% reduction)
              ctx.beginPath();
                ctx.arc(headScreenX, headScreenY, outerGlowRadius, 0, 2 * Math.PI);
                ctx.fillStyle = outerGrad;
                ctx.shadowColor = '#00fff7';
                ctx.shadowBlur = 36 * pulse; // Reduced from 60 to 36 (40% reduction)
              ctx.fill();
                ctx.globalAlpha = 1;
              ctx.shadowBlur = 0;
                ctx.restore();
                // Existing blue pulse
                ctx.save();
                const grad = ctx.createRadialGradient(
                  headScreenX, headScreenY, playerActualSize * 0.7,
                  headScreenX, headScreenY, playerActualSize * 1.25 + 8 * pulse
                );
                grad.addColorStop(0, 'rgba(0,191,255,0.108)'); // Reduced from 0.18 to 0.108 (40% reduction)
                grad.addColorStop(0.45, 'rgba(0,191,255,0.192)'); // Reduced from 0.32 to 0.192 (40% reduction)
                grad.addColorStop(0.8, 'rgba(0,191,255,0.228)'); // Reduced from 0.38 to 0.228 (40% reduction)
                grad.addColorStop(1, 'rgba(0,191,255,0.0)');
                ctx.globalAlpha = 0.21 + 0.15 * pulse; // Reduced from 0.35+0.25 to 0.21+0.15 (40% reduction)
                ctx.beginPath();
                ctx.arc(headScreenX, headScreenY, playerActualSize * 1.25 + 8 * pulse, 0, 2 * Math.PI);
                ctx.fillStyle = grad;
                ctx.shadowColor = '#00bfff';
                ctx.shadowBlur = 24 * pulse; // Reduced from 40 to 24 (40% reduction)
                ctx.fill();
                ctx.globalAlpha = 1;
                ctx.shadowBlur = 0;
                ctx.restore();
              }
                
              // Draw head with modern design and lightning effects
              ctx.save();
              
              // Define head radius first so it can be used by all effects
              const headRadius = (12 + segmentCount * 0.14) * 1.15 * Math.max(0.8, playerZoomFactor * 0.5); // Use player's actual size
              
              // Lightning effect on head - more intense than body
              const headLightningTime = Date.now() * 0.003; // Reduced from 0.005
              const headLightningIntensity = Math.sin(headLightningTime) * 0.5 + 0.7; // Reduced from 0.6 to 0.5
              const headLightningRadius = headRadius * (1.2 + headLightningIntensity * 0.3); // Reduced from 1.3+0.4 to 1.2+0.3
              
              // Check for kill glow effect on head
              const headKillGlow = killGlowEffects[id];
              let headKillGlowIntensity = 0;
              if (headKillGlow) {
                const elapsed = Date.now() - headKillGlow.startTime;
                const progress = Math.min(elapsed / headKillGlow.duration, 1);
                if (progress < 1) {
                  headKillGlowIntensity = (1 - progress) * headKillGlow.intensity;
                }
              }
              
              // Head lightning glow gradient
              const headLightningGradient = ctx.createRadialGradient(headScreenX, headScreenY, headRadius * 0.5, headScreenX, headScreenY, headLightningRadius);
              headLightningGradient.addColorStop(0, `${player.color}48`); // Reduced from 80 to 48 (40% reduction)
              headLightningGradient.addColorStop(0.3, `${player.color}30`); // Reduced from 50 to 30 (40% reduction)
              headLightningGradient.addColorStop(0.6, `${player.color}15`); // Reduced from 25 to 15 (40% reduction)
              headLightningGradient.addColorStop(1, `${player.color}00`);
              
              ctx.globalAlpha = 0.3 + headLightningIntensity * 0.24; // Reduced from 0.5+0.4 to 0.3+0.24 (40% reduction)
                ctx.beginPath();
              ctx.arc(headScreenX, headScreenY, headLightningRadius, 0, 2 * Math.PI);
              ctx.fillStyle = headLightningGradient;
              ctx.shadowColor = player.color;
              ctx.shadowBlur = 15 + headLightningIntensity * 12; // Reduced from 25+20 to 15+12 (40% reduction)
                ctx.fill();
              
              // Red kill glow effect on head
              if (headKillGlowIntensity > 0) {
                const headKillGlowRadius = headRadius * (1.6 + headKillGlowIntensity * 0.6);
                const headKillGlowGradient = ctx.createRadialGradient(headScreenX, headScreenY, headRadius * 0.5, headScreenX, headScreenY, headKillGlowRadius);
                headKillGlowGradient.addColorStop(0, `rgba(255, 0, 0, ${0.18 * headKillGlowIntensity})`); // Reduced by 80% from 0.9 to 0.18
                headKillGlowGradient.addColorStop(0.3, `rgba(255, 0, 0, ${0.14 * headKillGlowIntensity})`); // Reduced by 80% from 0.7 to 0.14
                headKillGlowGradient.addColorStop(0.7, `rgba(255, 0, 0, ${0.08 * headKillGlowIntensity})`); // Reduced by 80% from 0.4 to 0.08
                headKillGlowGradient.addColorStop(1, `rgba(255, 0, 0, 0)`);
                
                ctx.globalAlpha = headKillGlowIntensity * 0.18; // Reduced by 80% from 0.9 to 0.18
                ctx.beginPath();
                ctx.arc(headScreenX, headScreenY, headKillGlowRadius, 0, 2 * Math.PI);
                ctx.fillStyle = headKillGlowGradient;
                ctx.shadowColor = '#ff0000';
                ctx.shadowBlur = 8 + headKillGlowIntensity * 10; // Reduced by 80% from 40+50 to 8+10
                ctx.fill();
              }
              
              // Enhanced lightning arcs around head
              const headArcCount = 4;
              for (let arc = 0; arc < headArcCount; arc++) {
                const arcAngle = (arc / headArcCount) * Math.PI * 2 + headLightningTime * 0.3;
                const arcStartX = headScreenX + Math.cos(arcAngle) * headRadius * 0.9;
                const arcStartY = headScreenY + Math.sin(arcAngle) * headRadius * 0.9;
                const arcEndX = headScreenX + Math.cos(arcAngle) * headLightningRadius;
                const arcEndY = headScreenY + Math.sin(arcAngle) * headLightningRadius;
                
                // Draw lightning arc
                ctx.beginPath();
                ctx.moveTo(arcStartX, arcStartY);
                ctx.lineTo(arcEndX, arcEndY);
                ctx.strokeStyle = player.color;
                ctx.lineWidth = 4 + headLightningIntensity * 6;
                ctx.shadowColor = player.color;
                ctx.shadowBlur = 12 + headLightningIntensity * 15; // Reduced from 20+25 to 12+15 (40% reduction)
                ctx.stroke();
              }
              
              // Lightning bolt effect emanating from head in movement direction - 4 spinning "Z" zigzags like roots
              if (player.direction) {
                const boltLength = headRadius * 2.2; // Reduced length to 2.2 radius
                const boltStartX = headScreenX + player.direction.dx * headRadius * 0.4; // Closer to head (reduced from 0.8)
                const boltStartY = headScreenY + player.direction.dy * headRadius * 0.4;
                const boltEndX = headScreenX + player.direction.dx * boltLength;
                const boltEndY = headScreenY + player.direction.dy * boltLength;
                
                // Create 4 spinning "Z" zigzag lightning roots
                const rootCount = 4;
                for (let root = 0; root < rootCount; root++) {
                  const rootAngle = (root / rootCount) * Math.PI * 2 + headLightningTime * 0.8; // Spinning animation
                  const rootLength = boltLength * (0.6 + Math.random() * 0.4); // Variable root lengths
                  
                  // Calculate root direction (perpendicular to movement with spinning)
                  const rootDirX = Math.cos(rootAngle);
                  const rootDirY = Math.sin(rootAngle);
                  
                  const rootEndX = boltStartX + rootDirX * rootLength;
                  const rootEndY = boltStartY + rootDirY * rootLength;
                  
                  // Create "Z" zigzag pattern for each root
                  const zigzagSegments = 6;
                  const zigzagPoints = [];
                  zigzagPoints.push({ x: boltStartX, y: boltStartY });
                  
                  for (let i = 1; i < zigzagSegments; i++) {
                    const progress = i / zigzagSegments;
                    const baseX = boltStartX + (rootEndX - boltStartX) * progress;
                    const baseY = boltStartY + (rootEndY - boltStartY) * progress;
                    
                    // Create "Z" pattern by alternating perpendicular offsets
                    const perpendicularX = -rootDirY;
                    const perpendicularY = rootDirX;
                    const zigzagIntensity = headRadius * 0.4; // Reduced intensity
                    
                    // Alternate direction for "Z" effect
                    const zigzagDirection = i % 2 === 0 ? 1 : -1;
                    const zigzagOffset = Math.sin(headLightningTime * 3 + root * 1.5 + i * 0.8) * zigzagIntensity * zigzagDirection;
                    
                    zigzagPoints.push({
                      x: baseX + perpendicularX * zigzagOffset,
                      y: baseY + perpendicularY * zigzagOffset
                    });
                  }
                  zigzagPoints.push({ x: rootEndX, y: rootEndY });
                  
                  // Draw lightning root with transparent glow effect
                  ctx.save();
                  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'; // Transparent white core
                  ctx.lineWidth = 1.5 + headLightningIntensity * 1.5; // Thinner lines
                  ctx.lineCap = 'round';
                  ctx.lineJoin = 'round';
                  ctx.shadowColor = player.color;
                  ctx.shadowBlur = 9 + headLightningIntensity * 12; // Reduced from 15+20 to 9+12 (40% reduction)
                  ctx.globalAlpha = 0.6 + headLightningIntensity * 0.2; // More transparent
                  
                  ctx.beginPath();
                  ctx.moveTo(zigzagPoints[0].x, zigzagPoints[0].y);
                  for (let i = 1; i < zigzagPoints.length; i++) {
                    ctx.lineTo(zigzagPoints[i].x, zigzagPoints[i].y);
                  }
                  ctx.stroke();
                  
                  // Draw colored lightning root overlay
                  ctx.strokeStyle = player.color;
                  ctx.lineWidth = 1 + headLightningIntensity * 1; // Thinner colored lines
                  ctx.shadowBlur = 6 + headLightningIntensity * 9; // Reduced from 10+15 to 6+9 (40% reduction)
                  ctx.globalAlpha = 0.5 + headLightningIntensity * 0.3; // More transparent
                  
                  ctx.beginPath();
                  ctx.moveTo(zigzagPoints[0].x, zigzagPoints[0].y);
                  for (let i = 1; i < zigzagPoints.length; i++) {
                    ctx.lineTo(zigzagPoints[i].x, zigzagPoints[i].y);
                  }
                  ctx.stroke();
                  
                  // Add small branching roots from main root
                  const branchCount = 2;
                  for (let branch = 0; branch < branchCount; branch++) {
                    const branchStartIndex = Math.floor(Math.random() * (zigzagPoints.length - 2)) + 1;
                    const branchStart = zigzagPoints[branchStartIndex];
                    const branchLength = headRadius * (0.2 + Math.random() * 0.3); // Smaller branches
                    const branchAngle = rootAngle + (branch / branchCount) * Math.PI + headLightningTime * 1.2;
                    
                    const branchEndX = branchStart.x + Math.cos(branchAngle) * branchLength;
                    const branchEndY = branchStart.y + Math.sin(branchAngle) * branchLength;
                    
                    // Create mini "Z" for branch
                    const branchSegments = 4;
                    const branchPoints = [];
                    branchPoints.push({ x: branchStart.x, y: branchStart.y });
                    
                    for (let i = 1; i < branchSegments; i++) {
                      const progress = i / branchSegments;
                      const baseX = branchStart.x + (branchEndX - branchStart.x) * progress;
                      const baseY = branchStart.y + (branchEndY - branchStart.y) * progress;
                      
                      const perpX = Math.cos(branchAngle + Math.PI / 2);
                      const perpY = Math.sin(branchAngle + Math.PI / 2);
                      const zigzagOffset = Math.sin(headLightningTime * 4 + root * 0.8 + branch * 0.6 + i * 0.5) * headRadius * 0.2 * (i % 2 === 0 ? 1 : -1);
                      
                      branchPoints.push({
                        x: baseX + perpX * zigzagOffset,
                        y: baseY + perpY * zigzagOffset
                      });
                    }
                    branchPoints.push({ x: branchEndX, y: branchEndY });
                    
                    // Draw branch
                    ctx.strokeStyle = player.color;
                    ctx.lineWidth = 0.5 + headLightningIntensity * 0.5; // Very thin branches
                    ctx.shadowBlur = 3 + headLightningIntensity * 6; // Reduced from 5+10 to 3+6 (40% reduction)
                    ctx.globalAlpha = 0.3 + headLightningIntensity * 0.3; // Very transparent
                    
                    ctx.beginPath();
                    ctx.moveTo(branchPoints[0].x, branchPoints[0].y);
                    for (let i = 1; i < branchPoints.length; i++) {
                      ctx.lineTo(branchPoints[i].x, branchPoints[i].y);
                    }
                    ctx.stroke();
                  }
                  
                  ctx.restore();
                }
              }
              
              // Draw main head body
              ctx.globalAlpha = 1;
              ctx.beginPath();
              ctx.arc(headScreenX, headScreenY, headRadius, 0, 2 * Math.PI);
              ctx.fillStyle = player.color;
              ctx.shadowColor = player.color;
              ctx.shadowBlur = 15;
                ctx.fill();
              
              // Draw head highlight
              const highlightRadius = headRadius * 0.6;
              const highlightGradient = ctx.createRadialGradient(
                headScreenX - headRadius * 0.3, headScreenY - headRadius * 0.3, 0,
                headScreenX, headScreenY, highlightRadius
              );
              highlightGradient.addColorStop(0, '#ffffff');
              highlightGradient.addColorStop(0.3, `${player.color}80`);
              highlightGradient.addColorStop(1, `${player.color}00`);
              
                ctx.beginPath();
              ctx.arc(headScreenX, headScreenY, highlightRadius, 0, 2 * Math.PI);
              ctx.fillStyle = highlightGradient;
                ctx.fill();
                
              // Draw head border
                ctx.beginPath();
              ctx.arc(headScreenX, headScreenY, headRadius, 0, 2 * Math.PI);
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'; // More transparent white border
              ctx.lineWidth = 1.2; // Thinner border
              ctx.shadowColor = 'rgba(255, 255, 255, 0.2)'; // More transparent shadow
              ctx.shadowBlur = 4; // Reduced glow
              ctx.stroke();
              
              // Draw eyes looking in movement direction
              if (player.direction) {
                const eyeRadius = headRadius * 0.2; // Slightly smaller eyes
                const eyeOffset = headRadius * 0.6; // Eyes moved back half as much (from 55% to 60%)
                const eyeX1 = headScreenX + player.direction.dx * eyeOffset * 0.8 - player.direction.dy * eyeOffset * 0.3;
                const eyeY1 = headScreenY + player.direction.dy * eyeOffset * 0.8 + player.direction.dx * eyeOffset * 0.3;
                const eyeX2 = headScreenX + player.direction.dx * eyeOffset * 0.8 + player.direction.dy * eyeOffset * 0.3;
                const eyeY2 = headScreenY + player.direction.dy * eyeOffset * 0.8 - player.direction.dx * eyeOffset * 0.3;
                
                // Check for kill glow effect on eyes
                const eyeKillGlow = killGlowEffects[id];
                let eyeKillGlowIntensity = 0;
                if (eyeKillGlow) {
                  const elapsed = Date.now() - eyeKillGlow.startTime;
                  const progress = Math.min(elapsed / eyeKillGlow.duration, 1);
                  if (progress < 1) {
                    eyeKillGlowIntensity = (1 - progress) * eyeKillGlow.intensity;
                  }
                }
                
                // Draw eye whites with gradient
                ctx.save();
                ctx.translate(eyeX1, eyeY1);
                ctx.rotate(Math.atan2(player.direction.dy, player.direction.dx) + Math.PI / 2); // Rotate 90 degrees
                ctx.beginPath();
                ctx.arc(0, 0, eyeRadius, 0, 2 * Math.PI);
                const eyeGradient1 = ctx.createRadialGradient(-eyeRadius * 0.3, -eyeRadius * 0.3, 0, 0, 0, eyeRadius);
                eyeGradient1.addColorStop(0, '#ffffff');
                eyeGradient1.addColorStop(1, '#e0e0e0');
                ctx.fillStyle = eyeGradient1;
                ctx.fill();
                ctx.restore();
                
                ctx.save();
                ctx.translate(eyeX2, eyeY2);
                ctx.rotate(Math.atan2(player.direction.dy, player.direction.dx) + Math.PI / 2); // Rotate 90 degrees
                ctx.beginPath();
                ctx.arc(0, 0, eyeRadius, 0, 2 * Math.PI);
                const eyeGradient2 = ctx.createRadialGradient(-eyeRadius * 0.3, -eyeRadius * 0.3, 0, 0, 0, eyeRadius);
                eyeGradient2.addColorStop(0, '#ffffff');
                eyeGradient2.addColorStop(1, '#e0e0e0');
                ctx.fillStyle = eyeGradient2;
                ctx.fill();
                ctx.restore();
                
                // Draw diamond-shaped snake pupils (longer height, no cursor tracking)
                const pupilRadius = eyeRadius * 0.6;
                const pupilX1 = eyeX1;
                const pupilY1 = eyeY1;
                const pupilX2 = eyeX2;
                const pupilY2 = eyeY2;
                
                // Draw first diamond pupil
                ctx.save();
                ctx.translate(pupilX1, pupilY1);
                ctx.rotate(Math.atan2(player.direction.dy, player.direction.dx) + Math.PI / 2); // Rotate 90 degrees
                ctx.beginPath();
                // Draw diamond-shaped snake pupil with longer height
                const diamondWidth = pupilRadius * 0.4;
                const diamondHeight = pupilRadius * 1.2; // Increased height from 0.8 to 1.2
                ctx.moveTo(0, -diamondHeight);
                ctx.lineTo(diamondWidth, 0);
                ctx.lineTo(0, diamondHeight);
                ctx.lineTo(-diamondWidth, 0);
                ctx.closePath();
                ctx.fillStyle = eyeKillGlowIntensity > 0 ? `rgba(255, 0, 0, ${0.9 + eyeKillGlowIntensity * 0.1})` : '#000000';
                ctx.shadowColor = eyeKillGlowIntensity > 0 ? '#ff0000' : '#000000';
                ctx.shadowBlur = eyeKillGlowIntensity > 0 ? 8 : 2;
                ctx.fill();
                ctx.restore();
                
                // Draw second diamond pupil
                ctx.save();
                ctx.translate(pupilX2, pupilY2);
                ctx.rotate(Math.atan2(player.direction.dy, player.direction.dx) + Math.PI / 2); // Rotate 90 degrees
                ctx.beginPath();
                // Draw diamond-shaped snake pupil with longer height
                ctx.moveTo(0, -diamondHeight);
                ctx.lineTo(diamondWidth, 0);
                ctx.lineTo(0, diamondHeight);
                ctx.lineTo(-diamondWidth, 0);
                ctx.closePath();
                ctx.fillStyle = eyeKillGlowIntensity > 0 ? `rgba(255, 0, 0, ${0.9 + eyeKillGlowIntensity * 0.1})` : '#000000';
                ctx.shadowColor = eyeKillGlowIntensity > 0 ? '#ff0000' : '#000000';
                ctx.shadowBlur = eyeKillGlowIntensity > 0 ? 8 : 2;
                ctx.fill();
                ctx.restore();
              }
          }
          ctx.restore();
          }
        }
      }

      // Draw ETH drops - REMOVED SPARKLE EFFECT
      // ethDrops.forEach(drop => {
      //   const x = Math.random() * canvas.width;
      //   const y = Math.random() * canvas.height;
      //   ctx.beginPath();
      //   ctx.arc(x, y, 5, 0, 2 * Math.PI);
      //   ctx.fillStyle = drop.sparkleColor;
      //   ctx.shadowColor = drop.sparkleColor;
      //   ctx.shadowBlur = 8;
      //   ctx.fill();
      //   ctx.shadowBlur = 0;
      // });

      // Draw pop animations for disappearing segments
      popAnimations.forEach((pop, index) => {
        const elapsed = Date.now() - pop.startTime;
        const progress = Math.min(elapsed / pop.duration, 1);
        
        if (progress >= 1) {
          // Remove expired animations
          setPopAnimations(prev => prev.filter((_, i) => i !== index));
          return;
        }
        
        // Convert world coordinates to screen coordinates
        const screenX = pop.worldX - cameraX;
        const screenY = pop.worldY - cameraY;
        
        // Check if pop animation is visible
        if (screenX >= minX && screenX <= maxX && 
            screenY >= minY && screenY <= maxY) {
          
          ctx.save();
          
          // Calculate pop size and opacity based on progress
          const popSize = pop.size * (1 + progress * 2);
          const popOpacity = (1 - progress) * 0.8; // Reduced from 1.0
          
          // Simplified pop effect
        ctx.beginPath();
          ctx.arc(screenX, screenY, popSize, 0, 2 * Math.PI);
          ctx.fillStyle = pop.color;
          ctx.globalAlpha = popOpacity;
          ctx.shadowColor = pop.color;
          ctx.shadowBlur = 8; // Reduced from 15
        ctx.fill();
          ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
          
          ctx.restore();
        }
      });

      // Draw a test message if no gameState (for testing mode)
      if (!gameState) {
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#00ffcc';
        ctx.fillText('Game Canvas Ready - Testing Mode', canvas.width / 2, canvas.height / 2);
        ctx.font = '16px Arial';
        ctx.fillText('Move mouse to control direction', canvas.width / 2, canvas.height / 2 + 40);
        ctx.fillText('Press SPACE for boost', canvas.width / 2, canvas.height / 2 + 70);
      }

      // Movement Prediction Tracker
      if (showMovementTracker && gameState && gameState.players) {
        const playerId = Object.keys(gameState.players).find(
          id => gameState.players[id].wallet?.toLowerCase() === (address?.toLowerCase() || "0x0000000000000000000000000000000000000000")
        );
        
        if (playerId && gameState.players[playerId] && gameState.players[playerId].segments.length > 0) {
          const player = gameState.players[playerId];
          const head = player.segments[0];
          
          // Convert player head position to screen coordinates
          const playerScreenX = head.x - cameraX;
          const playerScreenY = head.y - cameraY;
          
          // Use the actual mouse position (already in screen coordinates)
          const mouseScreenX = mouseTarget.x;
          const mouseScreenY = mouseTarget.y;
          
          // Calculate distance and angle from player to mouse
          const dx = mouseScreenX - playerScreenX;
          const dy = mouseScreenY - playerScreenY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx);
          
          // Cap the line length at 200px for visibility
          const maxDistance = 200;
          const cappedDistance = Math.min(distance, maxDistance);
          
          // Calculate end point of the prediction line
          const endX = playerScreenX + Math.cos(angle) * cappedDistance;
          const endY = playerScreenY + Math.sin(angle) * cappedDistance;
          
          // Start the line slightly away from the snake head (offset by 20px)
          const startOffset = 20;
          const startX = playerScreenX + Math.cos(angle) * startOffset;
          const startY = playerScreenY + Math.sin(angle) * startOffset;
          
          // Draw prediction line with gradient effect
          const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
          gradient.addColorStop(0, 'rgba(0, 255, 255, 0.15)'); // Very transparent cyan at start
          gradient.addColorStop(1, 'rgba(0, 255, 255, 0.02)'); // Almost invisible at mouse
          
          ctx.save();
          ctx.strokeStyle = gradient;
          ctx.lineWidth = 3;
          ctx.lineCap = 'round';
          ctx.shadowColor = '#00ffff';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.stroke();
          ctx.restore();
          
          // Draw mouse target indicator (white dot with cyan border)
          ctx.save();
          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = '#00ffff';
          ctx.lineWidth = 2;
          ctx.shadowColor = '#00ffff';
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.arc(mouseScreenX, mouseScreenY, 4, 0, 2 * Math.PI);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }
      }

      // At the very end of the draw function, after all drawing:
      ctx.restore();



      animationId = requestAnimationFrame(draw);
    }
    
    animationId = requestAnimationFrame(draw);

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [gameState, ethDrops, popAnimations]); // Added popAnimations to dependencies

  useEffect(() => {
    if (isConfirmed) {
      setShowNamePrompt(false);
    }
  }, [isConfirmed]);

  useEffect(() => {
    if (joinGameError) {
      console.error("Join Game Error:", joinGameError);
    }
  }, [joinGameError]);

  useEffect(() => {
    // If no wager amount is passed and not in test mode, redirect back to main screen
    if (!wagerAmount && !isTestMode) {
      console.error("No wager amount provided. Redirecting.");
      navigate('/');
    }
  }, [wagerAmount, isTestMode, navigate]);

  useEffect(() => {
    // Calculate size based on actual segment count from game state, not just orbs eaten
    if (gameState && gameState.players) {
      const playerId = Object.keys(gameState.players).find(
        id => gameState.players[id].wallet?.toLowerCase() === (address?.toLowerCase() || "0x0000000000000000000000000000000000000000")
      );
      if (playerId && gameState.players[playerId]) {
        const player = gameState.players[playerId];
        const segmentCount = player.segments ? player.segments.length : 0;
        // Base size of 12 + 0.14 per segment (reduced from 0.2 to 0.14 for even more gradual growth)
        setPlayerSnakeSize(12 + segmentCount * 0.14);
      }
    }
  }, [gameState, address]);

  const handleJoinGame = () => {
    console.log("Attempting to join game...");
    console.log("Wallet connected:", isConnected);
    console.log("Address:", address);
    console.log("Player name:", playerName);
    console.log("Wager amount:", wagerAmount);
    console.log("Wager amount type:", typeof wagerAmount);
    console.log("Test mode:", isTestMode);
    console.log("Test mode type:", location.state?.testModeType);
    
    // Hidden test mode: bypass all wallet and ETH requirements
    if (isTestMode && playerName.trim().toLowerCase() === expectedTestName) {
      console.log(`Test mode activated (${testModeType}) - bypassing wallet and ETH requirements`);
      setShowNamePrompt(false);
      setIsPlayer(true);
      setError("");
      return;
    }
    
    if (!isConnected) {
      setError("Please connect your wallet first.");
      console.error("Wallet not connected.");
      return;
    }
    if (!playerName.trim()) {
      setError("Player name is required.");
      console.error("Missing player name.", { playerName });
      return;
    }
    if (!wagerAmount || wagerAmount <= 0) {
      setError("Please select a wager amount from the main screen.");
      console.error("Missing or invalid wager amount.", { wagerAmount });
      return;
    }

    // Allow 'test' as a name to bypass ETH transaction for testing
    if (playerName.trim().toLowerCase() === 'test') {
      setShowNamePrompt(false);
      setIsPlayer(true);
      setError("");
      return;
    }

    const zeroAddress = '0x0000000000000000000000000000000000000000';
    let wagerInWei;
    try {
      wagerInWei = parseEther(wagerAmount.toString());
      console.log("Wager in Wei:", wagerInWei.toString());
    } catch (error) {
      console.error("Error parsing wager:", error);
      setError("Invalid wager amount. Please return to the main screen and select a valid wager.");
      return;
    }

    const transactionData = {
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'joinGame',
      args: [zeroAddress],
      value: wagerInWei,
    };

    console.log("Transaction data:", transactionData);
    console.log("writeContract function:", typeof writeContract);
    
    // Set a timeout to detect if the wallet popup is blank
    const timeoutId = setTimeout(() => {
      console.log("Timeout reached - wallet popup may be blank");
      setError("Abstract wallet popup appears to be blank. This usually means there's a crypto API issue. Please try:\n\n1. Refresh the page\n2. Use a different browser (Chrome, Firefox, Edge)\n3. Try in incognito/private mode\n4. Disable browser extensions\n5. Check if your browser supports Web Crypto API");
    }, 5000); // 5 second timeout
    
    // Try the Abstract SDK first
    try {
      console.log("Calling writeContract...");
      const result = writeContract(transactionData);
      console.log("writeContract result:", result);
      
      // Clear timeout if successful
      clearTimeout(timeoutId);
    } catch (error) {
      console.error("Abstract SDK contract call failed:", error);
      clearTimeout(timeoutId);
      
      // Show manual transaction instructions since Abstract SDK is failing
      const manualInstructions = `
Abstract SDK Error: ${error.message || 'Crypto initialization failed'}

Since the Abstract SDK is having crypto API issues, here are manual instructions:

1. Open your Abstract wallet manually
2. Go to the "Send" or "Transaction" section
3. Use these transaction details:
   - To: ${CONTRACT_ADDRESS}
   - Value: ${wagerAmount} ETH
   - Data: 0x2389a2900000000000000000000000000000000000000000000000000000000000000000
   - Chain: Abstract Testnet (Chain ID: 11124)

4. After the transaction is confirmed, refresh this page

Alternative solutions:
- Try a different browser (Chrome, Firefox, Edge)
- Use incognito/private mode
- Disable browser extensions
- Update your browser to the latest version
      `;
      
      setError(manualInstructions);
    }
  };

  // Handle death screen
  useEffect(() => {
    if (showDeathScreen) {
      const timer = setInterval(() => {
        setDeathTimer(prev => {
          if (prev >= 3) {
            clearInterval(timer);
            return 3;
          }
          return prev + 0.1;
        });
      }, 100);
      
      return () => clearInterval(timer);
    }
  }, [showDeathScreen]);

  // Listen for death messages from server
  useEffect(() => {
    if (client) {
      const handleMessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received message from server:', data);
          
          if (data.type === 'death') {
            console.log('Death message received:', data);
            console.log('Current achievements state:', achievements);
            console.log('Current achievementSP state:', achievementSP);
            console.log('Achievements object keys:', Object.keys(achievements));
            console.log('Achievements object values:', Object.values(achievements));
            console.log('Achievement count:', Object.values(achievements).filter(Boolean).length);
            console.log('Persistent achievements:', achievements);
            
            // Navigate to death screen with session stats
            setTimeout(() => {
              safeNavigate('/death', {
                state: {
                  isTestMode: isTestMode,
                  wagerAmount: wagerAmount || 0,
                  stakeAmount: wagerAmount || 0,
                  escaped: false,
                  // Use server-sent stats
                  timeSurvived: data.timeSurvived || timeSurvived,
                  orbsEaten: data.orbsEaten || orbsEaten,
                  kills: data.kills || kills,
                  spEarned: data.SP ?? spEarned,
                  originalSP: data.originalSP || (data.SP ? data.SP * 2 : spEarned * 2), // Calculate original SP if not provided
                  playerName: data.name || playerName,
                  wallet: data.wallet || address,
                  startTime: data.sessionStartTime || sessionStartTime,
                  achievements: achievements,
                  achievementSP: achievementSP,
                  killedBy: data.killedBy || null,
                  deathType: data.deathType || 'boundary',
                  sessionCompletedQuests: Array.from(sessionCompletedQuests)
                }
              });
            }, 1000);
          }
          
          if (data.type === 'escape') {
            console.log('Escape message received:', data);
            // Navigate to escape screen with session stats
            setTimeout(() => {
              safeNavigate('/escape', {
                state: {
                  isTestMode: isTestMode,
                  wagerAmount: wagerAmount || 0,
                  stakeAmount: wagerAmount || 0,
                  escaped: true,
                  // Use server-sent stats
                  timeSurvived: data.timeSurvived || timeSurvived,
                  orbsEaten: data.orbsEaten || orbsEaten,
                  kills: data.kills || kills,
                  spEarned: data.SP ?? spEarned,
                  playerName: data.name || playerName,
                  wallet: data.wallet || address,
                  startTime: data.sessionStartTime || sessionStartTime,
                  achievements: achievements,
                  achievementSP: achievementSP,
                  sessionCompletedQuests: Array.from(sessionCompletedQuests)
                }
              });
            }, 50);
          }
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      };

      client.addEventListener('message', handleMessage);
      return () => client.removeEventListener('message', handleMessage);
    }
  }, [client, navigate]);

  const orbSound = useRef(null);
  const ethOrbSound = useRef(null);
  const boostSound = useRef(null);
  const deathSoundRef = useRef(null);
  const escapeSound = useRef(null);
  const collisionSound = useRef(null);
  const achievementSound = useRef(null);
  const killBonusSound = useRef(null);
  
  // Add this useEffect to debug achievement notifications
  useEffect(() => {
    if (achievementNotifications.length > 0) {
      console.log('📢 Achievement notifications array:', achievementNotifications);
      console.log('📢 Number of notifications:', achievementNotifications.length);
    }
  }, [achievementNotifications]);

  // --- SOUND SYSTEM REFACTOR START ---
  // Enhanced playSound utility with multiple fallbacks
  function playSound(ref, volume) {
    console.log('playSound called:', { ref: ref?.current, volume, refExists: !!ref });
    
    // First try the ref if it exists
    if (ref && ref.current) {
      try {
        console.log('Attempting to play sound:', ref.current.src, 'volume:', volume);
        // Create a clone of the audio element for more reliable playback
        const soundClone = ref.current.cloneNode(true);
        soundClone.volume = volume;
        
        const playPromise = soundClone.play();
        if (playPromise && playPromise.catch) {
          playPromise.catch(e => {
            console.error('Error playing cloned sound:', e);
            tryOriginalElement();
          });
          return;
        }
      } catch (e) {
        console.error('Error playing cloned sound:', e);
        tryOriginalElement();
      }
    } else {
      console.warn('Sound ref is null or undefined');
      tryCreateNewElement();
    }
    
    // Try the original element if clone fails
    function tryOriginalElement() {
      if (ref && ref.current) {
        try {
          console.log('Trying original audio element');
          ref.current.pause();
          ref.current.currentTime = 0;
          ref.current.volume = volume;
          
          const playPromise = ref.current.play();
          if (playPromise && playPromise.catch) {
            playPromise.catch(e => {
              console.error('Error playing original sound:', e);
              tryCreateNewElement();
            });
          }
        } catch (e) {
          console.error('Error playing original sound:', e);
          tryCreateNewElement();
        }
      } else {
        tryCreateNewElement();
      }
    }
    
    // Create a new audio element as last resort
    function tryCreateNewElement() {
      try {
        if (ref && ref.current && ref.current.src) {
          console.log('Creating new audio element for sound');
          const newAudio = new Audio(ref.current.src);
          newAudio.volume = volume;
          newAudio.play().catch(e => console.error('New audio element failed too:', e));
        }
      } catch (err) {
        console.error('Failed to create new audio element:', err);
      }
    }
  }

  // Unlock audio context on first user interaction
  useEffect(() => {
    const unlock = () => {
      [orbSound, ethOrbSound, killBonusSound].forEach(ref => {
        if (ref.current) {
          ref.current.volume = 0;
          ref.current.play().finally(() => {
            ref.current.pause();
            ref.current.currentTime = 0;
            ref.current.volume = volume * 0.32;
          });
        }
      });
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, [volume]);

  // Track previous values for sound triggers - using gameState data instead of local state
  const prevNormalOrbsRef = useRef(0);
  const prevMovingOrbsRef = useRef(0);
  const prevEthOrbsRef = useRef(0);
  const prevKillsRef = useRef(0);

  // Centralized sound trigger effect - using actual game data
  useEffect(() => {
    if (!gameState || !gameState.players) return;
    
    const playerId = Object.keys(gameState.players).find(
      id => gameState.players[id].wallet?.toLowerCase() === (address?.toLowerCase() || "0x0000000000000000000000000000000000000000")
    );
    
    if (!playerId) return;
    
    const player = gameState.players[playerId];
    const currentNormalOrbs = player.normalOrbsEaten || 0;
    const currentMovingOrbs = player.movingOrbsEaten || 0;
    const currentEthOrbs = player.ethOrbsEaten || 0;
    const currentKills = player.kills || 0;

    // Normal orb sound
    if (currentNormalOrbs > prevNormalOrbsRef.current) {
      console.log('Normal orb eaten! Playing orb sound.');
      playSound(orbSound, volume * 0.32);
    }
    prevNormalOrbsRef.current = currentNormalOrbs;

    // Moving orb sound
    if (currentMovingOrbs > prevMovingOrbsRef.current) {
      console.log('Moving orb eaten! Playing orb sound.');
      playSound(orbSound, volume * 0.32);
    }
    prevMovingOrbsRef.current = currentMovingOrbs;

    // ETH orb sound
    if (currentEthOrbs > prevEthOrbsRef.current) {
      console.log('ETH orb eaten! Playing ETH orb sound.');
      playSound(ethOrbSound, volume * 0.32);
    }
    prevEthOrbsRef.current = currentEthOrbs;

    // Kill bonus sound (0.5s delay)
    if (currentKills > prevKillsRef.current) {
      console.log('Kill bonus! Playing kill bonus sound.');
      setTimeout(() => playSound(killBonusSound, volume * 0.4), 500);
    }
    prevKillsRef.current = currentKills;
  }, [gameState, address, volume]);
  // --- SOUND SYSTEM REFACTOR END ---

  // 2. Play boost sound when boostActive becomes true
  useEffect(() => {
    if (boostActive && boostSound.current) {
      console.log('Playing boost sound, volume:', volume, 'calculated volume:', volume * 0.4);
      boostSound.current.currentTime = 0;
      boostSound.current.volume = volume * 0.4; // Increased from 0.25 * 1.1 to 0.4 (60% louder)
      boostSound.current.loop = true; // Make boost sound loop
      boostSound.current.play().catch(e => console.error('Error playing boost sound:', e));
    } else if (!boostActive && boostSound.current) {
      boostSound.current.loop = false; // Stop looping when boost ends
      boostSound.current.pause();
      boostSound.current.currentTime = 0;
    }
  }, [boostActive, volume]);

  // 3. Play death sound when showDeathScreen becomes true
  useEffect(() => {
    if (showDeathScreen && deathSoundRef.current) {
      console.log('Playing death sound, volume:', volume, 'calculated volume:', volume * 0.125 * 0.83);
      deathSoundRef.current.currentTime = 0;
      deathSoundRef.current.volume = volume * 0.125 * 0.83; // 87.5% reduction, then 17% more
      deathSoundRef.current.play().catch(e => console.error('Error playing death sound:', e));
    }
  }, [showDeathScreen, volume]);

  // 4. Play escape sound when isEscaping becomes true
  useEffect(() => {
    if (isEscaping && escapeSound.current) {
      console.log('Playing escape sound, volume:', volume, 'calculated volume:', volume * 0.25);
      escapeSound.current.currentTime = 0;
      escapeSound.current.volume = volume * 0.25; // 75% reduction
      escapeSound.current.play().catch(e => console.error('Error playing escape sound:', e));
    }
  }, [isEscaping, volume]);



  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (nameTakenTimerRef.current) clearTimeout(nameTakenTimerRef.current);
      if (largeSnakeWarningTimerRef.current) clearTimeout(largeSnakeWarningTimerRef.current);
      if (boostTimerRef.current) clearInterval(boostTimerRef.current);
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
      if (segmentRemovalTimerRef.current) clearInterval(segmentRemovalTimerRef.current);
      if (freeTimeTimerRef.current) clearInterval(freeTimeTimerRef.current);
      if (escapeTimerRef.current) clearInterval(escapeTimerRef.current);
    };
  }, []);

  // Auto-hide large snake warning after 3 seconds
  useEffect(() => {
    if (showLargeSnakeWarning) {
      // Clear any existing timer
      if (largeSnakeWarningTimerRef.current) {
        clearTimeout(largeSnakeWarningTimerRef.current);
      }
      
      largeSnakeWarningTimerRef.current = setTimeout(() => {
        setShowLargeSnakeWarning(false);
        setLargeSnakeWarningText('');
      }, 3000);
    }
    
    return () => {
      if (largeSnakeWarningTimerRef.current) {
        clearTimeout(largeSnakeWarningTimerRef.current);
      }
    };
  }, [showLargeSnakeWarning]);

  // Stop boost when player dies
  useEffect(() => {
    if (isDead || showDeathScreen) {
      if (boostTimerRef.current) {
        clearInterval(boostTimerRef.current);
        boostTimerRef.current = null;
      }
      if (segmentRemovalTimerRef.current) {
        clearInterval(segmentRemovalTimerRef.current);
        segmentRemovalTimerRef.current = null;
      }
      if (freeTimeTimerRef.current) {
        clearInterval(freeTimeTimerRef.current);
        freeTimeTimerRef.current = null;
      }
      if (cooldownTimerRef.current) {
        clearInterval(cooldownTimerRef.current);
        cooldownTimerRef.current = null;
      }
      setBoostActive(false);
      setBoostCooldown(0);
      setBoostFreeTimeRemaining(BOOST_FREE_DURATION);
      setTotalBoostTimeUsed(0);
      if (client) client.send(JSON.stringify({ type: 'boost', active: false }));
    }
  }, [isDead, showDeathScreen, client]);

  // Add this handler to trigger the escape logic
  const handleEscapeBarTrigger = () => {
    if (!isEscaping && !isDead) {
      startEscape();
    }
  };

  // --- QUEST PROGRESS UPDATE LOGIC REFACTOR START ---
  // Place this at the top of the component (after other refs):
  const multiGameQuestLastValuesRef = useRef({});

  // Update single-game quests: overwrite with current run stats (real-time)
  const updateSingleGameQuests = () => {
    if (!questTracker || !gameState || !gameState.players || !address) return;
    const playerId = Object.keys(gameState.players).find(
      id => gameState.players[id].wallet?.toLowerCase() === (address?.toLowerCase() || "0x0000000000000000000000000000000000000000")
    );
    if (!playerId || !gameState.players[playerId]) return;
    const player = gameState.players[playerId];
    // LOG: Show what stats are being sent to questTracker
    console.log('[QuestDebug] updateSingleGameQuests', {
      boostTime: totalBoostTimeUsed / 1000,
      orbsCollected: player.normalOrbsEaten || 0,
      segments: player.segments ? player.segments.length : 0,
      kills: player.kills || 0,
      ethCollected: player.ethEarned || 0,
      ethOrbsCollected: player.ethOrbsEaten || 0,
      movingOrbsCollected: player.movingOrbsEaten || 0,
      timeSurvived,
      timeElapsed: timeSurvived,
      boostUsed: boostActive,
      escapePending
    });
    
    // Enhanced tracking for speed demon quest with orbs
    const speedDemonOrbsCount = player.normalorbsEaten || 0;
    console.log('[QuestDebug] Speed demon tracking - orbsCollected:', speedDemonOrbsCount, 'boostTime:', totalBoostTimeUsed / 1000);
    
    questTracker.updateProgress(address, 'speed_demon_common', {
      boostTime: totalBoostTimeUsed / 1000,
      orbsCollected: speedDemonOrbsCount
    });
    
    // Always track segments, orbs, and other criteria for escape quests, but only set escaped=true when actually escaping
    const currentSegments = player.segments ? player.segments.length : 0;
    const escapeOrbsCount = player.normalorbsEaten || 0;
    console.log('[QuestDebug] Escape quest tracking - segments:', currentSegments, 'orbsCollected:', escapeOrbsCount, 'ethCollected:', player.ethEarned || 0, 'kills:', player.kills || 0, 'escapePending:', escapePending);
    
    questTracker.updateProgress(address, 'escape_artist_rare', {
      segments: currentSegments,
      ethCollected: player.ethEarned || 0,
      kills: player.kills || 0,
      orbsCollected: escapeOrbsCount,
      escaped: escapePending
    });
    
    // Enhanced tracking for survival master quest with segments
    const survivalSegments = player.segments ? player.segments.length : 0;
    console.log('[QuestDebug] Survival master tracking - segments:', survivalSegments, 'timeSurvived:', timeSurvived);
    
    // Enhanced tracking for survival master quest with orbs
    const survivalMasterOrbsCount = player.normalorbsEaten || 0;
    console.log('[QuestDebug] Survival master tracking - segments:', survivalSegments, 'orbsCollected:', survivalMasterOrbsCount, 'timeSurvived:', timeSurvived, 'kills:', player.kills || 0, 'boostTime:', totalBoostTimeUsed / 1000);
    
    questTracker.updateProgress(address, 'survival_master_epic', {
      survivalTime: timeSurvived,
      segments: survivalSegments,
      kills: player.kills || 0,
      orbsCollected: survivalMasterOrbsCount,
      boostTime: totalBoostTimeUsed / 1000
    });
    
    // Always track segments, orbs, and other criteria for perfect game quest
    const perfectGameSegments = player.segments ? player.segments.length : 0;
    const perfectGameOrbsCount = player.normalorbsEaten || 0;
    console.log('[QuestDebug] Perfect game tracking - segments:', perfectGameSegments, 'orbsCollected:', perfectGameOrbsCount, 'ethCollected:', player.ethEarned || 0, 'kills:', player.kills || 0, 'escapePending:', escapePending);
    
    questTracker.updateProgress(address, 'perfect_game_legendary', {
      segments: perfectGameSegments,
      ethCollected: player.ethEarned || 0,
      kills: player.kills || 0,
      orbsCollected: perfectGameOrbsCount,
      escaped: escapePending
    });
    
    // Enhanced tracking for orb efficiency quest
    const orbEfficiencyCount = player.normalorbsEaten || 0;
    console.log('[QuestDebug] Orb efficiency tracking - orbsCollected:', orbEfficiencyCount, 'timeElapsed:', timeSurvived);
    
    questTracker.updateProgress(address, 'orb_efficiency_common', {
      orbsCollected: orbEfficiencyCount,
      timeElapsed: timeSurvived
    });
    
    // Enhanced tracking for moving orbs
    const movingOrbsCount = player.movingOrbsEaten || 0;
    console.log('[QuestDebug] Moving orbs count:', movingOrbsCount);
    questTracker.updateProgress(address, 'moving_orb_hunter_rare', {
      movingOrbsCollected: movingOrbsCount,
      survivalTime: timeSurvived
    });
    
    // Enhanced tracking for orb streak quest
    const orbStreakCount = player.normalorbsEaten || 0;
    console.log('[QuestDebug] Orb streak tracking - orbsCollected:', orbStreakCount, 'timeElapsed:', timeSurvived, 'boostUsed:', boostActive);
    
    questTracker.updateProgress(address, 'orb_streak_epic', {
      orbsCollected: orbStreakCount,
      timeElapsed: timeSurvived,
      boostUsed: boostActive
    });
    
    // Enhanced tracking for ETH efficiency quest
    const ethOrbsCount = player.ethOrbsEaten || 0;
    console.log('[QuestDebug] ETH efficiency tracking - ethOrbsCollected:', ethOrbsCount, 'timeElapsed:', timeSurvived);
    
    questTracker.updateProgress(address, 'eth_efficiency_common', {
      ethOrbsCollected: ethOrbsCount,
      timeElapsed: timeSurvived
    });
    
    // Enhanced tracking for ETH streak quest
    console.log('[QuestDebug] ETH streak tracking - ethOrbsCollected:', ethOrbsCount, 'survivalTime:', timeSurvived);
    
    questTracker.updateProgress(address, 'eth_streak_rare', {
      ethOrbsCollected: ethOrbsCount,
      survivalTime: timeSurvived
    });
    
    // Enhanced tracking for ETH mastery quest with segments
    const ethMasterySegments = player.segments ? player.segments.length : 0;
    console.log('[QuestDebug] ETH mastery tracking - segments:', ethMasterySegments, 'ethOrbsCollected:', player.ethOrbsEaten || 0);
    
    questTracker.updateProgress(address, 'eth_mastery_epic', {
      ethOrbsCollected: player.ethOrbsEaten || 0,
      segments: ethMasterySegments
    });
    
    // Always track ETH orbs and ETH total for eth_legend_legendary quest
    const ethLegendOrbsCount = player.ethOrbsEaten || 0;
    const ethLegendTotal = player.ethEarned || 0;
    console.log('[QuestDebug] ETH legend tracking - ethOrbsCollected:', ethLegendOrbsCount, 'ethTotal:', ethLegendTotal, 'escapePending:', escapePending);
    
    questTracker.updateProgress(address, 'eth_legend_legendary', {
      ethOrbsCollected: ethLegendOrbsCount,
      ethTotal: ethLegendTotal,
      escaped: escapePending
    });
    
    // Always track ETH orbs and ETH total for eth_god_ultra quest
    const ethGodOrbsCount = player.ethOrbsEaten || 0;
    const ethGodTotal = player.ethEarned || 0;
    console.log('[QuestDebug] ETH god tracking - ethOrbsCollected:', ethGodOrbsCount, 'ethTotal:', ethGodTotal, 'escapePending:', escapePending);
    
    questTracker.updateProgress(address, 'eth_god_ultra', {
      ethOrbsCollected: ethGodOrbsCount,
      ethTotal: ethGodTotal,
      escaped: escapePending
    });
    
    questTracker.updateProgress(address, 'first_blood_common', {
      kills: player.kills || 0,
      timeElapsed: timeSurvived
    });
    
    questTracker.updateProgress(address, 'kill_streak_rare', {
      kills: player.kills || 0,
      timeElapsed: timeSurvived
    });
    
    // Enhanced tracking for assassin epic quest with orbs
    const assassinOrbsCount = player.normalorbsEaten || 0;
    console.log('[QuestDebug] Assassin tracking - kills:', player.kills || 0, 'orbsCollected:', assassinOrbsCount);
    
    questTracker.updateProgress(address, 'assassin_epic', {
      kills: player.kills || 0,
      orbsCollected: assassinOrbsCount
    });
    
    // Always track segments and kills for warlord quest
    const warlordSegments = player.segments ? player.segments.length : 0;
    console.log('[QuestDebug] Warlord tracking - segments:', warlordSegments, 'kills:', player.kills || 0, 'escapePending:', escapePending);
    
    questTracker.updateProgress(address, 'warlord_legendary', {
      kills: player.kills || 0,
      segments: warlordSegments,
      escaped: escapePending
    });
    
    // Enhanced tracking for death bringer quest with segments
    const deathBringerSegments = player.segments ? player.segments.length : 0;
    console.log('[QuestDebug] Death bringer tracking - segments:', deathBringerSegments, 'kills:', player.kills || 0);
    
    questTracker.updateProgress(address, 'death_bringer_ultra', {
      kills: player.kills || 0,
      segments: deathBringerSegments
    });
    
    // Enhanced tracking for endurance common quest with ETH orbs and normal orbs
    const enduranceEthOrbsCount = player.ethOrbsEaten || 0;
    const enduranceOrbsCount = player.normalorbsEaten || 0;
    console.log('[QuestDebug] Endurance tracking - survivalTime:', timeSurvived, 'orbsCollected:', enduranceOrbsCount, 'ethOrbsCollected:', enduranceEthOrbsCount, 'boostTime:', totalBoostTimeUsed / 1000);
    
    questTracker.updateProgress(address, 'endurance_common', {
      survivalTime: timeSurvived,
      orbsCollected: enduranceOrbsCount,
      ethOrbsCollected: enduranceEthOrbsCount,
      boostTime: totalBoostTimeUsed / 1000
    });
    
    // Enhanced tracking for survival expert quest with segments
    const survivalExpertSegments = player.segments ? player.segments.length : 0;
    console.log('[QuestDebug] Survival expert tracking - segments:', survivalExpertSegments, 'timeSurvived:', timeSurvived);
    
    questTracker.updateProgress(address, 'survival_expert_rare', {
      survivalTime: timeSurvived,
      segments: survivalExpertSegments
    });
    
    // Enhanced tracking for immortal epic quest with ETH orbs and normal orbs
    const immortalEthOrbsCount = player.ethOrbsEaten || 0;
    const immortalOrbsCount = player.normalorbsEaten || 0;
    console.log('[QuestDebug] Immortal tracking - survivalTime:', timeSurvived, 'orbsCollected:', immortalOrbsCount, 'ethOrbsCollected:', immortalEthOrbsCount);
    
    questTracker.updateProgress(address, 'immortal_epic', {
      survivalTime: timeSurvived,
      orbsCollected: immortalOrbsCount,
      ethOrbsCollected: immortalEthOrbsCount
    });
    
    // Always track segments and survival time for eternal quest
    const eternalSegments = player.segments ? player.segments.length : 0;
    console.log('[QuestDebug] Eternal tracking - segments:', eternalSegments, 'timeSurvived:', timeSurvived, 'escapePending:', escapePending);
    
    questTracker.updateProgress(address, 'eternal_legendary', {
      survivalTime: timeSurvived,
      segments: eternalSegments,
      escaped: escapePending
    });
    
    // Enhanced tracking for time lord quest with segments
    const timeLordSegments = player.segments ? player.segments.length : 0;
    console.log('[QuestDebug] Time lord tracking - segments:', timeLordSegments, 'timeSurvived:', timeSurvived);
    
    questTracker.updateProgress(address, 'time_lord_ultra', {
      survivalTime: timeSurvived,
      segments: timeLordSegments
    });
  };

  // Update multi-game quests: add only the stats gained in the current game
  const updateMultiGameQuests = () => {
    if (!questTracker || !gameState || !gameState.players || !address) return;
    const playerId = Object.keys(gameState.players).find(
      id => gameState.players[id].wallet?.toLowerCase() === (address?.toLowerCase() || "0x0000000000000000000000000000000000000000")
    );
    if (!playerId || !gameState.players[playerId]) return;
    const player = gameState.players[playerId];
    // LOG: Show what deltas are being sent to questTracker
    const deltaKills = (player.kills || 0) - (prevStatsRef.current.kills || 0);
    const deltaOrbs = (player.normalOrbsEaten || 0) - (prevStatsRef.current.normalOrbsEaten || 0);    const deltaEthOrbs = (player.ethOrbsEaten || 0) - (prevStatsRef.current.ethOrbsEaten || 0);
    const deltaTime = (timeSurvived || 0) - (prevStatsRef.current.timeSurvived || 0);
    console.log('[QuestDebug] updateMultiGameQuests', {
      deltaKills, deltaOrbs, deltaEthOrbs, deltaTime
    });
    
    // Only add positive deltas
    const addKills = deltaKills > 0 ? deltaKills : 0;
    const addOrbs = deltaOrbs > 0 ? deltaOrbs : 0;
    const addEthOrbs = deltaEthOrbs > 0 ? deltaEthOrbs : 0;
    const addTime = deltaTime > 0 ? deltaTime : 0;

    // Daily quests
    questTracker.updateProgress(address, 'daily_killer_common', {
      kills: (questTracker.getPlayerProgress(address)['daily_killer_common']?.kills || 0) + addKills
    });
    questTracker.updateProgress(address, 'daily_orb_collector_rare', {
      orbsCollected: (questTracker.getPlayerProgress(address)['daily_orb_collector_rare']?.orbsCollected || 0) + addOrbs
    });
    questTracker.updateProgress(address, 'daily_eth_hunter_epic', {
      ethOrbsCollected: (questTracker.getPlayerProgress(address)['daily_eth_hunter_epic']?.ethOrbsCollected || 0) + addEthOrbs
    });
    questTracker.updateProgress(address, 'daily_survivor_legendary', {
      survivalTime: (questTracker.getPlayerProgress(address)['daily_survivor_legendary']?.survivalTime || 0) + addTime
    });
    
    // Weekly quests
    questTracker.updateProgress(address, 'weekly_massacre_common', {
      kills: (questTracker.getPlayerProgress(address)['weekly_massacre_common']?.kills || 0) + addKills
    });
    questTracker.updateProgress(address, 'weekly_orb_master_rare', {
      orbsCollected: (questTracker.getPlayerProgress(address)['weekly_orb_master_rare']?.orbsCollected || 0) + addOrbs
    });
    questTracker.updateProgress(address, 'weekly_eth_legend_epic', {
      ethOrbsCollected: (questTracker.getPlayerProgress(address)['weekly_eth_legend_epic']?.ethOrbsCollected || 0) + addEthOrbs
    });
    questTracker.updateProgress(address, 'weekly_immortal_legendary', {
      survivalTime: (questTracker.getPlayerProgress(address)['weekly_immortal_legendary']?.survivalTime || 0) + addTime
    });
    questTracker.updateProgress(address, 'weekly_escape_artist_rare', {
      escapes: (questTracker.getPlayerProgress(address)['weekly_escape_artist_rare']?.escapes || 0) + (escapePending ? 1 : 0)
    });
    
    // Monthly quests
    questTracker.updateProgress(address, 'monthly_genocide_common', {
      kills: (questTracker.getPlayerProgress(address)['monthly_genocide_common']?.kills || 0) + addKills
    });
    questTracker.updateProgress(address, 'monthly_orb_god_rare', {
      orbsCollected: (questTracker.getPlayerProgress(address)['monthly_orb_god_rare']?.orbsCollected || 0) + addOrbs
    });
    questTracker.updateProgress(address, 'monthly_eth_emperor_epic', {
      ethOrbsCollected: (questTracker.getPlayerProgress(address)['monthly_eth_emperor_epic']?.ethOrbsCollected || 0) + addEthOrbs
    });
    questTracker.updateProgress(address, 'monthly_time_master_legendary', {
      survivalTime: (questTracker.getPlayerProgress(address)['monthly_time_master_legendary']?.survivalTime || 0) + addTime
    });
    questTracker.updateProgress(address, 'monthly_survivor_epic', {
      survivalTime: (questTracker.getPlayerProgress(address)['monthly_survivor_epic']?.survivalTime || 0) + addTime
    });
    
    // Persistent quests
    questTracker.updateProgress(address, 'persistent_killer_common', {
      kills: (questTracker.getPlayerProgress(address)['persistent_killer_common']?.kills || 0) + addKills
    });
    questTracker.updateProgress(address, 'persistent_collector_rare', {
      orbsCollected: (questTracker.getPlayerProgress(address)['persistent_collector_rare']?.orbsCollected || 0) + addOrbs
    });
    questTracker.updateProgress(address, 'persistent_eth_hunter_epic', {
      ethOrbsCollected: (questTracker.getPlayerProgress(address)['persistent_eth_hunter_epic']?.ethOrbsCollected || 0) + addEthOrbs
    });
    questTracker.updateProgress(address, 'persistent_survivor_legendary', {
      survivalTime: (questTracker.getPlayerProgress(address)['persistent_survivor_legendary']?.survivalTime || 0) + addTime
    });
    questTracker.updateProgress(address, 'persistent_escape_artist_ultra', {
      escapes: (questTracker.getPlayerProgress(address)['persistent_escape_artist_ultra']?.escapes || 0) + (escapePending ? 1 : 0)
    });
    // New multi-game speed/boost quests
    questTracker.updateProgress(address, 'persistent_speed_demon_rare', {
      boostTime: (questTracker.getPlayerProgress(address)['persistent_speed_demon_rare']?.boostTime || 0) + (totalBoostTimeUsed / 1000)
    });
    questTracker.updateProgress(address, 'persistent_speed_master_legendary', {
      boostTime: (questTracker.getPlayerProgress(address)['persistent_speed_master_legendary']?.boostTime || 0) + (totalBoostTimeUsed / 1000)
    });
    // New multi-game ETH orb quests
    questTracker.updateProgress(address, 'persistent_eth_collector_rare', {
      ethOrbsCollected: (questTracker.getPlayerProgress(address)['persistent_eth_collector_rare']?.ethOrbsCollected || 0) + addEthOrbs
    });
    questTracker.updateProgress(address, 'persistent_eth_master_legendary', {
      ethOrbsCollected: (questTracker.getPlayerProgress(address)['persistent_eth_master_legendary']?.ethOrbsCollected || 0) + addEthOrbs
    });
    // Death quests
    questTracker.updateProgress(address, 'death_counter_common', {
      deaths: (questTracker.getPlayerProgress(address)['death_counter_common']?.deaths || 0) + (isDead ? 1 : 0)
    });
    questTracker.updateProgress(address, 'death_counter_rare', {
      deaths: (questTracker.getPlayerProgress(address)['death_counter_rare']?.deaths || 0) + (isDead ? 1 : 0)
    });
    questTracker.updateProgress(address, 'death_counter_epic', {
      deaths: (questTracker.getPlayerProgress(address)['death_counter_epic']?.deaths || 0) + (isDead ? 1 : 0)
    });
    questTracker.updateProgress(address, 'death_counter_legendary', {
      deaths: (questTracker.getPlayerProgress(address)['death_counter_legendary']?.deaths || 0) + (isDead ? 1 : 0)
    });
    questTracker.updateProgress(address, 'death_counter_ultra', {
      deaths: (questTracker.getPlayerProgress(address)['death_counter_ultra']?.deaths || 0) + (isDead ? 1 : 0)
    });

    // Update prevStatsRef for next delta calculation
    prevStatsRef.current = {
      kills: player.kills || 0,
      orbsEaten: player.normalorbsEaten,
      ethOrbsEaten: player.ethOrbsEaten || 0,
      timeSurvived: timeSurvived || 0,
    };
  };

  // Check for quest completions (for both single-game and multi-game quests, anytime)
  const checkQuestCompletions = () => {
    if (!questTracker || !address) return;
    const allQuests = questTracker.quests;
    const newlyCompleted = [];
    
    // Enhanced debug logging for quest completions
    console.log('[QuestDebug] Checking for quest completions...');
    
    // Debug: Log current stats
    if (gameState && gameState.players) {
      const playerId = Object.keys(gameState.players).find(
        id => gameState.players[id].wallet?.toLowerCase() === (address?.toLowerCase() || "0x0000000000000000000000000000000000000000")
      );
      if (playerId && gameState.players[playerId]) {
        const player = gameState.players[playerId];
        console.log('[QuestDebug] Current player stats:', {
          timeSurvived,
          kills: player.kills || 0,
          orbsEaten: player.normalorbsEaten || 0,
          ethOrbsEaten: player.ethOrbsEaten || 0,
          segments: player.segments ? player.segments.length : 0,
          ethEarned: player.ethEarned || 0,
          boostTime: totalBoostTimeUsed / 1000,
          escapePending
        });
      }
    }
    
    // Check each quest for completion
    allQuests.forEach(quest => {
      // Get current progress for this quest
      const progress = questTracker.getPlayerProgress(address)[quest.id];
      const isAlreadyCompleted = questTracker.isQuestCompleted(address, quest.id);
      
      // Log progress for ETH-related quests
      if (quest.id.includes('eth_')) {
        console.log(`[QuestDebug] ETH Quest ${quest.id} progress:`, progress);
      }
      
      // Log progress for orb-related quests
      if (quest.id.includes('orb_') || quest.criteria?.orbsCollected) {
        console.log(`[QuestDebug] Orb Quest ${quest.id} progress:`, progress);
      }
      
      // Check if quest is completed but not marked as completed yet
      if (!isAlreadyCompleted && questTracker.checkQuestCompletion(address, quest.id)) {
        console.log(`[QuestDebug] Quest ${quest.id} (${quest.title}) COMPLETED! Marking as completed.`);
        questTracker.markQuestCompleted(address, quest.id);
        newlyCompleted.push(quest);
        // Track session completions
        setSessionCompletedQuests(prev => new Set([...prev, quest.id]));
      }
    });
    
    // Show notifications for newly completed quests
    if (newlyCompleted.length > 0) {
      console.log(`[QuestDebug] ${newlyCompleted.length} new quests completed:`, newlyCompleted.map(q => q.id));
      newlyCompleted.forEach(quest => {
        setQuestNotifications(prev => [...prev, {
          id: Date.now() + Math.random(),
          quest: quest.title,
          message: `🎯 Quest Completed: ${quest.title}! +${quest.reward.toLocaleString()} SP`,
          timestamp: Date.now(),
          reward: quest.reward
        }]);
      });
    }
  };

  // Quest cycling functions
  const getQuestsSortedByProgress = () => {
    if (!questTracker || !address) return [];
    
    const allQuests = questTracker.getAllQuests();
    const questsWithProgress = allQuests
      .filter(quest => !questTracker.isQuestCompleted(address, quest.id))
      .map(quest => {
        const progress = questTracker.getQuestProgress(address, quest.id);
        return { ...quest, progress };
      })
      .sort((a, b) => (b.progress?.percentage || 0) - (a.progress?.percentage || 0));
    
    return questsWithProgress;
  };

  const cycleToNextQuest = () => {
    const sortedQuests = getQuestsSortedByProgress();
    if (sortedQuests.length === 0) return;
    
    setCurrentQuestIndex(prev => {
      const nextIndex = (prev + 1) % Math.min(sortedQuests.length, 5);
      return nextIndex;
    });
  };

  const handleQuestTitleClick = () => {
    playClick();
    cycleToNextQuest();
  };

  // Add global functions for testing quest progress
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.checkQuestProgress = () => {
        if (!questTracker || !address) {
          console.log('❌ Quest tracker or address not available');
          return;
        }
        
        const allQuests = questTracker.getAllQuests();
        console.log('📊 Quest Progress Report:');
        
        allQuests.forEach(quest => {
          const progress = questTracker.getQuestProgress(address, quest.id);
          const completed = questTracker.isQuestCompleted(address, quest.id);
          const claimed = questTracker.isQuestClaimed(address, quest.id);
          
          console.log(`${quest.title} (${quest.rarity}):`, {
            progress: progress?.percentage || 0,
            completed,
            claimed,
            requirements: quest.requirements,
            current: progress
          });
        });
      };
      
      window.resetAllQuests = () => {
        if (!questTracker || !address) {
          console.log('❌ Quest tracker or address not available');
          return;
        }
        
        // Clear all quest data
        localStorage.removeItem(`questProgress_${address}`);
        localStorage.removeItem(`completedQuests_${address}`);
        localStorage.removeItem(`claimedQuests_${address}`);
        localStorage.removeItem(`claimedSPRewards_${address}`);
        
        // Reload quest tracker
        questTracker.loadFromStorage();
        console.log('🔄 All quests reset!');
      };
    }
  }, [questTracker, address]);

  // --- QUEST PROGRESS UPDATE LOGIC REFACTOR END ---

  // Reset boost free time after cooldown
  useEffect(() => {
    console.log('[BOOST] useEffect triggered - boostCooldown:', boostCooldown, 'boostActive:', boostActive, 'boostInitialized:', boostInitializedRef.current, 'boostFreeTimeRemaining:', boostFreeTimeRemaining);
    if (boostCooldown === 0 && !boostActive && boostInitializedRef.current && boostFreeTimeRemaining === 0) {
      // Only reset after cooldown finishes AND boost was previously initialized AND boost ran out naturally
      // This prevents resetting when boost is manually stopped
      console.log('[BOOST] Resetting boost after cooldown. Setting boostFreeTimeRemaining to', BOOST_FREE_DURATION);
      setBoostFreeTimeRemainingWithLog(BOOST_FREE_DURATION);
      console.log('[BOOST] Setting boostInitialized to false (after cooldown)');
      boostInitializedRef.current = false; // Reset for next boost cycle
    }
  }, [boostCooldown, boostActive, boostFreeTimeRemaining]);

  // Check for Escape Artist achievement when successfully escaping
  useEffect(() => {
    if (escapePending && !achievementNotificationShownRef.current['Escape Artist']) {
      try {
        console.log('🎯 Quick check: Escape Artist achievement condition met!');
        // Mark as achieved to prevent multiple notifications
        setSessionAchievements(prev => ({ ...prev, ['Escape Artist']: true }));
        // Mark as shown to prevent duplicate notifications
        achievementNotificationShownRef.current['Escape Artist'] = true;
        updateAchievement('Escape Artist', true);
        setAchievementSP(prev => prev + 2000);
        
        // Add notification with correct achievement name for image lookup
        setAchievementNotifications(prev => [...prev, {
          id: Date.now() + Math.random(),
          achievement: 'Escape Artist',
          message: 'Escape Artist Achievement Unlocked! +2000 SP',
          timestamp: Date.now()
        }]);
        setTimeout(() => playAchievementSound(), 50);
      } catch (err) {
        console.error('Error processing Escape Artist achievement:', err);
      }
    }
  }, [escapePending]);

  // Achievement tracking logic
  const lastAchievementCheckRef = useRef(0);
  const achievementCheckCountRef = useRef(0); // Track how many achievement checks have been performed
  
  // Enhanced achievement sound playback function with additional error handling
  const playAchievementSound = useCallback(() => {
    try {
      console.log('🔊 playAchievementSound called', { 
        soundRef: !!achievementSound.current, 
        volume,
        muted: achievementSound.current?.muted
      });
      
      if (achievementSound.current) {
        try {
          // Force reload the sound to ensure it plays
          const originalSrc = achievementSound.current.src;
          achievementSound.current.src = '';
          achievementSound.current.src = originalSrc;
          
          // Reset properties
          achievementSound.current.currentTime = 0;
          achievementSound.current.volume = volume * 0.6; // Increase volume
          achievementSound.current.muted = false;
          
          // Try to play the sound with fallbacks
          try {
            console.log('🔊 Attempting to play achievement sound...');
            const playPromise = achievementSound.current.play();
            
            if (playPromise !== undefined) {
              playPromise
                .then(() => console.log('🔊 Achievement sound played successfully'))
                .catch(e => {
                  console.error("🔊 Failed to play achievement sound:", e);
                  
                  try {
                    // Create and play a new audio element as fallback
                    console.log('🔊 Trying fallback audio element...');
                    const tempAudio = new Audio('/sounds/acheivement.mp3');
                    tempAudio.volume = volume * 0.6;
                    tempAudio.play()
                      .then(() => console.log('🔊 Fallback achievement sound played'))
                      .catch(err => console.error('🔊 Fallback also failed:', err));
                  } catch (err) {
                    console.error('Error creating fallback audio:', err);
                  }
                  
                  try {
                    // Also try to play on next user interaction
                    const playOnNextClick = () => {
                      try {
                        if (achievementSound.current) {
                          achievementSound.current.play()
                            .then(() => {
                              console.log('🔊 Achievement sound played on user interaction');
                              document.removeEventListener('click', playOnNextClick);
                            })
                            .catch(err => console.error('🔊 Still failed to play sound:', err));
                        }
                      } catch (clickErr) {
                        console.error('Error in click handler:', clickErr);
                      }
                    };
                    document.addEventListener('click', playOnNextClick, { once: true });
                  } catch (handlerErr) {
                    console.error('Error setting up click handler:', handlerErr);
                  }
                });
            } else {
              console.warn('🔊 Achievement sound play() did not return a promise');
              
              // Try alternative method
              setTimeout(() => {
                try {
                  if (achievementSound.current) {
                    achievementSound.current.play();
                    console.log('🔊 Tried alternative play method');
                  }
                } catch (timeoutErr) {
                  console.error('Error in timeout callback:', timeoutErr);
                }
              }, 100);
            }
          } catch (playErr) {
            console.error('🔊 Error trying to play achievement sound:', playErr);
          }
        } catch (audioSetupErr) {
          console.error('Error setting up audio:', audioSetupErr);
        }
      } else {
        console.error('🔊 Achievement sound ref is null or undefined');
        
        // Create temporary audio element as fallback
        try {
          const tempAudio = new Audio('/sounds/acheivement.mp3');
          tempAudio.volume = volume * 0.6;
          tempAudio.play()
            .then(() => console.log('🔊 Temporary achievement sound played'))
            .catch(err => console.error('🔊 Temporary audio failed:', err));
        } catch (tempAudioErr) {
          console.error('🔊 Failed to create temporary audio:', tempAudioErr);
        }
      }
    } catch (outerErr) {
      // Catch any unexpected errors at the top level
      console.error('🔊 Unexpected error in achievement sound playback:', outerErr);
    }
  }, [volume]);
  
  useEffect(() => {
    console.log('ACHIEVEMENT CHECK - gameState:', !!gameState, 'players:', !!gameState?.players);
    
    if (!gameState || !gameState.players) return;
    
    // Debug achievement sound element
    console.log('🔊 Achievement Sound Element Status:', {
      exists: !!achievementSound.current,
      readyState: achievementSound.current?.readyState,
      paused: achievementSound.current?.paused,
      muted: achievementSound.current?.muted,
      volume: achievementSound.current?.volume,
      src: achievementSound.current?.src
    });
    
    // Throttle achievement checks to once per second maximum
    const now = Date.now();
    if (now - lastAchievementCheckRef.current < 300) { // Further reduced throttle to 300ms for more responsive achievements
      return;
    }
    achievementCheckCountRef.current++;
    console.log(`ACHIEVEMENT CHECK - RUNNING FULL CHECK #${achievementCheckCountRef.current}`);
    lastAchievementCheckRef.current = now;

    let newAchievementSP = achievementSP; // <-- Fix: declare and initialize

    console.log('ACHIEVEMENT CHECK - Looking for player with address:', address);
    console.log('ACHIEVEMENT CHECK - Available players:', Object.keys(gameState.players).map(id => ({
      id,
      wallet: gameState.players[id].wallet
    })));
    
    const playerId = Object.keys(gameState.players).find(
      id => gameState.players[id].wallet?.toLowerCase() === (address?.toLowerCase() || "0x0000000000000000000000000000000000000000")
    );
    
    console.log('ACHIEVEMENT CHECK - Found playerId:', playerId);

    // If player not found in gameState, preserve existing achievements
    if (!playerId || !gameState.players[playerId]) {
      console.log('Player not found in gameState, preserving session achievements:', sessionAchievements);
      console.log('Player not found in gameState, preserving lifetime achievements:', achievements);
      return;
    }

    const player = gameState.players[playerId];

    // Debug: Log player data for achievement tracking
    console.log('Achievement tracking debug:', {
      playerId,
      playerData: player,
      orbsEaten: player.normalorbsEaten,
      movingOrbsEaten: player.movingOrbsEaten,
      kills: player.kills,
      timeSurvived,
      boostCount,
      totalBoostTimeUsed,
      speed: player.speed,
      escapePending,
      isDead,
      currentSessionAchievements: sessionAchievements,
      currentLifetimeAchievements: achievements,
      achievementSP,
      lastKilledPlayerSegments
    });
    
    // Check if conditions are met for each achievement
    console.log('Achievement conditions check:');
    console.log('Orb Hunter:', player.normalorbsEaten >= 50 && timeSurvived <= 120, 'Has session achievement:', !!sessionAchievements['Orb Hunter'], 'Has lifetime achievement:', !!achievements['Orb Hunter']);
    console.log('Killer Instinct:', kills >= 3 && timeSurvived <= 300, 'Has session achievement:', !!sessionAchievements['Killer Instinct'], 'Has lifetime achievement:', !!achievements['Killer Instinct']);
    console.log('Moving Orb Master:', player.movingOrbsEaten >= 20 && timeSurvived <= 240, 'Has session achievement:', !!sessionAchievements['Moving Orb Master'], 'Has lifetime achievement:', !!achievements['Moving Orb Master']);
    console.log('Speed Demon:', totalBoostTimeUsed >= 25000, 'Has session achievement:', !!sessionAchievements['Speed Demon'], 'Has lifetime achievement:', !!achievements['Speed Demon']);
    console.log('Speed Runner:', escapePending && timeSurvived <= 120, 'Has session achievement:', !!sessionAchievements['Speed Runner'], 'Has lifetime achievement:', !!achievements['Speed Runner']);
    console.log('Orb Chain:', player.normalorbsEaten >= 10 && timeSurvived <= 30, 'Has session achievement:', !!sessionAchievements['Orb Chain'], 'Has lifetime achievement:', !!achievements['Orb Chain']);
    console.log('Endurance:', timeSurvived >= 1200, 'Has session achievement:', !!sessionAchievements['Endurance'], 'Has lifetime achievement:', !!achievements['Endurance']);
    console.log('Giant Slayer:', lastKilledPlayerSegments >= 35, 'Has session achievement:', !!sessionAchievements['Giant Slayer'], 'Has lifetime achievement:', !!achievements['Giant Slayer']);

    // Orb Hunter - Collect 50 orbs within 2 minutes
    console.log('🔍 Checking Orb Hunter achievement:', {
      normalOrbsEaten: player.normalOrbsEaten,
      normalorbsEaten: player.normalorbsEaten, // Check both possible property names
      timeSurvived,
      hasAchievement: sessionAchievements['Orb Hunter'],
      meetsCondition: (player.normalOrbsEaten || player.normalorbsEaten || 0) >= 50 && timeSurvived <= 120
    });
    // Fix: Check both possible property names
    const normalOrbsCount = player.normalOrbsEaten || player.normalorbsEaten || 0;
    if (normalOrbsCount >= 50 && timeSurvived <= 120 && !sessionAchievements['Orb Hunter'] && !achievementNotificationShownRef.current['Orb Hunter']) {
      console.log('Orb Hunter achievement triggered!');
      setSessionAchievements(prev => ({ ...prev, ['Orb Hunter']: true }));
      achievementNotificationShownRef.current['Orb Hunter'] = true;
      try {
        updateAchievement('Orb Hunter', true);
      } catch (err) {
        console.error('Failed to update achievement:', err);
      }
      newAchievementSP += 2000;
      setAchievementNotifications(prev => [...prev, {
        id: Date.now() + 1,
        achievement: 'Orb Hunter',
        message: 'Orb Hunter Achievement Unlocked! +2000 SP',
        timestamp: Date.now()
      }]);
      // Play achievement sound
      try {
        playAchievementSound();
      } catch (err) {
        console.error('Failed to play achievement sound:', err);
      }
    }

    // Killer Instinct - Get 3 kills within 5 minutes
    if (kills >= 3 && timeSurvived <= 300 && !sessionAchievements['Killer Instinct'] && !achievementNotificationShownRef.current['Killer Instinct']) {
      console.log('Killer Instinct achievement triggered!');
      setSessionAchievements(prev => ({ ...prev, ['Killer Instinct']: true }));
      achievementNotificationShownRef.current['Killer Instinct'] = true;
      try {
        updateAchievement('Killer Instinct', true);
      } catch (err) {
        console.error('Failed to update achievement:', err);
      }
      newAchievementSP += 2000;
      setAchievementNotifications(prev => [...prev, {
        id: Date.now() + 3,
        achievement: 'Killer Instinct',
        message: 'Killer Instinct Achievement Unlocked! +2000 SP',
        timestamp: Date.now()
      }]);
      // Play achievement sound
      try {
        playAchievementSound();
      } catch (err) {
        console.error('Failed to play achievement sound:', err);
      }
    }

    // Moving Orb Master - Collect 20 moving orbs within 4 minutes
    console.log('🔍 Checking Moving Orb Master achievement:', {
      movingOrbsEaten: player.movingOrbsEaten,
      movingorbsEaten: player.movingorbsEaten, // Check both possible property names
      timeSurvived,
      hasAchievement: sessionAchievements['Moving Orb Master'],
      meetsCondition: (player.movingOrbsEaten || player.movingorbsEaten || 0) >= 20 && timeSurvived <= 240
    });
    // Fix: Check both possible property names
    const movingOrbsCount = player.movingOrbsEaten || player.movingorbsEaten || 0;
    if (movingOrbsCount >= 20 && timeSurvived <= 240 && !sessionAchievements['Moving Orb Master'] && !achievementNotificationShownRef.current['Moving Orb Master']) {
      console.log('Moving Orb Master achievement triggered!');
      setSessionAchievements(prev => ({ ...prev, ['Moving Orb Master']: true }));
      achievementNotificationShownRef.current['Moving Orb Master'] = true;
      try {
        updateAchievement('Moving Orb Master', true);
      } catch (err) {
        console.error('Failed to update achievement:', err);
      }
      newAchievementSP += 2000;
      setAchievementNotifications(prev => [...prev, {
        id: Date.now() + 4,
        achievement: 'Moving Orb Master',
        message: 'Moving Orb Master Achievement Unlocked! +2000 SP',
        timestamp: Date.now()
      }]);
      // Play achievement sound
      try {
        playAchievementSound();
      } catch (err) {
        console.error('Failed to play achievement sound:', err);
      }
    }

    // Escape Artist - Escape with 25+ segments, 0.02+ ETH, 2+ kills, 50+ orbs, and no deaths
    if (escapePending && !sessionAchievements['Escape Artist'] && !achievementNotificationShownRef.current['Escape Artist']) {
      const playerSegments = player.segments ? player.segments.length : 0;
      const playerEthEarned = player.ethEarned || 0;
      if (
        playerSegments >= 25 &&
        playerEthEarned >= 0.02 &&
        kills >= 2 &&
        player.normalorbsEaten >= 50 &&
        !isDead
      ) {
        console.log('Escape Artist achievement triggered!');
        setSessionAchievements(prev => ({ ...prev, ['Escape Artist']: true }));
        achievementNotificationShownRef.current['Escape Artist'] = true;
        try {
          updateAchievement('Escape Artist', true);
        } catch (err) {
          console.error('Failed to update achievement:', err);
        }
        newAchievementSP += 2000;
        setAchievementNotifications(prev => [...prev, {
          id: Date.now() + 5,
          achievement: 'Escape Artist',
          message: 'Escape Artist Achievement Unlocked! +2000 SP',
          timestamp: Date.now()
        }]);
        // Play achievement sound
        try {
          playAchievementSound();
        } catch (err) {
          console.error('Failed to play achievement sound:', err);
        }
      }
    }

    // Giant Slayer - Kill a player with 35+ segments
    if (
      lastKilledPlayerSegments !== null &&
      lastKilledPlayerSegments >= 35 &&
      !sessionAchievements['Giant Slayer'] &&
      !achievementNotificationShownRef.current['Giant Slayer']
    ) {
      console.log('Giant Slayer achievement triggered!');
      setSessionAchievements(prev => ({ ...prev, ['Giant Slayer']: true }));
      achievementNotificationShownRef.current['Giant Slayer'] = true;
      try {
        updateAchievement('Giant Slayer', true);
      } catch (err) {
        console.error('Failed to update achievement:', err);
      }
      newAchievementSP += 2000;
      setAchievementNotifications(prev => [...prev, {
        id: Date.now() + 6,
        achievement: 'Giant Slayer',
        message: 'Giant Slayer Achievement Unlocked! +2000 SP',
        timestamp: Date.now()
      }]);
      // Play achievement sound
      try {
        playAchievementSound();
      } catch (err) {
        console.error('Failed to play achievement sound:', err);
      }
    }

    // Speed Demon - Boost for 25 seconds total in a single game
    if (totalBoostTimeUsed >= 25000 && !sessionAchievements['Speed Demon'] && !achievementNotificationShownRef.current['Speed Demon']) {
      console.log('🚀 Speed Demon achievement triggered!');
      setSessionAchievements(prev => ({ ...prev, ['Speed Demon']: true }));
      achievementNotificationShownRef.current['Speed Demon'] = true;
      try {
        updateAchievement('Speed Demon', true);
      } catch (err) {
        console.error('Failed to update achievement:', err);
      }
      newAchievementSP += 2000;
      setAchievementNotifications(prev => [
        ...prev,
        {
          id: Date.now() + Math.random(),
          achievement: 'Speed Demon',
          message: 'Speed Demon Achievement Unlocked! +2000 SP',
          timestamp: Date.now(),
        },
      ]);
      // Play achievement sound with delay to prevent overlap with boost sound
      try {
        setTimeout(() => {
          playAchievementSound();
          console.log('🔊 Playing Speed Demon achievement sound with delay');
        }, 500);
      } catch (err) {
        console.error('Failed to play achievement sound:', err);
      }
    }

    // Speed Runner - Escape within 2 minutes
    if (escapePending && timeSurvived <= 120 && !sessionAchievements['Speed Runner'] && !achievementNotificationShownRef.current['Speed Runner']) {
      console.log('🏃 Speed Runner achievement triggered!');
      setSessionAchievements(prev => ({ ...prev, ['Speed Runner']: true }));
      achievementNotificationShownRef.current['Speed Runner'] = true;
      try {
        updateAchievement('Speed Runner', true);
      } catch (err) {
        console.error('Failed to update achievement:', err);
      }
      newAchievementSP += 2000;
      setAchievementNotifications(prev => [...prev, {
        id: Date.now() + Math.random(),
        achievement: 'Speed Runner',
        message: 'Speed Runner Achievement Unlocked! +2000 SP',
        timestamp: Date.now()
      }]);
      // Play achievement sound with delay to prevent overlap with escape sound
      try {
        setTimeout(() => {
          playAchievementSound();
          console.log('🔊 Playing Speed Runner achievement sound with delay');
        }, 1000);
      } catch (err) {
        console.error('Failed to play achievement sound:', err);
      }
    }

    // Orb Chain - Collect 10 orbs within 30 seconds (simple proxy: 10 orbs in under 30s from game start)
    console.log('🔍 Checking Orb Chain achievement:', {
      normalOrbsEaten: player.normalOrbsEaten,
      normalorbsEaten: player.normalorbsEaten, // Check both possible property names
      timeSurvived,
      hasAchievement: sessionAchievements['Orb Chain'],
      meetsCondition: (player.normalOrbsEaten || player.normalorbsEaten || 0) >= 10 && timeSurvived <= 30
    });
    // Fix: Check both possible property names
    const orbChainCount = player.normalOrbsEaten || player.normalorbsEaten || 0;
    if (orbChainCount >= 10 && timeSurvived <= 30 && !sessionAchievements['Orb Chain'] && !achievementNotificationShownRef.current['Orb Chain']) {
      console.log('Orb Chain achievement triggered!');
      setSessionAchievements(prev => ({ ...prev, ['Orb Chain']: true }));
      achievementNotificationShownRef.current['Orb Chain'] = true;
      try {
        updateAchievement('Orb Chain', true);
      } catch (err) {
        console.error('Failed to update achievement:', err);
      }
      newAchievementSP += 2000;
      setAchievementNotifications(prev => [...prev, {
        id: Date.now() + 8,
        achievement: 'Orb Chain',
        message: 'Orb Chain Achievement Unlocked! +2000 SP',
        timestamp: Date.now()
      }]);
      // Play achievement sound
      try {
        playAchievementSound();
      } catch (err) {
        console.error('Failed to play achievement sound:', err);
      }
    }

    // Endurance - Survive for 20 minutes
    if (timeSurvived >= 1200 && !sessionAchievements['Endurance'] && !achievementNotificationShownRef.current['Endurance']) {
      console.log('Endurance achievement triggered!');
      setSessionAchievements(prev => ({ ...prev, ['Endurance']: true }));
      achievementNotificationShownRef.current['Endurance'] = true;
      try {
        updateAchievement('Endurance', true);
      } catch (err) {
        console.error('Failed to update achievement:', err);
      }
      newAchievementSP += 2000;
      setAchievementNotifications(prev => [...prev, {
        id: Date.now() + 9,
        achievement: 'Endurance',
        message: 'Endurance Achievement Unlocked! +2000 SP',
        timestamp: Date.now()
      }]);
      // Play achievement sound
      try {
        playAchievementSound();
      } catch (err) {
        console.error('Failed to play achievement sound:', err);
      }
    }

    // Update achievement SP if needed
    if (newAchievementSP !== achievementSP) {
      console.log('Achievement SP updated:', newAchievementSP);
      console.log('Previous Achievement SP:', achievementSP);
      
      // Update the achievement SP
      setAchievementSP(newAchievementSP);
      
      // Force achievement sound to play
      setTimeout(() => {
        try {
          playAchievementSound();
          console.log('🔊 Playing achievement sound after SP update');
        } catch (err) {
          console.error('🔊 Failed to play achievement sound after SP update:', err);
        }
      }, 100); // Small delay to ensure UI updates first
    }
  }, [gameState, timeSurvived, kills, escapePending, address, boostCount, lastKilledPlayerSegments, sessionAchievements, achievements, volume, playAchievementSound]);

  // Auto-cleanup achievement notifications after 5 seconds
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      setAchievementNotifications(prev => 
        prev.filter(notification => Date.now() - notification.timestamp < 5000)
      );
    }, 1000);

    return () => clearInterval(cleanupInterval);
  }, []);

  // Send achievement SP updates to server
  useEffect(() => {
    if (client && client.readyState === WebSocket.OPEN && achievementSP > 0) {
      client.send(JSON.stringify({
        type: 'achievementSP',
        achievementSP: achievementSP
      }));
    }
  }, [achievementSP, client]);

  // Quest tracking logic - REMOVED DUPLICATE TRACKING
  // This useEffect was causing stats to be recorded multiple times
  // Now only the interval-based tracking (below) handles quest updates properly

  // Auto-cleanup achievement notifications after 5 seconds
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      setAchievementNotifications(prev => 
        prev.filter(notification => Date.now() - notification.timestamp < 5000)
      );
    }, 1000);

    return () => clearInterval(cleanupInterval);
  }, []);

  // Auto-cleanup quest notifications after 5 seconds
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      setQuestNotifications(prev => 
        prev.filter(notification => Date.now() - notification.timestamp < 5000)
      );
    }, 1000);

    return () => clearInterval(cleanupInterval);
  }, []);

  // Reset single-game quest progress when game ends
  useEffect(() => {
    if (isDead || escapePending) {
      console.log('[QuestDebug] Resetting single-game quest progress due to:', isDead ? 'death' : 'escape');
      
      // Make sure to check all quest completions before resetting
      if (questTracker && address) {
        // Log player stats before checking completions
        const playerId = Object.keys(gameState?.players || {}).find(
          id => gameState?.players[id]?.wallet?.toLowerCase() === (address?.toLowerCase() || "0x0000000000000000000000000000000000000000")
        );
        
        if (playerId && gameState?.players[playerId]) {
          const player = gameState.players[playerId];
          console.log('[QuestDebug] Final player stats before quest completion check:', {
            ethOrbsEaten: player.ethOrbsEaten || 0,
            movingOrbsEaten: player.movingOrbsEaten || 0,
            orbsEaten: player.normalorbsEaten || 0,
            segments: player.segments ? player.segments.length : 0,
            kills: player.kills || 0,
            ethEarned: player.ethEarned || 0,
            timeSurvived
          });
        }
        
        checkQuestCompletions();
        setTimeout(() => {
          questTracker.resetSingleGameProgress(address);
        }, 1000); // Increased delay to ensure quest completions are processed first
      } else {
        questTracker.resetSingleGameProgress(address);
      }
    }
  }, [isDead, escapePending, address, questTracker, gameState, timeSurvived]);

  // Double flash effect when boost cooldown ends
  const prevBoostCooldownRef = useRef(boostCooldown);
  useEffect(() => {
    if (prevBoostCooldownRef.current > 0 && boostCooldown === 0) {
      // Double flash: set true, false, true, false in quick succession
      setSegmentLossFlash(true);
      setTimeout(() => setSegmentLossFlash(false), 100);
      setTimeout(() => setSegmentLossFlash(true), 200);
      setTimeout(() => setSegmentLossFlash(false), 350);
    }
    prevBoostCooldownRef.current = boostCooldown;
  }, [boostCooldown]);

  // Extract ETH orbs from game state
  useEffect(() => {
    if (gameState && gameState.orbs) {
      const ethOrbsFromState = gameState.orbs.filter(orb => orb.isEthOrb).map(orb => ({
        ...orb,
        velocity: orb.velocity || { x: 0, y: 0 } // Ensure velocity exists
      }));
      setEthOrbs(ethOrbsFromState);
    }
  }, [gameState]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (boostTimerRef.current) clearInterval(boostTimerRef.current);
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
      if (segmentRemovalTimerRef.current) clearInterval(segmentRemovalTimerRef.current);
      if (escapeTimerRef.current) clearInterval(escapeTimerRef.current);
    };
  }, []);

  // Play achievement sound when new achievements are unlocked
  useEffect(() => {
    console.log('ACHIEVEMENT SOUND CHECK - notifications:', achievementNotifications.length, 'sound ref:', !!achievementSound.current);
    
    if (achievementNotifications.length > 0 && achievementSound.current) {
      // Play sound for the most recent achievement
      const latestNotification = achievementNotifications[achievementNotifications.length - 1];
      console.log('ACHIEVEMENT SOUND - Latest notification:', latestNotification);
      
      if (Date.now() - latestNotification.timestamp < 1000) { // Increased time window for sound playback
        console.log('ACHIEVEMENT SOUND - Attempting to play sound');
        achievementSound.current.currentTime = 0;
        achievementSound.current.volume = volume * 0.4;
        achievementSound.current.play().catch(err => {
          console.error('ACHIEVEMENT SOUND - Error playing sound:', err);
        });
      }
    }
  }, [achievementNotifications, volume]);

  // --- BOOST CLEANUP AND ACHIEVEMENT REPORTING ---
  useEffect(() => {
    // Cleanup function for boost timers and state
    function cleanupBoost() {
      if (boostActive && client) {
        client.send(JSON.stringify({ type: 'boost', active: false }));
      }
      setBoostActive(false);
      if (freeTimeTimerRef.current) {
        clearInterval(freeTimeTimerRef.current);
        freeTimeTimerRef.current = null;
      }
      if (segmentRemovalTimerRef.current) {
        clearInterval(segmentRemovalTimerRef.current);
        segmentRemovalTimerRef.current = null;
      }
      if (cooldownTimerRef.current) {
        clearInterval(cooldownTimerRef.current);
        cooldownTimerRef.current = null;
      }
      setBoostFreeTimeRemainingWithLog(BOOST_FREE_DURATION);
      setTotalBoostTimeUsed(0);
    }

    // Cleanup on unmount, death, or escape
    return () => {
      console.log("GameScreen unmounting. Current URL:", window.location.pathname);
      cleanupBoost();
    };
    // eslint-disable-next-line
  }, []);

  // Cleanup boost on death or escape
  useEffect(() => {
    if (isDead || escapePending) {
      if (boostActive && client) {
        client.send(JSON.stringify({ type: 'boost', active: false }));
      }
      setBoostActive(false);
      if (freeTimeTimerRef.current) {
        clearInterval(freeTimeTimerRef.current);
        freeTimeTimerRef.current = null;
      }
      if (segmentRemovalTimerRef.current) {
        clearInterval(segmentRemovalTimerRef.current);
        segmentRemovalTimerRef.current = null;
      }
      if (cooldownTimerRef.current) {
        clearInterval(cooldownTimerRef.current);
        cooldownTimerRef.current = null;
      }
      setBoostFreeTimeRemainingWithLog(BOOST_FREE_DURATION);
      setTotalBoostTimeUsed(0);
    }
    // Also send latest achievementSP to server
    if ((isDead || escapePending) && client) {
      client.send(JSON.stringify({ type: 'achievementSP', achievementSP }));
    }
    // eslint-disable-next-line
  }, [isDead, escapePending]);

  // Always send achievementSP to server when it changes
  useEffect(() => {
    if (client && achievementSP > 0) {
      client.send(JSON.stringify({ type: 'achievementSP', achievementSP }));
    }
    // eslint-disable-next-line
  }, [achievementSP]);

  // Cleanup expired kill glow effects
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
          const currentTime = Date.now();
      setKillGlowEffects(prev => {
        const updated = {};
        let hasChanges = false;
        
        for (const [id, effect] of Object.entries(prev)) {
          const elapsed = currentTime - effect.startTime;
          if (elapsed < effect.duration) {
            updated[id] = effect;
          } else {
            hasChanges = true;
            console.log(`Cleaning up expired kill glow for player ${id}`);
          }
        }
        
        return hasChanges ? updated : prev;
      });
    }, 1000); // Check every second
    
    return () => clearInterval(cleanupInterval);
  }, []);

  // 1. Add state for speed bonus
  const [speedBonus, setSpeedBonus] = useState({ active: false, startTime: null, duration: null });

  // 2. Update speed bonus state from gameState
  useEffect(() => {
    if (!gameState || !gameState.players) return;
    const playerId = Object.keys(gameState.players).find(
      id => gameState.players[id].wallet?.toLowerCase() === (address?.toLowerCase() || "0x0000000000000000000000000000000000000000")
    );
    if (!playerId || !gameState.players[playerId]) return;
    const player = gameState.players[playerId];
    if (player.speedBonusActive) {
      setSpeedBonus({
        active: true,
        startTime: player.speedBonusStartTime,
        duration: player.speedBonusDuration
      });
    } else {
      setSpeedBonus({ active: false, startTime: null, duration: null });
    }
  }, [gameState, address]);

  // 3. Show on-screen message/timer if speed bonus is active
  const [speedBonusTimeLeft, setSpeedBonusTimeLeft] = useState(0);
  useEffect(() => {
    let timer;
    if (speedBonus.active && speedBonus.startTime && speedBonus.duration) {
      const update = () => {
        const now = Date.now();
        const timeLeft = Math.max(0, Math.ceil((speedBonus.startTime + speedBonus.duration - now) / 1000));
        setSpeedBonusTimeLeft(timeLeft);
      };
      update();
      timer = setInterval(update, 250);
    } else {
      setSpeedBonusTimeLeft(0);
    }
    return () => timer && clearInterval(timer);
  }, [speedBonus]);

  // Real-time timer update for timeSurvived
  useEffect(() => {
    if (!joined || isDead || showDeathScreen) return;
    
    const timer = setInterval(() => {
      if (sessionStartTime) {
        setTimeSurvived(Math.floor((Date.now() - sessionStartTime) / 1000));
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [joined, isDead, showDeathScreen, sessionStartTime]);

  // Continuous quest tracking timer
  useEffect(() => {
    if (!joined || isDead || showDeathScreen || !questTracker || !address) return;
    
    const timer = setInterval(() => {
      // Update quest progress every 500ms during gameplay
      updateSingleGameQuests();
      updateMultiGameQuests();
      checkQuestCompletions();
    }, 100);
    
    return () => clearInterval(timer);
  }, [joined, isDead, showDeathScreen, questTracker, address]);

  // Reset multi-game quest tracking when session starts
  useEffect(() => {
    if (sessionStartTime && joined && !isDead) {
      multiGameQuestsUpdatedRef.current = false;
    }
  }, [sessionStartTime, joined, isDead]);

  // This state variable is already declared at the top of the component


  // Quest cycling system
  const [currentQuestIndex, setCurrentQuestIndex] = useState(0);
  const [questList, setQuestList] = useState([]);
  const [lastStatsUpdate, setLastStatsUpdate] = useState(0);
  const [showClosestQuest, setShowClosestQuest] = useState(true);

  // Update quest list when stats change
  useEffect(() => {
    const sortedQuests = getQuestsSortedByProgress();
    setQuestList(sortedQuests);
    
    // Reset to closest quest after 3 seconds of stats update
    const now = Date.now();
    if (now - lastStatsUpdate > 3000) {
      setCurrentQuestIndex(0);
      setShowClosestQuest(true);
    }
  }, [questTracker, address, lastStatsUpdate, orbsEaten, kills, ethOrbsEaten, timeSurvived]);

  // Update lastStatsUpdate when quest progress changes
  useEffect(() => {
    setLastStatsUpdate(Date.now());
    setShowClosestQuest(false);
    
    // Show closest quest after 3 seconds
    const timer = setTimeout(() => {
      setCurrentQuestIndex(0);
      setShowClosestQuest(true);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [orbsEaten, kills, ethOrbsEaten, timeSurvived]);

  // 4. In the render/JSX, show the message if active
  if (showNamePrompt) {
    return (
      <div className="centered-game-box">
        <div className="game-box">
          {showNamePrompt && (
            <div className="name-prompt-overlay" style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              background: 'rgba(0,0,0,0.2)',
              zIndex: 100
            }}>
              <div className="name-prompt-box" style={{
                background: 'linear-gradient(135deg, rgba(24,28,43,0.4) 0%, rgba(24,28,43,0.6) 100%)',
                borderRadius: '20px',
                boxShadow: '0 20px 40px rgba(0, 255, 204, 0.15), 0 0 60px rgba(0, 255, 204, 0.1)',
                padding: '3rem',
                maxWidth: 800,
                width: '95%',
                textAlign: 'center',
                border: '2px solid rgba(0, 255, 204, 0.3)',
                backdropFilter: 'blur(10px)',
                position: 'relative',
                overflow: 'hidden'
                              }}>
                
                {/* Animated background effect */}
                <div style={{
                  position: 'absolute',
                  top: '-50%',
                  left: '-50%',
                  width: '200%',
                  height: '200%',
                  background: 'radial-gradient(circle, rgba(0, 255, 204, 0.1) 0%, transparent 70%)',
                  animation: 'pulse 3s ease-in-out infinite',
                  zIndex: -1,
                  borderRadius: '50%'
                }}></div>
                
                {/* Additional animated elements */}
                <div style={{
                  position: 'absolute',
                  top: '20%',
                  right: '-30%',
                  width: '60%',
                  height: '60%',
                  background: 'radial-gradient(circle, rgba(0, 255, 204, 0.08) 0%, transparent 60%)',
                  animation: 'pulse 6s ease-in-out infinite reverse',
                  zIndex: -1,
                  borderRadius: '50%'
                }}></div>
                
                <div style={{
                  position: 'absolute',
                  bottom: '10%',
                  left: '-20%',
                  width: '40%',
                  height: '40%',
                  background: 'radial-gradient(circle, rgba(0, 255, 204, 0.12) 0%, transparent 50%)',
                  animation: 'pulse 5s ease-in-out infinite',
                  zIndex: -1,
                  borderRadius: '50%'
                }}></div>
                
                <h2 style={{
                  fontSize: '2.5rem',
                  fontWeight: 'bold',
                  color: '#00ffcc',
                  marginBottom: '1.5rem',
                  textShadow: '0 0 20px rgba(0, 255, 204, 0.5)',
                  fontFamily: "'Orbitron', sans-serif",
                  letterSpacing: '2px'
                }}>
                  🐍 ENTER YOUR NAME 🐍
                </h2>
                
                {isTestMode && (
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.15) 0%, rgba(255, 193, 7, 0.25) 100%)',
                    border: '2px solid rgba(255, 193, 7, 0.4)',
                    color: '#ffc107',
                    padding: '12px 20px',
                    borderRadius: '12px',
                    marginBottom: '1.5rem',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    boxShadow: '0 0 20px rgba(255, 193, 7, 0.3)',
                    backdropFilter: 'blur(10px)',
                    fontFamily: "'Orbitron', sans-serif"
                  }}>
                    🧪 TEST MODE ACTIVATED - No wallet required
                  </div>
                )}
                
                <div style={{
                  background: 'linear-gradient(135deg, rgba(0, 255, 204, 0.1) 0%, rgba(0, 255, 204, 0.2) 100%)',
                  border: '2px solid rgba(0, 255, 204, 0.3)',
                  borderRadius: '12px',
                  padding: '15px 20px',
                  marginBottom: '2rem',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: '#00ffcc',
                  boxShadow: '0 0 15px rgba(0, 255, 204, 0.2)',
                  fontFamily: "'Orbitron', sans-serif"
                }}>
                  💰 Wager: {isTestMode ? '0 ETH (Test Mode)' : `${wagerAmount} ETH`}
                </div>
                
                <div style={{ position: 'relative', marginBottom: '2rem' }}>
                <input
                  type="text"
                  value={playerName}
                  onChange={e => setPlayerName(e.target.value)}
                  maxLength={16}
                    style={{
                      fontSize: '18px',
                      padding: '15px 20px',
                      borderRadius: '12px',
                      border: '2px solid rgba(0, 255, 204, 0.3)',
                      background: 'rgba(0, 0, 0, 0.3)',
                      color: '#fff',
                      width: '100%',
                      boxSizing: 'border-box',
                      outline: 'none',
                      transition: 'all 0.3s ease',
                      fontFamily: "'Orbitron', sans-serif",
                      textAlign: 'center'
                    }}
                    placeholder={isTestMode ? `Enter '${expectedTestName}' to continue` : "Enter your player name..."}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'rgba(0, 255, 204, 0.6)';
                      e.target.style.boxShadow = '0 0 20px rgba(0, 255, 204, 0.3)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(0, 255, 204, 0.3)';
                      e.target.style.boxShadow = 'none';
                    }}
                />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
                <button
                  className="primary-button"
                    style={{
                      fontSize: '18px',
                      padding: '15px 30px',
                      background: nameTakenError 
                        ? 'linear-gradient(135deg, #ff4444, #cc0000)' 
                        : 'linear-gradient(135deg, #00ffcc, #00cc99)',
                      border: nameTakenError ? '2px solid #ff4444' : '2px solid rgba(0, 255, 204, 0.5)',
                      color: nameTakenError ? '#fff' : '#000',
                      borderRadius: '12px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: nameTakenError 
                        ? '0 0 20px rgba(255, 68, 68, 0.4)' 
                        : '0 0 20px rgba(0, 255, 204, 0.3)',
                      fontFamily: "'Orbitron', sans-serif",
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      minWidth: '180px'
                    }}
                    onClick={() => { playClick(); handleJoinGame(); }}
                  disabled={!playerName.trim() || (!isTestMode && (!isConnected || isJoinGameLoading || isConfirming))}
                    onMouseEnter={(e) => {
                      if (!e.target.disabled) {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = nameTakenError 
                          ? '0 0 30px rgba(255, 68, 68, 0.6)' 
                          : '0 0 30px rgba(0, 255, 204, 0.5)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = nameTakenError 
                        ? '0 0 20px rgba(255, 68, 68, 0.4)' 
                        : '0 0 20px rgba(0, 255, 204, 0.3)';
                    }}
                  >
                    {nameTakenError ? '❌ Name Taken' : (isTestMode ? '🎮 Join Test Game' : (isJoinGameLoading ? '⏳ Awaiting Approval...' : (isConfirming ? '⏳ Confirming...' : '🚀 Join Game')))}
                </button>
                  
                  <button
                    className="secondary-button"
                    style={{
                      fontSize: '16px',
                      padding: '12px 24px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      borderRadius: '12px',
                      color: '#fff',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      fontFamily: "'Orbitron', sans-serif",
                      backdropFilter: 'blur(10px)',
                      fontWeight: 'bold',
                      letterSpacing: '1px'
                    }}
                    onClick={() => navigate('/')}
                    title="Back to Main Screen"
                    onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                      e.target.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                      e.target.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                      e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                      e.target.style.transform = 'translateY(0)';
                    }}
                  >
                    ⬅️ Back
                  </button>
                </div>
                {(isJoinGameLoading || isConfirming) && !isTestMode && (
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(0, 255, 204, 0.1) 0%, rgba(0, 255, 204, 0.2) 100%)',
                    border: '1px solid rgba(0, 255, 204, 0.3)',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    marginTop: '1.5rem',
                    color: '#00ffcc',
                    fontSize: '14px',
                    fontFamily: "'Orbitron', sans-serif",
                    boxShadow: '0 0 10px rgba(0, 255, 204, 0.2)'
                  }}>
                    {isJoinGameLoading && '⏳ Please approve the transaction in your wallet...'}
                    {isConfirming && '⏳ Waiting for transaction confirmation...'}
                  </div>
                )}
                {isTestMode && (
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.1) 0%, rgba(255, 193, 7, 0.2) 100%)',
                    border: '1px solid rgba(255, 193, 7, 0.3)',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    marginTop: '1.5rem',
                    color: '#ffc107',
                    fontSize: '14px',
                    fontFamily: "'Orbitron', sans-serif",
                    boxShadow: '0 0 10px rgba(255, 193, 7, 0.2)'
                  }}>
                    🧪 Test mode bypasses all wallet and ETH requirements
                  </div>
                )}
                {joinGameError && !isTestMode && (
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(255, 68, 68, 0.1) 0%, rgba(255, 68, 68, 0.2) 100%)',
                    border: '1px solid rgba(255, 68, 68, 0.3)',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    marginTop: '1.5rem',
                    color: '#ff4444',
                    fontSize: '14px',
                    fontFamily: "'Orbitron', sans-serif",
                    boxShadow: '0 0 10px rgba(255, 68, 68, 0.2)',
                    wordBreak: 'break-word'
                  }}>
                    ❌ <strong>Error:</strong> {joinGameError.shortMessage || joinGameError.message}
                  </div>
                )}
                {error && !isTestMode && (
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(255, 68, 68, 0.1) 0%, rgba(255, 68, 68, 0.2) 100%)',
                    border: '1px solid rgba(255, 68, 68, 0.3)',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    marginTop: '1.5rem',
                    color: '#ff4444',
                    fontSize: '14px',
                    fontFamily: "'Orbitron', sans-serif",
                    boxShadow: '0 0 10px rgba(255, 68, 68, 0.2)'
                  }}>
                    ❌ {error}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Death Screen Component
  if (showDeathScreen) {
    return (
      <div className="centered-game-box">
        <div className="game-box">
          <div className="death-screen-overlay" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'rgba(0,0,0,0.8)',
            zIndex: 1000
          }}>
            <div className="death-screen-box" style={{
              background: `radial-gradient(circle at 50% 50%, rgba(139,0,0,0.85) 55%, rgba(139,0,0,1) 100%)`,
              borderRadius: '24px',
              boxShadow: '0 0 25px 5px #8b000044',
              padding: '4rem',
              maxWidth: 700,
              width: '100%',
              textAlign: 'center',
              border: '1.5px solid #8b000033',
              color: '#fff'
            }}>
              <h2 style={{ color: '#ff4444', marginBottom: '2rem' }}>💀 YOU DIED 💀</h2>
              <div style={{ fontSize: '18px', marginBottom: '2rem' }}>
                {deathTimer < 3 ? (
                  <div>Returning to main menu in {Math.ceil(3 - deathTimer)} seconds...</div>
                ) : (
                  <div>Returning to main menu...</div>
                )}
              </div>
              <button
                className="primary-button"
                style={{ 
                  fontSize: 20, 
                  padding: '10px 32px',
                  background: 'linear-gradient(135deg, #ff4444, #cc0000)',
                  border: '2px solid #ff4444'
                }}
                onClick={() => navigate('/')}
              >
                Return to Main Menu
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <EscapeBarEnhanced escapePending={escapePending} onEscapeTrigger={startEscape} />
      
      {/* Segment loss visual feedback */}
      {segmentLossFlash && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(255, 255, 200, 0.4)',
          zIndex: 9999,
          pointerEvents: 'none',
          animation: 'segmentLossFlash 0.3s ease-out'
        }} />
      )}
      
      <style>{`
        @keyframes segmentLossFlash {
          0% { opacity: 0.6; }
          50% { opacity: 0.4; }
          100% { opacity: 0; }
        }
      `}</style>
      
      {/* Large Snake Warning */}
      {showLargeSnakeWarning && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'linear-gradient(135deg, rgba(255, 0, 0, 0.15) 0%, rgba(255, 0, 0, 0.25) 100%)',
          border: '2px solid rgba(255, 0, 0, 0.4)',
          borderRadius: '16px',
          padding: '20px 30px',
          color: '#ff4444',
          fontSize: '24px',
          fontWeight: 'bold',
          textAlign: 'center',
          zIndex: 1000,
          boxShadow: '0 0 30px rgba(255, 0, 0, 0.4), 0 0 60px rgba(255, 0, 0, 0.2)',
          backdropFilter: 'blur(10px)',
          fontFamily: "'Orbitron', sans-serif",
          textShadow: '0 0 10px rgba(255, 0, 0, 0.8)',
          animation: 'pulse 2s ease-in-out infinite',
          maxWidth: '90vw',
          wordWrap: 'break-word'
        }}>
          ⚠️ {largeSnakeWarningText} ⚠️
        </div>
      )}
    <div className="centered-game-box" style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      padding: '2rem',
      position: 'relative',
      transform: 'scale(0.9)',
      transformOrigin: 'top center',
    }}>
      {/* Live ETH Counter - positioned under navbar on top left */}
      <div style={{
        position: 'absolute',
        top: '80px',
        left: '-20px',
        background: 'rgba(24, 28, 43, 0.57)',
        color: '#00ffcc',
        borderRadius: 12,
        padding: '12px 16px',
        boxShadow: glow ? '0 0 30px 8px #00ff33, 0 0 15px #00ffcc33' : '0 0 15px #00ffcc33',
        textAlign: 'center',
        zIndex: 10,
        border: '1px solid #00ffcc22',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        minWidth: '120px'
      }}>
        <img 
          src="/eth-logo.png" 
          alt="ETH" 
          style={{ 
            width: '24px', 
            height: '24px',
            filter: 'drop-shadow(0 0 4px #00ffcc)'
          }}
        />
        <span style={{ 
          fontSize: '16px', 
          fontWeight: 'bold',
          textShadow: '0 0 8px #00ffcc',
          fontFamily: "'Orbitron', sans-serif"
        }}>
            ETH {totalClaimableEth.toFixed(3)} +
        </span>
      </div>

      {/* Wager Counter - positioned under ETH counter */}
      <div style={{
        position: 'absolute',
        bottom: '380px', // moved from top: '140px'
        left: '-20px',
        background: 'rgba(24, 28, 43, 0.57)',
        color: '#00ffcc',
        borderRadius: 12,
        padding: '12px 16px',
        boxShadow: '0 0 15px #00ffcc33',
        textAlign: 'center',
        zIndex: 10,
        border: '1px solid #00ffcc22',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        minWidth: '120px'
      }}>
        <img 
          src="/eth-logo.png" 
          alt="ETH" 
          style={{ 
            width: '24px', 
            height: '24px',
            filter: 'drop-shadow(0 0 4px #00ffcc)'
          }}
        />
        <span style={{ 
          fontSize: '16px', 
          fontWeight: 'bold',
          textShadow: '0 0 8px #00ffcc',
          fontFamily: "'Orbitron', sans-serif"
        }}>
          Wager | ETH {wagerAmount || 0}
        </span>
      </div>

      {/* SP Counter Box */}
      <div style={{
        position: 'absolute',
        top: '60px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(24, 28, 43, 0.15)',
        border: '1px solid rgba(138, 43, 226, 0.15)',
        borderRadius: '16px',
        padding: '14px 20px',
        backdropFilter: 'blur(15px)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        minWidth: '140px',
        boxShadow: '0 8px 32px rgba(138, 43, 226, 0.15), 0 0 0 1px rgba(138, 43, 226, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        transition: 'all 0.3s ease',
        zIndex: 1000
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{ 
            fontSize: '18px',
            filter: 'drop-shadow(0 0 8px rgba(138, 43, 226, 0.6))'
          }}>💎</span>
          <span style={{ 
            fontSize: '16px', 
            fontWeight: '600',
            textShadow: '0 0 12px rgba(138, 43, 226, 0.8)',
            fontFamily: "'Orbitron', sans-serif",
            color: '#e9d5ff',
            letterSpacing: '0.5px'
          }}>
            SP {gameState && gameState.players ? 
              (() => {
                const playerId = Object.keys(gameState.players).find(
                  id => gameState.players[id].wallet?.toLowerCase() === (address?.toLowerCase() || "0x0000000000000000000000000000000000000000")
                );
                return playerId && gameState.players[playerId] ? 
                  (gameState.players[playerId].SP || 0) : 0;
              })() : 0
            }
          </span>
        </div>
      </div>

      {/* Kill Reward Indicator */}
      {gameState && gameState.players && (() => {
        const playerId = Object.keys(gameState.players).find(
          id => gameState.players[id].wallet?.toLowerCase() === (address?.toLowerCase() || "0x0000000000000000000000000000000000000000")
        );
        const player = playerId ? gameState.players[playerId] : null;
        
        if (player && player.killRewardActive && player.killRewardStartTime && player.killRewardDuration) {
          const timeSinceKill = Date.now() - player.killRewardStartTime;
          const timeRemaining = Math.max(0, player.killRewardDuration - timeSinceKill);
          const secondsRemaining = Math.ceil(timeRemaining / 1000);
          
          if (secondsRemaining > 0) {
            return (
              <div style={{
                position: 'absolute',
                top: '120px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(0, 255, 0, 0.15)',
                border: '2px solid rgba(0, 255, 0, 0.4)',
                borderRadius: '16px',
                padding: '14px 20px',
                backdropFilter: 'blur(15px)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                minWidth: '200px',
                boxShadow: '0 8px 32px rgba(0, 255, 0, 0.3), 0 0 0 1px rgba(0, 255, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                transition: 'all 0.3s ease',
                zIndex: 1000,
                animation: 'pulse 1s infinite'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{ 
                    fontSize: '18px',
                    filter: 'drop-shadow(0 0 8px rgba(0, 255, 0, 0.8))'
                  }}>🎯</span>
                  <span style={{ 
                    fontSize: '16px', 
                    fontWeight: '600',
                    textShadow: '0 0 12px rgba(0, 255, 0, 0.8)',
                    fontFamily: "'Orbitron', sans-serif",
                    color: '#00ff00',
                    letterSpacing: '0.5px'
                  }}>
                    Kill Reward: {secondsRemaining}s (2.4x Orb Pickup)
                  </span>
                </div>
              </div>
            );
          }
        }
        return null;
      })()}

      {/* Leaderboard positioned in top right */}
      {gameState && gameState.players && (
        <div style={{
          position: 'absolute',
          top: '60px',
          right: '0px',
          background: 'rgba(24, 28, 43, 0.29)',
          color: '#00ffcc',
          borderRadius: 10,
          padding: 12,
          maxWidth: 280,
          boxShadow: '0 0 10px #00ffcc33',
          textAlign: 'center',
          zIndex: 10,
          border: '1px solid #00ffcc22',
          backdropFilter: 'blur(5px)'
        }}>
          <h3 style={{ margin: 0, fontSize: 18, marginBottom: 8, fontFamily: "'Orbitron', sans-serif" }}>Leaderboard</h3>
          <ol style={{ padding: 0, margin: 0, listStyle: 'decimal inside', fontSize: 14, fontFamily: "'Orbitron', sans-serif" }}>
            {Object.values(gameState.players)
              .sort((a, b) => b.SP - a.SP)
              .slice(0, 11)
              .map((p, i) => (
                <li key={i} style={{ 
                  color: p.alive ? p.color : '#888', 
                  padding: '2px 0',
                  borderBottom: i < 10 ? '1px solid rgba(255, 255, 255, 0.3)' : 'none',
                  fontFamily: "'Orbitron', sans-serif"
                }}>
                  <a
                    href={`${networkConfig.config.EXPLORER.replace('docs.abs.xyz', 'docs[dot]abs[dot]xyz')}/address/${p.wallet || ''}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ 
                      color: 'inherit', 
                      textDecoration: 'none',
                      cursor: 'pointer',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      transition: 'all 0.2s ease',
                      display: 'inline-block',
                      fontWeight: 'bold',
                      textShadow: `0 0 1.6px ${p.alive ? p.color : '#888'}, 0 0 2.4px ${p.alive ? p.color : '#888'}`,
                      WebkitTextStroke: `0.5px ${p.alive ? p.color : '#888'}`,
                      outline: `1px solid ${p.alive ? p.color : '#888'}`,
                      outlineOffset: '1px',
                      fontFamily: "'Orbitron', sans-serif"
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.textShadow = `0 0 2.4px ${p.alive ? p.color : '#888'}, 0 0 4px ${p.alive ? p.color : '#888'}, 0 0 6px ${p.alive ? p.color : '#888'}`;
                      e.currentTarget.style.WebkitTextStroke = `0.8px ${p.alive ? p.color : '#888'}`;
                      e.currentTarget.style.outline = `1px solid ${p.alive ? p.color : '#888'}`;
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.textShadow = `0 0 1.6px ${p.alive ? p.color : '#888'}, 0 0 2.4px ${p.alive ? p.color : '#888'}`;
                      e.currentTarget.style.WebkitTextStroke = `0.5px ${p.alive ? p.color : '#888'}`;
                      e.currentTarget.style.outline = `1px solid ${p.alive ? p.color : '#888'}`;
                    }}
                    title={p.wallet || ''}
                  >
                    <span style={{ 
                      color: p.alive ? p.color : '#888',
                      textShadow: `0 0 1.6px ${p.alive ? p.color : '#888'}, 0 0 2.4px ${p.alive ? p.color : '#888'}`,
                      WebkitTextStroke: `0.5px ${p.alive ? p.color : '#888'}`,
                      fontFamily: "'Orbitron', sans-serif"
                    }}>
                      {p.name}
                    </span>
                    <span style={{ 
                      color: '#ffffff', 
                      textShadow: '0 0 1.6px #ffffff, 0 0 2.4px #ffffff',
                      WebkitTextStroke: '0.5px #000000',
                      fontWeight: 'normal',
                      fontFamily: "'Orbitron', sans-serif"
                    }}>     |</span>
                    <span style={{ 
                      color: '#ffffff',
                      textShadow: '0 0 1.6px #ffffff, 0 0 2.4px #ffffff',
                      WebkitTextStroke: '0.5px #000000',
                      fontWeight: 'normal',
                      fontFamily: "'Orbitron', sans-serif"
                    }}>
                      SP-{p.SP || 0}
                    </span>
                    <span style={{ 
                      color: '#ffffff', 
                      textShadow: '0 0 1.6px #ffffff, 0 0 2.4px #ffffff',
                      WebkitTextStroke: '0.5px #000000',
                      fontWeight: 'normal',
                      fontFamily: "'Orbitron', sans-serif"
                    }}>|</span>
                    <span style={{ 
                      color: '#ffffff',
                      textShadow: '0 0 1.6px #ffffff, 0 0 2.4px #ffffff',
                      WebkitTextStroke: '0.5px #000000',
                      fontWeight: 'normal',
                      fontFamily: "'Orbitron', sans-serif"
                    }}>
                      ETH-0
                    </span>
                    <span style={{ 
                      color: '#ffffff', 
                      textShadow: '0 0 1.6px #ffffff, 0 0 2.4px #ffffff',
                      WebkitTextStroke: '0.5px #000000',
                      fontWeight: 'normal',
                      fontFamily: "'Orbitron', sans-serif"
                    }}>|</span>
                  </a>
                </li>
              ))}
          </ol>
        </div>
      )}

      {/* Time Box - positioned above minimap */}
      <div style={{
        position: 'absolute',
        bottom: '390px',
        right: '40px',
        background: 'rgba(24, 28, 43, 0.57)',
        color: '#00ff44',
        borderRadius: 12,
        padding: '12px 16px',
        boxShadow: '0 0 15px #00ff4433',
        textAlign: 'center',
        border: '1px solid #00ff4422',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        minWidth: '120px',
        zIndex: 1000
      }}>
        <span style={{ 
          fontSize: '18px',
          filter: 'drop-shadow(0 0 4px #00ff44)'
        }}>⏱️</span>
        <span style={{ 
          fontSize: '16px', 
          fontWeight: 'bold',
          textShadow: '0 0 8px #00ff44',
          fontFamily: "'Orbitron', sans-serif"
        }}>
          {timeSurvived < 60 ? `${timeSurvived}s` : `${Math.floor(timeSurvived / 60)}m ${timeSurvived % 60}s`}
        </span>
      </div>

      {/* Minimap positioned at bottom right of game canvas */}
      {gameState && (
        <div style={{
          position: 'absolute',
          bottom: '150px',
          right: '40px',
          background: 'rgba(24, 28, 43, 0.85)',
          borderRadius: '12px',
          padding: '12px',
          width: 220,
          height: 220,
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
          zIndex: 1000,
          border: '1px solid rgba(0, 255, 204, 0.2)',
          backdropFilter: 'blur(8px)',
          display: showMinimap ? 'block' : 'none'
        }}>
          {/* Toggle button positioned at top right of minimap */}
          <button
            onClick={() => setShowMinimap(!showMinimap)}
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              background: 'rgba(255, 68, 68, 0.2)',
              border: '1px solid rgba(255, 68, 68, 0.4)',
              borderRadius: '6px',
              padding: '4px 8px',
              color: '#ff4444',
              fontSize: '0.7rem',
              fontWeight: '600',
              cursor: 'pointer',
              backdropFilter: 'blur(4px)',
              transition: 'all 0.3s ease',
              fontFamily: "'Orbitron', sans-serif",
              zIndex: 1001
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = '0 4px 12px rgba(255, 68, 68, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            ✕
          </button>
          
          <canvas
            id="minimap"
            width={200}
            height={200}
            style={{
              display: 'block',
              borderRadius: '8px',
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(0, 255, 204, 0.2)'
            }}
            ref={(canvas) => {
              if (canvas && gameState) {
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, 200, 200);
                
                // Scale factor for minimap (12000 world to 200 minimap)
                const scale = 200 / 12000;
                
                // Draw circular boundary (no shadow)
                ctx.strokeStyle = '#00ffcc';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(100, 100, 100, 0, 2 * Math.PI);
                ctx.stroke();
                
                // Draw orbs (normal and moving)
                if (gameState.orbs) {
                  // Show only 40% of normal orbs, all moving orbs
                  ctx.globalAlpha = 0.7;
                  for (let i = 0; i < gameState.orbs.length; i++) {
                    const orb = gameState.orbs[i];
                    const x = orb.x * scale;
                    const y = orb.y * scale;
                    if (x >= 0 && x <= 200 && y >= 0 && y <= 200) {
                      if (orb.type === 'moving') {
                        ctx.fillStyle = '#00aaff'; // Moving orbs: blue
                        ctx.beginPath();
                        ctx.arc(x, y, 1.2, 0, 2 * Math.PI);
                        ctx.fill();
                      } else if (Math.random() < 0.4) {
                      ctx.fillStyle = orb.color;
                      ctx.beginPath();
                      ctx.arc(x, y, 1, 0, 2 * Math.PI);
                      ctx.fill();
                      }
                    }
                  }
                  ctx.globalAlpha = 1;
                }
                
                // Draw snakes (simplified, fewer segments, no shadow)
                if (gameState.players) {
                  for (const id in gameState.players) {
                    const player = gameState.players[id];
                    if (!player.alive) continue;
                  
                    if (player.segments.length > 0) {
                      const head = player.segments[0];
                      const x = head.x * scale;
                      const y = head.y * scale;
                      
                      if (x >= 0 && x <= 200 && y >= 0 && y <= 200) {
                        // Calculate snake size based on segment count
                        const segmentCount = player.segments.length;
                        const baseSize = 2;
                        const sizeMultiplier = Math.min(segmentCount / 20, 2.5);
                        const snakeSize = baseSize + sizeMultiplier;
                        
                        // Draw snake head
                        ctx.fillStyle = player.color;
                        ctx.beginPath();
                        ctx.arc(x, y, snakeSize, 0, 2 * Math.PI);
                        ctx.fill();
                        
                        // Draw mini snake body (show up to 5 segments)
                        ctx.globalAlpha = 0.7;
                        const maxSegmentsToShow = Math.min(segmentCount, 5);
                        for (let i = 1; i < maxSegmentsToShow; i++) {
                          if (i < player.segments.length) {
                            const seg = player.segments[i];
                          const segX = seg.x * scale;
                          const segY = seg.y * scale;
                          if (segX >= 0 && segX <= 200 && segY >= 0 && segY <= 200) {
                              // Fade out segments towards the tail
                              const fadeAlpha = 0.7 * (1 - (i / maxSegmentsToShow));
                              ctx.globalAlpha = fadeAlpha;
                              // Smaller segments towards the tail
                              const segmentSize = snakeSize * (1 - (i / maxSegmentsToShow) * 0.5);
                            ctx.beginPath();
                              ctx.arc(segX, segY, segmentSize, 0, 2 * Math.PI);
                            ctx.fill();
                            }
                          }
                        }
                        ctx.globalAlpha = 1;
                      }
                    }
                  }
                }
              }
            }}
          />
          <div style={{
            position: 'absolute',
            bottom: '8px',
            left: '8px',
            color: '#00ffcc',
            fontSize: '0.7rem',
            fontWeight: '600',
            textShadow: '0 0 4px #00ffcc',
            fontFamily: "'Orbitron', sans-serif"
          }}>
            MINIMAP
          </div>
        </div>
      )}

      {/* Map toggle button when minimap is hidden */}
      {gameState && !showMinimap && (
        <button
          onClick={() => setShowMinimap(true)}
          style={{
            position: 'absolute',
            bottom: '350px',
            right: '60px',
            background: 'rgba(0, 255, 204, 0.2)',
            border: '1px solid rgba(0, 255, 204, 0.4)',
            borderRadius: '8px',
            padding: '8px 12px',
            color: '#00ffcc',
            fontSize: '0.7rem',
            fontWeight: '600',
            cursor: 'pointer',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
            transition: 'all 0.3s ease',
            fontFamily: "'Orbitron', sans-serif",
            zIndex: 1000
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 6px 20px rgba(0, 255, 204, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.3)';
          }}
        >
          Map
        </button>
      )}

      <div className="game-box" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        maxWidth: '1800px',
        width: '100%'
      }}>
        <canvas
          ref={canvasRef}
          width={1800}
          height={1100}
          onMouseDown={handleMouseDown}
          style={{
            display: "block",
            margin: "0 auto 24px auto",
            background: "#111",
            borderRadius: "12px",
            boxShadow: "0 0 16px #00ffcc44",
            width: "95vw",
            maxWidth: 1600,
            height: "80vh",
            maxHeight: 1000,
            cursor: showMovementTracker ? 'none' : 'default'
          }}
        />
        
        <div className="game-ui-container" style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '2rem',
          flexWrap: 'wrap',
          width: '100%',
          maxWidth: '1600px'
        }}>
          <div className="controls-section" style={{
            background: 'rgba(24, 28, 43, 0.85)',
            border: '1px solid rgba(0, 255, 204, 0.2)',
            borderRadius: '12px',
            padding: '12px',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
            minWidth: '180px'
          }}>
            <h3 style={{ margin: 0, fontSize: '0.75rem', fontWeight: '600', color: '#00ffcc', marginBottom: '8px', fontFamily: "'Orbitron', sans-serif" }}>Controls</h3>
            <div style={{ fontSize: '0.65rem', color: '#ccc', lineHeight: '1.3', fontFamily: "'Orbitron', sans-serif" }}>
              <div>Mouse Movement</div>
              <div>Double tap E to escape</div>
            </div>
            
            {/* Movement Tracker Toggle */}
          <div style={{
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginTop: '12px',
              padding: '8px 0',
              borderTop: '1px solid rgba(0, 255, 204, 0.2)'
            }}>
              <span style={{ 
                fontSize: '0.65rem', 
                color: '#00ffcc', 
                fontFamily: "'Orbitron', sans-serif",
                fontWeight: '500'
              }}>
                ✅ Tracker
              </span>
              <button
                onClick={() => setShowMovementTracker(!showMovementTracker)}
                style={{
                  width: '32px',
                  height: '18px',
                  background: showMovementTracker ? '#00ffcc' : 'rgba(255, 255, 255, 0.2)',
                  border: '1px solid rgba(0, 255, 204, 0.4)',
                  borderRadius: '9px',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 2px'
                }}
              >
                <div style={{
                  width: '14px',
                  height: '14px',
                  background: '#fff',
                  borderRadius: '50%',
                  transform: showMovementTracker ? 'translateX(14px)' : 'translateX(0)',
                  transition: 'transform 0.3s ease',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)'
                }} />
              </button>
            </div>


          </div>



          {/* Session Stats - shown in both test mode and normal mode */}
            <div style={{
            background: 'rgba(24, 28, 43, 0.85)',
            border: '1px solid rgba(0, 255, 204, 0.2)',
            borderRadius: '12px',
            padding: '12px',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
            color: '#00ffcc', 
            fontSize: '0.65rem',
            fontFamily: "'Orbitron', sans-serif",
            minWidth: '160px'
          }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '0.75rem', fontWeight: '600', color: '#00ffcc', fontFamily: "'Orbitron', sans-serif" }}>Session Stats</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '2px 0'
              }}>
                <span style={{ fontSize: '0.6rem', opacity: 0.8 }}>🔵 Orbs:</span>
                <span style={{ fontSize: '0.65rem', fontWeight: '600', textShadow: '0 0 4px #00ffcc' }}>
                  {gameState && gameState.players ? 
                    (() => {
                      const playerId = Object.keys(gameState.players).find(
                        id => gameState.players[id].wallet?.toLowerCase() === (address?.toLowerCase() || "0x0000000000000000000000000000000000000000")
                      );
                      return playerId && gameState.players[playerId] ? 
                        (gameState.players[playerId].normalOrbsEaten || 0) : 0;
                    })() : 0
                  }
                </span>
            </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '2px 0'
              }}>
                <span style={{ fontSize: '0.6rem', opacity: 0.8 }}>⚡ Moving:</span>
                <span style={{ fontSize: '0.65rem', fontWeight: '600', textShadow: '0 0 4px #00ffcc' }}>
                  {gameState && gameState.players ? 
                    (() => {
                      const playerId = Object.keys(gameState.players).find(
                        id => gameState.players[id].wallet?.toLowerCase() === (address?.toLowerCase() || "0x0000000000000000000000000000000000000000")
                      );
                      return playerId && gameState.players[playerId] ? 
                        (gameState.players[playerId].movingOrbsEaten || 0) : 0;
                    })() : 0
                  }
                </span>
            </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '2px 0'
              }}>
                <span style={{ fontSize: '0.6rem', opacity: 0.8 }}>💀 Kills:</span>
                <span style={{ fontSize: '0.65rem', fontWeight: '600', textShadow: '0 0 4px #00ffcc' }}>
                  {gameState && gameState.players ? 
                    (() => {
                      const playerId = Object.keys(gameState.players).find(
                        id => gameState.players[id].wallet?.toLowerCase() === (address?.toLowerCase() || "0x0000000000000000000000000000000000000000")
                      );
                      return playerId && gameState.players[playerId] ? 
                        (gameState.players[playerId].kills || 0) : 0;
                    })() : 0
                  }
                </span>
          </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '2px 0'
              }}>
                <span style={{ fontSize: '0.6rem', opacity: 0.8 }}>🏆 Achievements:</span>
                <span style={{ fontSize: '0.65rem', fontWeight: '600', textShadow: '0 0 4px #00ff44', color: '#00ff44' }}>
                  {Object.values(sessionAchievements).filter(Boolean).length}
                </span>
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '2px 0'
              }}>
                <span style={{ fontSize: '0.6rem', opacity: 0.8 }}>🎯 Quests:</span>
                <span style={{ fontSize: '0.65rem', fontWeight: '600', textShadow: '0 0 4px #ffe066', color: '#ffe066' }}>
                  {sessionCompletedQuests.size}
                </span>
              </div>
            </div>
          </div>

          {/* Quests Box - next to session stats */}
          {(() => {
            // Use quest cycling system
            const currentQuest = questList[currentQuestIndex];
            if (!currentQuest) return null;
            
            const getRarityColor = (rarity) => {
              const colors = {
                common: '#4ade80',
                rare: '#60a5fa',
                epic: '#a855f7',
                legendary: '#f59e0b',
                ultra: '#f87171'
              };
              return colors[rarity] || '#4ade80';
            };
            
            return (
              <div style={{ 
                background: 'rgba(24, 28, 43, 0.85)',
                border: `1px solid ${getRarityColor(currentQuest.rarity)}40`,
                borderRadius: '12px',
                padding: '12px',
                backdropFilter: 'blur(8px)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
                color: '#00ffcc', 
                fontSize: '0.65rem',
                fontFamily: "'Orbitron', sans-serif",
                minWidth: '200px',
                maxWidth: '250px'
              }}>
                <h3 
                  onClick={handleQuestTitleClick}
                  style={{ 
                    margin: '0 0 8px 0', 
                    fontSize: '0.75rem', 
                    fontWeight: '600', 
                    color: getRarityColor(currentQuest.rarity), 
                    fontFamily: "'Orbitron', sans-serif",
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    userSelect: 'none',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'scale(1.02)';
                    e.target.style.textShadow = `0 0 8px ${getRarityColor(currentQuest.rarity)}`;
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'scale(1)';
                    e.target.style.textShadow = 'none';
                  }}
                >
                  <span>{currentQuest.icon}</span>
                  <span>{currentQuest.title}</span>
                  <span style={{ fontSize: '0.6rem', opacity: 0.7 }}>↻</span>
                  <span style={{ 
                    fontSize: '0.5rem', 
                    opacity: 0.5, 
                    marginLeft: 'auto',
                    background: 'rgba(0,0,0,0.3)',
                    padding: '1px 4px',
                    borderRadius: '3px'
                  }}>
                    {Math.min(currentQuestIndex + 1, 5)}/5
                  </span>
                  {!showClosestQuest && (
                    <span style={{
                      position: 'absolute',
                      top: '-2px',
                      right: '-2px',
                      width: '8px',
                      height: '8px',
                      background: '#ff6b6b',
                      borderRadius: '50%',
                      animation: 'pulse 1s infinite',
                      boxShadow: '0 0 4px #ff6b6b'
                    }} />
                  )}
                </h3>
                
                <div style={{ 
                  fontSize: '0.6rem', 
                  color: '#ccc', 
                  marginBottom: '8px',
                  lineHeight: '1.3'
                }}>
                  {currentQuest.description}
                </div>
                
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ 
          display: 'flex',
                    justifyContent: 'space-between', 
          alignItems: 'center',
                    marginBottom: '4px'
                  }}>
                    <span style={{ fontSize: '0.6rem', opacity: 0.8 }}>Progress:</span>
                    <span style={{ 
                      fontSize: '0.65rem', 
                      fontWeight: '600', 
                      color: getRarityColor(currentQuest.rarity),
                      textShadow: `0 0 4px ${getRarityColor(currentQuest.rarity)}`
                    }}>
                      {currentQuest.progress?.percentage || 0}%
                    </span>
                  </div>
                  
                  <div style={{
          width: '100%',
                    height: '6px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '3px',
                    overflow: 'hidden',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    <div style={{
                      width: `${currentQuest.progress?.percentage || 0}%`,
                      height: '100%',
                      background: `linear-gradient(90deg, ${getRarityColor(currentQuest.rarity)}, ${getRarityColor(currentQuest.rarity)}80)`,
                      borderRadius: '3px',
                      transition: 'width 0.3s ease',
                      boxShadow: `0 0 8px ${getRarityColor(currentQuest.rarity)}40`
                    }} />
                  </div>
                </div>
                
              <div style={{ 
                display: 'flex', 
                  justifyContent: 'space-between', 
                alignItems: 'center', 
                  fontSize: '0.6rem'
                }}>
                  <span style={{ opacity: 0.8 }}>Reward:</span>
                  <span style={{ 
                    fontWeight: '600', 
                    color: '#a259ff',
                    textShadow: '0 0 4px #a259ff'
                  }}>
                    +{currentQuest.reward.toLocaleString()} SP
                  </span>
                </div>
              </div>
            );
          })()}



          {/* Achievement List */}
          {showAchievementList && (
            <div style={{ 
              background: 'rgba(24, 28, 43, 0.85)',
              border: '1px solid rgba(162, 89, 255, 0.2)',
              borderRadius: '12px',
              padding: '12px',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
              color: '#ffffff', 
              fontSize: '10px',
              fontFamily: "'Orbitron', sans-serif",
              minWidth: '300px',
              maxWidth: '450px',
              maxHeight: '250px',
              overflowY: 'auto'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <h3 style={{ margin: 0, fontSize: '14px', color: '#a259ff', textShadow: '0 0 8px #a259ff', fontFamily: "'Orbitron', sans-serif" }}>
                  🎖️ Achievements
                </h3>
            </div>
                <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: '6px'
              }}>
                {Object.entries(sessionAchievements).map(([achievement, completed]) => (
                  <div key={achievement} style={{ 
                  display: 'flex', 
                    justifyContent: 'space-between', 
                  alignItems: 'center', 
                    padding: '4px 6px',
                    borderRadius: '6px',
                    background: completed ? 'rgba(162, 89, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                    border: completed ? '1px solid rgba(162, 89, 255, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
                    minWidth: '120px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '10px' }}>
                        {completed ? '✅' : '⚪'}
                      </span>
                      <span style={{ 
                        fontSize: '8px', 
                        color: completed ? '#00ff44' : '#ccc',
                        fontWeight: completed ? 'bold' : 'normal'
                      }}>
                        {achievement}
                      </span>
                </div>
                    {completed && (
                      <span style={{ 
                        fontSize: '7px', 
                        color: '#00ff44', 
                        fontWeight: 'bold',
                        textShadow: '0 0 4px #00ff44'
                      }}>
                        +2000 SP
                      </span>
              )}
            </div>
                ))}
          </div>
            </div>
          )}

          {/* Stats and Achievement Buttons - positioned above boost button */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            marginBottom: '16px'
          }}>
            <button 
              onClick={() => setShowPerformanceMonitor(!showPerformanceMonitor)}
              style={{
                background: showPerformanceMonitor ? 'rgba(0, 255, 204, 0.2)' : 'rgba(24, 28, 43, 0.85)',
                border: '1px solid rgba(0, 255, 204, 0.3)',
                color: '#ffffff',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '0.7rem',
                fontWeight: '600',
                cursor: 'pointer',
                backdropFilter: 'blur(8px)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
                transition: 'all 0.3s ease',
                width: '120px',
                fontFamily: "'Orbitron', sans-serif"
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(0, 255, 204, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.3)';
              }}
            >
              {showPerformanceMonitor ? '📊 Hide Stats' : '📊 Show Stats'}
            </button>
            
            {/* Boost button moved here */}
          <div className="boost-container" style={{
            background: 'rgba(24, 28, 43, 0.85)',
            border: '1px solid rgba(0, 255, 204, 0.2)',
            borderRadius: '12px',
            padding: '12px',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
            minWidth: '140px'
          }}>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  marginBottom: '8px'
                }}>
                  <div style={{ fontSize: '0.8rem' }}>🚀</div>
                  <span style={{ fontSize: '0.65rem', color: '#00ffcc', fontFamily: "'Orbitron', sans-serif" }}>Tap LMB to Boost</span>
          </div>
                
                {/* Boost cooldown indicator */}
                {boostCooldown > 0 && (
                  <div style={{
                    width: '80px',
                    height: '6px',
                    background: '#333',
                    borderRadius: '3px',
                    overflow: 'hidden',
                    border: '1px solid #ff4444',
                    marginBottom: '8px'
                  }}>
                    <div style={{
                      width: `${(boostCooldown / BOOST_COOLDOWN) * 100}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #ff4444, #cc0000)',
                      transition: 'width 0.1s ease'
                    }}></div>
                  </div>
                )}
                
                {/* Boost button */}
            <button 
                  onClick={handleBoostButton}
                  disabled={boostCooldown > 0}
                  style={{
                    background: boostActive ? 'linear-gradient(135deg, #ff4444, #cc0000)' : 
                              boostCooldown > 0 ? 'rgba(128, 128, 128, 0.5)' : 'linear-gradient(135deg, #00ffcc, #00cc99)',
                    border: '1px solid',
                    borderColor: boostActive ? '#ff4444' : boostCooldown > 0 ? '#888' : '#00ffcc',
                    color: '#000',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '0.7rem',
                    fontWeight: '600',
                    cursor: boostCooldown > 0 ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: boostActive ? '0 0 15px rgba(255, 68, 68, 0.4)' : '0 0 8px rgba(0, 255, 204, 0.3)',
                    minWidth: '100px',
                    fontFamily: "'Orbitron', sans-serif"
                  }}
                  onMouseEnter={(e) => {
                    if (boostCooldown === 0) {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = boostActive 
                        ? '0 6px 20px rgba(255, 68, 68, 0.4)' 
                        : '0 6px 20px rgba(0, 255, 204, 0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = boostActive ? '0 0 15px rgba(255, 68, 68, 0.4)' : '0 0 8px rgba(0, 255, 204, 0.3)';
                  }}
                >
                  {boostActive ? `BOOSTING! ${Math.ceil(boostFreeTimeRemaining / 1000)}s` : (boostCooldown > 0 ? `COOLDOWN ${Math.ceil(boostCooldown / 1000)}s` : 'BOOST')}
            </button>
            </div>
          </div>
        </div>

        <h2 style={{ textAlign: 'center', marginTop: '1rem' }}>
          {loading
            ? "⏳ Connecting to game..."
            : error
            ? `❌ ${error}`
            : "🎮 Active Game - Slither for ETH"}
        </h2>
        
        {/* CSS Styles for controls and animations */}
        <style>{`
          @keyframes pulse {
            0% { opacity: 0.3; transform: scale(1); }
            50% { opacity: 0.6; transform: scale(1.05); }
            100% { opacity: 0.3; transform: scale(1); }
          }
          
          .controls-section {
            background: rgba(24, 28, 43, 0.4);
            border: 1px solid #00ffcc22;
            border-radius: 12px;
            padding: 16px;
            backdrop-filter: blur(5px);
            box-shadow: 0 0 10px #00ffcc22;
          }
          
          .boost-button {
            position: relative;
            background: linear-gradient(135deg, #ff4444, #cc0000);
            border: 2px solid #ff4444;
            border-radius: 12px;
            padding: 12px 24px;
            color: white;
            font-weight: bold;
            font-size: 16px;
            cursor: pointer;
            transition: all 0.2s ease;
            overflow: hidden;
            min-width: 140px;
            min-height: 50px;
          }
          
          .boost-button:hover:not(:disabled) {
            background: linear-gradient(135deg, #ff6666, #dd2222);
            border-color: #ff6666;
            box-shadow: 0 0 15px #ff444466;
          }
          
          .boost-button.active {
            background: linear-gradient(135deg, #00ff44, #00cc33);
            border-color: #00ff44;
            box-shadow: 0 0 20px #00ff4466;
          }
          
          .boost-button.cooldown {
            background: linear-gradient(135deg, #666666, #444444);
            border-color: #666666;
            cursor: not-allowed;
          }
          
          .boost-button:disabled {
            background: linear-gradient(135deg, #666666, #444444);
            border-color: #666666;
            cursor: not-allowed;
          }
          
          .boost-gauge {
            position: absolute;
            top: 0;
            left: 0;
            height: 100%;
            background: linear-gradient(135deg, #00ff44, #00cc33);
            transition: width 0.1s ease;
            z-index: 1;
          }
          
          .boost-text {
            position: relative;
            z-index: 2;
          }
          
          .boost-tooltip {
            position: absolute;
            top: -30px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: #00ffcc;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            white-space: nowrap;
          }
        `}</style>
      </div>
      <audio ref={orbSound} src="/sounds/orb.mp3" preload="auto" />
      <audio ref={ethOrbSound} src="/sounds/ethorb.mp3" preload="auto" />
      <audio ref={boostSound} src="/sounds/boost.mp3" preload="auto" />
      <audio ref={collisionSound} src="/sounds/collision.mp3" preload="auto" />
        <audio 
          ref={achievementSound} 
          src="/sounds/acheivement.mp3" 
          preload="auto"
          loop={false}
          muted={false}
          volume={0.7}
          onCanPlay={() => console.log('🔊 Achievement sound can play now')}
          onLoadedData={() => console.log('🔊 Achievement sound loaded successfully')}
          onError={(e) => console.error('🔊 Achievement sound failed to load:', e)}
          onPlay={() => console.log('🔊 Achievement sound started playing')}
          onEnded={() => console.log('🔊 Achievement sound finished playing')}
        />
      <audio ref={killBonusSound} src="/sounds/killbonus.mp3" preload="auto" />
      
      {/* Achievement Notifications */}
      {console.log('🏆 Rendering notifications section, count:', achievementNotifications?.length)}
      {/* Achievement notification banner removed as requested */}
      {(achievementNotifications || []).map((notification, index) => {
        try {
          // Get achievement name directly from notification
          const achievementName = notification.achievement;
          console.log('🖼️ Rendering achievement notification:', { 
            achievementName, 
            availableImages: achievementImageMap 
          });
          
          // Get image directly from achievementImageMap using the exact achievement name
          let imageSrc = '/achieve.png'; // Default fallback image
          
          if (achievementName && achievementImageMap[achievementName]) {
            // Direct lookup with exact name match
            imageSrc = `/${achievementImageMap[achievementName]}`;
            console.log(`🖼️ Found image for ${achievementName}: ${imageSrc}`);
          } else if (notification.message) {
            // Fallback: try to extract name from message
            const match = notification.message.match(/^(.*?) Achievement Unlocked!/);
            if (match) {
              const extractedName = match[1].trim();
              if (achievementImageMap[extractedName]) {
                imageSrc = `/${achievementImageMap[extractedName]}`;
                console.log(`🖼️ Found image using message extraction: ${imageSrc}`);
              }
            }
          }
          
          return (
          <div
            key={notification.id}
            style={{
              position: 'fixed',
              top: `${200 + (index * 120)}px`,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(0, 102, 255, 0.3)', // More transparent blue (50% more transparent)
              color: '#ffffff',
              fontWeight: '700',
              fontSize: '1.2rem',
              padding: '1.5rem 2.5rem',
              borderRadius: '16px',
              boxShadow: '0 12px 40px rgba(0, 102, 255, 0.5), 0 0 0 2px rgba(255, 255, 255, 0.4)',
              zIndex: 10000,
              textAlign: 'left',
              textShadow: '0 0 10px rgba(255, 255, 255, 0.6)',
              fontFamily: "'Orbitron', sans-serif",
              border: '2px solid rgba(255, 255, 255, 0.5)',
              backdropFilter: 'blur(15px)',
              animation: 'achievementFadeIn 0.8s ease-out',
              pointerEvents: 'none',
              opacity: 0.95,
              transition: 'all 0.3s ease',
              letterSpacing: '0.5px',
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              minWidth: '400px',
              maxWidth: '95vw',
              justifyContent: 'flex-start',
            }}
          >
            {/* Achievement image with specific image from Quests.jsx */}
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '12px',
              background: 'rgba(0, 102, 255, 0.3)',
              border: '2px solid rgba(255, 255, 255, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0, 102, 255, 0.5), 0 0 10px rgba(0, 0, 0, 0.8)',
              position: 'relative'
            }}>
              <img
                src={imageSrc}
                alt={achievementName || "Achievement"}
                style={{
                  width: '90%',
                  height: '90%',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 0 15px rgba(255,255,255,0.8)) drop-shadow(0 0 10px rgba(0,102,255,0.8)) drop-shadow(0 0 8px rgba(0,0,0,0.9))',
                  animation: 'trophyGlow 2s ease-in-out infinite alternate',
                }}
                onError={e => { 
                  console.error(`🖼️ Image load error for ${imageSrc}`, e);
                  e.target.onerror = null; 
                  e.target.src = '/achieve.png'; 
                }}
              />
            </div>
            
            {/* Achievement details with better formatting */}
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'flex-start',
              gap: '6px' 
            }}>
              <h3 style={{ 
                margin: 0, 
                color: '#ffffff',
                fontSize: '1.3rem',
                fontWeight: '900',
                textShadow: '0 0 10px rgba(255, 255, 255, 0.6)',
                letterSpacing: '0.5px'
              }}>
                {achievementName}
              </h3>
              <div style={{
                background: 'rgba(0, 255, 204, 0.3)',
                padding: '6px 12px',
                borderRadius: '10px',
                marginTop: '2px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                boxShadow: '0 0 15px rgba(0, 255, 204, 0.4)'
              }}>
                <span style={{ 
                  fontSize: '1rem',
                  color: '#ffffff',
                  fontWeight: '700',
                  textShadow: '0 0 8px rgba(0, 255, 204, 0.8)'
                }}>
                  +2000 SP
                </span>
              </div>
            </div>
          </div>
        );
        } catch (err) {
          console.error('Error rendering achievement notification:', err);
          return null; // Render nothing if there's an error
        }
      })}

      {/* Quest Notifications */}
      {questNotifications.map((notification, index) => (
        <div
          key={notification.id}
          style={{
            position: 'fixed',
            top: `${200 + (achievementNotifications.length * 90) + (index * 90)}px`,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(245, 158, 11, 0.15) 100%)',
            color: '#ffffff',
            fontWeight: '600',
            fontSize: '1.1rem',
            padding: '1.2rem 2.5rem',
            borderRadius: '20px',
            boxShadow: '0 12px 40px rgba(245, 158, 11, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
            zIndex: 10000,
            textAlign: 'center',
            textShadow: '0 0 15px rgba(255, 255, 255, 0.6)',
            fontFamily: "'Orbitron', sans-serif",
            border: '1px solid rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(20px)',
            animation: 'questFadeIn 0.8s ease-out',
            pointerEvents: 'none',
            opacity: 0.9,
            transition: 'all 0.3s ease',
            letterSpacing: '0.5px'
          }}
        >
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            justifyContent: 'center'
          }}>
            <span style={{ 
              fontSize: '1.8rem',
              filter: 'drop-shadow(0 0 12px rgba(245, 158, 11, 0.8))',
              animation: 'questGlow 2s ease-in-out infinite alternate'
            }}>🎯</span>
            <span style={{
              background: 'linear-gradient(45deg, #ffffff, #fef3c7)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: '700'
            }}>{notification.message}</span>
    </div>
        </div>
      ))}
      
      <style>{`
        @keyframes achievementFadeIn {
          0% {
            opacity: 0;
            transform: translateX(-50%) scale(0.8);
            top: 120px;
          }
          20% {
            transform: translateX(-50%) scale(1.05);
          }
          100% {
            opacity: 1;
            transform: translateX(-50%) scale(1);
          }
        }
        
        @keyframes trophyGlow {
          0% {
            filter: drop-shadow(0 0 5px rgba(0, 102, 255, 0.4));
            transform: scale(1);
          }
          50% {
            filter: drop-shadow(0 0 10px rgba(0, 102, 255, 0.6));
            transform: scale(1.05);
          }
          100% {
            filter: drop-shadow(0 0 15px rgba(0, 102, 255, 0.8));
            transform: scale(1);
          }
        }
        
        @keyframes pulseScale {
          0% {
            transform: scale(0.95);
            opacity: 0.8;
          }
          100% {
            transform: scale(1.05);
            opacity: 1;
          }
        }
        
        @keyframes questFadeIn {
          0% {
            opacity: 0;
            transform: translateX(-50%) scale(0.9);
          }
          100% {
            opacity: 1;
            transform: translateX(-50%) scale(1);
          }
        }
        
        @keyframes questGlow {
          0% {
            filter: drop-shadow(0 0 8px rgba(245, 158, 11, 0.6));
          }
          100% {
            filter: drop-shadow(0 0 20px rgba(245, 158, 11, 1));
          }
        }
      `}</style>
      
      {/* Performance Monitor */}
      <PerformanceMonitor isVisible={showPerformanceMonitor} />
      
      {/* Gameplay Tester */}
      <GameplayTester 
        isVisible={showGameplayTester} 
        onScenarioStart={(scenarioName) => {
          console.log(`Achievement started: ${scenarioName}`);
        }}
      />
      {speedBonus.active && speedBonusTimeLeft > 0 && (
        <div style={{
          position: 'fixed',
          top: '7%',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          background: 'linear-gradient(90deg, rgba(0,255,204,0.18) 0%, rgba(0,255,136,0.22) 100%)',
          border: '2px solid #00ffcc',
          borderRadius: '18px',
          padding: '0.7rem 2.2rem',
          fontSize: '1.25rem',
          fontWeight: 700,
          color: '#00ffcc',
          textShadow: '0 0 12px #00ffcc88',
          boxShadow: '0 2px 24px rgba(0,255,204,0.12)',
          fontFamily: "'Orbitron', sans-serif",
          letterSpacing: '0.04em',
          backdropFilter: 'blur(8px)'
        }}>
                              🚀 SPEED BONUS! +50% SPEED ({speedBonusTimeLeft}s left)
        </div>
      )}
    </div>
    </>
  );
}

function EscapeBarEnhanced({ escapePending, onEscapeTrigger }) {
  const [tapCount, setTapCount] = React.useState(0);
  const [isEscaping, setIsEscaping] = React.useState(false);
  const [showBar, setShowBar] = React.useState(false);
  const [showMessage, setShowMessage] = React.useState(false);
  const [shake, setShake] = React.useState(false);
  const barRef = React.useRef(null);
  const escapeTimeoutRef = React.useRef(null);
  const tapTimeoutRef = React.useRef(null);
  const inactivityTimeoutRef = React.useRef(null);
  const ESCAPE_DURATION = 3000; // 3 seconds
  const TAP_RESET_TIME = 500; // 0.5 seconds to complete double tap
  const INACTIVITY_TIMEOUT = 700; // 0.7 seconds of inactivity

  // Function to reset everything and hide the UI
  const resetAndHide = () => {
    setTapCount(0);
    setShowBar(false);
    setShowMessage(false);
    setIsEscaping(false);
    setShake(false);
    if (barRef.current) {
      barRef.current.style.transition = 'none';
      barRef.current.style.width = '0%';
    }
    clearTimeout(escapeTimeoutRef.current);
    clearTimeout(tapTimeoutRef.current);
    clearTimeout(inactivityTimeoutRef.current);
  };

  // Function to start inactivity timer
  const startInactivityTimer = () => {
    clearTimeout(inactivityTimeoutRef.current);
    inactivityTimeoutRef.current = setTimeout(() => {
      resetAndHide();
    }, INACTIVITY_TIMEOUT);
  };

  // CSS for shake animation
  useEffect(() => {
    if (shake) {
      const timeout = setTimeout(() => setShake(false), 400);
      return () => clearTimeout(timeout);
    }
  }, [shake]);

  // Handle key events for double tap
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.repeat) return;
      if (e.key === 'e' || e.key === 'E') {
        setShowBar(true);
        setShowMessage(true);
        clearTimeout(tapTimeoutRef.current);
        clearTimeout(inactivityTimeoutRef.current);
        
        if (tapCount < 2) {
          setTapCount((prev) => Math.min(prev + 1, 2));
          setShake(true);
          
          if (tapCount === 1) {
            // Double tap completed - start escape sequence
            setIsEscaping(true);
            clearTimeout(tapTimeoutRef.current);
            
            // Start the escape bar animation
            if (barRef.current) {
              barRef.current.style.transition = `width ${ESCAPE_DURATION}ms linear`;
              void barRef.current.offsetWidth; // Force reflow
              barRef.current.style.width = '100%';
            }
            
            // Set timeout to trigger escape after 3 seconds
            escapeTimeoutRef.current = setTimeout(() => {
              resetAndHide();
              if (onEscapeTrigger) onEscapeTrigger();
            }, ESCAPE_DURATION + 50);
          } else {
            // First tap - set timeout to reset if no second tap
            tapTimeoutRef.current = setTimeout(() => {
              resetAndHide();
            }, TAP_RESET_TIME);
          }
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(tapTimeoutRef.current);
      clearTimeout(inactivityTimeoutRef.current);
      clearTimeout(escapeTimeoutRef.current);
    };
  }, [tapCount, onEscapeTrigger]);

  // Listen for transitionend to trigger escape
  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    const handleTransitionEnd = () => {
      if (isEscaping && tapCount === 2) {
        resetAndHide();
        if (onEscapeTrigger) onEscapeTrigger();
      }
    };
    bar.addEventListener('transitionend', handleTransitionEnd);
    return () => bar.removeEventListener('transitionend', handleTransitionEnd);
  }, [isEscaping, tapCount, onEscapeTrigger]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimeout(escapeTimeoutRef.current);
      clearTimeout(tapTimeoutRef.current);
      clearTimeout(inactivityTimeoutRef.current);
    };
  }, []);

  const barOpacity = 0.7;
  const messageOpacity = 0.7;
  const textShadow = '0 0 12px #00ffcc99, 0 0 24px #00ffcc99';

  if (!showBar) return null;

  return (
    <>
      <style>{`
        @keyframes shake {
          0% { transform: translate(-50%, -50%) translateX(0); }
          20% { transform: translate(-50%, -50%) translateX(-6px); }
          40% { transform: translate(-50%, -50%) translateX(6px); }
          60% { transform: translate(-50%, -50%) translateX(-4px); }
          80% { transform: translate(-50%, -50%) translateX(4px); }
          100% { transform: translate(-50%, -50%) translateX(0); }
        }
        .shake {
          animation: shake 0.4s;
        }
      `}</style>
      {showBar && (
        <div style={{
          position: 'fixed',
          top: '28%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0, 0, 0, 0.7)',
          border: '2px solid #00ffcc88',
          borderRadius: '10px',
          padding: '20px',
          zIndex: 1000,
          textAlign: 'center',
          opacity: barOpacity,
          minWidth: 340,
          boxShadow: '0 0 16px #00ffcc44',
          pointerEvents: 'none',
        }} className={shake && tapCount < 2 ? 'shake' : ''}>
        <div style={{ color: '#00ffcc', fontSize: '18px', marginBottom: '10px', opacity: 0.9, textShadow, fontFamily: "'Orbitron', sans-serif" }}>
          {escapePending ? 'ESCAPE SUCCESSFUL! Processing...' : (tapCount < 2 ? 'ESCAPE: Tap E again to escape' : 'ESCAPING...')}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
          {[1, 2].map((n) => (
            <div key={n} style={{
              width: 18, height: 18,
              borderRadius: '50%',
              background: tapCount >= n ? '#00ffcc' : '#222b',
              border: '2px solid #00ffcc',
              boxShadow: tapCount >= n ? '0 0 8px #00ffcc' : 'none',
              marginRight: n < 2 ? 8 : 0,
              transition: 'background 0.2s',
              opacity: 0.9
            }} />
          ))}
        </div>
        <div style={{
          width: '300px',
          height: '20px',
          background: '#333a',
          borderRadius: '10px',
          overflow: 'hidden',
          border: '1px solid #00ffcc',
          margin: '0 auto',
          opacity: 0.7
        }}>
          <div ref={barRef} style={{
            width: '0%',
            height: '100%',
            background: 'linear-gradient(90deg, #00ffcc, #00cc99)',
            opacity: 0.9
          }}></div>
        </div>

              </div>
      )}
    </>
  );
}

export default GameScreen;
            