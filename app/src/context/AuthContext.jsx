import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { API_URL, STORAGE_KEYS } from '../config/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user from storage on mount
  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    const savedProfile = localStorage.getItem(STORAGE_KEYS.PROFILE);

    if (token && savedProfile) {
      try {
        setUser(JSON.parse(savedProfile));
        // Verify token in background
        verifyToken(token);
      } catch (e) {
        clearAuth();
      }
    }
    setLoading(false);
  }, []);

  const verifyToken = async (token) => {
    try {
      const res = await fetch(`${API_URL}/api/student/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.profile);
        localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(data.profile));
      } else {
        clearAuth();
      }
    } catch (err) {
      // Network error - keep local data, try again later
      console.warn('Token verification failed:', err);
    }
  };

  const clearAuth = () => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.PROFILE);
    setUser(null);
  };

  // Login with phone and password
  const login = useCallback(async (phone, password) => {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/student/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password })
      });

      const data = await res.json();

      if (!res.ok) {
        return {
          success: false,
          error: data.error || 'Помилка входу',
          code: data.code
        };
      }

      // Save to storage
      localStorage.setItem(STORAGE_KEYS.TOKEN, data.token);
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(data.student));
      setUser(data.student);

      return { success: true, student: data.student };
    } catch (err) {
      return { success: false, error: 'Немає з\'єднання з сервером' };
    } finally {
      setLoading(false);
    }
  }, []);

  // Register new student
  const register = useCallback(async (phone, password, fullName, nickname) => {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/student/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          password,
          fullName: fullName || null,
          nickname: nickname || null
        })
      });

      const data = await res.json();

      if (!res.ok) {
        return {
          success: false,
          error: data.error || 'Помилка реєстрації',
          code: data.code
        };
      }

      // Save to storage
      localStorage.setItem(STORAGE_KEYS.TOKEN, data.token);
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(data.student));
      setUser(data.student);

      return { success: true, student: data.student };
    } catch (err) {
      return { success: false, error: 'Немає з\'єднання з сервером' };
    } finally {
      setLoading(false);
    }
  }, []);

  // Logout
  const logout = useCallback(() => {
    clearAuth();
  }, []);

  // Get token for API calls
  const getToken = useCallback(() => {
    return localStorage.getItem(STORAGE_KEYS.TOKEN);
  }, []);

  // Update profile locally (after server update)
  const updateProfile = useCallback((profile) => {
    setUser(profile);
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  }, []);

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    getToken,
    updateProfile,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
