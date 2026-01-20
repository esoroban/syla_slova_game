import React from 'react';

export default function ProgressBar({ current, total, label }) {
  const percentage = (current / total) * 100;

  return (
    <div className="progress-container">
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="progress-text" style={{ textAlign: 'center', fontSize: '0.9rem' }}>
        {current} / {total}
      </div>
    </div>
  );
}
