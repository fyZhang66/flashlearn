import React from 'react';
import './CardStats.css';
import { useStats } from '../contexts/StatsContext';

function CardStats() {
  const { stats } = useStats();
  
  return (
    <div className="card-stats">
      <div className="stat-item">
        <span className="stat-value">{stats.total}</span>
        <span className="stat-label">Total Cards</span>
      </div>
      <div className="stat-item">
        <span className="stat-value">{stats.unlearned}</span>
        <span className="stat-label">Not Learned</span>
      </div>
      <div className="stat-item">
        <span className="stat-value">{stats.due}</span>
        <span className="stat-label">Due for Review</span>
      </div>
    </div>
  );
}

export default CardStats;