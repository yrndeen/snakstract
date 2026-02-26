import React, { useRef, useEffect } from 'react';
import DigitalSnake from '../canvas/DigitalSnakes';

const COLORS = [
  '#6c5ce7', // Purple
  '#00ffcc', // Teal
  '#32cd32', // Lime Green
  '#87ceeb', // Light Blue
  '#ff0000', // Red
];

const NUM_SNAKES = 32;
const NUM_GLOW_SNAKES = 12;
const PURPLE_COLOR = '#6c5ce7';

function AnimatedSnakes({ isGameActive = false }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let snakes = [];

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      snakes = []; // Clear existing snakes

      // Generate glow indices randomly
      const glowIndices = new Set();
      while (glowIndices.size < NUM_GLOW_SNAKES) {
        glowIndices.add(Math.floor(Math.random() * NUM_SNAKES));
      }

      let purpleGlowAssignedCount = 0; // Track purple glows assigned
      const purpleGlowCandidates = []; // To pick snakes for forced purple glow
      for (let i = 0; i < NUM_SNAKES; i++) {
        purpleGlowCandidates.push(i); // All snakes are candidates initially
      }
      // Shuffle candidates to pick random ones for purple glow
      for (let i = purpleGlowCandidates.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [purpleGlowCandidates[i], purpleGlowCandidates[j]] = [purpleGlowCandidates[j], purpleGlowCandidates[i]];
      }

      for (let i = 0; i < NUM_SNAKES; i++) {
        let snakeColor;
        // Ensure at least 2 purple snakes among the total
        if (i < 2) { // The first 2 snakes will be purple
          snakeColor = PURPLE_COLOR;
        } else {
          snakeColor = COLORS[Math.floor(Math.random() * COLORS.length)];
        }

        let hasGlow = glowIndices.has(i);
        let explicitGlowColor = null;

        // Assign purple glow to 2 additional random snakes, ensuring they are also chosen to glow
        // The `glowIndices.has(i)` ensures it's one of the *total* 12 glowing snakes
        if (purpleGlowAssignedCount < 2 && glowIndices.has(i)) {
          explicitGlowColor = PURPLE_COLOR;
          purpleGlowAssignedCount++;
        } else if (hasGlow) {
          // For other glowing snakes, glow color matches body color
          explicitGlowColor = snakeColor;
        }
        
        snakes.push(
          new DigitalSnake(
            canvas,
            ctx,
            snakeColor,
            Math.random() * 0.8 + 0.2, // Speed (0.2 to 1)
            Math.random() * 2 + 1.5, // Size (1.5 to 3.5)
            hasGlow, // Pass hasGlow flag
            explicitGlowColor // Pass explicit glow color
          )
        );
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Only update and draw snakes if game is not active
      if (!isGameActive) {
        for (const snake of snakes) {
          snake.update();
          snake.draw();
        }
      } else {
        // When game is active, just draw the snakes in their current positions without updating
        for (const snake of snakes) {
          snake.draw();
        }
      }
      
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isGameActive]); // Add isGameActive to dependencies

  return <canvas ref={canvasRef} className="animated-snakes-canvas" />;
}

export default AnimatedSnakes; 