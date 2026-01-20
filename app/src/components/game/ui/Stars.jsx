import React from 'react';

export default function Stars({ count, total = 3, animated = false }) {
  return (
    <div className="stars-container">
      {[...Array(total)].map((_, i) => (
        <span
          key={i}
          className={`star ${i < count ? 'earned' : 'empty'}`}
          style={{
            animationDelay: animated ? `${i * 0.2}s` : '0s'
          }}
        >
          ⭐
        </span>
      ))}
    </div>
  );
}
