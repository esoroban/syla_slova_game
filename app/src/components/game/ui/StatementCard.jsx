import React from 'react';

export default function StatementCard({ text, draggable = false }) {
  return (
    <div
      className="statement-card"
      draggable={draggable}
    >
      "{text}"
    </div>
  );
}
