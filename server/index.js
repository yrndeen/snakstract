const WebSocket = require('ws');
const http = require('http');
require('dotenv').config();
const { ethers } = require('ethers');
const express = require('express');
const bodyParser = require('body-parser');
let CONTRACT_ABI;
let CONTRACT_ADDRESS;
const verifiedProofs = new Map(); // address => { timestamp, wagerAmount, ... }

try {
  CONTRACT_ABI = require('../frontend/src/contract/SnakstractABI.json');
  CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
} catch (error) {
  console.error("Failed to load contract information:", error);
}

// Initialize server wallet for contract interactions
let serverWallet;
let contract;

if (process.env.RPC_URL && process.env.SERVER_PRIVATE_KEY && CONTRACT_ADDRESS) {
  try {
    const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
    serverWallet = new ethers.Wallet(process.env.SERVER_PRIVATE_KEY, provider);
    contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, serverWallet);
    console.log("Contract integration initialized");
  } catch (error) {
    console.error("Failed to initialize contract integration:", error);
  }
}

const server = http.createServer();
const wss = new WebSocket.Server({ server });

console.log('Game server starting...');

const isTestMode = process.env.NODE_ENV === 'development'; // Set based on environment

// Game state
let gameState = {
  players: {},
  orbs: [],
  gameStarted: false,
  timestamp: Date.now()
};

let nextGameId = 1;

// Helper to get a random position inside the circle boundary
function getRandomPositionInCircle(maxRadius) {
  const centerX = 6000;
  const centerY = 6000;
  let x, y, dist;
  do {
    const angle = Math.random() * 2 * Math.PI;
    const radius = Math.sqrt(Math.random()) * maxRadius;
    x = centerX + Math.cos(angle) * radius;
    y = centerY + Math.sin(angle) * radius;
    dist = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
  } while (dist > maxRadius);
  return { x: Math.floor(x), y: Math.floor(y) };
}

// Helper to check if a position is far enough from all other players
function isFarFromOtherPlayers(x, y, players, minDist) {
  for (const id in players) {
    const player = players[id];
    if (!player.segments || !player.segments[0]) continue;
    const head = player.segments[0];
    const dist = Math.sqrt(Math.pow(x - head.x, 2) + Math.pow(y - head.y, 2));
    if (dist < minDist) return false;
  }
  return true;
}

// Generate some orbs throughout the large world (all inside circle boundary)
gameState.orbs = [];
for (let i = 0; i < 1800; i++) { // Increased by 1.5x from 1200 to 1800
  // Bundled orbs: clusters of 3-5 orbs close together
  if (i < 300) { // Increased bundle count proportionally
    const bundleCenter = getRandomPositionInCircle(5990);
    const bundleSize = 3 + Math.floor(Math.random() * 3); // 3-5 orbs
    for (let j = 0; j < bundleSize; j++) {
      let orbPos;
      do {
        orbPos = getRandomPositionInCircle(5990);
      } while (Math.sqrt(Math.pow(orbPos.x - bundleCenter.x, 2) + Math.pow(orbPos.y - bundleCenter.y, 2)) > 40);
      gameState.orbs.push({
        x: orbPos.x,
        y: orbPos.y,
        color: ['#00fff7', '#ffcc00', '#ff0077', '#00ff44', '#ff6600'][Math.floor(Math.random() * 5)]
      });
    }
    i += bundleSize - 1;
  } else {
    const orbPos = getRandomPositionInCircle(5990);
    gameState.orbs.push({
      x: orbPos.x,
      y: orbPos.y,
      color: ['#00fff7', '#ffcc00', '#ff0077', '#00ff44', '#ff6600'][Math.floor(Math.random() * 5)]
    });
  }
}

// Random colors for players
const playerColors = [
  '#00ffcc', '#ff4444', '#44ff44', '#4444ff', '#ffff44', 
  '#ff44ff', '#44ffff', '#ff8844', '#8844ff', '#44ff88',
  '#ff4488', '#88ff44', '#4488ff', '#ffaa44', '#aa44ff',
  '#ff0066', '#66ff00', '#0066ff', '#ff6600', '#6600ff',
  '#00ff66', '#ff0066', '#66ff66', '#ff6666', '#6666ff',
  // Added more vibrant and unique colors
  '#39ff14', // neon green
  '#ffb347', // pastel orange
  '#b19cd9', // pastel purple
  '#ff69b4', // hot pink
  '#ffd700', // gold
  '#00bfff', // deep sky blue
  '#ff6347', // tomato
  '#adff2f', // green yellow
  '#ff1493', // deep pink
  '#7fffd4', // aquamarine
  '#e9967a', // dark salmon
  '#8a2be2', // blue violet
  '#20b2aa', // light sea green
  '#dc143c', // crimson
  '#c0c0c0', // silver
  '#222831', // dark gray
  '#f72585', // magenta
  '#4361ee', // vivid blue
  '#b5179e', // vivid purple
  '#ffbe0b', // vivid yellow
  '#3a86ff', // strong blue
  '#8338ec', // electric purple
  '#ff006e', // neon pink
  '#fb5607', // vivid orange
  '#fffcf2', // off white
  '#2ec4b6', // teal
  '#ffb4a2', // light coral
  '#6a4c93', // muted purple
  '#ffb5e8', // pastel pink
  '#d0f4de', // mint
  '#f1c40f', // sunflower
  '#e17055', // coral
  '#00b894', // green teal
  '#fdcb6e', // pastel yellow
  '#636e72', // graphite
];

// Moving orb colors for randomized moving orbs
const movingOrbColors = [
  '#ff00ff', '#ff0088', '#ff4400', '#ff8800', '#ffcc00',
  '#ffff00', '#ccff00', '#88ff00', '#44ff00', '#00ff00',
  '#00ff44', '#00ff88', '#00ffcc', '#00ffff', '#0088ff',
  '#0044ff', '#0000ff', '#4400ff', '#8800ff', '#cc00ff'
];

// Add moving orbs that give more growth (inside circle) - 45 total with enhanced movement
for (let i = 0; i < 45; i++) { // Reduced from 60 to 45 (reduced by 15)
  const orbPos = getRandomPositionInCircle(5990);
  gameState.orbs.push({
    x: orbPos.x,
    y: orbPos.y,
    color: movingOrbColors[Math.floor(Math.random() * movingOrbColors.length)], // Randomized colors
    moving: true,
    dx: (Math.random() - 0.5) * 27.75, // Increased speed by 3.7x for much faster movement
    dy: (Math.random() - 0.5) * 27.75,
    id: 'moving_' + Math.random().toString(36).substr(2, 9),
    opacity: 0.7 + Math.random() * 0.3, // Random transparency between 0.7 and 1.0
    roamTimer: Math.random() * 5000, // Random timer for direction changes
    roamInterval: 3000 + Math.random() * 4000 // Random interval between direction changes
  });
}

// Helper function to calculate SP with death penalty
function calculateSPWithDeathPenalty(player, isDeath = false) {
  const timeSurvived = Math.floor((Date.now() - player.joinedAt) / 1000);
  const minutesSurvived = Math.floor(timeSurvived / 60);
  const spFromTime = minutesSurvived * 10;
  const spFromMovingOrbs = (player?.movingOrbsEaten || 0) * 10; // 10 SP per moving orb
  const spFromNormalOrbs = (player?.normalOrbsEaten || 0) * 5; // 5 SP per normal orb
  const spFromOrbs = spFromMovingOrbs + spFromNormalOrbs;
  const spFromKills = (player?.kills || 0) * 500;
  const spFromAchievements = player?.achievementSP || 0;
  const totalSP = spFromTime + spFromOrbs + spFromKills + spFromAchievements;
  
  if (isDeath) {
    return Math.floor(totalSP * 0.5); // Deduct 50% on death
  }
  return totalSP;
}

