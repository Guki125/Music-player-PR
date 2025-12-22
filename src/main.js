// src/main.js
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './styles/main.scss';

import { Player } from './js/player.js';
import { searchTracks } from './js/api.js';

// --- Дефолтний плейлист (якщо історія пуста) ---
const defaultPlaylist = [
  {
    title: "Don't Start Now",
    artist: "Dua Lipa",
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/8d/af/2e/8daf2e5b-38ba-77d0-1e96-a6fc5c721f47/190296996347.jpg/600x600bb.jpg",
    url: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/05/25/38/052538e1-5820-e22a-2898-17215167b579/mzaf_14958045622379326463.plus.aac.p.m4a"
  },
  {
    title: "Blinding Lights",
    artist: "The Weeknd",
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/f6/c6/24/f6c62423-f232-c11e-b81b-a53c48564177/19UMGIM86064.rgb.jpg/600x600bb.jpg",
    url: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/48/4d/86/484d86b6-d242-6e2b-f215-a20c3558f395/mzaf_10526362402120015525.plus.aac.p.m4a"
  },
  {
    title: "Neon Dreams",
    artist: "Retro Wave",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    cover: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=400&auto=format&fit=crop"
  }
];

document.addEventListener('DOMContentLoaded', async () => {
  // --- Змінні стану ---
  let currentQuery = '';
  let currentOffset = 0;

  // --- Елементи UI ---
  const searchInput = document.getElementById('search-input');
  const searchBar = document.getElementById('search-bar');
  const searchToggleBtn = document.getElementById('search-toggle-btn');
  const searchIcon = document.getElementById('search-icon');
  
  const loadMoreBtn = document.getElementById('load-more-btn');
  const paginationContainer = document.getElementById('pagination-container');

  // --- 1. Відновлення сесії (LocalStorage) ---
  const savedQuery = localStorage.getItem('lastSearch');
  let startPlaylist = defaultPlaylist;

  if (savedQuery) {
      try {
          // Якщо користувач щось шукав, спробуємо це завантажити
          const results = await searchTracks(savedQuery, 0);
          if (results.length > 0) {
              startPlaylist = results;
              currentQuery = savedQuery;
              currentOffset = 25; // Наступна сторінка буде з 25-го треку
              
              // Показуємо кнопку Load More
              paginationContainer.classList.remove('hidden');
              console.log(`Відновлено попередню сесію: ${savedQuery}`);
          }
      } catch (e) {
          console.warn("Не вдалося відновити сесію, використовуємо дефолт.");
      }
  }

  // --- 2. Ініціалізація плеєра ---
  const player = new Player(startPlaylist);

  // --- 3. Логіка Пошуку (Відкриття/Закриття) ---
  searchToggleBtn.addEventListener('click', () => {
    const isHidden = searchBar.classList.toggle('hidden');
    if (!isHidden) {
        searchIcon.classList.add('text-primary'); // Підсвітка іконки
        searchInput.focus();
        
        // Якщо є збережений запит, підставляємо його в поле, щоб не вводити заново
        if (currentQuery && searchInput.value === '') {
            searchInput.value = currentQuery;
        }
    } else {
        searchIcon.classList.remove('text-primary');
    }
  });

  // --- 4. Обробка Enter в полі пошуку ---
  searchInput.addEventListener('keypress', async (e) => {
    if (e.key === 'Enter') {
      const query = searchInput.value.trim();
      
      if (query.length > 0) {
        try {
            // Візуалізація процесу
            searchInput.style.opacity = '0.5';
            
            // Новий пошук -> скидаємо offset
            currentOffset = 0;
            currentQuery = query;

            const newTracks = await searchTracks(query, 0);
            
            if (newTracks.length > 0) {
                // Оновлюємо плейлист
                player.updatePlaylist(newTracks);
                
                // Зберігаємо запит
                localStorage.setItem('lastSearch', query);

                // Оновлюємо UI
                searchBar.classList.add('hidden');
                searchIcon.classList.remove('text-primary');
                
                // Вмикаємо пагінацію для нового запиту
                paginationContainer.classList.remove('hidden');
                loadMoreBtn.style.display = 'inline-block'; // На випадок якщо була схована
                currentOffset = 25; 
            } else {
                alert('Нічого не знайдено');
                paginationContainer.classList.add('hidden');
            }
        } catch (error) {
            console.error("Search error:", error);
            alert("Помилка при пошуку даних");
        } finally {
            searchInput.style.opacity = '1';
        }
      }
    }
  });

  // --- 5. Логіка кнопки "Load More" ---
  loadMoreBtn.addEventListener('click', async () => {
      if (!currentQuery) return;
      
      // Анімація завантаження на кнопці
      const originalText = loadMoreBtn.innerHTML;
      loadMoreBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Loading...';
      loadMoreBtn.disabled = true;

      try {
          // Запитуємо наступну порцію (зсув currentOffset)
          const moreTracks = await searchTracks(currentQuery, currentOffset);
          
          if (moreTracks.length > 0) {
              // Додаємо треки до існуючого плейлиста
              // ВАЖЛИВО: переконайтесь, що метод addToPlaylist є у player.js
              player.addToPlaylist(moreTracks);
              
              // Зсуваємо лічильник
              currentOffset += 25;
          } else {
              alert("Більше треків немає.");
              loadMoreBtn.style.display = 'none'; // Ховаємо кнопку, якщо все завантажили
          }
      } catch (e) {
          console.error("Pagination error:", e);
          alert("Помилка завантаження додаткових треків");
      } finally {
          // Повертаємо кнопку до життя
          loadMoreBtn.innerHTML = originalText;
          loadMoreBtn.disabled = false;
      }
  });
});