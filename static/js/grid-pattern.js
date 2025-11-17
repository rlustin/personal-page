import { ColorObserver, prefersReducedMotion, supportsCanvas, createVisibilityHandler } from './utils.js';

const DEFAULT_CONFIG = {
  gridSpacing: 60,
  lineWidth: 1,
  mouseInfluenceRadius: 250,
  baseOpacity: 0.06,
  pulseOpacityRange: 0.06,
  pulseSpeed: 0.0008,
  maxLineWidth: 2.5
};

/**
 * GridPattern creates a minimal grid that pulses with the accent color
 * and subtly reacts to mouse movement.
 */
export class GridPattern {
  constructor(canvasId, config = {}) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      throw new Error(`Canvas element with ID "${canvasId}" not found`);
    }

    if (!supportsCanvas()) {
      console.warn('Canvas not supported, grid pattern disabled');
      this.canvas.style.display = 'none';
      return;
    }

    this.config = { ...DEFAULT_CONFIG, ...config };
    this.ctx = this.canvas.getContext('2d');
    this.mouse = { x: null, y: null };
    this.animationId = null;
    this.isActive = false;
    this.isPaused = false;
    this.time = 0;
    this.resizeHandler = null;
    this.mouseMoveHandler = null;
    this.mouseLeaveHandler = null;
    this.cleanupVisibility = null;

    this.colorObserver = new ColorObserver();
    this.shouldAnimate = !prefersReducedMotion();

    this.setupCanvas();
    this.setupMouseTracking();
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

  setupMouseTracking() {
    this.mouseMoveHandler = (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    };

    this.mouseLeaveHandler = () => {
      this.mouse.x = null;
      this.mouse.y = null;
    };

    window.addEventListener('mousemove', this.mouseMoveHandler);
    window.addEventListener('mouseleave', this.mouseLeaveHandler);
  }

  setupVisibilityHandler() {
    this.cleanupVisibility = createVisibilityHandler(
      () => this.resume(),
      () => this.pause()
    );
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
    this.time += this.config.pulseSpeed;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const { r, g, b } = this.colorObserver.getRgb();
    const pulse = Math.sin(this.time * 1000) * 0.5 + 0.5;

    const verticalLines = Math.ceil(this.canvas.width / this.config.gridSpacing);
    for (let i = 0; i <= verticalLines; i++) {
      const x = i * this.config.gridSpacing;
      const { opacity, lineWidth } = this.calculateLineStyle(x, this.canvas.height / 2, pulse);

      this.ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
      this.ctx.lineWidth = lineWidth;
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvas.height);
      this.ctx.stroke();
    }

    const horizontalLines = Math.ceil(this.canvas.height / this.config.gridSpacing);
    for (let i = 0; i <= horizontalLines; i++) {
      const y = i * this.config.gridSpacing;
      const { opacity, lineWidth } = this.calculateLineStyle(this.canvas.width / 2, y, pulse);

      this.ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
      this.ctx.lineWidth = lineWidth;
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width, y);
      this.ctx.stroke();
    }
  }

  calculateLineStyle(x, y, pulse) {
    let opacity = this.config.baseOpacity + pulse * this.config.pulseOpacityRange;
    let lineWidth = this.config.lineWidth;

    if (this.mouse.x !== null && this.mouse.y !== null) {
      const dx = this.mouse.x - x;
      const dy = this.mouse.y - y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < this.config.mouseInfluenceRadius) {
        const influence = 1 - distance / this.config.mouseInfluenceRadius;
        const smoothInfluence = influence * influence; // Quadratic easing for smoother falloff

        // Enhance opacity near mouse
        opacity += smoothInfluence * 0.2;

        // Increase line width near mouse
        lineWidth = this.config.lineWidth + smoothInfluence * (this.config.maxLineWidth - this.config.lineWidth);
      }
    }

    return { opacity, lineWidth };
  }

  destroy() {
    this.stop();

    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = null;
    }

    if (this.mouseMoveHandler) {
      window.removeEventListener('mousemove', this.mouseMoveHandler);
      this.mouseMoveHandler = null;
    }

    if (this.mouseLeaveHandler) {
      window.removeEventListener('mouseleave', this.mouseLeaveHandler);
      this.mouseLeaveHandler = null;
    }

    if (this.cleanupVisibility) {
      this.cleanupVisibility();
      this.cleanupVisibility = null;
    }

    if (this.colorObserver) {
      this.colorObserver.stop();
    }
  }
}
