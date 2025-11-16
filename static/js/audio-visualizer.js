import { ColorObserver, prefersReducedMotion, supportsCanvas, createVisibilityHandler } from './utils.js';

const DEFAULT_CONFIG = {
  fftSize: 128,
  barCount: 32,
  barGap: 2,
  barHeightMultiplier: 0.7,
  opacityBase: 0.15,
  opacityRange: 0.15
};

/**
 * AudioVisualizer renders a real-time frequency spectrum visualization
 * on a canvas element, synced with the site's animated accent color.
 */
export class AudioVisualizer {
  constructor(canvasId, audioContext, config = {}) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      throw new Error(`Canvas element with ID "${canvasId}" not found`);
    }

    if (!supportsCanvas()) {
      console.warn('Canvas not supported, audio visualizer disabled');
      this.canvas.style.display = 'none';
      return;
    }

    this.config = { ...DEFAULT_CONFIG, ...config };
    this.ctx = this.canvas.getContext('2d');
    this.audioContext = audioContext;
    this.analyser = null;
    this.dataArray = null;
    this.bufferLength = null;
    this.animationId = null;
    this.isActive = false;
    this.isPaused = false;
    this.resizeHandler = null;
    this.cleanupVisibility = null;

    this.colorObserver = new ColorObserver();
    this.shouldAnimate = !prefersReducedMotion();

    this.setupCanvas();
    this.setupVisibilityHandler();
    this.colorObserver.start();
  }

  setupCanvas() {
    this.resizeHandler = () => {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    };
    this.resizeHandler();
    window.addEventListener('resize', this.resizeHandler);
  }

  setupVisibilityHandler() {
    this.cleanupVisibility = createVisibilityHandler(
      () => this.resume(),
      () => this.pause()
    );
  }

  init(source) {
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = this.config.fftSize;
    this.bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(this.bufferLength);

    source.connect(this.analyser);
  }

  start() {
    if (this.isActive || !this.shouldAnimate) return;
    this.isActive = true;
    this.isPaused = false;
    this.canvas.style.display = 'block';
    this.draw();
  }

  stop() {
    this.isActive = false;
    this.isPaused = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.canvas.style.display = 'none';
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  pause() {
    if (!this.isActive) return;
    this.isPaused = true;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  resume() {
    if (!this.isActive || !this.isPaused) return;
    this.isPaused = false;
    this.draw();
  }

  draw() {
    if (!this.isActive || this.isPaused) return;

    this.animationId = requestAnimationFrame(() => this.draw());
    this.analyser.getByteFrequencyData(this.dataArray);

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const totalGapWidth = (this.config.barCount - 1) * this.config.barGap;
    const totalBarWidth = this.canvas.width - totalGapWidth;
    const barWidth = totalBarWidth / this.config.barCount;

    const { r, g, b } = this.colorObserver.getRgb();

    for (let i = 0; i < this.config.barCount; i++) {
      const dataIndex = Math.floor((i / this.config.barCount) * this.bufferLength);
      const value = this.dataArray[dataIndex];
      const normalizedValue = value / 255;
      const barHeight = normalizedValue * this.canvas.height * this.config.barHeightMultiplier;

      const x = i * (barWidth + this.config.barGap);
      const y = this.canvas.height - barHeight;

      const opacity = this.config.opacityBase + normalizedValue * this.config.opacityRange;
      this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
      this.ctx.fillRect(x, y, barWidth, barHeight);
    }
  }

  destroy() {
    this.stop();

    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = null;
    }

    if (this.cleanupVisibility) {
      this.cleanupVisibility();
      this.cleanupVisibility = null;
    }

    if (this.colorObserver) {
      this.colorObserver.stop();
    }

    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }
  }
}
