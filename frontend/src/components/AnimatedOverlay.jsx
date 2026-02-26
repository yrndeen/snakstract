import React from 'react';
import useClickSound from '../hooks/useClickSound';

export default function AnimatedOverlay(props) {
  const playClick = useClickSound();

  return <div className="electric-overlay">⚡ Digital snakes clashing...</div>;
}
