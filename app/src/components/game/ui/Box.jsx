import React, { useState } from 'react';
import { UI } from '../../../data/assets';

const BOX_IMAGES = {
  green: UI.boxGreen,
  yellow: UI.boxYellow,
  red: UI.boxRed
};

const BOX_LABELS = {
  green: 'Факт',
  yellow: 'Думка',
  red: 'Вигадка'
};

export default function Box({ color, onClick, highlight, showLabel = true, disabled = false }) {
  const [animation, setAnimation] = useState('');

  const handleClick = () => {
    if (disabled) return;
    if (onClick) {
      onClick(color);
    }
  };

  const triggerCorrect = () => {
    setAnimation('correct');
    setTimeout(() => setAnimation(''), 500);
  };

  const triggerWrong = () => {
    setAnimation('wrong');
    setTimeout(() => setAnimation(''), 500);
  };

  return (
    <div
      className={`box ${highlight ? 'box-highlight' : ''} ${animation} ${disabled ? 'disabled' : ''}`}
      onClick={handleClick}
      style={{ cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1 }}
    >
      <img src={BOX_IMAGES[color]} alt={BOX_LABELS[color]} />
      {showLabel && (
        <div
          className="box-label"
          style={{
            backgroundColor:
              color === 'green' ? '#7ED321' :
              color === 'yellow' ? '#F5A623' :
              '#E85A5A',
            color: 'white'
          }}
        >
          {BOX_LABELS[color]}
        </div>
      )}
    </div>
  );
}

// Експортуємо функції для анімацій
Box.triggerCorrect = (ref) => ref?.triggerCorrect?.();
Box.triggerWrong = (ref) => ref?.triggerWrong?.();
