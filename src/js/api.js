// src/js/api.js
import axios from 'axios';

const BASE_URL = 'https://itunes.apple.com/search';

// --- Функція пошуку треків ---
export async function searchTracks(query, offset = 0) {
  if (!query) return [];

  try {
    // --- 1. Виконання запиту до iTunes API ---
    const response = await axios.get(BASE_URL, {
      params: {
        term: query,
        media: 'music',
        entity: 'song',
        limit: 25,
        offset: offset
      }
    });

    if (!response.data || !response.data.results) {
        return [];
    }

    // --- 2. Фільтрація та форматування даних ---
    const results = response.data.results;

    // Фільтруємо треки без прев'ю або обкладинки
    const validResults = results.filter(track => 
        track.previewUrl && 
        track.artworkUrl100
    );

    // Форматуємо об'єкти для зручного використання в плеєрі
    return validResults.map(track => {
      return {
        title: track.trackName,
        artist: track.artistName,
        cover: track.artworkUrl100.replace('100x100bb', '600x600bb'), // Підвищення якості зображення
        url: track.previewUrl,
        id: track.trackId
      };
    });

  } catch (error) {
    // --- 3. Обробка помилок ---
    console.error('API Request failed:', error);
    return []; 
  }
}