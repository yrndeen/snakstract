import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="page-container">
      <h2>404 - Page Not Found</h2>
      <p>The page you’re looking for doesn’t exist.</p>
      <button onClick={() => navigate('/')}>Return Home</button>
    </div>
  );
}