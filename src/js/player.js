// src/js/player.js
import { formatTime } from './utils.js';

export class Player {
  constructor(playlist) {
    this.playlist = playlist;
    this.currentIndex = 0;
    this.isPlaying = false;
    this.isAnimating = false;
    this.audio = document.getElementById('audio-element');

    // Перевірка наявності елементів
    const diskElements = Array.from(document.querySelectorAll('.diskette'));
    if (diskElements.length !== 3) {
        console.error("Critical: Need 3 .diskette elements");
        return;
    }

    this.items = [
        { el: diskElements[0], img: diskElements[0].querySelector('img') },
        { el: diskElements[1], img: diskElements[1].querySelector('img') },
        { el: diskElements[2], img: diskElements[2].querySelector('img') }
    ];

    this.ui = {
      title: document.getElementById('track-title'),
      artist: document.getElementById('artist-name'),
      playBtn: document.getElementById('play-btn'),
      playIcon: document.getElementById('play-icon'),
      progressContainer: document.querySelector('.progress-bar'),
      progressFill: document.getElementById('progress'),
      currentTime: document.getElementById('current-time'),
      duration: document.getElementById('duration'),
      carouselScene: document.querySelector('.carousel-scene')
    };

    // Ініціалізація
    this.initCarousel();
    this.updateAudioAndText(this.currentIndex, false); // false = не автоплей
    this.addEventListeners();
  }

  // ... (getSafeIndex та initCarousel без змін) ...
  getSafeIndex(index) {
    const len = this.playlist.length;
    return (index % len + len) % len;
  }

  initCarousel() {
    const iPrev = this.getSafeIndex(this.currentIndex - 1);
    const iActive = this.currentIndex;
    const iNext = this.getSafeIndex(this.currentIndex + 1);

    this.items[0].img.src = this.playlist[iPrev].cover;
    this.items[1].img.src = this.playlist[iActive].cover;
    this.items[2].img.src = this.playlist[iNext].cover;

    this.items[0].el.className = 'diskette pos-prev';
    this.items[1].el.className = 'diskette pos-active';
    this.items[2].el.className = 'diskette pos-next';
  }

  // Навігація
  next() {
    if (this.isAnimating) return;
    this.isAnimating = true;

    this.currentIndex = this.getSafeIndex(this.currentIndex + 1);
    this.updateAudioAndText(this.currentIndex, this.isPlaying); // Граємо тільки якщо вже грали

    // Анімація...
    this.items[0].el.className = 'diskette pos-hidden-left';
    this.items[1].el.className = 'diskette pos-prev';
    this.items[2].el.className = 'diskette pos-active';

    setTimeout(() => {
        const recycledItem = this.items.shift();
        recycledItem.el.classList.add('no-transition');
        recycledItem.el.className = 'diskette pos-hidden-right no-transition';
        
        const futureIndex = this.getSafeIndex(this.currentIndex + 1);
        recycledItem.img.src = this.playlist[futureIndex].cover;

        recycledItem.el.offsetHeight; 
        recycledItem.el.classList.remove('no-transition');
        recycledItem.el.className = 'diskette pos-next';

        this.items.push(recycledItem);
        this.isAnimating = false;
    }, 500);
  }

  prev() {
    if (this.isAnimating) return;
    this.isAnimating = true;

    this.currentIndex = this.getSafeIndex(this.currentIndex - 1);
    this.updateAudioAndText(this.currentIndex, this.isPlaying);

    this.items[2].el.className = 'diskette pos-hidden-right';
    this.items[1].el.className = 'diskette pos-next';
    this.items[0].el.className = 'diskette pos-active';

    setTimeout(() => {
        const recycledItem = this.items.pop();
        recycledItem.el.classList.add('no-transition');
        recycledItem.el.className = 'diskette pos-hidden-left no-transition';
        
        const futureIndex = this.getSafeIndex(this.currentIndex - 1);
        recycledItem.img.src = this.playlist[futureIndex].cover;

        recycledItem.el.offsetHeight;
        recycledItem.el.classList.remove('no-transition');
        recycledItem.el.className = 'diskette pos-prev';

        this.items.unshift(recycledItem);
        this.isAnimating = false;
    }, 500);
  }

