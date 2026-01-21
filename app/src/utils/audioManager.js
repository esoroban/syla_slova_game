/**
 * Менеджер аудіо для гри "Місто зламаних слів"
 * Відтворює озвучку діалогів з ElevenLabs
 */

class AudioManager {
  constructor() {
    this.currentAudio = null;
    this.isEnabled = true;
    this.volume = 1.0;
    this.onEndCallback = null;

    // Базовий шлях до аудіо файлів
    // В Electron використовуємо відносний шлях, в браузері - абсолютний
    this.basePath = this.detectBasePath();
  }

  /**
   * Визначити базовий шлях залежно від середовища
   */
  detectBasePath() {
    // Якщо запущено в Electron (file:// протокол)
    if (typeof window !== 'undefined' && window.location.protocol === 'file:') {
      return './audio';
    }
    // Веб-версія
    return '/audio';
  }

  /**
   * Встановити стан звуку (увімкнено/вимкнено)
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
    if (!enabled && this.currentAudio) {
      this.stop();
    }
  }

  /**
   * Отримати стан звуку
   */
  getEnabled() {
    return this.isEnabled;
  }

  /**
   * Встановити гучність (0.0 - 1.0)
   */
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.currentAudio) {
      this.currentAudio.volume = this.volume;
    }
  }

  /**
   * Генерує шлях до аудіо файлу
   * @param {number} levelId - ID рівня (1-13)
   * @param {string} voice - Тип голосу (robot, male, female, theatrical)
   * @param {string} phase - Фаза (intro, tutorial, outro)
   * @param {number} index - Індекс фрази (1-based)
   */
  getAudioPath(levelId, voice, phase, index) {
    const levelStr = String(levelId).padStart(2, '0');
    const indexStr = String(index).padStart(2, '0');
    return `${this.basePath}/level${levelStr}/level${levelStr}_${voice}_${phase}_${indexStr}.mp3`;
  }

  /**
   * Відтворити аудіо файл
   * @param {string} path - Шлях до файлу
   * @param {Function} onEnd - Callback при завершенні
   */
  play(path, onEnd = null) {
    if (!this.isEnabled) {
      // Якщо звук вимкнено, одразу викликаємо callback
      if (onEnd) {
        setTimeout(onEnd, 100);
      }
      return null;
    }

    // Зупиняємо попереднє аудіо
    this.stop();

    try {
      this.currentAudio = new Audio(path);
      this.currentAudio.volume = this.volume;
      this.onEndCallback = onEnd;

      this.currentAudio.onended = () => {
        this.currentAudio = null;
        if (this.onEndCallback) {
          this.onEndCallback();
          this.onEndCallback = null;
        }
      };

      this.currentAudio.onerror = (e) => {
        console.warn('Audio error:', path, e);
        this.currentAudio = null;
        // При помилці все одно викликаємо callback
        if (this.onEndCallback) {
          this.onEndCallback();
          this.onEndCallback = null;
        }
      };

      this.currentAudio.play().catch(err => {
        console.warn('Audio play failed:', err);
        if (this.onEndCallback) {
          this.onEndCallback();
          this.onEndCallback = null;
        }
      });

      return this.currentAudio;
    } catch (error) {
      console.warn('Audio creation failed:', error);
      if (onEnd) {
        setTimeout(onEnd, 100);
      }
      return null;
    }
  }

  /**
   * Відтворити діалог рівня
   * @param {number} levelId - ID рівня
   * @param {string} voice - Тип голосу
   * @param {string} phase - Фаза (intro, tutorial, outro)
   * @param {number} index - Індекс фрази (1-based)
   * @param {Function} onEnd - Callback при завершенні
   */
  playDialogue(levelId, voice, phase, index, onEnd = null) {
    const path = this.getAudioPath(levelId, voice, phase, index);
    return this.play(path, onEnd);
  }

  /**
   * Зупинити поточне аудіо
   */
  stop() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    this.onEndCallback = null;
  }

  /**
   * Перевірити чи зараз щось відтворюється
   */
  isPlaying() {
    return this.currentAudio !== null && !this.currentAudio.paused;
  }
}

// Singleton instance
const audioManager = new AudioManager();

export default audioManager;
