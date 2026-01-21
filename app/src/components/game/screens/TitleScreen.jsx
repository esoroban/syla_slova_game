import React from 'react';
import { MAP } from '../../../data/assets';

export default function TitleScreen({ onStart, onContinue, hasProgress, user, isGuest, onLogout }) {
  return (
    <div className="game-container">
      <div
        className="game-background"
        style={{
          backgroundImage: `url(${MAP.full})`,
          filter: 'blur(5px)'
        }}
      />

      {/* User info header */}
      {(user || isGuest) && (
        <div className="user-header">
          <div className="user-info">
            {user ? (
              <span className="user-name">
                👤 {user.nickname || user.fullName || 'Гравець'}
              </span>
            ) : (
              <span className="user-name guest">
                👻 Гостьовий режим
              </span>
            )}
          </div>
          <button className="logout-btn" onClick={onLogout}>
            Вийти
          </button>
        </div>
      )}

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

          {isGuest && (
            <p className="guest-warning">
              ⚠️ В гостьовому режимі прогрес не зберігається на сервері
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
