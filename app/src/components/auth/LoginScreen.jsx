import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

/**
 * Екран авторизації для гри
 * Підтримує вхід та реєстрацію
 */
export default function LoginScreen({ onSkip }) {
  const { login, register, loading } = useAuth();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Format phone for display
  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/[^\d\s]/g, '');
    setPhone(value);
  };

  // Format phone for API
  const formatPhone = (phone) => {
    const digits = phone.replace(/\D/g, '');
    return `+380${digits}`;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await login(formatPhone(phone), password);

    if (!result.success) {
      setError(result.error);
    }

    setIsSubmitting(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Паролі не співпадають');
      return;
    }

    if (password.length < 6) {
      setError('Пароль має бути не менше 6 символів');
      return;
    }

    setIsSubmitting(true);

    const result = await register(
      formatPhone(phone),
      password,
      null, // fullName
      nickname.trim() || null
    );

    if (!result.success) {
      setError(result.error);
    }

    setIsSubmitting(false);
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError(null);
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="auth-screen">
      <div className="auth-background" />

      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-logo">
            <span className="auth-logo-icon">🏰</span>
            <h1 className="auth-title">Місто зламаних слів</h1>
          </div>

          <p className="auth-subtitle">
            {mode === 'login' ? 'Вхід до гри' : 'Створення акаунту'}
          </p>

          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="auth-form">
              <div className="form-group">
                <label htmlFor="phone">Номер телефону</label>
                <div className="phone-input-wrapper">
                  <span className="phone-prefix">+380</span>
                  <input
                    type="tel"
                    id="phone"
                    value={phone}
                    onChange={handlePhoneChange}
                    placeholder="50 123 45 67"
                    maxLength={12}
                    required
                    disabled={isSubmitting}
                    autoComplete="tel"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password">Пароль</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={isSubmitting}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="auth-submit-btn"
                disabled={isSubmitting || loading}
              >
                {isSubmitting ? 'Вхід...' : 'Увійти'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="auth-form">
              <div className="form-group">
                <label htmlFor="reg-phone">Номер телефону *</label>
                <div className="phone-input-wrapper">
                  <span className="phone-prefix">+380</span>
                  <input
                    type="tel"
                    id="reg-phone"
                    value={phone}
                    onChange={handlePhoneChange}
                    placeholder="50 123 45 67"
                    maxLength={12}
                    required
                    disabled={isSubmitting}
                    autoComplete="tel"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="nickname">Як тебе звати?</label>
                <input
                  type="text"
                  id="nickname"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Твоє ім'я або нікнейм"
                  maxLength={50}
                  disabled={isSubmitting}
                  autoComplete="nickname"
                />
              </div>

              <div className="form-group">
                <label htmlFor="reg-password">Пароль *</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="reg-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Мінімум 6 символів"
                    required
                    minLength={6}
                    disabled={isSubmitting}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="confirm-password">Підтвердіть пароль *</label>
                <input
                  type="password"
                  id="confirm-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Повторіть пароль"
                  required
                  disabled={isSubmitting}
                  autoComplete="new-password"
                />
              </div>

              <button
                type="submit"
                className="auth-submit-btn"
                disabled={isSubmitting || loading}
              >
                {isSubmitting ? 'Реєстрація...' : 'Зареєструватися'}
              </button>
            </form>
          )}

          <div className="auth-toggle">
            <button onClick={toggleMode} disabled={isSubmitting}>
              {mode === 'login'
                ? 'Немає акаунту? Зареєструватися'
                : 'Вже є акаунт? Увійти'}
            </button>
          </div>

          {onSkip && (
            <div className="auth-skip">
              <button onClick={onSkip} disabled={isSubmitting}>
                Грати без акаунту
              </button>
              <span className="auth-skip-hint">
                (прогрес не збережеться на сервері)
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
