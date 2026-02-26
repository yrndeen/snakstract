import React from 'react';

function FAQ() {
  return (
    <div className="page-container" style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* Custom scroll bar for shorter thumb */}
      <style>{`
        .faq-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .faq-scroll::-webkit-scrollbar-thumb {
          margin-top: 16px;
          margin-bottom: 16px;
          background-color: rgba(108, 92, 231, 0.4);
          border-radius: 3px;
        }
        .faq-scroll::-webkit-scrollbar-track {
          background: transparent;
          margin: 4px;
        }
      `}</style>
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '90vh',
      }}>
        <div
          className="faq-scroll"
          style={{
          background: `radial-gradient(circle at 50% 50%, rgba(24,28,43,0.85) 55%, rgba(24,28,43,1) 100%), url('/faq_bg.png') 40% center/cover no-repeat`,
          borderRadius: '24px',
          boxShadow: '0 8px 32px 0 #00ffcc22',
          padding: '3rem 3rem',
          maxWidth: 900,
          width: '100%',
          border: '1.5px solid #00ffcc33',
          backdropFilter: 'blur(8px)',
            maxHeight: '80vh',
            overflowY: 'auto',
          }}
        >
          <h2 style={{ color: '#00ffcc', textAlign: 'center', marginBottom: '2rem' }}>❓ FAQ</h2>
          <p><strong>Q: What is Snakstract?</strong><br />A: It's a PvP snake survival game built on the blockchain.</p>
          <p><strong>Q: What wallet do I need?</strong><br />A: You can use MetaMask, Abstract, Rainbow, or other Web3 wallets.</p>
          <p><strong>Q: What if my escape claim transaction fails?</strong><br />A: If your on-chain escape claim transaction fails or gets stuck, don't worry! You can go to the <strong>History</strong> tab and use the <strong>Withdraw</strong> button next to the relevant game entry. This will allow you to manually claim your accumulated ETH.</p>
          <p><strong>Q: How do I claim my ETH?</strong><br />A: When you escape or are eliminated, you will be prompted to withdraw your ETH. If you miss the prompt or the transaction fails, you can always claim your ETH from the <strong>History</strong> tab using the Withdraw Funds button.</p>
          <p><strong>Q: How do I escape during a game?</strong><br />
            A: You can escape at any time by double-tapping the <strong>E</strong> key on your keyboard. A progress bar will appear and automatically fill over 3 seconds. Once complete, your game will end and you can withdraw your ETH.
          </p>
          <p><strong>Q: Can I play on mobile?</strong><br />A: <span style={{color:'#ff4444'}}>No, Snakstract is not supported on mobile devices. Please use a desktop browser.</span></p>
          <p><strong>Q: How do I earn Snake Points (SP)?</strong><br />
            A: Snake Points (SP) are earned for skillful play and are tracked on-chain for each wallet. They represent your Abstract XP on the Abstract L2 chain. More features for SP are coming soon! You earn SP for:
            <ul style={{marginTop: '0.5em'}}>
              <li>Eating a normal orb: <strong>5 SP</strong></li>
              <li>Eating a moving orb: <strong>10 SP</strong></li>
              <li>Surviving 1 minute: <strong>10 SP</strong></li>
              <li>Killing another player (direct hit): <strong>500 SP</strong></li>
              <li>Causing another player to die (collision): <strong>200 SP</strong></li>
              <li>Winning the game (last survivor): <strong>2000 SP</strong></li>
              <li>Successfully escaping and claiming ETH: <strong>200 SP</strong></li>
              <li>Killing and taking ETH (eliminate + claim): <strong>1000 SP</strong></li>
            </ul>
            SP is shown as "SP (Points)" in your game history and on the leaderboard.
          </p>
          <p><strong>Q: How do I move and boost in Snakstract?</strong><br />
            A: You control your snake using the <strong>mouse</strong> only. The snake turns smoothly toward your mouse input for precise maneuvers. Keyboard keys (Arrow Keys, WASD) no longer move the player. To boost, <strong>hold the Left Mouse Button</strong>. Boosting makes your snake move much faster, but it consumes your snake's segments and depletes the boost gauge. Once the gauge is empty, you'll need to wait for a cooldown before boosting again. (Spacebar no longer activates boost.)
          </p>
          <p><strong>Q: How do starting segments work based on wager?</strong><br />
            A: Your starting snake size is determined by your wager amount! Higher wagers give you more starting segments:
            <ul style={{marginTop: '0.5em'}}>
              <li>0.001 ETH = 4 segments</li>
              <li>0.3 ETH = 30 segments</li>
              <li>Other amounts are calculated proportionally between these values</li>
            </ul>
            This system gives higher-staking players a competitive advantage while maintaining game balance. The more you wager, the bigger your starting snake will be!
          </p>
          <p><strong>Q: What are Achievements and how do they work?</strong><br />
            A: Achievements are special challenges that reward you with <strong>+2000 SP</strong> when completed! There are 10 different achievements to unlock:
            <ul style={{marginTop: '0.5em'}}>
              <li><strong>Speed Demon:</strong> Fully deplete boost at least 3 times AND survive for 3 minutes at top speed</li>
              <li><strong>Orb Hunter:</strong> Collect 50 orbs within 2 minutes</li>
              <li><strong>Survivor:</strong> Survive for 10 minutes</li>
              <li><strong>Killer Instinct:</strong> Get 3 kills within 5 minutes</li>
              <li><strong>Moving Orb Master:</strong> Collect 20 moving orbs within 4 minutes</li>
              <li><strong>Giant Slayer:</strong> Survive for 5 minutes with 50+ segments</li>
              <li><strong>Escape Artist:</strong> Escape with 2000+ segments AND 0.01+ ETH</li>
              <li><strong>Orb Chain:</strong> Collect 10 orbs within 30 seconds</li>
              <li><strong>Endurance:</strong> Survive for 20 minutes</li>
            </ul>
            When you complete an achievement, a blue achievement message will appear on screen and you'll receive +2000 SP instantly!
          </p>
          <p><strong>Q: What are Quests and how do they work?</strong><br />
            A: Quests are special challenges that reward you with SP based on their rarity! Visit the <strong>Quests</strong> page to see all available quests:
            <ul style={{marginTop: '0.5em'}}>
              <li><strong style={{color: '#4ade80'}}>Common (Green):</strong> 1,000 - 5,000 SP rewards</li>
              <li><strong style={{color: '#60a5fa'}}>Rare (Blue):</strong> 5,000 - 15,000 SP rewards</li>
              <li><strong style={{color: '#a855f7'}}>Epic (Purple):</strong> 15,000 - 25,000 SP rewards</li>
              <li><strong style={{color: '#f59e0b'}}>Legendary (Orange):</strong> 25,000 - 40,000 SP rewards</li>
              <li><strong style={{color: '#f87171'}}>Ultra (Red):</strong> 40,000 - 50,000 SP rewards</li>
            </ul>
            <strong>Quest Types:</strong>
            <ul style={{marginTop: '0.5em'}}>
              <li><strong>Single-Game Quests:</strong> Complete objectives within one game session</li>
              <li><strong>Multi-Game Quests:</strong> Track progress across multiple games (daily, weekly, monthly)</li>
              <li><strong>Progressive Quests:</strong> Build up achievements over time (survival time, kills, etc.)</li>
            </ul>
            <strong>Quest Categories:</strong>
            <ul style={{marginTop: '0.5em'}}>
              <li><strong>Achievements:</strong> Special challenges like "Escape Artist" and "Persistent Survivor"</li>
              <li><strong>Orbs:</strong> Collect orbs efficiently and in streaks</li>
              <li><strong>ETH Orbs:</strong> Master ETH collection and efficiency</li>
              <li><strong>Kills:</strong> Eliminate other players and build kill streaks</li>
              <li><strong>Survival:</strong> Survive for extended periods and build endurance</li>
              <li><strong>Daily/Weekly/Monthly:</strong> Time-based challenges with regular resets</li>
            </ul>
            <strong>How to Complete Quests:</strong>
            <ul style={{marginTop: '0.5em'}}>
              <li>Play games normally - quest progress is tracked automatically</li>
              <li>Check the Quests page to see your progress on each quest</li>
              <li>When a quest is completed, click the "Claim SP" button to receive your reward</li>
              <li>Multi-game quests show progress bars and accumulate across sessions</li>
              <li>Daily/Weekly/Monthly quests reset automatically at their respective intervals</li>
            </ul>
          </p>
        </div>
      </div>
    </div>
  );
}

export default FAQ;