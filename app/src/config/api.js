/**
 * API Configuration for Game
 */

// Determine API URL based on environment
function getApiUrl() {
  // Vite env variable
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // Production - same origin
  if (import.meta.env.PROD) {
    return '';
  }

  // Development - local backend
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  return `http://${hostname}:3001`;
}

export const API_URL = getApiUrl();

// Storage keys
export const STORAGE_KEYS = {
  TOKEN: 'game_student_token',
  PROFILE: 'game_student_profile',
  PROGRESS: 'game_progress',
  PENDING_RESULTS: 'game_pending_results'
};
