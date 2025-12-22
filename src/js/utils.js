// src/js/utils.js

export function formatTime(seconds) {
  if (isNaN(seconds)) return '0:00';
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  // Додаємо нуль спереду, якщо секунд менше 10 (наприклад, 2:05)
  const formattedSeconds = remainingSeconds < 10 ? `0${remainingSeconds}` : remainingSeconds;
  
  return `${minutes}:${formattedSeconds}`;
}