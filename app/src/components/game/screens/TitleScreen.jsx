import React from 'react';
import { MAP } from '../../../data/assets';

export default function TitleScreen({ onStart, onContinue, hasProgress }) {
  return (
    <div className="game-container">
      <div
        className="game-background"
        style={{
          backgroundImage: `url(${MAP.full})`,
          filter: 'blur(5px)'
        }}
      />

      <div className="game-screen">
        <div className="title-screen">
          <h1 className="game-title">Місто зламаних слів</h1>
          <p className="game-subtitle">
            Навчись розрізняти факти від думок,<br />
            причини від збігів,<br />
            і стань героєм міста!
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {hasProgress ? (
              <>
                <button className="btn btn-success" onClick={onContinue}>
                  Продовжити гру
                </button>
                <button className="btn btn-primary" onClick={onStart}>
                  Нова гра
                </button>
              </>
            ) : (
              <button className="btn btn-success" onClick={onStart}>
                Почати гру
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
