import axios from 'axios';

const BASE_URL = 'https://itunes.apple.com/search';

// Додали параметр offset (за замовчуванням 0)
export async function searchTracks(query, offset = 0) {
  try {
    const response = await axios.get(BASE_URL, {
      params: {
        term: query,
        media: 'music',
        entity: 'song',
        limit: 25,
        offset: offset // Важливий параметр для пагінації
      }
    });

    const results = response.data.results;
    
    // Фільтрація
    const validResults = results.filter(track => track.previewUrl && track.artworkUrl100);

    const formattedTracks = validResults.map(track => {
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
    console.error('API Error:', error);
    throw error;
  }
}