wss.on('connection', (ws) => {
  console.log('Client connected');
  let playerId = null;

  // Store playerId on the WebSocket connection for later use
  ws.playerId = playerId;

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      // console.log('Received message from client:', data); // Debug all messages - DISABLED FOR PERFORMANCE
      
      if (data.type === 'join' && !playerId) {
        // Restrict duplicate names (except in test mode)
        const isTestMode = !!data.testMode;
        let nameTaken = false;
        if (!isTestMode) {
          for (const id in gameState.players) {
            if (gameState.players[id].name === data.name && gameState.players[id].alive) {
              nameTaken = true;
              break;
            }
          }
        }
        if (nameTaken) {
          ws.send(JSON.stringify({ type: 'error', message: 'Name already taken. Please choose another.' }));
          return;
        }
        // Remove any player with the same name (cleanup dead sessions)
        for (const id in gameState.players) {
          if (gameState.players[id].name === data.name) {
            delete gameState.players[id];
          }
        }
        playerId = Math.random().toString(36).substr(2, 9);
        
        // Update the WebSocket playerId property
        ws.playerId = playerId;
        
        // Get referrer from contract if available
        let referrer = null;
        const walletAddress = data.wallet || "0x0000000000000000000000000000000000000000";
        
        if (!isTestMode && walletAddress !== "0x0000000000000000000000000000000000000000" && contract) {
          // Check if player has a referrer in the contract
          (async () => {
            try {
              const playerDetails = await contract.getPlayerDetails(walletAddress);
              if (playerDetails && playerDetails.length >= 5 && 
                  playerDetails[4] && 
                  playerDetails[4] !== "0x0000000000000000000000000000000000000000") {
                console.log(`Player ${walletAddress} has referrer: ${playerDetails[4]}`);
                // Store referrer information
                referrer = playerDetails[4];
              }
            } catch (error) {
              console.error(`Failed to check referrer for ${walletAddress}:`, error);
            }
          })();
        }
        
        // Create player data with random color
        const randomColor = playerColors[Math.floor(Math.random() * playerColors.length)];
        gameState.players[playerId] = {
          wallet: walletAddress,
          color: randomColor,
          alive: true,
          name: data.name || "Player",
          SP: 0,
          orbsEaten: 0,
          ethOrbsEaten: 0, // Track ETH orbs separately
          movingOrbsEaten: 0,
          normalOrbsEaten: 0,
          kills: 0,
          joinedAt: Date.now(),
          sessionStartTime: Date.now(),
          wager: data.wager || 0,
          isImmuneToCollision: false,
          escapeStartTime: null,
          isEscaping: false,
          ethEarned: 0,
          achievementSP: 0, // Track achievement SP
          // Boost tracking properties
          isBoosting: false,
          boostStartTime: null,
          boostSegmentsLost: 0,
          speedBonusActive: false, // New: Track speed bonus
          speedBonusStartTime: null,
          speedBonusDuration: null,
          originalBaseSpeed: null, // New: Store original base speed
          referrer: referrer // Store referrer address if available
        };
        
        // Create snake data for the player (spawn inside circle, not on top of others)
        let spawn, attempts = 0;
        do {
          spawn = getRandomPositionInCircle(5700);
          attempts++;
        } while (!isFarFromOtherPlayers(spawn.x, spawn.y, gameState.players, 200) && attempts < 30);
        // Fallback: if too many attempts, just use last spawn
        const startX = spawn.x;
        const startY = spawn.y;
        
        // Calculate starting segments based on wager amount - WAGER-BASED STARTING SEGMENTS
        const wager = data.wager || 0;
        let startingSegments = 4; // Default minimum segments
        
        if (wager >= 0.001) {
          // Linear interpolation between 4 segments (0.001 ETH) and 30 segments (0.3 ETH)
          const minWager = 0.001;
          const maxWager = 0.3;
          const minSegments = 4;
          const maxSegments = 30;
          
          if (wager >= maxWager) {
            startingSegments = maxSegments; // Cap at 30 segments for wagers >= 0.3 ETH
          } else {
            // Linear interpolation formula
            const wagerRatio = (wager - minWager) / (maxWager - minWager);
            startingSegments = Math.floor(minSegments + wagerRatio * (maxSegments - minSegments));
          }
        }
        
        console.log(`Player ${playerId} (${data.name || 'Player'}) joined with wager: ${wager} ETH, starting segments: ${startingSegments}`);
        
        // Create segments array based on calculated starting segments
        const segments = [];
        for (let i = 0; i < startingSegments; i++) {
          segments.push({
            x: startX - (i * 20), // Each segment 20 pixels behind the previous
            y: startY
          });
        }
        
        gameState.players[playerId].segments = segments;
        gameState.players[playerId].direction = { dx: 1, dy: 0 };
        gameState.players[playerId].targetDirection = { dx: 1, dy: 0 };
        gameState.players[playerId].speed = 8.75;
        gameState.players[playerId].baseSpeed = 8.75;
        gameState.players[playerId].deathTime = null;
        
        // Send player ID back
        ws.send(JSON.stringify({
          type: 'joined',
          playerId: playerId,
          state: gameState
        }));
        // Broadcast updated state to all clients
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'state',
              data: gameState
            }));
          }
        });
        console.log('Player joined successfully');
      }
      
      if (data.type === 'move' && playerId && gameState.players[playerId]) {
        // Update snake direction
        gameState.players[playerId].targetDirection = data.direction;
        // console.log('Player moved:', data.direction); // DISABLED FOR PERFORMANCE
      }
      
      if (data.type === 'boost' && playerId && gameState.players[playerId]) {
        const player = gameState.players[playerId];
        
        if (data.active && !player.isBoosting) {
          // Boost starting
          player.isBoosting = true;
          player.boostStartTime = Date.now();
          // console.log(`Player ${playerId} started boosting`);
        } else if (!data.active && player.isBoosting) {
          // Boost ending
          player.isBoosting = false;
          // console.log(`Player ${playerId} ended boosting`);
          
          // Reset boost tracking
          player.boostStartTime = null;
        }
      }
      
      if (data.type === 'removeSegment' && playerId && gameState.players[playerId]) {
        const player = gameState.players[playerId];
        // Remove one segment if player has more than 4 segments
        if (player.segments.length > 4) {
          player.segments.pop();
          player.boostSegmentsLost = (player.boostSegmentsLost || 0) + 1;
          // console.log(`Player ${playerId} lost 1 segment from boost. Remaining: ${player.segments.length}`);
        }
      }
      
      if (data.type === 'achievementSP' && playerId && gameState.players[playerId]) {
        // Update player's achievement SP
        gameState.players[playerId].achievementSP = data.achievementSP || 0;
        // console.log(`Player ${playerId} achievement SP updated to: ${data.achievementSP}`); // DISABLED FOR PERFORMANCE
      }
      
      if (data.type === 'escapeStart' && playerId && gameState.players[playerId]) {
        console.log('Player starting escape - granting immunity');
        // Grant immunity when escape starts (2.5 seconds after double-tap)
        gameState.players[playerId].escapeStartTime = Date.now();
        gameState.players[playerId].isImmuneToCollision = true;
        // Block movement and updates for escaping player
        gameState.players[playerId].isEscaping = true;
      }
      
      if (data.type === 'escape' && playerId && gameState.players[playerId]) {
        console.log('Player escaped');
        // Handle player escape completion (3 seconds after double-tap)
        console.log(`Player ${playerId} escape completed`);
        console.log('Current player state:', gameState.players[playerId]);
        
        // Gather session stats
        const player = gameState.players[playerId];
        console.log('Player data for escape:', player);
        
        // Check for any pending ETH rewards from expired orbs
        let pendingEthRewards = 0;
        if (gameState.escapedPlayerRewards && player.wallet) {
          pendingEthRewards = gameState.escapedPlayerRewards[player.wallet] || 0;
          if (pendingEthRewards > 0) {
            // Add pending rewards to player's ethEarned
            player.ethEarned = (player.ethEarned || 0) + pendingEthRewards;
            console.log(`Player ${playerId} (${player.wallet}) received ${pendingEthRewards} ETH from expired orbs before escape`);
            // Clear the pending rewards
            delete gameState.escapedPlayerRewards[player.wallet];
          }
        }
        
        // Call contract's escapeGame function via server wallet
        const isTestMode = process.env.NODE_ENV === 'development';
        if (!isTestMode && player.wallet && 
            player.wallet !== "0x0000000000000000000000000000000000000000" && 
            contract && serverWallet) {
          // Use an immediately invoked async function to handle contract interaction
          (async () => {
            try {
              console.log(`Server calling escapeGame for ${player.wallet}`);
              
              // Call escapeGame for the player
              // We use callStatic first to check if the call would succeed
              await contract.callStatic.escapeGame({from: serverWallet.address});
              
              // Create a transaction with gasPrice and gasLimit
              const tx = await contract.populateTransaction.escapeGame();
              tx.gasPrice = await serverWallet.provider.getGasPrice();
              tx.gasLimit = ethers.utils.hexlify(300000); // Adjust as needed
              
              // Send the transaction
              const response = await serverWallet.sendTransaction(tx);
              console.log(`escapeGame transaction sent: ${response.hash}`);
              
              // Don't wait for confirmation to avoid delaying the player's experience
            } catch (error) {
              console.error(`Failed to call escapeGame for ${player.wallet}:`, error);
              // Don't block the escape process if the contract call fails
            }
          })();
        }
        
        const timeSurvived = player ? Math.floor((Date.now() - player.joinedAt) / 1000) : 0;
        const minutesSurvived = Math.floor(timeSurvived / 60);
        const spFromTime = minutesSurvived * 10;
        const spFromMovingOrbs = (player?.movingOrbsEaten || 0) * 10; // 10 SP per moving orb
        const spFromNormalOrbs = (player?.normalOrbsEaten || 0) * 5; // 5 SP per normal orb
        const spFromOrbs = spFromMovingOrbs + spFromNormalOrbs;
        const spFromKills = (player?.kills || 0) * 500;
        const spFromAchievements = player?.achievementSP || 0;
        const totalSP = spFromTime + spFromOrbs + spFromKills + spFromAchievements;
        
        console.log('Escape stats calculation:', {
          timeSurvived,
          minutesSurvived,
          spFromTime,
          orbsEaten: player?.orbsEaten || 0,
          spFromOrbs,
          kills: player?.kills || 0,
          spFromKills,
          spFromAchievements,
          totalSP
        });
        
        // On escape or death message from client, use achievements field from client
        const achievementCount = typeof data.achievements === 'number' ? data.achievements : 0;
        
        const sessionStats = {
          gameId: Math.floor(Math.random() * 1000000),
          timeSurvived: Math.floor((Date.now() - player.sessionStartTime) / 1000),
          orbsEaten: player?.orbsEaten || 0,
          ethEarned: player?.ethEarned || 0,
          kills: player?.kills || 0,
          SP: totalSP,
          result: 'escape',
          stake: 'N/A',
          profit: 'N/A',
          sp: totalSP,
          tx: 'N/A',
          TX: 'N/A',
          wallet: player?.wallet || playerId,
          name: player?.name || `Player ${playerId.slice(0, 6)}`,
          sessionStartTime: player?.sessionStartTime || Date.now(),
          killedBy: null,
          deathType: 'boundary',
          spFromAchievements: spFromAchievements,
          achievements: achievementCount
        };
        console.log('Sending escape stats:', sessionStats);
        
        // Update leaderboard
        try {
          const fs = require('fs');
          let leaderboard = { players: {} };
          if (fs.existsSync('./leaderboard.json')) {
            const fileContent = fs.readFileSync('./leaderboard.json', 'utf8');
            if (fileContent.trim()) {
              try {
                leaderboard = JSON.parse(fileContent);
              } catch (parseError) {
                console.error('Corrupted leaderboard.json, resetting to default');
                leaderboard = { players: {} };
              }
            }
          }
          const wallet = (sessionStats.wallet || playerId).toLowerCase();
          leaderboard.players = leaderboard.players || {};
          // Remove any leaderboard entries for this wallet that are not keyed by the wallet address
          for (const key of Object.keys(leaderboard.players)) {
            if (
              leaderboard.players[key].wallet &&
              leaderboard.players[key].wallet.toLowerCase() === wallet &&
              key !== wallet
            ) {
              delete leaderboard.players[key];
            }
          }
          if (!leaderboard.players[wallet]) {
            leaderboard.players[wallet] = {
              SP: 0,
              orbsEaten: 0,
              ethEarned: 0,
              kills: 0,
              timeSurvived: 0,
              name: sessionStats.name,
              wallet: wallet,
              gamesPlayed: 0,
              winCount: 0,
              profit: 'N/A',
              achievementSP: 0,
              achievements: 0
            };
          }
          leaderboard.players[wallet].SP += sessionStats.SP || 0;
          leaderboard.players[wallet].orbsEaten += sessionStats.orbsEaten || 0;
          leaderboard.players[wallet].ethEarned += sessionStats.ethEarned || 0;
          leaderboard.players[wallet].kills += sessionStats.kills || 0;
          leaderboard.players[wallet].timeSurvived += sessionStats.timeSurvived || 0;
          leaderboard.players[wallet].gamesPlayed = (leaderboard.players[wallet].gamesPlayed || 0) + 1;
          leaderboard.players[wallet].name = sessionStats.name;
          leaderboard.players[wallet].wallet = wallet;
          leaderboard.players[wallet].achievementSP += sessionStats.spFromAchievements || 0;
          leaderboard.players[wallet].achievements += achievementCount;
          if (sessionStats.result === 'escape') {
            leaderboard.players[wallet].winCount = (leaderboard.players[wallet].winCount || 0) + 1;
          }
          fs.writeFileSync('./leaderboard.json', JSON.stringify(leaderboard, null, 2));
        } catch (e) { console.error('Leaderboard update failed', e); }
        
        // Send escape notification to the player
        console.log(`Sending escape message to player ${playerId}`);
        ws.send(JSON.stringify({
          type: 'escape',
          playerId: playerId,
          ...sessionStats
        }));
        
        // Update history
        try {
          const fs = require('fs');
          const historyPath = './history.json';
          let history = [];
          if (fs.existsSync(historyPath)) {
            const fileContent = fs.readFileSync(historyPath, 'utf8');
            if (fileContent.trim()) {
              try {
                history = JSON.parse(fileContent);
              } catch (parseError) {
                console.error('Corrupted history.json, resetting to default');
                history = [];
              }
            }
          }
          history.push({
            id: sessionStats.gameId,
            time: sessionStats.timeSurvived,
            stake: sessionStats.stake,
            result: sessionStats.result,
            profit: sessionStats.profit,
            sp: sessionStats.sp,
            kills: sessionStats.kills || 0,
            tx: sessionStats.tx,
            wallet: (sessionStats.wallet || playerId).toLowerCase(),
            timestamp: Date.now(),
            dateTime: new Date().toLocaleString('en-GB', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            }),
            achievementSP: sessionStats.spFromAchievements || 0,
            achievements: typeof sessionStats.achievements === 'number' ? sessionStats.achievements : 0
          });
          fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
        } catch (e) { console.error('History update failed', e); }
        
        // Remove player from state immediately after sending escape message
        delete gameState.players[playerId];
        playerId = null;
        ws.playerId = null;
        console.log(`Player ${playerId} successfully escaped and removed from game`);
      }
      
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });
  
  ws.on('close', () => {
    if (playerId) {
      if (gameState.players[playerId]) {
        delete gameState.players[playerId];
      }
      // Broadcast updated state to all clients
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'state',
            data: gameState
          }));
        }
      });
      console.log(`Player ${playerId} disconnected and removed.`);
    } else {
      console.log('Client disconnected');
    }
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Game loop - update snake positions
function gameLoop() {
  // Clean up expired kill rewards
  for (const playerId in gameState.players) {
    const player = gameState.players[playerId];
    if (player.killRewardActive && player.killRewardStartTime && player.killRewardDuration) {
      const timeSinceKill = Date.now() - player.killRewardStartTime;
      if (timeSinceKill >= player.killRewardDuration) {
        // Kill reward expired, remove it
        player.killRewardActive = false;
        player.killRewardStartTime = null;
        player.killRewardDuration = null;
        console.log(`Player ${playerId} kill reward expired after ${timeSinceKill}ms`);
      } else {
        console.log(`Player ${playerId} kill reward still active: ${timeSinceKill}ms remaining`);
      }
    }
  }

  // Clean up expired ETH orbs and distribute remaining ETH
  const currentTime = Date.now();
  const expiredEthOrbs = [];
  const ethOrbGroups = {}; // Group orbs by killer for distribution

  for (let i = gameState.orbs.length - 1; i >= 0; i--) {
    const orb = gameState.orbs[i];
    if (orb.isEthOrb && orb.expirationTime && currentTime >= orb.expirationTime) {
      // ETH orb has expired - convert to normal orb instead of removing
      if (!orb.convertedToNormal) {
        orb.convertedToNormal = true;
        orb.isExpired = true; // Mark as expired for frontend
        orb.isEthOrb = false; // No longer an ETH orb
        orb.ethValue = 0; // Remove ETH value
        console.log(`ETH orb ${orb.id} expired, converting to normal orb`);
        
        // Group by killer for distribution of remaining ETH
        if (orb.killerId && orb.totalEthValue) {
          if (!ethOrbGroups[orb.killerId]) {
            ethOrbGroups[orb.killerId] = {
              killerId: orb.killerId,
              totalEthValue: 0,
              collectedEthValue: 0
            };
          }
          ethOrbGroups[orb.killerId].totalEthValue += orb.totalEthValue;
        }
      }
    }
  }

  // Distribute remaining ETH from expired orbs
  for (const killerId in ethOrbGroups) {
    const group = ethOrbGroups[killerId];
    const remainingEth = group.totalEthValue - group.collectedEthValue;
    
    if (remainingEth > 0) {
      if (killerId && killerId !== 'null') {
        // 70% goes to killer, 30% goes to treasury (player kill)
        const killerShare = remainingEth * 0.7;
        const treasuryShare = remainingEth * 0.3;
        
        // Find the killer's wallet address from the orbs
        const killerWallet = gameState.orbs.find(orb => 
          orb.killerId === killerId && orb.killerWallet
        )?.killerWallet;
        
        // Give 70% to killer (even if they've escaped)
        if (killerWallet) {
          // If killer is still in game, add to their ethEarned
          if (gameState.players[killerId]) {
            gameState.players[killerId].ethEarned = (gameState.players[killerId].ethEarned || 0) + killerShare;
            console.log(`Player ${killerId} (${killerWallet}) received ${killerShare} ETH from expired orbs`);
          } else {
            // Killer has escaped - add to their smart contract balance for history tab
            // This will be tracked in the session history and can be claimed later
            console.log(`Escaped player ${killerWallet} received ${killerShare} ETH from expired orbs - will be claimable in history`);
            
            // Store this for the history tab claim system
            if (!gameState.escapedPlayerRewards) {
              gameState.escapedPlayerRewards = {};
            }
            if (!gameState.escapedPlayerRewards[killerWallet]) {
              gameState.escapedPlayerRewards[killerWallet] = 0;
            }
            gameState.escapedPlayerRewards[killerWallet] += killerShare;
            
            // Also update the history file to include this pending reward
            try {
              const fs = require('fs');
              const historyPath = './history.json';
              let history = [];
              if (fs.existsSync(historyPath)) {
                const fileContent = fs.readFileSync(historyPath, 'utf8');
                if (fileContent.trim()) {
                  try {
                    history = JSON.parse(fileContent);
                  } catch (parseError) {
                    console.error('Corrupted history.json, resetting to default');
                    history = [];
                  }
                }
              }
              
              // Find the most recent escape entry for this wallet and update it
              const walletLower = killerWallet.toLowerCase();
              for (let i = history.length - 1; i >= 0; i--) {
                if (history[i].wallet === walletLower && history[i].result === 'escape') {
                  // Update the ethEarned in the history entry
                  history[i].ethEarned = (history[i].ethEarned || 0) + killerShare;
                  history[i].pendingRewards = (history[i].pendingRewards || 0) + killerShare;
                  console.log(`Updated history entry for ${killerWallet} with ${killerShare} ETH from expired orbs`);
                  break;
                }
              }
              
              fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
            } catch (e) { 
              console.error('History update for escaped player rewards failed', e); 
            }
          }
        }
        
        // 30% goes to treasury (you can implement treasury logic here)
        console.log(`Treasury received ${treasuryShare} ETH from expired orbs`);
      } else {
        // 100% goes to treasury (boundary death, no killer)
        const treasuryShare = remainingEth;
        console.log(`Treasury received ${treasuryShare} ETH from expired orbs (boundary death)`);
        // (implement treasury logic here if needed)
      }
    }
  }

  // Update snake positions
  for (const playerId in gameState.players) {
    const player = gameState.players[playerId];
    // Block movement and updates if player is escaping
    if (player.isEscaping) continue;
    if (!player.alive) continue;
    
    // Smoothly update direction toward target direction
    if (player.targetDirection) {
      // Interpolate direction for sharp turning
      const turnRate = 0.35; // Sharper turning
      player.direction.dx += (player.targetDirection.dx - player.direction.dx) * turnRate;
      player.direction.dy += (player.targetDirection.dy - player.direction.dy) * turnRate;
      // Normalize
      const len = Math.sqrt(player.direction.dx ** 2 + player.direction.dy ** 2);
      if (len > 0) {
        player.direction.dx /= len;
        player.direction.dy /= len;
      }
    }
    
    // Calculate speed scaling based on segments and boost
    const segmentCount = player.segments.length;
    const segmentSpeedBonus = Math.floor(segmentCount / 30) * 0.02; // 2% per 30 segments
    const baseSpeedWithBonus = player.baseSpeed * (1 + segmentSpeedBonus);
    
    // Apply boost speed increase (2.5x faster)
    if (player.isBoosting) {
      player.speed = baseSpeedWithBonus * 2.5; // 2.5x boost speed increase
    } else {
      player.speed = baseSpeedWithBonus;
    }
    
    // Move snake head
    const head = player.segments[0];
    const newHead = {
      x: head.x + player.direction.dx * player.speed,
      y: head.y + player.direction.dy * player.speed
    };
    // --- Bounded world: die if out of circular boundary ---
    const centerX = 6000;
    const centerY = 6000;
    const distanceFromCenter = Math.sqrt(
      Math.pow(newHead.x - centerX, 2) + Math.pow(newHead.y - centerY, 2)
    );
    if (distanceFromCenter > 5990 && !player.isImmuneToCollision) {
      player.alive = false;
      // Create ETH orbs from the dead snake
      const playerStake = player.stake || 0; // Get player's stake (the one who died)
      const playerCollectedEth = player.ethEarned || 0; // Get ETH collected from other players
      const totalEthToDrop = playerStake + playerCollectedEth; // Total ETH to drop (stake + collected)
      const segmentSize = 12 + player.segments.length * 0.14; // Calculate segment size based on player's segment count
      const ethOrbs = player.segments.map((segment, index) => ({
        x: segment.x,
        y: segment.y,
        color: '#00ffcc',
        isEthOrb: true, // Mark as ETH orb
        ethValue: totalEthToDrop / player.segments.length, // Split total ETH among segments
        size: segmentSize, // Make ETH orbs the same size as the dead player's segments
          id: Math.random().toString(36).substr(2, 9),
        creationTime: Date.now(), // Track when orb was created
        expirationTime: Date.now() + 40000, // 40 seconds from creation
        killerId: null, // Track who killed the player
        killerWallet: null, // Track killer's wallet address
        totalEthValue: totalEthToDrop // Track total ETH value for distribution
      }));
      gameState.orbs.push(...ethOrbs);
      // Gather session stats
      const timeSurvived = player ? Math.floor((Date.now() - player.joinedAt) / 1000) : 0;
      const minutesSurvived = Math.floor(timeSurvived / 60);
      const spFromTime = minutesSurvived * 10;
      const spFromMovingOrbs = (player?.movingOrbsEaten || 0) * 10; // 10 SP per moving orb
      const spFromNormalOrbs = (player?.normalOrbsEaten || 0) * 5; // 5 SP per normal orb
      const spFromOrbs = spFromMovingOrbs + spFromNormalOrbs;
      const spFromKills = (player?.kills || 0) * 500;
      const spFromAchievements = player?.achievementSP || 0;
      const totalSP = spFromTime + spFromOrbs + spFromKills + spFromAchievements;
      const finalSP = Math.floor(totalSP * 0.5); // Deduct 50% on death
      
      // On escape or death message from client, use achievements field from client
      const achievementCount = player.achievements ? Object.values(player.achievements).filter(Boolean).length : (player.achievementSP ? Math.floor(player.achievementSP / 2000) : 0);
      
      const sessionStats = {
        gameId: Math.floor(Math.random() * 1000000),
        timeSurvived: Math.floor((Date.now() - player.sessionStartTime) / 1000),
        orbsEaten: player?.orbsEaten || 0,
        ethEarned: player?.ethEarned || 0,
        kills: player?.kills || 0,
        SP: finalSP,
        originalSP: totalSP, // Keep original for display
        result: 'death',
        stake: 'N/A',
        profit: 'N/A',
        sp: finalSP,
        tx: 'N/A',
        TX: 'N/A',
        wallet: player?.wallet || playerId,
        name: player?.name || `Player ${playerId.slice(0, 6)}`,
        sessionStartTime: player?.sessionStartTime || Date.now(),
        killedBy: null,
        deathType: 'boundary',
        spFromAchievements: spFromAchievements,
        achievements: achievementCount
      };
      if (isTestMode) {
        sessionStats.TX = 'N/A';
        sessionStats.profit = 'N/A';
      } else {
        if (typeof sessionStats.winnings === 'number' && typeof sessionStats.wager === 'number') {
          sessionStats.profit = sessionStats.winnings - sessionStats.wager;
        } else {
          sessionStats.profit = 'N/A';
        }
      }
      // Update leaderboard
      try {
        const fs = require('fs');
        let leaderboard = { players: {} };
        if (fs.existsSync('./leaderboard.json')) {
          const fileContent = fs.readFileSync('./leaderboard.json', 'utf8');
          if (fileContent.trim()) {
            try {
              leaderboard = JSON.parse(fileContent);
            } catch (parseError) {
              console.error('Corrupted leaderboard.json, resetting to default');
              leaderboard = { players: {} };
            }
          }
        }
        const wallet = (sessionStats.wallet || playerId).toLowerCase();
        leaderboard.players = leaderboard.players || {};
        // Remove any leaderboard entries for this wallet that are not keyed by the wallet address
        for (const key of Object.keys(leaderboard.players)) {
          if (
            leaderboard.players[key].wallet &&
            leaderboard.players[key].wallet.toLowerCase() === wallet &&
            key !== wallet
          ) {
            delete leaderboard.players[key];
          }
        }
        if (!leaderboard.players[wallet]) {
          leaderboard.players[wallet] = {
            SP: 0,
            orbsEaten: 0,
            ethEarned: 0,
            kills: 0,
            timeSurvived: 0,
            name: sessionStats.name,
            wallet: wallet,
            gamesPlayed: 0,
            winCount: 0,
            profit: 'N/A',
            achievementSP: 0,
            achievements: 0
          };
        }
        leaderboard.players[wallet].SP += sessionStats.SP || 0;
        leaderboard.players[wallet].orbsEaten += sessionStats.orbsEaten || 0;
        leaderboard.players[wallet].ethEarned += sessionStats.ethEarned || 0;
        leaderboard.players[wallet].kills += sessionStats.kills || 0;
        leaderboard.players[wallet].timeSurvived += sessionStats.timeSurvived || 0;
        leaderboard.players[wallet].gamesPlayed = (leaderboard.players[wallet].gamesPlayed || 0) + 1;
        leaderboard.players[wallet].name = sessionStats.name;
        leaderboard.players[wallet].wallet = wallet;
        leaderboard.players[wallet].achievementSP += sessionStats.spFromAchievements || 0;
        leaderboard.players[wallet].achievements += achievementCount;
        if (sessionStats.result === 'escape') {
          leaderboard.players[wallet].winCount = (leaderboard.players[wallet].winCount || 0) + 1;
        }
        fs.writeFileSync('./leaderboard.json', JSON.stringify(leaderboard, null, 2));
      } catch (e) { console.error('Leaderboard update failed', e); }
      // Update history
      try {
        const fs = require('fs');
        const historyPath = './history.json';
        let history = [];
        if (fs.existsSync(historyPath)) {
          const fileContent = fs.readFileSync(historyPath, 'utf8');
          if (fileContent.trim()) {
            try {
              history = JSON.parse(fileContent);
            } catch (parseError) {
              console.error('Corrupted history.json, resetting to default');
              history = [];
            }
          }
        }
        history.push({
          id: sessionStats.gameId,
          time: sessionStats.timeSurvived,
          stake: sessionStats.stake,
          result: sessionStats.result,
          profit: sessionStats.profit,
          sp: sessionStats.sp,
          kills: sessionStats.kills || 0,
          tx: sessionStats.tx,
          wallet: (sessionStats.wallet || playerId).toLowerCase(),
          timestamp: Date.now(),
          dateTime: new Date().toLocaleString('en-GB', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          }),
          achievementSP: sessionStats.spFromAchievements || 0,
          achievements: typeof sessionStats.achievements === 'number' ? sessionStats.achievements : 0
        });
        fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
      } catch (e) { console.error('History update failed', e); }
      // Immediately notify the client of death with stats
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN && client.playerId === playerId) {
          console.log(`Sending death message to player ${playerId}`);
          client.send(JSON.stringify({
            type: 'death',
            playerId: playerId,
            ...sessionStats
          }));
        }
      });
      // Remove player from state
      delete gameState.players[playerId];
      continue;
    }
    // Add new head
    player.segments.unshift(newHead);
    
    // Remove tail (keep snake length)
    if (player.segments.length > 4) {
      player.segments.pop();
    }

    // Boost segment consumption is now handled when boost ends in the message handler

    // Update moving orbs positions
    for (let i = 0; i < gameState.orbs.length; i++) {
      const orb = gameState.orbs[i];
      if (orb.moving) {
        // Update roam timer and change direction randomly
        orb.roamTimer += 50; // Increment timer (assuming 50ms game loop)
        if (orb.roamTimer >= orb.roamInterval) {
          // Change direction randomly
          const newAngle = Math.random() * 2 * Math.PI;
          const speed = Math.sqrt(orb.dx * orb.dx + orb.dy * orb.dy);
          orb.dx = Math.cos(newAngle) * speed;
          orb.dy = Math.sin(newAngle) * speed;
          orb.roamTimer = 0;
          orb.roamInterval = 3000 + Math.random() * 4000; // New random interval
        }
        
        // Update position based on velocity
        orb.x += orb.dx;
        orb.y += orb.dy;
        
        // Bounce off world boundaries (circular boundary)
        const centerX = 6000;
        const centerY = 6000;
        const distanceFromCenter = Math.sqrt(
          Math.pow(orb.x - centerX, 2) + Math.pow(orb.y - centerY, 2)
        );
        
        if (distanceFromCenter > 5980) { // Slightly inside the death boundary
          // Bounce back towards center
          const angle = Math.atan2(orb.y - centerY, orb.x - centerX);
          const bounceDistance = 5980 - distanceFromCenter;
          orb.x = centerX + Math.cos(angle) * 5980;
          orb.y = centerY + Math.sin(angle) * 5980;
          
          // Reverse velocity component that's pointing outward
          const normalX = Math.cos(angle);
          const normalY = Math.sin(angle);
          const dotProduct = orb.dx * normalX + orb.dy * normalY;
          if (dotProduct > 0) {
            orb.dx -= 2 * dotProduct * normalX;
            orb.dy -= 2 * dotProduct * normalY;
          }
          
          // Add some randomness to prevent getting stuck
          orb.dx += (Math.random() - 0.5) * 0.5;
          orb.dy += (Math.random() - 0.5) * 0.5;
          
          // Normalize velocity to maintain consistent speed
          const speed = Math.sqrt(orb.dx * orb.dx + orb.dy * orb.dy);
          if (speed > 0) {
            orb.dx = (orb.dx / speed) * 27.75; // Increased speed by 3.7x for much faster movement
            orb.dy = (orb.dy / speed) * 27.75;
          }
        }
      }
    }

    // Calculate real-time SP for this player
    const timeSurvived = Math.floor((Date.now() - player.joinedAt) / 1000);
    const minutesSurvived = Math.floor(timeSurvived / 60);
    const spFromTime = minutesSurvived * 10;
    const spFromMovingOrbs = (player?.movingOrbsEaten || 0) * 10; // 10 SP per moving orb
    const spFromNormalOrbs = (player?.normalOrbsEaten || 0) * 5; // 5 SP per normal orb
    const spFromOrbs = spFromMovingOrbs + spFromNormalOrbs;
    const spFromKills = (player?.kills || 0) * 500;
    const spFromAchievements = player?.achievementSP || 0;
    const totalSP = spFromTime + spFromOrbs + spFromKills + spFromAchievements;
    player.SP = totalSP;

    // Check for orb collision
    for (let i = gameState.orbs.length - 1; i >= 0; i--) {
      const orb = gameState.orbs[i];
      
      // Remove orbs outside the circular boundary
      const centerX = 6000;
      const centerY = 6000;
      const orbDistanceFromCenter = Math.sqrt(
        Math.pow(orb.x - centerX, 2) + Math.pow(orb.y - centerY, 2)
      );
      
      // Remove orbs that are outside the boundary (5990 radius)
      if (orbDistanceFromCenter > 5990) {
        gameState.orbs.splice(i, 1);
        continue; // Skip collision check for removed orb
      }
      
      // Calculate collision radius based on snake size - 45% REDUCTION
      // Base radius is 11 (reduced from 15), increases by 1 for every 10 segments beyond the initial 4 (reduced from 8 to 10 for more gradual growth)
      const baseRadius = 11; // Reduced from 15 to 11 (45% reduction)
      const sizeBonus = Math.max(0, Math.floor((player.segments.length - 4) / 10)); // Changed from 8 to 10 segments
      let collisionRadius = baseRadius + sizeBonus;
      
      // Apply kill reward: 2.4x orb pickup radius if active
      if (player.killRewardActive && player.killRewardStartTime && player.killRewardDuration) {
        const timeSinceKill = Date.now() - player.killRewardStartTime;
        if (timeSinceKill < player.killRewardDuration) {
          collisionRadius *= 2.4; // 2.4x orb pickup radius
        } else {
          // Kill reward expired, remove it
          player.killRewardActive = false;
          player.killRewardStartTime = null;
          player.killRewardDuration = null;
        }
      }
      
      const distance = Math.sqrt(
        Math.pow(newHead.x - orb.x, 2) + Math.pow(newHead.y - orb.y, 2)
      );
      
      // Calculate effective collision radius - include orb size for ETH orbs
      let effectiveCollisionRadius = collisionRadius;
      if (orb.isEthOrb && orb.size) {
        // For ETH orbs, add the orb's size to the collision radius
        effectiveCollisionRadius = collisionRadius + (orb.size * 0.5); // Scale orb size for collision
      }
      
      if (distance < effectiveCollisionRadius) {
        // Consume the orb
        const consumedOrb = gameState.orbs.splice(i, 1)[0];
        // Player ate an orb - give more SP for moving orbs since they're harder to catch
        const spGain = consumedOrb.moving ? 10 : 5; // Moving orbs give 10 SP, normal orbs give 5 SP
          gameState.players[playerId].orbsEaten = (gameState.players[playerId].orbsEaten || 0) + 1;
        
        // Track orb types separately for SP calculation
        if (consumedOrb.moving) {
          gameState.players[playerId].movingOrbsEaten = (gameState.players[playerId].movingOrbsEaten || 0) + 1;
          // 70% chance for 50% speed bonus for 40s
          if (Math.random() < 0.7) {
            const now = Date.now();
            gameState.players[playerId].speedBonusActive = true;
            gameState.players[playerId].speedBonusStartTime = now;
            gameState.players[playerId].speedBonusDuration = 40000; // 40 seconds
            // Store original speed if not already stored
            if (!gameState.players[playerId].originalBaseSpeed) {
              gameState.players[playerId].originalBaseSpeed = gameState.players[playerId].baseSpeed || 8.75;
            }
            // Apply 50% speed bonus
            gameState.players[playerId].baseSpeed = gameState.players[playerId].originalBaseSpeed * 1.5;
            console.log(`Player ${playerId} received 50% speed bonus for 40s from moving orb!`);
          }
        } else {
          gameState.players[playerId].normalOrbsEaten = (gameState.players[playerId].normalOrbsEaten || 0) + 1;
        }
        
        // Remove ETH tracking from regular orbs - ETH only comes from ETH orbs dropped by dead players
        console.log(`Player ${playerId} ate ${consumedOrb.moving ? 'moving' : 'normal'} orb. New orbsEaten: ${gameState.players[playerId].orbsEaten}. SP gained: ${spGain}. Collision radius: ${collisionRadius} (${player.segments.length} segments) - 45% REDUCTION ACTIVE`);
        
              // Check if this is an ETH orb (from dead player) that hasn't been converted to normal
      if (consumedOrb.isEthOrb && !consumedOrb.convertedToNormal) {
        // Track ETH orbs separately for sound effects
        gameState.players[playerId].ethOrbsEaten = (gameState.players[playerId].ethOrbsEaten || 0) + 1;
        
        // Check if ETH orb has expired
        const currentTime = Date.now();
        const isExpired = consumedOrb.expirationTime && currentTime >= consumedOrb.expirationTime;
        
        if (!isExpired) {
          // ETH orb is still active - give ETH value
          gameState.players[playerId].ethEarned = (gameState.players[playerId].ethEarned || 0) + consumedOrb.ethValue;
          console.log(`Player ${playerId} collected ETH orb. New ethEarned: ${gameState.players[playerId].ethEarned}`);
          
          // Track collected ETH to prevent double counting when orbs expire
          if (consumedOrb.killerId && consumedOrb.totalEthValue) {
            // Mark this orb as collected by updating the total value
            consumedOrb.collectedEthValue = consumedOrb.ethValue;
          }
          
          // Also call contract to record ETH orb winnings
          const isTestMode = process.env.NODE_ENV === 'development';
          const player = gameState.players[playerId];
          if (!isTestMode && player.wallet && 
              player.wallet !== "0x0000000000000000000000000000000000000000" && 
              contract && serverWallet) {
            
            // Use an immediately invoked async function to handle contract interaction
            (async () => {
              try {
                // Convert ETH value to wei
                const ethValueWei = ethers.utils.parseEther(consumedOrb.ethValue.toString());
                
                console.log(`Server calling addEthOrbWinnings for ${player.wallet}: ${consumedOrb.ethValue} ETH`);
                
                // Call addEthOrbWinnings for the player
                await contract.callStatic.addEthOrbWinnings(player.wallet, ethValueWei, {from: serverWallet.address});
                
                // Create a transaction
                const tx = await contract.populateTransaction.addEthOrbWinnings(player.wallet, ethValueWei);
                tx.gasPrice = await serverWallet.provider.getGasPrice();
                tx.gasLimit = ethers.utils.hexlify(250000);
                
                // Send the transaction
                const response = await serverWallet.sendTransaction(tx);
                console.log(`addEthOrbWinnings transaction sent: ${response.hash}`);
              } catch (error) {
                console.error(`Failed to call addEthOrbWinnings for ${player.wallet}:`, error);
                // Continue with the game flow even if contract call fails
              }
            })();
          }
        } else {
          // ETH orb has expired - no ETH value given
          console.log(`Player ${playerId} collected expired ETH orb - no ETH value given`);
        }
      }
        // Grow snake based on orb type
        const tail = player.segments[player.segments.length - 1];
        if (consumedOrb.moving) {
          // Moving orbs: 3-4 segments randomly
          const segmentsToAdd = Math.floor(Math.random() * 2) + 3; // Random number between 3-4
          for (let k = 0; k < segmentsToAdd; k++) player.segments.push({ x: tail.x, y: tail.y });
        } else {
          // Normal orbs: 1.25 segments
          const segmentsToAdd = 1.25;
          for (let k = 0; k < Math.floor(segmentsToAdd); k++) player.segments.push({ x: tail.x, y: tail.y });
          // Add half segment randomly (30% chance)
          if (Math.random() < 0.3) {
            player.segments.push({ x: tail.x, y: tail.y });
          }
        }
        // Respawn orb after 10-14s
        setTimeout(() => {
          if (consumedOrb.moving) {
            gameState.orbs.push({
              x: Math.floor(Math.random() * 12000),
              y: Math.floor(Math.random() * 12000),
              color: movingOrbColors[Math.floor(Math.random() * movingOrbColors.length)], // Use randomized colors
              moving: true,
              dx: (Math.random() - 0.5) * 27.75, // Increased speed by 3.7x for much faster movement
              dy: (Math.random() - 0.5) * 27.75,
              id: 'moving_' + Math.random().toString(36).substr(2, 9),
              opacity: 0.7 + Math.random() * 0.3, // Random transparency
              roamTimer: Math.random() * 5000, // Random timer for direction changes
              roamInterval: 3000 + Math.random() * 4000 // Random interval between direction changes
            });
          } else {
            gameState.orbs.push({
              x: Math.floor(Math.random() * 12000),
              y: Math.floor(Math.random() * 12000),
              color: consumedOrb.color,
              id: Math.random().toString(36).substr(2, 9),
              size: Math.max(8, Math.min(64, player.segments.length * 1.5)),
              creationTime: Date.now(), // Track when orb was created
              expirationTime: Date.now() + 40000, // 40 seconds from creation
              killerId: null, // Track who killed the player
              killerWallet: null, // Track killer's wallet address
              totalEthValue: consumedOrb.ethValue // Track total ETH value for distribution
            });
          }
        }, Math.random() * 4000 + 10000);
      }
    }

    // Check for snake collision with other snakes
    for (const otherId in gameState.players) {
      if (otherId === playerId) continue;
      const otherPlayer = gameState.players[otherId];
      if (!otherPlayer.alive) continue;
      
      // Skip collision check if the current player is immune to collision
      if (player.isImmuneToCollision) {
        continue;
      }
      
      // Check collision with other snake's segments - 45% REDUCTION
      for (let i = 0; i < otherPlayer.segments.length; i++) {
        const segment = otherPlayer.segments[i];
        
        // Calculate collision radius based on other player's size - 45% REDUCTION
        // Base radius is 14 (reduced from 25), increases by 2 for every 8 segments beyond the initial 4
        const otherPlayerBaseRadius = 14; // Reduced from 25 to 14 (45% reduction)
        const otherPlayerSizeBonus = Math.max(0, Math.floor((otherPlayer.segments.length - 4) / 8)) * 2; // 2 per 8 segments
        const otherPlayerCollisionRadius = otherPlayerBaseRadius + otherPlayerSizeBonus;
        
        const distance = Math.sqrt(
          Math.pow(newHead.x - segment.x, 2) + Math.pow(newHead.y - segment.y, 2)
        );
        if (distance < otherPlayerCollisionRadius) {
          // Snake dies from collision
          player.alive = false;
          // Increment killer's kills stat
          if (gameState.players[otherId]) {
            gameState.players[otherId].kills = (gameState.players[otherId].kills || 0) + 1;
            console.log(`Player ${otherId} killed ${playerId}. New kills: ${gameState.players[otherId].kills}. Collision radius: ${otherPlayerCollisionRadius} (${otherPlayer.segments.length} segments) - 45% REDUCTION ACTIVE`);
            
            // Give kill reward: 2.4x orb pickup radius for 10 seconds
            gameState.players[otherId].killRewardActive = true;
            gameState.players[otherId].killRewardStartTime = Date.now();
            gameState.players[otherId].killRewardDuration = 10000; // 10 seconds in milliseconds
            console.log(`Player ${otherId} received kill reward: 2.4x orb pickup radius for 10 seconds with red glow effect`);
            console.log(`Kill reward details: active=${gameState.players[otherId].killRewardActive}, startTime=${gameState.players[otherId].killRewardStartTime}, duration=${gameState.players[otherId].killRewardDuration}`);
          }
          // Create ETH orbs from the dead snake
          const playerStake = player.stake || 0; // Get player's stake
          const playerCollectedEth = player.ethEarned || 0; // Get ETH collected from other players
          const totalEthToDrop = playerStake + playerCollectedEth; // Total ETH to drop (stake + collected)
          const segmentSize = 12 + player.segments.length * 0.14; // Calculate segment size based on player's segment count
          const ethOrbs = player.segments.map((segment, index) => ({
            x: segment.x,
            y: segment.y,
            color: '#00ffcc',
            isEthOrb: true, // Mark as ETH orb
            ethValue: totalEthToDrop / player.segments.length, // Split total ETH among segments
            size: segmentSize, // Make ETH orbs the same size as the dead player's segments
              id: Math.random().toString(36).substr(2, 9),
            creationTime: Date.now(), // Track when orb was created
            expirationTime: Date.now() + 40000, // 40 seconds from creation
            killerId: otherId, // Track who killed the player
            killerWallet: gameState.players[otherId]?.wallet || null, // Track killer's wallet address
            totalEthValue: totalEthToDrop // Track total ETH value for distribution
          }));
          gameState.orbs.push(...ethOrbs);
          // Gather session stats
          const timeSurvived = player ? Math.floor((Date.now() - player.joinedAt) / 1000) : 0;
          const minutesSurvived = Math.floor(timeSurvived / 60);
          const spFromTime = minutesSurvived * 10;
          const spFromOrbs = (player?.orbsEaten || 0) * 5;
          const spFromKills = (player?.kills || 0) * 500;
          const spFromAchievements = player?.achievementSP || 0;
          const totalSP = spFromTime + spFromOrbs + spFromKills + spFromAchievements;
          const finalSP = Math.floor(totalSP * 0.5); // Deduct 50% on death
          
          // On escape or death message from client, use achievements field from client
          const achievementCount = player.achievements ? Object.values(player.achievements).filter(Boolean).length : (player.achievementSP ? Math.floor(player.achievementSP / 2000) : 0);
          
          const sessionStats = {
            gameId: Math.floor(Math.random() * 1000000),
            timeSurvived: Math.floor((Date.now() - player.sessionStartTime) / 1000),
            orbsEaten: player?.orbsEaten || 0,
            ethEarned: player?.ethEarned || 0,
            kills: player?.kills || 0,
            SP: finalSP,
            originalSP: totalSP, // Keep original for display
            result: 'death',
            stake: 'N/A',
            profit: 'N/A',
            sp: finalSP,
            tx: 'N/A',
            TX: 'N/A',
            wallet: player?.wallet || playerId,
            name: player?.name || `Player ${playerId.slice(0, 6)}`,
            sessionStartTime: player?.sessionStartTime || Date.now(),
            killedBy: otherPlayer?.name || `Player ${otherId.slice(0, 6)}`,
            deathType: 'player',
            spFromAchievements: spFromAchievements,
            achievements: achievementCount,
            killedPlayerSegments: player.segments.length // NEW: send killed player's segment count
          };
          // Update leaderboard
          try {
            const fs = require('fs');
            let leaderboard = { players: {} };
            if (fs.existsSync('./leaderboard.json')) {
              const fileContent = fs.readFileSync('./leaderboard.json', 'utf8');
              if (fileContent.trim()) {
                try {
                  leaderboard = JSON.parse(fileContent);
                } catch (parseError) {
                  console.error('Corrupted leaderboard.json, resetting to default');
                  leaderboard = { players: {} };
                }
              }
            }
            const wallet = (sessionStats.wallet || playerId).toLowerCase();
            leaderboard.players = leaderboard.players || {};
            // Remove any leaderboard entries for this wallet that are not keyed by the wallet address
            for (const key of Object.keys(leaderboard.players)) {
              if (
                leaderboard.players[key].wallet &&
                leaderboard.players[key].wallet.toLowerCase() === wallet &&
                key !== wallet
              ) {
                delete leaderboard.players[key];
              }
            }
            if (!leaderboard.players[wallet]) {
              leaderboard.players[wallet] = {
                SP: 0,
                orbsEaten: 0,
                ethEarned: 0,
                kills: 0,
                timeSurvived: 0,
                name: sessionStats.name,
                wallet: wallet,
                gamesPlayed: 0,
                winCount: 0,
                profit: 'N/A',
                achievementSP: 0,
                achievements: 0
              };
            }
            leaderboard.players[wallet].SP += sessionStats.SP || 0;
            leaderboard.players[wallet].orbsEaten += sessionStats.orbsEaten || 0;
            leaderboard.players[wallet].ethEarned += sessionStats.ethEarned || 0;
            leaderboard.players[wallet].kills += sessionStats.kills || 0;
            leaderboard.players[wallet].timeSurvived += sessionStats.timeSurvived || 0;
            leaderboard.players[wallet].gamesPlayed = (leaderboard.players[wallet].gamesPlayed || 0) + 1;
            leaderboard.players[wallet].name = sessionStats.name;
            leaderboard.players[wallet].wallet = wallet;
            leaderboard.players[wallet].achievementSP += sessionStats.spFromAchievements || 0;
            leaderboard.players[wallet].achievements += achievementCount;
            if (sessionStats.result === 'escape') {
              leaderboard.players[wallet].winCount = (leaderboard.players[wallet].winCount || 0) + 1;
            }
            fs.writeFileSync('./leaderboard.json', JSON.stringify(leaderboard, null, 2));
          } catch (e) { console.error('Leaderboard update failed', e); }
          // Update history
          try {
            const fs = require('fs');
            const historyPath = './history.json';
            let history = [];
            if (fs.existsSync(historyPath)) {
              const fileContent = fs.readFileSync(historyPath, 'utf8');
              if (fileContent.trim()) {
                try {
                  history = JSON.parse(fileContent);
                } catch (parseError) {
                  console.error('Corrupted history.json, resetting to default');
                  history = [];
                }
              }
            }
            history.push({
              id: sessionStats.gameId,
              time: sessionStats.timeSurvived,
              stake: sessionStats.stake,
              result: sessionStats.result,
              profit: sessionStats.profit,
              sp: sessionStats.sp,
              kills: sessionStats.kills || 0,
              tx: sessionStats.tx,
              wallet: (sessionStats.wallet || playerId).toLowerCase(),
              timestamp: Date.now(),
              dateTime: new Date().toLocaleString('en-GB', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              }),
              achievementSP: sessionStats.spFromAchievements || 0,
              achievements: typeof sessionStats.achievements === 'number' ? sessionStats.achievements : 0
            });
            fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
          } catch (e) { console.error('History update failed', e); }
          // Immediately notify the client of death with stats
          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN && client.playerId === playerId) {
              console.log(`Sending death message to player ${playerId}`);
              client.send(JSON.stringify({
                type: 'death',
                playerId: playerId,
                ...sessionStats
              }));
            }
            
            // Also notify the killer about the kill with segment count for Giant Slayer achievement
            if (client.readyState === WebSocket.OPEN && client.playerId === otherId) {
              console.log(`Sending kill notification to player ${otherId} (killed player with ${player.segments.length} segments)`);
              client.send(JSON.stringify({
                type: 'kill_notification',
                killedPlayerId: playerId,
                killedPlayerName: player.name || `Player ${playerId.slice(0, 6)}`,
                killedPlayerSegments: player.segments.length
              }));
            }
          });
          // Remove player from state
          delete gameState.players[playerId];
          break;
        }
      }
      if (!player.alive) break;
    }

    // Handle death and send to death screen after 3 seconds
    if (!player.alive && !player.deathTime) {
      player.deathTime = Date.now();
      console.log(`Player ${playerId} died at ${new Date().toISOString()}`);
    }
  }
  
  // In the main game loop, after updating all players:
  for (const playerId in gameState.players) {
    const player = gameState.players[playerId];
    if (player.speedBonusActive) {
      const now = Date.now();
      if (now - player.speedBonusStartTime >= player.speedBonusDuration) {
        player.speedBonusActive = false;
        // Revert to original base speed
        if (player.originalBaseSpeed) {
          player.baseSpeed = player.originalBaseSpeed;
        }
        player.speedBonusStartTime = null;
        player.speedBonusDuration = null;
        console.log(`Player ${playerId}'s speed bonus expired.`);
      }
    }
  }
  
  // Broadcast updated state to all clients
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      // Debug: Log player data being sent
      if (Object.keys(gameState.players).length > 0) {
        const firstPlayerId = Object.keys(gameState.players)[0];
        const firstPlayer = gameState.players[firstPlayerId];
        console.log(`Broadcasting game state. Sample player ${firstPlayerId}:`, {
          killRewardActive: firstPlayer.killRewardActive,
          killRewardStartTime: firstPlayer.killRewardStartTime,
          killRewardDuration: firstPlayer.killRewardDuration,
          hasKillReward: !!(firstPlayer.killRewardActive && firstPlayer.killRewardStartTime && firstPlayer.killRewardDuration)
        });
      }
      
      client.send(JSON.stringify({
        type: 'state',
        data: gameState
      }));
    }
  });
}

