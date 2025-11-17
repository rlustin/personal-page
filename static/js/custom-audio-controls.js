// Custom Audio Controls
export class CustomAudioControls {
  constructor(audioElement) {
    this.audio = audioElement;
    this.playPauseBtn = document.getElementById('play-pause');
    this.muteBtn = document.getElementById('mute-toggle');
    this.progressBar = document.querySelector('.progress-bar');
    this.progressFilled = document.querySelector('.progress-filled');
    this.currentTimeDisplay = document.querySelector('.current-time');
    this.durationDisplay = document.querySelector('.duration');
    this.volumeSlider = document.getElementById('volume-slider');

    this.init();
  }

  init() {
    if (!this.audio) return;

    // Play/Pause
    this.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
    this.audio.addEventListener('play', () => this.updatePlayPauseButton(true));
    this.audio.addEventListener('pause', () => this.updatePlayPauseButton(false));

    // Progress bar
    this.audio.addEventListener('timeupdate', () => this.updateProgress());
    this.audio.addEventListener('loadedmetadata', () => this.updateDuration());
    this.progressBar.addEventListener('click', (e) => this.seek(e));

    // Volume
    if (this.volumeSlider) {
      this.volumeSlider.addEventListener('input', (e) => this.updateVolume(e));
    }
    this.muteBtn.addEventListener('click', () => this.toggleMute());

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => this.handleKeyboard(e));
  }

  togglePlayPause() {
    if (this.audio.paused) {
      this.audio.play();
    } else {
      this.audio.pause();
    }
  }

  updatePlayPauseButton(isPlaying) {
    const playIcon = this.playPauseBtn.querySelector('.play-icon');
    const pauseIcon = this.playPauseBtn.querySelector('.pause-icon');

    if (isPlaying) {
      playIcon.style.display = 'none';
      pauseIcon.style.display = 'block';
    } else {
      playIcon.style.display = 'block';
      pauseIcon.style.display = 'none';
    }
  }

  updateProgress() {
    const percent = (this.audio.currentTime / this.audio.duration) * 100;
    this.progressFilled.style.width = `${percent}%`;
    this.currentTimeDisplay.textContent = this.formatTime(this.audio.currentTime);
  }

  updateDuration() {
    this.durationDisplay.textContent = this.formatTime(this.audio.duration);
  }

  seek(e) {
    const rect = this.progressBar.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    this.audio.currentTime = percent * this.audio.duration;
  }

  updateVolume(e) {
    this.audio.volume = e.target.value / 100;
    this.updateMuteButton();
  }

  toggleMute() {
    this.audio.muted = !this.audio.muted;
    this.updateMuteButton();
  }

  updateMuteButton() {
    const volumeIcon = this.muteBtn.querySelector('.volume-icon');
    const muteIcon = this.muteBtn.querySelector('.mute-icon');

    if (this.audio.muted || this.audio.volume === 0) {
      volumeIcon.style.display = 'none';
      muteIcon.style.display = 'block';
    } else {
      volumeIcon.style.display = 'block';
      muteIcon.style.display = 'none';
    }
  }

  formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  handleKeyboard(e) {
    // Space bar to play/pause
    if (e.code === 'Space' && e.target.tagName !== 'INPUT') {
      e.preventDefault();
      this.togglePlayPause();
    }

    // Arrow keys for seeking
    if (e.code === 'ArrowLeft') {
      e.preventDefault();
      this.audio.currentTime = Math.max(0, this.audio.currentTime - 5);
    }
    if (e.code === 'ArrowRight') {
      e.preventDefault();
      this.audio.currentTime = Math.min(this.audio.duration, this.audio.currentTime + 5);
    }

    // M to mute
    if (e.code === 'KeyM') {
      e.preventDefault();
      this.toggleMute();
    }
  }
}
