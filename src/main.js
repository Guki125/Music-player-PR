// src/main.js
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './styles/main.scss';

import { Player } from './js/player.js';
import { searchTracks } from './js/api.js';

// --- ВИПРАВЛЕНО: Надійний дефолтний плейлист ---
// Використовуємо SoundHelix, бо iTunes посилання "живуть" недовго
const defaultPlaylist = [
  {
    title: "Demo Song 1",
    artist: "SoundHelix",
    cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=600&auto=format&fit=crop",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
  },
  {
    title: "Demo Song 2",
    artist: "SoundHelix",
    cover: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=600&auto=format&fit=crop",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"
  },
  {
    title: "Demo Song 3",
    artist: "SoundHelix",
    cover: "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?q=80&w=600&auto=format&fit=crop",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3"
  }
];

document.addEventListener('DOMContentLoaded', async () => {
  
  const welcomeScreen = document.getElementById('welcome-screen');
  
  // Через 2.5 секунди додаємо клас .hide, який запускає CSS-анімацію зникнення
  setTimeout(() => {
      welcomeScreen.classList.add('hide');
  }, 2500);

  // Змінні стану
  let currentQuery = '';
  let currentOffset = 0;
  let isSearching = false; // Блокування повторних натискань

  // Елементи UI
  const searchInput = document.getElementById('search-input');
  const searchBar = document.getElementById('search-bar');
  const searchToggleBtn = document.getElementById('search-toggle-btn');
  const searchIcon = document.getElementById('search-icon');
  
  const loadMoreBtn = document.getElementById('load-more-btn');
  const paginationContainer = document.getElementById('pagination-container');

  // --- 1. Відновлення сесії ---
  const savedQuery = localStorage.getItem('lastSearch');
  let startPlaylist = defaultPlaylist;

  // Якщо був збережений пошук, пробуємо його відновити
  if (savedQuery) {
      try {
          const results = await searchTracks(savedQuery, 0);
          if (results && results.length > 0) {
              startPlaylist = results;
              currentQuery = savedQuery;
              currentOffset = 25;
              paginationContainer.classList.remove('hidden');
          } else {
              // Якщо збережений пошук нічого не дав - чистимо його
              localStorage.removeItem('lastSearch');
          }
      } catch (e) {
          console.warn("Збій відновлення сесії, вантажимо дефолт.");
      }
  }

  // --- 2. Старт плеєра ---
  // Створюємо плеєр з ГАРАНТОВАНО робочим плейлистом
  const player = new Player(startPlaylist);

  // --- 3. UI Пошуку ---
  searchToggleBtn.addEventListener('click', () => {
    const isHidden = searchBar.classList.toggle('hidden');
    if (!isHidden) {
        searchIcon.classList.add('text-primary');
        searchInput.focus();
        if (currentQuery && searchInput.value === '') {
            searchInput.value = currentQuery;
        }
    } else {
        searchIcon.classList.remove('text-primary');
    }
  });

  // --- 4. Логіка пошуку (FIXED) ---
  const performSearch = async () => {
      const query = searchInput.value.trim();
      if (!query || isSearching) return;

      isSearching = true; // Блокуємо повторний запуск
      searchInput.style.opacity = '0.5';

      try {
          // Скидаємо offset для нового пошуку
          currentOffset = 0;
          currentQuery = query;

          const newTracks = await searchTracks(query, 0);
          
          if (newTracks && newTracks.length > 0) {
              // Успіх
              player.updatePlaylist(newTracks);
              localStorage.setItem('lastSearch', query);

              // Ховаємо пошук
              searchBar.classList.add('hidden');
              searchIcon.classList.remove('text-primary');
              
              // Пагінація
              paginationContainer.classList.remove('hidden');
              loadMoreBtn.style.display = 'inline-block';
              currentOffset = 25; 
          } else {
              // Нічого не знайдено (але це не помилка коду)
              console.log('API повернуло 0 треків');
              alert('За вашим запитом нічого не знайдено.');
              paginationContainer.classList.add('hidden');
          }
      } catch (error) {
          console.error("Search critical error:", error);
          // Не показуємо alert, якщо це просто скасування запиту
          // alert("Помилка з'єднання з сервером"); 
      } finally {
          searchInput.style.opacity = '1';
          isSearching = false; // Розблокуємо
      }
  };

  // Обробка Enter
  searchInput.addEventListener('keydown', (e) => { // keydown надійніше за keypress
    if (e.key === 'Enter') {
      e.preventDefault(); // Зупиняємо будь-яку дефолтну дію браузера
      performSearch();
    }
  });

  // --- 5. Логіка "Load More" ---
  loadMoreBtn.addEventListener('click', async () => {
      if (!currentQuery || isSearching) return;
      
      const originalText = loadMoreBtn.innerHTML;
      loadMoreBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Loading...';
      loadMoreBtn.disabled = true;
      isSearching = true;

      try {
          const moreTracks = await searchTracks(currentQuery, currentOffset);
          
          if (moreTracks && moreTracks.length > 0) {
              player.addToPlaylist(moreTracks);
              currentOffset += 25;
          } else {
              loadMoreBtn.style.display = 'none';
          }
      } catch (e) {
          console.error("Pagination error:", e);
      } finally {
          loadMoreBtn.innerHTML = originalText;
          loadMoreBtn.disabled = false;
          isSearching = false;
      }
  });
});