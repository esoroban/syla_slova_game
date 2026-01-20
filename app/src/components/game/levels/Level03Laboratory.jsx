import React, { useState, useEffect, useRef } from 'react';
import { LEVEL_3_DATA } from '../../../data/levels';
import { LOCATIONS, EFFECTS, BADGES } from '../../../data/assets';
import { shuffleArray } from '../../../utils/shuffle';
import Character from '../ui/Character';
import DialogueBox from '../ui/DialogueBox';
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

export default function Level03Laboratory({ onComplete, onExit, onNextLevel }) {
  const [phase, setPhase] = useState(PHASES.INTRO);
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState(0);
  const [score, setScore] = useState(0);
  const [lastAnswer, setLastAnswer] = useState(null);
  const [effect, setEffect] = useState(null);
  const [stars, setStars] = useState(0);
  const [homework, setHomework] = useState({ fact: '', method: '', result: '' });
  const [isProcessing, setIsProcessing] = useState(false);
  const [questionTimer, setQuestionTimer] = useState(0);
  const [totalTime, setTotalTime] = useState(0);

  // Стан для рандомізації та повторення
  const [shuffledQuestions, setShuffledQuestions] = useState([]);
  const [wrongQuestionIds, setWrongQuestionIds] = useState([]);
  const [isRetryMode, setIsRetryMode] = useState(false);

  // Зберігаємо результати першого раунду
  const [firstRoundCorrect, setFirstRoundCorrect] = useState(0);
  const [firstRoundWrong, setFirstRoundWrong] = useState(0);
  const [firstRoundScore, setFirstRoundScore] = useState(0);

  // Ref для питань повтору
  const retryQuestionsRef = useRef([]);

  // Ref для діалогу
  const dialogueRef = useRef(null);

  // Показати пояснення після відповіді
  const [showExplanation, setShowExplanation] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);

  const data = LEVEL_3_DATA;

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

  // Секундомер
  useEffect(() => {
    let interval;
    if (phase === PHASES.GAME && !isProcessing && !showExplanation) {
      interval = setInterval(() => {
        setQuestionTimer(prev => prev + 1);
        setTotalTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [phase, isProcessing, showExplanation]);

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

  // Форматування часу
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

  // Скид гри
  const resetGame = () => {
    retryQuestionsRef.current = [];
    setShuffledQuestions(shuffleArray(data.questions));
    setIsRetryMode(false);
    setWrongQuestionIds([]);
    setQuestionIndex(0);
    setCorrectAnswers(0);
    setWrongAnswers(0);
    setScore(0);
    setFirstRoundCorrect(0);
    setFirstRoundWrong(0);
    setFirstRoundScore(0);
    setIsProcessing(false);
    setLastAnswer(null);
    setShowExplanation(false);
    setSelectedOption(null);
    setPhase(PHASES.GAME);
  };

  // Обробка відповіді
  const handleAnswer = (option) => {
    if (isProcessing) return;
    setIsProcessing(true);
    setSelectedOption(option);

    const isCorrect = option.isCorrect;
    setLastAnswer({ isCorrect });

    if (isCorrect) {
      showEffect('correct');
      setCorrectAnswers(prev => prev + 1);
      setScore(prev => prev + 10);
    } else {
      showEffect('incorrect');
      setWrongAnswers(prev => prev + 1);
      setScore(prev => prev - 2);

      if (!isRetryMode) {
        setWrongQuestionIds(prev => [...prev, currentQuestion.id]);
      }
    }

    // Показуємо пояснення
    setShowExplanation(true);
  };

  // Перехід до наступного питання
  const nextQuestion = () => {
    setShowExplanation(false);
    setSelectedOption(null);
    setIsProcessing(false);
    setLastAnswer(null);

    const totalQuestions = questionsToUse.length;
    if (questionIndex < totalQuestions - 1) {
      setQuestionIndex(prev => prev + 1);
    } else {
      calculateResult();
    }
  };

  // Розрахунок результату
  const calculateResult = () => {
    const total = questionsToUse.length;
    const percentage = (correctAnswers / total) * 100;

    let earnedStars = 0;
    if (percentage >= 90) earnedStars = 3;
    else if (percentage >= 70) earnedStars = 2;
    else if (percentage >= 50) earnedStars = 1;

    setStars(earnedStars);

    const minCorrect = data.minCorrect || 4;
    const passed = correctAnswers >= minCorrect;

    if (passed && wrongQuestionIds.length > 0 && !isRetryMode) {
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

      retryQuestionsRef.current = shuffledWrongQs;

      setFirstRoundCorrect(correctAnswers);
      setFirstRoundWrong(wrongAnswers);
      setFirstRoundScore(score);

      setIsRetryMode(true);
      setQuestionIndex(0);
      setCorrectAnswers(0);
      setWrongAnswers(0);
      setIsProcessing(false);
      setLastAnswer(null);
      setShowExplanation(false);
      setSelectedOption(null);
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
    const totalCorrect = isRetryMode ? firstRoundCorrect + correctAnswers : correctAnswers;
    const totalWrong = isRetryMode ? Math.max(0, firstRoundWrong - correctAnswers) : wrongAnswers;
    const totalScore = isRetryMode ? firstRoundScore + score : score;

    if (onComplete) {
      onComplete({
        levelId: 3,
        stars,
        score: totalScore,
        correctAnswers: totalCorrect,
        wrongAnswers: totalWrong,
        homework
      });
    }
  };

  // Пропустити домашку
  const skipHomework = () => {
    const totalCorrect = isRetryMode ? firstRoundCorrect + correctAnswers : correctAnswers;
    const totalWrong = isRetryMode ? Math.max(0, firstRoundWrong - correctAnswers) : wrongAnswers;
    const totalScore = isRetryMode ? firstRoundScore + score : score;

    if (onComplete) {
      onComplete({
        levelId: 3,
        stars,
        score: totalScore,
        correctAnswers: totalCorrect,
        wrongAnswers: totalWrong,
        homework: null
      });
    }
  };

  // Перевіряємо чи фаза з діалогами
  const isDialoguePhase = phase === PHASES.INTRO || phase === PHASES.TUTORIAL || phase === PHASES.OUTRO;

  // Обробник кліку по всьому екрану
  const handleScreenClick = (e) => {
    if (e.target.closest('button') || e.target.closest('input') || e.target.closest('.option-btn')) {
      return;
    }
    if (isDialoguePhase) {
      if (dialogueRef.current && dialogueRef.current.isTyping()) {
        dialogueRef.current.showFullText();
      } else {
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
            <Character type="scientist" name={data.characterName} />
            <DialogueBox
              ref={dialogueRef}
              text={data.intro.dialogues[dialogueIndex]}
            />
          </div>
        );

      case PHASES.TUTORIAL:
        return (
          <div className="game-content">
            <Character type="scientist" name={data.characterName} />
            <DialogueBox
              ref={dialogueRef}
              text={data.tutorial.dialogues[dialogueIndex]}
            />
          </div>
        );

      case PHASES.GAME:
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

            <Character type="scientist" name={data.characterName} emotion={lastAnswer?.isCorrect ? 'happy' : 'neutral'} />

            {currentQuestion && (
              <>
                {/* Питання */}
                <div className="question-card" style={{
                  background: 'white',
                  borderRadius: '20px',
                  padding: '20px 30px',
                  maxWidth: '500px',
                  textAlign: 'center',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                  marginBottom: '15px'
                }}>
                  <p style={{ fontSize: '1.1rem', color: '#333', margin: 0 }}>
                    {currentQuestion.text}
                  </p>
                </div>

                {/* Варіанти відповідей */}
                {!showExplanation ? (
                  <div className="options-container" style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    width: '100%',
                    maxWidth: '500px'
                  }}>
                    {currentQuestion.options.map((option) => (
                      <button
                        key={option.id}
                        className="option-btn"
                        onClick={() => handleAnswer(option)}
                        disabled={isProcessing}
                        style={{
                          padding: '15px 20px',
                          background: isProcessing ? '#ccc' : '#4A90D9',
                          border: 'none',
                          borderRadius: '12px',
                          color: 'white',
                          fontSize: '1rem',
                          cursor: isProcessing ? 'not-allowed' : 'pointer',
                          transition: 'transform 0.2s, box-shadow 0.2s',
                          boxShadow: '0 4px 12px rgba(74, 144, 217, 0.3)',
                          textAlign: 'left'
                        }}
                      >
                        <span style={{ fontWeight: 'bold', marginRight: '10px' }}>
                          {option.id.toUpperCase()})
                        </span>
                        {option.text}
                      </button>
                    ))}
                  </div>
                ) : (
                  /* Пояснення після відповіді */
                  <div className="explanation-card" style={{
                    background: selectedOption?.isCorrect ? 'rgba(126, 211, 33, 0.95)' : 'rgba(232, 90, 90, 0.95)',
                    borderRadius: '20px',
                    padding: '20px 30px',
                    maxWidth: '500px',
                    textAlign: 'center',
                    color: 'white'
                  }}>
                    <h3 style={{ margin: '0 0 10px 0' }}>
                      {selectedOption?.isCorrect ? '✓ Правильно!' : '✗ Не зовсім...'}
                    </h3>
                    <p style={{ margin: '0 0 15px 0' }}>
                      {selectedOption?.explanation}
                    </p>
                    <button
                      onClick={nextQuestion}
                      style={{
                        padding: '12px 30px',
                        background: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        color: selectedOption?.isCorrect ? '#7ED321' : '#E85A5A',
                        fontWeight: 'bold',
                        fontSize: '1rem',
                        cursor: 'pointer'
                      }}
                    >
                      Далі →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        );

      case PHASES.RETRY_PROMPT:
        return (
          <div className="game-content">
            <Character type="scientist" name={data.characterName} emotion="happy" />
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
        const totalCorrect = isRetryMode ? firstRoundCorrect + correctAnswers : correctAnswers;
        const totalWrong = isRetryMode ? firstRoundWrong - correctAnswers : wrongAnswers;
        const totalScore = isRetryMode ? firstRoundScore + score : score;
        const totalQuestions = data.questions.length;
        const passed = totalCorrect >= (data.minCorrect || 4);

        return (
          <div className="game-content result-screen">
            <h1 className="result-title">
              {passed ? 'Вітаю!' : 'Спробуй ще раз'}
            </h1>

            <Stars count={stars} animated={true} />

            <div className="result-stats">
              <div className="stat-row">
                <span>Правильних відповідей:</span>
                <span>{totalCorrect} / {totalQuestions}</span>
              </div>
              <div className="stat-row">
                <span>Очки:</span>
                <span>{totalScore}</span>
              </div>
              <div className="stat-row">
                <span>Загальний час:</span>
                <span>{formatTime(totalTime)}</span>
              </div>
            </div>

            {passed && stars >= 3 && (
              <div className="badge-earned">
                <img src={BADGES.young_scientist} alt="Бейдж" className="badge-image" />
                <div className="badge-name">{data.badgeName}</div>
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
            <Character type="scientist" name={data.characterName} emotion="celebrating" />
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
              <h2 className="homework-title">{data.homework.title}</h2>
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
        style={{ backgroundImage: `url(${LOCATIONS.laboratory})` }}
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
