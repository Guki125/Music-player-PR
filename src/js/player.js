// src/js/player.js
import { formatTime } from './utils.js';

export class Player {
  constructor(playlist) {
    this.playlist = playlist;
    this.currentIndex = 0;
    this.isPlaying = false;
    this.isAnimating = false;
    this.audio = document.getElementById('audio-element');

    // Знаходимо всі дискети (має бути 3)
    const diskElements = Array.from(document.querySelectorAll('.diskette'));
    
    if (diskElements.length !== 3) {
        console.error("Critical Error: HTML must contain exactly 3 .diskette elements!");
        return;
    }

    // Створюємо структуру (Items)
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
      // Контейнер каруселі для кліків
      carouselScene: document.querySelector('.carousel-scene')
    };

    // Ініціалізація
    this.initCarousel();
    this.updateAudioAndText(this.currentIndex);
    this.addEventListeners();
  }

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

  // --- Навігація Вперед ---
  next() {
    if (this.isAnimating) return;
    this.isAnimating = true;

    this.currentIndex = this.getSafeIndex(this.currentIndex + 1);
    this.updateAudioAndText(this.currentIndex);
    if (this.isPlaying) this.playSafely();

    // Зсув класів
    this.items[0].el.className = 'diskette pos-hidden-left';
    this.items[1].el.className = 'diskette pos-prev';
    this.items[2].el.className = 'diskette pos-active';

    setTimeout(() => {
        const recycledItem = this.items.shift(); // Забираємо перший (лівий)
        
        recycledItem.el.classList.add('no-transition');
        recycledItem.el.className = 'diskette pos-hidden-right no-transition'; // Телепорт направо
        
        // Вантажимо картинку майбутнього треку
        const futureIndex = this.getSafeIndex(this.currentIndex + 1);
        recycledItem.img.src = this.playlist[futureIndex].cover;

        recycledItem.el.offsetHeight; // Force reflow

        recycledItem.el.classList.remove('no-transition');
        recycledItem.el.className = 'diskette pos-next';

        this.items.push(recycledItem); // Додаємо в кінець
        this.isAnimating = false;
    }, 500);
  }

  // --- Навігація Назад ---
  prev() {
    if (this.isAnimating) return;
    this.isAnimating = true;

    this.currentIndex = this.getSafeIndex(this.currentIndex - 1);
    this.updateAudioAndText(this.currentIndex);
    if (this.isPlaying) this.playSafely();

    this.items[2].el.className = 'diskette pos-hidden-right';
    this.items[1].el.className = 'diskette pos-next';
    this.items[0].el.className = 'diskette pos-active';

    setTimeout(() => {
        const recycledItem = this.items.pop(); // Забираємо останній (правий)
        
        recycledItem.el.classList.add('no-transition');
        recycledItem.el.className = 'diskette pos-hidden-left no-transition'; // Телепорт наліво
        
        const futureIndex = this.getSafeIndex(this.currentIndex - 1);
        recycledItem.img.src = this.playlist[futureIndex].cover;

        recycledItem.el.offsetHeight;

        recycledItem.el.classList.remove('no-transition');
        recycledItem.el.className = 'diskette pos-prev';

        this.items.unshift(recycledItem);
        this.isAnimating = false;
    }, 500);
  }

  // --- Аудіо ---
  async playSafely() {
    try {
        await this.audio.play();
        this.isPlaying = true;
        this.ui.playIcon.className = 'bi bi-pause-fill';
    } catch (e) {
        console.warn("Autoplay blocked (user interaction required):", e);
        this.isPlaying = false;
        this.ui.playIcon.className = 'bi bi-play-fill';
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

  updateAudioAndText(index) {
    const track = this.playlist[index];
    this.ui.title.textContent = track.title;
    this.ui.artist.textContent = track.artist;
    
    // Оновлюємо сорс, якщо він змінився (навіть при першому запуску)
    if (this.audio.src !== track.url) {
        this.audio.src = track.url;
        this.ui.progressFill.style.width = '0%';
        this.ui.currentTime.textContent = '0:00';
    }
  }

  updatePlaylist(newTracks) {
      this.audio.pause();
      this.isPlaying = false;
      this.ui.playIcon.className = 'bi bi-play-fill';
      
      this.playlist = newTracks;
      this.currentIndex = 0;
      this.initCarousel();
      his.updateAudioAndText(0);
      
        const totalChars = this.playlist.reduce((acc, track) => {
            return acc + track.title.length;
        }, 0);
        console.log(`Статистика плейлиста (reduce): ${totalChars} символів у назвах пісень.`);
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
    // ... (старі події: ended, timeupdate)
    this.audio.addEventListener('ended', () => this.next());
    this.audio.addEventListener('timeupdate', (e) => this.updateProgress(e));
    
    // --- НОВЕ: ДІАГНОСТИКА ПОМИЛОК ---
    this.audio.addEventListener('error', (e) => {
        console.error("❌ Помилка відтворення:", this.audio.error);
        console.warn("🔗 Проблемний URL:", this.audio.src);
        
        // Візуально показуємо користувачу, що щось не так
        this.ui.title.textContent = "Error loading track";
        this.ui.playIcon.className = 'bi bi-exclamation-triangle-fill'; // Іконка трикутника
        this.isPlaying = false;
    });

    // ... (решта коду кнопок)
    this.ui.playBtn.onclick = () => this.togglePlay();
    document.getElementById('next-btn').onclick = () => this.next();
    document.getElementById('prev-btn').onclick = () => this.prev();
    this.ui.progressContainer.onclick = (e) => this.seek(e);

    // Делегування для каруселі
    this.ui.carouselScene.addEventListener('click', (e) => {
        const card = e.target.closest('.diskette');
        if (!card) return;
        if (card.classList.contains('pos-next')) this.next();
        else if (card.classList.contains('pos-prev')) this.prev();
        else if (card.classList.contains('pos-active')) this.togglePlay();
    });
  }

  addToPlaylist(moreTracks) {
      this.playlist = [...this.playlist, ...moreTracks];
      console.log(`Додано ${moreTracks.length} треків. Всього: ${this.playlist.length}`);
  }
}