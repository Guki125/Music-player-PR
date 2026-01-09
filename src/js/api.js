import axios from 'axios';

const BASE_URL = 'https://itunes.apple.com/search';

export async function searchTracks(query, offset = 0) {
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

    // Фільтрація треків без прев'ю або обкладинки
    const validResults = results.filter(track => 
        track.previewUrl && track.artworkUrl100
    );

    return validResults.map(track => {
      return {
        title: track.trackName,
        artist: track.artistName,
        cover: track.artworkUrl100.replace('100x100bb', '600x600bb'),
        url: track.previewUrl,
        id: track.trackId
      };
    });

  } catch (error) {
    console.error('API Request failed:', error);
    return []; 
  }
}