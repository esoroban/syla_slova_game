import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import GameEngine from './components/game/GameEngine';
import LoginScreen from './components/auth/LoginScreen';
import './styles/game.css';

function AppContent() {
  const { isAuthenticated, loading, user, logout } = useAuth();
  const [guestMode, setGuestMode] = useState(false);

  // Loading state
  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner" />
        <p>Завантаження...</p>
      </div>
    );
  }

  // Show login if not authenticated and not in guest mode
  if (!isAuthenticated && !guestMode) {
    return (
      <LoginScreen
        onSkip={() => setGuestMode(true)}
      />
    );
  }

  // Show game (authenticated or guest mode)
  return (
    <GameEngine
      user={user}
      isGuest={guestMode}
      onLogout={() => {
        logout();
        setGuestMode(false);
      }}
    />
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