// Start the game loop
setInterval(gameLoop, 50);

// Start the server
const PORT = process.env.PORT || 2567;
server.listen(PORT, () => {
  console.log(`Game server starting...`);
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

const app = express();
app.use(bodyParser.json());

// CORS middleware for all routes
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

// /leaderboard endpoint
app.get('/leaderboard', (req, res) => {
  try {
    const fs = require('fs');
    let leaderboard = { players: {} };
    if (fs.existsSync('./leaderboard.json')) {
      const fileContent = fs.readFileSync('./leaderboard.json', 'utf8');
      if (fileContent.trim()) {
        try {
          leaderboard = JSON.parse(fileContent);
        } catch (parseError) {
          console.error('Corrupted leaderboard.json, resetting to default');
          leaderboard = { players: {} };
        }
      }
    }
    if (!leaderboard.players) leaderboard.players = {};
    const walletStats = {};
    for (const [playerId, playerData] of Object.entries(leaderboard.players || {})) {
      const wallet = playerData.wallet || playerId;
      if (!walletStats[wallet]) {
        walletStats[wallet] = {
          address: wallet,
          SP: 0,
          orbsEaten: 0,
          ethEarned: 0,
          kills: 0,
          timeSurvived: 0,
          gamesPlayed: 0,
          winCount: 0,
          name: playerData.name || `Player ${wallet.slice(0, 6)}`,
          achievements: 0,
          achievementSP: 0,
          questsCompleted: 0
        };
      }
      walletStats[wallet].SP += playerData.SP || 0;
      walletStats[wallet].orbsEaten += playerData.orbsEaten || 0;
      walletStats[wallet].ethEarned += playerData.ethEarned || 0;
      walletStats[wallet].kills += playerData.kills || 0;
      walletStats[wallet].timeSurvived += playerData.timeSurvived || 0;
      walletStats[wallet].gamesPlayed += playerData.gamesPlayed || 0;
      walletStats[wallet].winCount += playerData.winCount || 0;
      walletStats[wallet].achievements += playerData.achievements || 0;
      walletStats[wallet].achievementSP += playerData.achievementSP || 0;
      walletStats[wallet].questsCompleted += playerData.questsCompleted || 0;
    }
    const playersArray = Object.values(walletStats).map(player => ({
      ...player,
      achievements: player.achievements,
      achievementSP: player.achievementSP,
      questsCompleted: player.questsCompleted,
      winRate: player.gamesPlayed > 0 ? Math.round((player.winCount / player.gamesPlayed) * 100) : 0
    }));
    playersArray.sort((a, b) => b.profit - a.profit || b.SP - a.SP);
    res.json(playersArray);
  } catch (error) {
    console.error('Error serving leaderboard:', error);
    res.status(500).json({ error: 'Failed to load leaderboard', details: error.message });
  }
});

// /update-sp endpoint
app.post('/update-sp', (req, res) => {
  try {
    const { wallet, spToAdd, name } = req.body;
    if (!wallet || typeof spToAdd !== 'number') {
      res.status(400).json({ error: 'Missing wallet or spToAdd' });
      return;
    }
    const fs = require('fs');
    let leaderboard = { players: {} };
    if (fs.existsSync('./leaderboard.json')) {
      const fileContent = fs.readFileSync('./leaderboard.json', 'utf8');
      if (fileContent.trim()) {
        try {
          leaderboard = JSON.parse(fileContent);
        } catch (parseError) {
          console.error('Corrupted leaderboard.json, resetting to default');
          leaderboard = { players: {} };
        }
      }
    }
    const walletKey = wallet.toLowerCase();
    if (!leaderboard.players[walletKey]) {
      leaderboard.players[walletKey] = {
        SP: 0,
        orbsEaten: 0,
        ethEarned: 0,
        kills: 0,
        timeSurvived: 0,
        name: name || `Player ${wallet.slice(0, 6)}`,
        wallet: walletKey,
        gamesPlayed: 0,
        winCount: 0,
        profit: 'N/A',
        achievementSP: 0,
        achievements: 0,
        questsCompleted: 0
      };
    }
    leaderboard.players[walletKey].SP += spToAdd;
    leaderboard.players[walletKey].achievementSP += spToAdd;
    leaderboard.players[walletKey].questsCompleted = (leaderboard.players[walletKey].questsCompleted || 0) + 1;
    if (name) leaderboard.players[walletKey].name = name;
    fs.writeFileSync('./leaderboard.json', JSON.stringify(leaderboard, null, 2));
    // Add quest SP entry to history.json
    try {
      const historyPath = './history.json';
      let history = [];
      if (fs.existsSync(historyPath)) {
        const fileContent = fs.readFileSync(historyPath, 'utf8');
        if (fileContent.trim()) {
          try {
            history = JSON.parse(fileContent);
          } catch (parseError) {
            console.error('Corrupted history.json, resetting to default');
            history = [];
          }
        }
      }
      const now = Date.now();
      const questId = (typeof req.body === 'object' && req.body.questId) || null;
      const questName = (typeof req.body === 'object' && req.body.questName) || null;
      history.push({
        id: now,
        time: 'N/A',
        stake: 'N/A',
        result: '🎯',
        profit: 'N/A',
        sp: spToAdd,
        tx: 'N/A',
        wallet: walletKey,
        timestamp: now,
        dateTime: new Date(now).toLocaleString('en-GB', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }),
        achievementSP: spToAdd,
        achievements: 'N/A',
        ...(questId ? { questId } : {}),
        ...(questName ? { questName } : {})
      });
      fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
    } catch (e) { console.error('Failed to write quest SP to history.json', e); }
    res.json({ 
      success: true, 
      newTotalSP: leaderboard.players[walletKey].SP,
      spAdded: spToAdd 
    });
  } catch (error) {
    console.error('Error updating SP:', error);
    res.status(500).json({ error: 'Failed to update SP', details: error.message });
  }
});

// /history endpoint
app.get('/history', (req, res) => {
  try {
    const fs = require('fs');
    let history = [];
    if (fs.existsSync('./history.json')) {
      const fileContent = fs.readFileSync('./history.json', 'utf8');
      if (fileContent.trim()) {
        try {
          history = JSON.parse(fileContent);
        } catch (parseError) {
          console.error('Corrupted history.json, resetting to default');
          history = [];
        }
      }
    }
    res.json(history);
  } catch (error) {
    console.error('Error serving history:', error);
    res.status(500).json({ error: 'Failed to load history', details: error.message });
  }
});

// /api/verify-signature endpoint (already present)
app.post('/api/verify-signature', (req, res) => {
  const { message, signature, address, timestamp, wagerAmount, nonce } = req.body;
  if (!message || !signature || !address || !timestamp) {
    return res.json({ success: false, error: 'Missing required fields.' });
  }
  if (Math.abs(Date.now() - timestamp) > 2 * 60 * 1000) {
    return res.json({ success: false, error: 'Signature expired.' });
  }
  let recovered;
  try {
    recovered = ethers.utils.verifyMessage(message, signature);
  } catch (e) {
    return res.json({ success: false, error: 'Invalid signature.' });
  }
  if (recovered.toLowerCase() !== address.toLowerCase()) {
    return res.json({ success: false, error: 'Address mismatch.' });
  }
  verifiedProofs.set(address.toLowerCase(), { timestamp, wagerAmount, nonce });
  res.json({ success: true });
});

// Mount Express app as middleware for all HTTP requests
server.on('request', app);
// ... rest of server code ...