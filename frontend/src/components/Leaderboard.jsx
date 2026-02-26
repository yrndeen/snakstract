import React, { useEffect, useState } from 'react';
import './Leaderboard.css';

const mockData = [
  { address: '0xA1...123', score: 12, eth: 0.03 },
  { address: '0xB2...456', score: 8, eth: 0.015 },
  { address: '0xC3...789', score: 5, eth: 0.004 },
];

export default function Leaderboard() {
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    // Replace with live fetch later
    setEntries(mockData);
  }, []);

  return (
    <div className="leaderboard-container">
      <h2>Top Survivors</h2>
      <table>
        <thead>
          <tr>
            <th>Wallet</th>
            <th>ETH Escaped</th>
            <th>SP</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, index) => (
            <tr key={index}>
              <td>{entry.address}</td>
              <td>{entry.eth}</td>
              <td>{entry.SP}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
