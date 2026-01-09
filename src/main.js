import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './styles/main.scss';

import { Player } from './js/player.js';
import { searchTracks } from './js/api.js';

// --- Дефолтний плейлист ---
const defaultPlaylist = [
  {
    title: "Night Owl",
    artist: "Broke For Free",
    cover: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=600&auto=format&fit=crop",
    url: "https://files.freemusicarchive.org/storage-freemusicarchive-org/music/WFMU/Broke_For_Free/Directionless_EP/Broke_For_Free_-_01_-_Night_Owl.mp3"
  },
  {
    title: "Enthusiast",
    artist: "Tours",
    cover: "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?q=80&w=600&auto=format&fit=crop",
    url: "https://files.freemusicarchive.org/storage-freemusicarchive-org/music/no_curator/Tours/Enthusiast/Tours_-_01_-_Enthusiast.mp3"
  },
  {
    title: "Shipping Lanes",
    artist: "Chad Crouch",
    cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=600&auto=format&fit=crop",
    url: "https://files.freemusicarchive.org/storage-freemusicarchive-org/music/ccCommunity/Chad_Crouch/Arps/Chad_Crouch_-_01_-_Algorithms.mp3"
  }
];

document.addEventListener('DOMContentLoaded', async () => {
  // --- 1. Прелоадер ---
  const welcomeScreen = document.getElementById('welcome-screen');
  if (welcomeScreen) {
      setTimeout(() => {
          welcomeScreen.classList.add('hide');
      }, 2500);
  }

  // --- 2. Змінні стану ---
  let currentQuery = '';
  let currentOffset = 0;
  let isSearching = false;

  const searchInput = document.getElementById('search-input');
  const searchBar = document.getElementById('search-bar');
  const searchToggleBtn = document.getElementById('search-toggle-btn');
  const searchIcon = document.getElementById('search-icon');
  
  const loadMoreBtn = document.getElementById('load-more-btn');
  const paginationContainer = document.getElementById('pagination-container');

  // --- 3. Відновлення сесії ---
  const savedQuery = localStorage.getItem('lastSearch');
  let startPlaylist = defaultPlaylist;

  if (savedQuery) {
      try {
          const results = await searchTracks(savedQuery, 0);
          if (results && results.length > 0) {
              startPlaylist = results;
              currentQuery = savedQuery;
              currentOffset = 25;
              paginationContainer.classList.remove('hidden');
          } else {
              localStorage.removeItem('lastSearch');
          }
      } catch (e) {
          console.warn("Session restore failed, using default.");
      }
  }

  // --- 4. Ініціалізація плеєра ---
  const player = new Player(startPlaylist);

  // --- 5. UI Пошуку ---
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

  // --- 6. Виконання пошуку ---
  const performSearch = async () => {
      const query = searchInput.value.trim();
      if (!query || isSearching) return;

      isSearching = true;
      searchInput.style.opacity = '0.5';

      try {
          currentOffset = 0;
          currentQuery = query;

          const newTracks = await searchTracks(query, 0);
          
          if (newTracks && newTracks.length > 0) {
              player.updatePlaylist(newTracks);
              localStorage.setItem('lastSearch', query);

              searchBar.classList.add('hidden');
              searchIcon.classList.remove('text-primary');
              
              paginationContainer.classList.remove('hidden');
              loadMoreBtn.style.display = 'inline-block';
              currentOffset = 25; 
          } else {
              alert('Nothing found.');
              paginationContainer.classList.add('hidden');
          }
      } catch (error) {
          console.error("Search error:", error);
      } finally {
          searchInput.style.opacity = '1';
          isSearching = false;
      }
  };

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      performSearch();
    }
  });

  // --- 7. Пагінація (Load More) ---
  loadMoreBtn.addEventListener('click', async () => {
      if (!currentQuery || isSearching) return;
      
      const originalText = loadMoreBtn.innerHTML;
      loadMoreBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Loading...';
      loadMoreBtn.disabled = true;
      isSearching = true;

      try {
          const nextOffset = currentOffset + 25;
          const moreTracks = await searchTracks(currentQuery, nextOffset);
          
          if (moreTracks && moreTracks.length > 0) {
              player.addToPlaylist(moreTracks);
              currentOffset = nextOffset;
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