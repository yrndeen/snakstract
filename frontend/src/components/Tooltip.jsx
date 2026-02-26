
import React from 'react';
import './ui-enhancements.css';

function Tooltip({ children, text }) {
  return (
    <span className="tooltip">
      {children}
      <span className="tooltip-text">{text}</span>
    </span>
  );
}

export default Tooltip;
