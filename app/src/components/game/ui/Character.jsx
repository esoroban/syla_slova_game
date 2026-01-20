import React from 'react';
import { CHARACTERS } from '../../../data/assets';

export default function Character({ type, name, emotion = 'neutral' }) {
  const characterImage = CHARACTERS[type];

  if (!characterImage) {
    console.warn(`Character image not found: ${type}`);
    return null;
  }

  return (
    <div className="character-container">
      <img
        src={characterImage}
        alt={name}
        className="character-image"
        data-emotion={emotion}
      />
      {name && <div className="character-name">{name}</div>}
    </div>
  );
}
