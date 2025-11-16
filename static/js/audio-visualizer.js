const FFT_SIZE = 128;
const BAR_COUNT = 32;
const BAR_GAP = 2;
const BAR_HEIGHT_MULTIPLIER = 0.7;
const OPACITY_BASE = 0.15;
const OPACITY_RANGE = 0.15;
const DEFAULT_COLOR = { r: 255, g: 51, b: 102 };

/**
 * AudioVisualizer renders a real-time frequency spectrum visualization
 * on a canvas element, synced with the site's animated accent color.
 */
export class AudioVisualizer {
  constructor(canvasId, audioContext) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      throw new Error(`Canvas element with ID "${canvasId}" not found`);
    }

    this.ctx = this.canvas.getContext('2d');
    this.audioContext = audioContext;
    this.analyser = null;
    this.dataArray = null;
    this.bufferLength = null;
    this.animationId = null;
    this.isActive = false;
    this.cachedColor = null;
    this.cachedRgb = DEFAULT_COLOR;
    this.resizeHandler = null;

    this.setupCanvas();
    this.setupColorObserver();
  }

  setupCanvas() {
    this.resizeHandler = () => {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    };
    this.resizeHandler();
    window.addEventListener('resize', this.resizeHandler);
  }

  setupColorObserver() {
    this.updateColor();
    setInterval(() => this.updateColor(), 1000);
  }

  updateColor() {
    const accentColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--accent-primary')
      .trim();

    if (accentColor && accentColor !== this.cachedColor) {
      this.cachedColor = accentColor;
      this.cachedRgb = this.parseColor(accentColor);
    }
  }

  init(source) {
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = FFT_SIZE;
    this.bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(this.bufferLength);

    source.connect(this.analyser);
  }

  start() {
    if (this.isActive) return;
    this.isActive = true;
    this.canvas.style.display = 'block';
    this.draw();
  }

  stop() {
    this.isActive = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.canvas.style.display = 'none';
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  draw() {
    if (!this.isActive) return;

    this.animationId = requestAnimationFrame(() => this.draw());
    this.analyser.getByteFrequencyData(this.dataArray);

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const totalGapWidth = (BAR_COUNT - 1) * BAR_GAP;
    const totalBarWidth = this.canvas.width - totalGapWidth;
    const barWidth = totalBarWidth / BAR_COUNT;

    for (let i = 0; i < BAR_COUNT; i++) {
      const dataIndex = Math.floor((i / BAR_COUNT) * this.bufferLength);
      const value = this.dataArray[dataIndex];
      const normalizedValue = value / 255;
      const barHeight = normalizedValue * this.canvas.height * BAR_HEIGHT_MULTIPLIER;

      const x = i * (barWidth + BAR_GAP);
      const y = this.canvas.height - barHeight;

      const opacity = OPACITY_BASE + normalizedValue * OPACITY_RANGE;
      const { r, g, b } = this.cachedRgb;
      this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
      this.ctx.fillRect(x, y, barWidth, barHeight);
    }
  }

  parseColor(color) {
    const hexMatch = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
    if (hexMatch) {
      return {
        r: parseInt(hexMatch[1], 16),
        g: parseInt(hexMatch[2], 16),
        b: parseInt(hexMatch[3], 16)
      };
    }

    const rgbMatch = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(color);
    if (rgbMatch) {
      return {
        r: parseInt(rgbMatch[1], 10),
        g: parseInt(rgbMatch[2], 10),
        b: parseInt(rgbMatch[3], 10)
      };
    }

    return DEFAULT_COLOR;
  }

  destroy() {
    this.stop();

    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = null;
    }

    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }
  }
}
