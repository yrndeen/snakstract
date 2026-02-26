import { useState, useEffect, useCallback } from 'react';

export function useAchievements() {
  const [achievements, setAchievements] = useState(() => {
    try {
      const stored = localStorage.getItem('achievements');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Listen for external updates
  useEffect(() => {
    const handler = (e) => {
      try {
        if (e.key === 'achievements') {
          const stored = localStorage.getItem('achievements');
          setAchievements(stored ? JSON.parse(stored) : {});
        }
      } catch (err) {
        console.error('Error handling storage event in useAchievements:', err);
      }
    };
    
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('storage', handler);
    };
  }, []);

  // Update achievements and localStorage
  const updateAchievement = useCallback((key, value = true) => {
    if (!key) {
      console.error('Invalid achievement key provided to updateAchievement');
      return;
    }
    
    try {
      // First update localStorage directly to avoid any race conditions
      const currentAchievements = { ...achievements };
      currentAchievements[key] = value;
      
      // Save to localStorage synchronously before state update
      try {
        localStorage.setItem('achievements', JSON.stringify(currentAchievements));
      } catch (err) {
        console.error('Error saving achievements to localStorage:', err);
      }
      
      // Then update the state
      setAchievements(currentAchievements);
    } catch (err) {
      console.error('Error in updateAchievement:', err);
    }
  }, [achievements]);

  return [achievements, updateAchievement];
} 