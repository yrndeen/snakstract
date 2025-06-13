import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainScreen from './pages/MainScreen';
import GameScreen from './pages/GameScreen';
import EscapeScreen from './pages/EscapeScreen';
import ReferralTab from './pages/ReferralTab';
import HistoryTab from './pages/HistoryTab';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainScreen />} />
        <Route path="/game" element={<GameScreen />} />
        <Route path="/escape" element={<EscapeScreen />} />
        <Route path="/referral" element={<ReferralTab />} />
        <Route path="/history" element={<HistoryTab />} />
      </Routes>
    </Router>
  );
}

export default App;
