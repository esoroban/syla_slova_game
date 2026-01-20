import React, { useState, useEffect, useRef } from 'react';
import { LEVEL_2_DATA, CATEGORIES_LEVEL_2 } from '../../../data/levels';
import { LOCATIONS, EFFECTS, BADGES } from '../../../data/assets';
import { shuffleArray } from '../../../utils/shuffle';
import Character from '../ui/Character';
import DialogueBox from '../ui/DialogueBox';
import StatementCard from '../ui/StatementCard';
import Stars from '../ui/Stars';
import ProgressBar from '../ui/ProgressBar';

// Фази рівня
const PHASES = {
  INTRO: 'intro',
  TUTORIAL: 'tutorial',
  GAME: 'game',
  RESULT: 'result',
  RETRY_PROMPT: 'retry_prompt',
  OUTRO: 'outro',
  HOMEWORK: 'homework'
};

export default function Level02Tower({ onComplete, onExit, onNextLevel }) {
  const [phase, setPhase] = useState(PHASES.INTRO);
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState(0);
  const [score, setScore] = useState(0);
  const [lastAnswer, setLastAnswer] = useState(null);
  const [effect, setEffect] = useState(null);
  const [stars, setStars] = useState(0);
  const [homework, setHomework] = useState({ verifiable: '', unverifiable: '' });
  const [isProcessing, setIsProcessing] = useState(false);
  const [questionTimer, setQuestionTimer] = useState(0);
  const [totalTime, setTotalTime] = useState(0);

  // Стан для рандомізації та повторення
  const [shuffledQuestions, setShuffledQuestions] = useState([]);
  const [wrongQuestionIds, setWrongQuestionIds] = useState([]);
  const [isRetryMode, setIsRetryMode] = useState(false);

  // Використовуємо ref для зберігання питань повтору (синхронно!)
  const retryQuestionsRef = useRef([]);

  // Анімація
  const [cardAnimation, setCardAnimation] = useState(null);

  // Ref для діалогу
  const dialogueRef = useRef(null);

  const data = LEVEL_2_DATA;

  // Отримуємо актуальні питання
  const getQuestionsToUse = () => {
    if (isRetryMode && retryQuestionsRef.current.length > 0) {
      return retryQuestionsRef.current;
    }
    if (shuffledQuestions.length > 0) {
      return shuffledQuestions;
    }
    return data.questions;
  };

  const questionsToUse = getQuestionsToUse();
  const currentQuestion = questionsToUse[questionIndex] || questionsToUse[0] || data.questions[0];

  // Секундомер для вопроса
  useEffect(() => {
    let interval;
    if (phase === PHASES.GAME && !isProcessing) {
      interval = setInterval(() => {
        setQuestionTimer(prev => prev + 1);
        setTotalTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [phase, isProcessing]);

  // Сброс таймера при смене вопроса
  useEffect(() => {
    if (phase === PHASES.GAME && !isProcessing) {
      setQuestionTimer(0);
    }
  }, [questionIndex]);

  // Перемішування питань при старті гри
  useEffect(() => {
    if (phase === PHASES.GAME && shuffledQuestions.length === 0 && !isRetryMode) {
      setShuffledQuestions(shuffleArray(data.questions));
    }
  }, [phase, isRetryMode, shuffledQuestions.length, data.questions]);

  // Форматирование времени
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Показати ефект
  const showEffect = (type) => {
    setEffect(type);
    setTimeout(() => setEffect(null), 800);
  };

  // Повний скид гри для нової спроби
  // НЕ скидаємо totalTime - він продовжує рахувати з попередньої спроби
  const resetGame = () => {
    retryQuestionsRef.current = [];
    setShuffledQuestions(shuffleArray(data.questions));
    setIsRetryMode(false);
    setWrongQuestionIds([]);
    setQuestionIndex(0);
    setCorrectAnswers(0);
    setWrongAnswers(0);
    setScore(0);
    // totalTime НЕ скидаємо - він накопичує час всіх спроб
    setIsProcessing(false);
    setLastAnswer(null);
    setCardAnimation(null);
    setPhase(PHASES.GAME);
  };

  // Обробка відповіді на питання
  const handleAnswer = (answer) => {
    if (isProcessing) return;
    setIsProcessing(true);

    const isCorrect = answer === currentQuestion.answer;

    setLastAnswer({ answer, isCorrect });

    // Запускаємо анімацію
    const targetButton = answer === 'verifiable' ? 'green' : 'red';
    setCardAnimation({ targetButton, isCorrect });

    setTimeout(() => {
      if (isCorrect) {
        showEffect('correct');
        const newCorrectAnswers = correctAnswers + 1;
        setCorrectAnswers(newCorrectAnswers);
        setScore(prev => prev + 10);

        setTimeout(() => {
          setCardAnimation(null);
          const totalQuestions = questionsToUse.length;
          if (questionIndex < totalQuestions - 1) {
            setQuestionIndex(prev => prev + 1);
            setLastAnswer(null);
            setIsProcessing(false);
          } else {
            calculateResult(newCorrectAnswers);
          }
        }, 600);
      } else {
        showEffect('incorrect');
        setWrongAnswers(prev => prev + 1);
        setScore(prev => prev - 2);

        const newWrongIds = !isRetryMode
          ? [...wrongQuestionIds, currentQuestion.id]
          : wrongQuestionIds;
        if (!isRetryMode) {
          setWrongQuestionIds(newWrongIds);
        }

        setTimeout(() => {
          setCardAnimation(null);
          const totalQuestions = questionsToUse.length;
          if (questionIndex < totalQuestions - 1) {
            setQuestionIndex(prev => prev + 1);
            setLastAnswer(null);
            setIsProcessing(false);
          } else {
            calculateResult(correctAnswers, newWrongIds);
          }
        }, 600);
      }
    }, 500);
  };

  // Розрахунок результату
  const calculateResult = (finalCorrectAnswers = correctAnswers, finalWrongIds = wrongQuestionIds) => {
    const total = questionsToUse.length;
    const percentage = (finalCorrectAnswers / total) * 100;

    let earnedStars = 0;
    if (percentage >= 90) earnedStars = 3;
    else if (percentage >= 70) earnedStars = 2;
    else if (percentage >= 50) earnedStars = 1;

    setStars(earnedStars);

    const minCorrect = 5;
    const passed = finalCorrectAnswers >= minCorrect;

    if (passed && finalWrongIds.length > 0 && !isRetryMode) {
      setPhase(PHASES.RETRY_PROMPT);
    } else {
      setPhase(PHASES.RESULT);
    }
  };

  // Обробка вибору повторення
  const handleRetryChoice = (wantRetry) => {
    if (wantRetry) {
      const wrongQs = data.questions.filter(q => wrongQuestionIds.includes(q.id));
      const shuffledWrongQs = shuffleArray(wrongQs);

      // Зберігаємо в ref СИНХРОННО перед зміною фази
      retryQuestionsRef.current = shuffledWrongQs;

      setIsRetryMode(true);
      setQuestionIndex(0);
      setCorrectAnswers(0);
      setWrongAnswers(0);
      setIsProcessing(false);
      setLastAnswer(null);
      setCardAnimation(null);
      setPhase(PHASES.GAME);
    } else {
      setPhase(PHASES.RESULT);
    }
  };

  // Перехід діалогів
  const nextDialogue = () => {
    if (phase === PHASES.INTRO) {
      if (dialogueIndex < data.intro.dialogues.length - 1) {
        setDialogueIndex(prev => prev + 1);
      } else {
        setDialogueIndex(0);
        setPhase(PHASES.TUTORIAL);
      }
    } else if (phase === PHASES.TUTORIAL) {
      if (dialogueIndex < data.tutorial.dialogues.length - 1) {
        setDialogueIndex(prev => prev + 1);
      } else {
        setDialogueIndex(0);
        setPhase(PHASES.GAME);
      }
    } else if (phase === PHASES.OUTRO) {
      if (dialogueIndex < data.outro.dialogues.length - 1) {
        setDialogueIndex(prev => prev + 1);
      } else {
        setPhase(PHASES.HOMEWORK);
      }
    }
  };

  // Збереження домашки
  const saveHomework = () => {
    console.log('Homework saved:', homework);
    if (onComplete) {
      onComplete({
        levelId: 2,
        stars,
        score,
        correctAnswers,
        wrongAnswers,
        homework
      });
    }
  };

  // Пропустити домашку
  const skipHomework = () => {
    if (onComplete) {
      onComplete({
        levelId: 2,
        stars,
        score,
        correctAnswers,
        wrongAnswers,
        homework: null
      });
    }
  };

  // Позиція кнопки для анімації
  const getButtonPosition = (button) => {
    return button === 'green' ? { x: -150, y: 180 } : { x: 150, y: 180 };
  };

  // Перевіряємо чи фаза з діалогами (можна клікати по всьому екрану)
  const isDialoguePhase = phase === PHASES.INTRO || phase === PHASES.TUTORIAL || phase === PHASES.OUTRO;

  // Обробник кліку по всьому екрану
  const handleScreenClick = (e) => {
    // Ігноруємо кліки по кнопках та інтерактивних елементах
    if (e.target.closest('button') || e.target.closest('input') || e.target.closest('.box')) {
      return;
    }
    // Тільки для фаз з діалогами
    if (isDialoguePhase) {
      // Якщо текст ще друкується - показуємо повний текст
      if (dialogueRef.current && dialogueRef.current.isTyping()) {
        dialogueRef.current.showFullText();
      } else {
        // Якщо текст показаний - переходимо далі
        nextDialogue();
      }
    }
  };

  // Рендер фази
  const renderPhase = () => {
    switch (phase) {
      case PHASES.INTRO:
        return (
          <div className="game-content">
            <Character type="owl" name="Сова-страж" />
            <DialogueBox
              ref={dialogueRef}
              text={data.intro.dialogues[dialogueIndex]}
            />
          </div>
        );

      case PHASES.TUTORIAL:
        return (
          <div className="game-content">
            <Character type="owl" name="Сова-страж" />
            <DialogueBox
              ref={dialogueRef}
              text={data.tutorial.dialogues[dialogueIndex]}
            />

            <div className="answer-buttons-demo" style={{ marginTop: '20px', opacity: 0.7, display: 'flex', gap: '20px', justifyContent: 'center' }}>
              <div className="answer-btn-preview" style={{
                padding: '15px 30px',
                background: '#7ED321',
                borderRadius: '15px',
                color: 'white',
                fontWeight: 'bold'
              }}>
                Можна перевірити
              </div>
              <div className="answer-btn-preview" style={{
                padding: '15px 30px',
                background: '#E85A5A',
                borderRadius: '15px',
                color: 'white',
                fontWeight: 'bold'
              }}>
                Неможливо перевірити
              </div>
            </div>
          </div>
        );

      case PHASES.GAME:
        const buttonPosition = cardAnimation ? getButtonPosition(cardAnimation.targetButton) : null;

        return (
          <div className="game-content">
            <div className="game-header">
              <ProgressBar
                current={questionIndex + 1}
                total={questionsToUse.length}
                label={isRetryMode ? "Повторення" : "Прогрес"}
              />
              <div className="timer-display">
                <span className="timer-icon">⏱</span>
                <span className="timer-value">{formatTime(questionTimer)}</span>
              </div>
            </div>

            <Character type="owl" name="Сова-страж" emotion={lastAnswer?.isCorrect ? 'happy' : 'neutral'} />

            {currentQuestion && (
              <>
                <div
                  className={`paper-note-wrapper ${cardAnimation ? 'note-dropping' : ''}`}
                  style={cardAnimation ? {
                    '--drop-x': `${buttonPosition.x}px`,
                    '--drop-y': `${buttonPosition.y}px`,
                    '--note-color': cardAnimation.isCorrect ? '#4CAF50' : '#E85A5A'
                  } : {}}
                >
                  <div className="paper-note">
                    <div className="paper-note-pin"></div>
                    <p className="paper-note-text">{currentQuestion.text}</p>
                  </div>
                </div>

                <div className="answer-buttons" style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '20px' }}>
                  <button
                    className={`btn-answer btn-verifiable ${cardAnimation?.targetButton === 'green' ? 'btn-highlight' : ''}`}
                    onClick={() => handleAnswer('verifiable')}
                    disabled={isProcessing}
                    style={{
                      padding: '20px 40px',
                      background: isProcessing ? '#ccc' : '#7ED321',
                      border: 'none',
                      borderRadius: '15px',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '18px',
                      cursor: isProcessing ? 'not-allowed' : 'pointer',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      boxShadow: cardAnimation?.targetButton === 'green'
                        ? '0 0 30px rgba(126, 211, 33, 0.6)'
                        : '0 4px 15px rgba(126, 211, 33, 0.3)',
                      transform: cardAnimation?.targetButton === 'green' ? 'scale(1.1)' : 'scale(1)'
                    }}
                  >
                    ✓ Можна перевірити
                  </button>
                  <button
                    className={`btn-answer btn-unverifiable ${cardAnimation?.targetButton === 'red' ? 'btn-highlight' : ''}`}
                    onClick={() => handleAnswer('unverifiable')}
                    disabled={isProcessing}
                    style={{
                      padding: '20px 40px',
                      background: isProcessing ? '#ccc' : '#E85A5A',
                      border: 'none',
                      borderRadius: '15px',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '18px',
                      cursor: isProcessing ? 'not-allowed' : 'pointer',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      boxShadow: cardAnimation?.targetButton === 'red'
                        ? '0 0 30px rgba(232, 90, 90, 0.6)'
                        : '0 4px 15px rgba(232, 90, 90, 0.3)',
                      transform: cardAnimation?.targetButton === 'red' ? 'scale(1.1)' : 'scale(1)'
                    }}
                  >
                    ✗ Неможливо перевірити
                  </button>
                </div>
              </>
            )}
          </div>
        );

      case PHASES.RETRY_PROMPT:
        return (
          <div className="game-content">
            <Character type="owl" name="Сова-страж" emotion="happy" />
            <div className="retry-prompt-box" style={{
              background: 'white',
              borderRadius: '20px',
              padding: '30px',
              maxWidth: '500px',
              textAlign: 'center',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
            }}>
              <h2 style={{ color: '#4A90D9', marginBottom: '15px' }}>Молодець! Рівень пройдено!</h2>
              <p style={{ fontSize: '1.1rem', marginBottom: '10px' }}>
                Але ти помилився в {wrongQuestionIds.length} питанн{wrongQuestionIds.length === 1 ? 'і' : 'ях'}.
              </p>
              <p style={{ fontSize: '1.1rem', marginBottom: '15px' }}>Хочеш пройти їх ще раз?</p>
              <p style={{ color: '#888', fontSize: '0.9rem' }}>Таймер: {formatTime(totalTime)}</p>
              <div style={{ display: 'flex', gap: '15px', marginTop: '20px', justifyContent: 'center' }}>
                <button className="btn btn-primary" onClick={() => handleRetryChoice(true)}>
                  Так, повторити
                </button>
                <button className="btn btn-secondary" onClick={() => handleRetryChoice(false)}>
                  Ні, продовжити
                </button>
              </div>
            </div>
          </div>
        );

      case PHASES.RESULT:
        const passed = correctAnswers >= 5;
        return (
          <div className="game-content result-screen">
            <h1 className="result-title">
              {passed ? 'Вітаю!' : 'Спробуй ще раз'}
            </h1>

            <Stars count={stars} animated={true} />

            <div className="result-stats">
              <div className="stat-row">
                <span>Правильних відповідей:</span>
                <span>{correctAnswers} / {questionsToUse.length || data.questions.length}</span>
              </div>
              <div className="stat-row">
                <span>Очки:</span>
                <span>{score}</span>
              </div>
              <div className="stat-row">
                <span>Загальний час:</span>
                <span>{formatTime(totalTime)}</span>
              </div>
            </div>

            {passed && stars >= 3 && (
              <div className="badge-earned">
                <img src={BADGES.truth_guardian} alt="Бейдж" className="badge-image" />
                <div className="badge-name">Страж істини</div>
              </div>
            )}

            <div className="result-buttons">
              {passed ? (
                <button
                  className="btn btn-primary btn-large"
                  onClick={() => {
                    setDialogueIndex(0);
                    setPhase(PHASES.OUTRO);
                  }}
                >
                  Далі →
                </button>
              ) : (
                <>
                  <button
                    className="btn btn-primary btn-large"
                    onClick={resetGame}
                  >
                    Спробувати ще
                  </button>
                  <button className="btn btn-secondary" onClick={onExit}>
                    Вийти
                  </button>
                </>
              )}
            </div>
          </div>
        );

      case PHASES.OUTRO:
        return (
          <div className="game-content">
            <Character type="owl" name="Сова-страж" emotion="celebrating" />
            <DialogueBox
              ref={dialogueRef}
              text={data.outro.dialogues[dialogueIndex]}
            />
          </div>
        );

      case PHASES.HOMEWORK:
        return (
          <div className="game-content">
            <div className="homework-form">
              <h2 className="homework-title">Домашнє завдання</h2>
              <p style={{ marginBottom: '20px', color: '#666' }}>
                {data.homework.description}
              </p>

              {data.homework.tasks.map((task) => (
                <div key={task.key} className="homework-field">
                  <label className="homework-label">{task.label}</label>
                  <input
                    type="text"
                    className="homework-input"
                    value={homework[task.key]}
                    onChange={(e) => setHomework(prev => ({
                      ...prev,
                      [task.key]: e.target.value
                    }))}
                    placeholder="Напиши тут..."
                  />
                </div>
              ))}

              <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                <button className="btn btn-success" onClick={saveHomework}>
                  Зберегти
                </button>
                <button className="btn btn-secondary" onClick={skipHomework}>
                  Пропустити
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className="game-container"
      onClick={handleScreenClick}
      style={{ cursor: isDialoguePhase ? 'pointer' : 'default' }}
    >
      <div
        className="game-background"
        style={{ backgroundImage: `url(${LOCATIONS.tower})` }}
      />

      <div className="game-screen">
        {renderPhase()}
      </div>

      {effect && (
        <div className="effect-overlay">
          <img
            src={effect === 'correct' ? EFFECTS.correct : EFFECTS.incorrect}
            alt={effect}
            className="effect-image"
          />
        </div>
      )}
    </div>
  );
}
