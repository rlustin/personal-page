import { ColorObserver, prefersReducedMotion, supportsCanvas, createVisibilityHandler } from './utils.js';

const DEFAULT_CONFIG = {
  particleCount: 40,
  particleBaseSize: 3,
  particleSizeVariance: 2,
  mouseInfluenceRadius: 150,
  mouseInfluenceStrength: 0.3,
  animationSpeed: 0.0005,
  pulseSpeed: 0.002
};

/**
 * BackgroundPattern creates an animated geometric pattern that reacts to mouse movement
 * and pulses with the site's accent color animation.
 */
export class BackgroundPattern {
  constructor(canvasId, config = {}) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      throw new Error(`Canvas element with ID "${canvasId}" not found`);
    }

    if (!supportsCanvas()) {
      console.warn('Canvas not supported, background pattern disabled');
      this.canvas.style.display = 'none';
      return;
    }

    this.config = { ...DEFAULT_CONFIG, ...config };
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
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
    this.initParticles();
    this.colorObserver.start();
  }

  setupCanvas() {
    this.resizeHandler = () => {
      const oldWidth = this.canvas.width;
      const oldHeight = this.canvas.height;
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;

      if (oldWidth > 0 && oldHeight > 0) {
        this.particles.forEach(particle => {
          particle.baseX = (particle.baseX / oldWidth) * this.canvas.width;
          particle.baseY = (particle.baseY / oldHeight) * this.canvas.height;
        });
      }
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

  initParticles() {
    this.particles = [];
    for (let i = 0; i < this.config.particleCount; i++) {
      this.particles.push({
        baseX: Math.random() * this.canvas.width,
        baseY: Math.random() * this.canvas.height,
        x: 0,
        y: 0,
        size: this.config.particleBaseSize + Math.random() * this.config.particleSizeVariance,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
        phase: Math.random() * Math.PI * 2
      });
    }
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
    this.time += this.config.animationSpeed;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const { r, g, b } = this.colorObserver.getRgb();

    this.particles.forEach((particle) => {
      particle.baseX += particle.speedX;
      particle.baseY += particle.speedY;

      if (particle.baseX < 0 || particle.baseX > this.canvas.width) particle.speedX *= -1;
      if (particle.baseY < 0 || particle.baseY > this.canvas.height) particle.speedY *= -1;

      let x = particle.baseX;
      let y = particle.baseY;

      if (this.mouse.x !== null && this.mouse.y !== null) {
        const dx = this.mouse.x - particle.baseX;
        const dy = this.mouse.y - particle.baseY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.config.mouseInfluenceRadius) {
          const force = (1 - distance / this.config.mouseInfluenceRadius) * this.config.mouseInfluenceStrength;
          x += dx * force;
          y += dy * force;
        }
      }

      particle.x = x;
      particle.y = y;

      const pulse = Math.sin(this.time * 1000 * this.config.pulseSpeed + particle.phase) * 0.5 + 0.5;
      const opacity = 0.15 + pulse * 0.15;

      this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
      this.ctx.beginPath();
      this.ctx.arc(x, y, particle.size, 0, Math.PI * 2);
      this.ctx.fill();
    });
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
