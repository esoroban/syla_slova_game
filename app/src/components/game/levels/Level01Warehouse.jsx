import React, { useState, useEffect, useRef } from 'react';
import { LEVEL_1_DATA, CATEGORIES } from '../../../data/levels';
import { LOCATIONS, EFFECTS, BADGES } from '../../../data/assets';
import { shuffleArray } from '../../../utils/shuffle';
import Character from '../ui/Character';
import DialogueBox from '../ui/DialogueBox';
import StatementCard from '../ui/StatementCard';
import Box from '../ui/Box';
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

export default function Level01Warehouse({ onComplete, onExit, onNextLevel }) {
  const [phase, setPhase] = useState(PHASES.INTRO);
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState(0);
  const [score, setScore] = useState(0);
  const [lastAnswer, setLastAnswer] = useState(null);
  const [effect, setEffect] = useState(null);
  const [stars, setStars] = useState(0);
  const [homework, setHomework] = useState({ fact: '', opinion: '', fiction: '' });
  const [isProcessing, setIsProcessing] = useState(false);
  const [questionTimer, setQuestionTimer] = useState(0);
  const [totalTime, setTotalTime] = useState(0);

  // Стан для рандомізації та повторення
  const [shuffledQuestions, setShuffledQuestions] = useState([]);
  const [wrongQuestionIds, setWrongQuestionIds] = useState([]);
  const [isRetryMode, setIsRetryMode] = useState(false);

  // Зберігаємо результати першого раунду для підсумку
  const [firstRoundCorrect, setFirstRoundCorrect] = useState(0);
  const [firstRoundWrong, setFirstRoundWrong] = useState(0);
  const [firstRoundScore, setFirstRoundScore] = useState(0);

  // Використовуємо ref для зберігання питань повтору (синхронно!)
  const retryQuestionsRef = useRef([]);

  // Анімація падіння картки
  const [cardAnimation, setCardAnimation] = useState(null);

  // Ref для діалогу
  const dialogueRef = useRef(null);

  const data = LEVEL_1_DATA;

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
    // Скидаємо результати першого раунду
    setFirstRoundCorrect(0);
    setFirstRoundWrong(0);
    setFirstRoundScore(0);
    // totalTime НЕ скидаємо - він накопичує час всіх спроб
    setIsProcessing(false);
    setLastAnswer(null);
    setCardAnimation(null);
    setPhase(PHASES.GAME);
  };

  // Обробка відповіді на питання
  const handleAnswer = (boxColor) => {
    if (isProcessing) return;
    setIsProcessing(true);

    const answerMap = { green: 'fact', yellow: 'opinion', red: 'fiction' };
    const answer = answerMap[boxColor];
    const isCorrect = answer === currentQuestion.answer;

    setLastAnswer({ answer, isCorrect });

    // Запускаємо анімацію падіння картки
    setCardAnimation({ targetBox: boxColor, isCorrect });

    // Затримка для анімації падіння
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

      // Зберігаємо результати першого раунду
      setFirstRoundCorrect(correctAnswers);
      setFirstRoundWrong(wrongAnswers);
      setFirstRoundScore(score);

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
    // Використовуємо загальні результати (враховуючи retry)
    const totalCorrect = isRetryMode ? firstRoundCorrect + correctAnswers : correctAnswers;
    const totalWrong = isRetryMode ? Math.max(0, firstRoundWrong - correctAnswers) : wrongAnswers;
    const totalScore = isRetryMode ? firstRoundScore + score : score;

    if (onComplete) {
      onComplete({
        levelId: 1,
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
    // Використовуємо загальні результати (враховуючи retry)
    const totalCorrect = isRetryMode ? firstRoundCorrect + correctAnswers : correctAnswers;
    const totalWrong = isRetryMode ? Math.max(0, firstRoundWrong - correctAnswers) : wrongAnswers;
    const totalScore = isRetryMode ? firstRoundScore + score : score;

    if (onComplete) {
      onComplete({
        levelId: 1,
        stars,
        score: totalScore,
        correctAnswers: totalCorrect,
        wrongAnswers: totalWrong,
        homework: null
      });
    }
  };

  // Отримати позицію коробки для анімації
  const getBoxPosition = (boxColor) => {
    switch (boxColor) {
      case 'green': return { x: -180, y: 220 };
      case 'yellow': return { x: 0, y: 220 };
      case 'red': return { x: 180, y: 220 };
      default: return { x: 0, y: 220 };
    }
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
            <Character type="robot" name="SORT-1" />
            <DialogueBox
              ref={dialogueRef}
              text={data.intro.dialogues[dialogueIndex]}
            />
          </div>
        );

      case PHASES.TUTORIAL:
        return (
          <div className="game-content">
            <Character type="robot" name="SORT-1" />
            <DialogueBox
              ref={dialogueRef}
              text={data.tutorial.dialogues[dialogueIndex]}
            />

            <div className="boxes-container" style={{ marginTop: '20px', opacity: 0.7 }}>
              <Box color="green" showLabel={true} />
              <Box color="yellow" showLabel={true} />
              <Box color="red" showLabel={true} />
            </div>
          </div>
        );

      case PHASES.GAME:
        const boxPosition = cardAnimation ? getBoxPosition(cardAnimation.targetBox) : null;

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

            <Character type="robot" name="SORT-1" emotion={lastAnswer?.isCorrect ? 'happy' : 'neutral'} />

            {currentQuestion && (
              <>
                <div
                  className={`paper-note-wrapper ${cardAnimation ? 'note-dropping' : ''}`}
                  style={cardAnimation ? {
                    '--drop-x': `${boxPosition.x}px`,
                    '--drop-y': `${boxPosition.y}px`,
                    '--note-color': cardAnimation.isCorrect ? '#4CAF50' : '#E85A5A'
                  } : {}}
                >
                  <div className="paper-note">
                    <div className="paper-note-pin"></div>
                    <p className="paper-note-text">{currentQuestion.text}</p>
                  </div>
                </div>

                <div className="boxes-container">
                  <Box
                    color="green"
                    onClick={handleAnswer}
                    showLabel={true}
                    disabled={isProcessing}
                    highlight={cardAnimation?.targetBox === 'green'}
                  />
                  <Box
                    color="yellow"
                    onClick={handleAnswer}
                    showLabel={true}
                    disabled={isProcessing}
                    highlight={cardAnimation?.targetBox === 'yellow'}
                  />
                  <Box
                    color="red"
                    onClick={handleAnswer}
                    showLabel={true}
                    disabled={isProcessing}
                    highlight={cardAnimation?.targetBox === 'red'}
                  />
                </div>
              </>
            )}
          </div>
        );

      case PHASES.RETRY_PROMPT:
        return (
          <div className="game-content">
            <Character type="robot" name="SORT-1" emotion="happy" />
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
        // Рахуємо загальні результати (перший раунд + повторення)
        const totalCorrect = isRetryMode ? firstRoundCorrect + correctAnswers : correctAnswers;
        const totalWrong = isRetryMode ? firstRoundWrong - correctAnswers : wrongAnswers; // Виправлені помилки віднімаються
        const totalScore = isRetryMode ? firstRoundScore + score : score;
        const totalQuestions = data.questions.length;
        const passed = totalCorrect >= 5;

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
                <img src={BADGES.sorter} alt="Бейдж" className="badge-image" />
                <div className="badge-name">Сортувальник</div>
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
            <Character type="robot" name="SORT-1" emotion="celebrating" />
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
        style={{ backgroundImage: `url(${LOCATIONS.warehouse})` }}
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
