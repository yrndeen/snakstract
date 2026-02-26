import { useContext, useRef, useEffect } from 'react';
import { VolumeContext } from '../components/VolumeControl';

export default function useClickSound() {
  const { muted, volume } = useContext(VolumeContext) || { muted: false, volume: 1 };
  const audioRef = useRef(null);
  const errorRef = useRef(false);
  const audioElementRef = useRef(null);

  // Create a static audio element that persists across renders
  useEffect(() => {
    if (!audioElementRef.current && typeof document !== 'undefined') {
      const audioElement = document.createElement('audio');
      audioElement.src = '/sounds/click.mp3';
      audioElement.preload = 'auto';
      document.body.appendChild(audioElement);
      audioElementRef.current = audioElement;
      
      console.log('Created persistent click sound element');
      
      // Clean up on unmount
      return () => {
        if (audioElementRef.current) {
          document.body.removeChild(audioElementRef.current);
        }
      };
    }
  }, []);

  // Lazy create audio element as backup
  useEffect(() => {
    if (!audioRef.current && typeof window !== 'undefined') {
      try {
        const audio = new window.Audio('/sounds/click.mp3');
        audio.preload = 'auto';
        
        // Add error handler
        audio.addEventListener('error', (e) => {
          // Silently handle missing sound file - it's optional
          errorRef.current = true;
        });
        
        // Add load handler
        audio.addEventListener('canplaythrough', () => {
          console.log('Click sound loaded successfully');
          errorRef.current = false;
        });
        
        audioRef.current = audio;
      } catch (err) {
        console.error('Failed to create audio element:', err);
        errorRef.current = true;
      }
    }
    
    // Cleanup
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  function playClick() {
    console.log('playClick called, muted:', muted, 'volume:', volume);
    
    // First try the persistent audio element
    if (audioElementRef.current && !muted && volume > 0) {
      try {
        console.log('Trying to play persistent click sound');
        audioElementRef.current.currentTime = 0;
        audioElementRef.current.volume = volume * 0.5;
        
        const playPromise = audioElementRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error('Error playing persistent click sound:', error);
            tryFallbackAudio();
          });
          return;
        }
      } catch (err) {
        console.error('Error with persistent click sound:', err);
      }
    }
    
    // If persistent element fails, try the Audio object
    tryFallbackAudio();
    
    function tryFallbackAudio() {
      if (audioRef.current && !muted && volume > 0 && !errorRef.current) {
        try {
          console.log('Trying fallback Audio object for click sound');
          audioRef.current.currentTime = 0;
          audioRef.current.volume = volume * 0.5;
          
          // Use promise-based play with error handling
          const playPromise = audioRef.current.play();
          
          if (playPromise !== undefined) {
            playPromise.catch(error => {
              console.error('Error playing click sound fallback:', error);
              
              // Try to create a new audio element as last resort
              try {
                console.log('Creating one-time audio element for click sound');
                const lastResortAudio = new window.Audio('/sounds/click.mp3');
                lastResortAudio.volume = volume * 0.5;
                lastResortAudio.play().catch(e => console.error('Last resort click sound failed too:', e));
              } catch (err) {
                console.error('Failed to create last resort audio:', err);
              }
            });
          }
        } catch (err) {
          console.error('Error playing click sound fallback:', err);
        }
      }
    }
  }

  return playClick;
} 