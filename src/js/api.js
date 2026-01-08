// src/js/api.js
import axios from 'axios';

const BASE_URL = 'https://itunes.apple.com/search';

export async function searchTracks(query, offset = 0) {
  // Якщо запит пустий, одразу повертаємо пустий масив
  if (!query) return [];

  try {
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

    const results = response.data.results;

    // Жорстка фільтрація: Тільки треки з прев'ю і картинкою
    const validResults = results.filter(track => 
        track.previewUrl && 
        track.artworkUrl100
    );

    const formattedTracks = validResults.map(track => {
      // Хак для якості картинки
      const highResCover = track.artworkUrl100.replace('100x100bb', '600x600bb');
      return {
        title: track.trackName,
        artist: track.artistName,
        cover: highResCover,
        url: track.previewUrl,
        id: track.trackId
      };
    });

    return formattedTracks;

  } catch (error) {
    console.error('API Request failed:', error);
    // Повертаємо пустий масив замість викидання помилки, 
    // щоб не ламати інтерфейс "червоним" алертом
    return []; 
  }
}