  // Оновлена логіка аудіо
  updateAudioAndText(index, shouldPlay = false) {
    const track = this.playlist[index];
    
    // Оновлюємо текст
    this.ui.title.textContent = track.title;
    this.ui.artist.textContent = track.artist;
    
    // Скидаємо стилі помилки (якщо були)
    this.ui.title.style.color = ''; 
    
    // Якщо трек новий - міняємо src
    if (this.audio.src !== track.url) {
        this.audio.src = track.url;
        this.ui.progressFill.style.width = '0%';
        this.ui.currentTime.textContent = '0:00';
        
        // ВАЖЛИВО: Не викликаємо play(), якщо це ініціалізація
        if (shouldPlay) {
            this.playSafely();
        }
    }
  }

  async playSafely() {
    try {
        await this.audio.play();
        this.isPlaying = true;
        this.ui.playIcon.className = 'bi bi-pause-fill';
    } catch (e) {
        // Ігноруємо помилку, якщо це "AbortError" (швидке перемикання)
        if (e.name !== 'AbortError') {
             console.warn("Autoplay/Play blocked:", e);
             this.isPlaying = false;
             this.ui.playIcon.className = 'bi bi-play-fill';
        }
    }
  }

  togglePlay() {
    if (this.isPlaying) {
        this.audio.pause();
        this.isPlaying = false;
        this.ui.playIcon.className = 'bi bi-play-fill';
    } else {
        this.playSafely();
    }
  }

  // Оновлення списку (API)
  updatePlaylist(newTracks) {
      this.audio.pause();
      this.isPlaying = false;
      this.ui.playIcon.className = 'bi bi-play-fill';
      
      this.playlist = newTracks;
      this.currentIndex = 0;
      this.initCarousel();
      this.updateAudioAndText(0, false); // false - не грати одразу
  }

  addToPlaylist(moreTracks) {
      this.playlist = [...this.playlist, ...moreTracks];
  }

  seek(e) {
    const width = this.ui.progressContainer.clientWidth;
    const clickX = e.offsetX;
    const duration = this.audio.duration;
    if (duration) {
        this.audio.currentTime = (clickX / width) * duration;
    }
  }

  updateProgress(e) {
    const { duration, currentTime } = e.srcElement;
    if (!duration) return;
    const p = (currentTime / duration) * 100;
    this.ui.progressFill.style.width = `${p}%`;
    this.ui.currentTime.textContent = formatTime(currentTime);
    this.ui.duration.textContent = formatTime(duration);
  }

  addEventListeners() {
    this.audio.addEventListener('ended', () => this.next());
    this.audio.addEventListener('timeupdate', (e) => this.updateProgress(e));
    
    // ВИПРАВЛЕНО: Обробка помилок аудіо
    this.audio.addEventListener('error', (e) => {
        // Показуємо помилку тільки якщо ми намагалися грати
        if (this.isPlaying) {
            console.error("Audio Load Error:", this.audio.error);
            this.ui.title.textContent = "Error loading audio";
            this.ui.title.style.color = '#ff4444';
            this.isPlaying = false;
            this.ui.playIcon.className = 'bi bi-exclamation-triangle';
        }
    });

    this.ui.playBtn.onclick = () => this.togglePlay();
    document.getElementById('next-btn').onclick = () => this.next();
    document.getElementById('prev-btn').onclick = () => this.prev();
    this.ui.progressContainer.onclick = (e) => this.seek(e);

    this.ui.carouselScene.addEventListener('click', (e) => {
        const card = e.target.closest('.diskette');
        if (!card) return;
        if (card.classList.contains('pos-next')) this.next();
        else if (card.classList.contains('pos-prev')) this.prev();
        else if (card.classList.contains('pos-active')) this.togglePlay();
    });
  }
}