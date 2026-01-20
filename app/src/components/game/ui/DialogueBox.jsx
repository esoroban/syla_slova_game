import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';

const DialogueBox = forwardRef(function DialogueBox({ text, onComplete, autoAdvance = false, delay = 3000 }, ref) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  // Експортуємо методи для батьківського компонента
  useImperativeHandle(ref, () => ({
    isTyping: () => isTyping,
    showFullText: () => {
      if (isTyping) {
        setDisplayedText(text);
        setIsTyping(false);
      }
    }
  }));

  useEffect(() => {
    setDisplayedText('');
    setIsTyping(true);

    let index = 0;
    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
      } else {
        clearInterval(timer);
        setIsTyping(false);

        if (autoAdvance && onComplete) {
          setTimeout(onComplete, delay);
        }
      }
    }, 30);

    return () => clearInterval(timer);
  }, [text, autoAdvance, delay, onComplete]);

  // Клік по діалогу показує повний текст (якщо друкується)
  // або викликає onComplete (якщо переданий)
  const handleClick = (e) => {
    // Якщо є onComplete - обробляємо тут і зупиняємо спливання
    // Якщо немає - дозволяємо клікам спливати до батьківського контейнера
    if (isTyping) {
      setDisplayedText(text);
      setIsTyping(false);
      e.stopPropagation(); // Зупиняємо тільки якщо показали текст
    } else if (onComplete) {
      onComplete();
      e.stopPropagation();
    }
    // Якщо текст показаний і немає onComplete - клік спливає до батька
  };

  return (
    <div
      className="dialogue-box"
      onClick={handleClick}
      style={{ cursor: 'pointer' }}
    >
      <p className="dialogue-text">{displayedText}</p>
    </div>
  );
});

export default DialogueBox;
