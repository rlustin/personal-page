import {
  ColorObserver,
  prefersReducedMotion,
  supportsCanvas,
  createVisibilityHandler,
} from './utils.js';

const DEFAULT_CONFIG = {
  gridSpacing: 80,
  lineCount: 18,
  lineOpacity: 0.06,
  segmentOpacity: 0.08,
  accentLineCount: 5,
  accentOpacity: 0.12,
  mouseInfluenceRadius: 200,
  animationSpeed: 0.0003,
  pulseSpeed: 0.0015,
  driftSpeed: 0.15,
  particleCount: 40,
  particleBaseSize: 3,
  particleSizeVariance: 2,
  particleDriftSpeed: 0.3,
};

/**
 * BackgroundPattern draws an architectural blueprint-style grid
 * with drifting horizontal and vertical lines.
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
    this.lines = [];
    this.particles = [];
    this.mouse = { x: null, y: null };
    this.animationId = null;
    this.isActive = false;
    this.isPaused = false;
    this.time = 0;
    this.resizeHandler = null;
    this.mouseMoveHandler = null;
    this.mouseLeaveHandler = null;
    this.touchMoveHandler = null;
    this.touchEndHandler = null;
    this.cleanupVisibility = null;

    this.colorObserver = new ColorObserver();
    this.shouldAnimate = !prefersReducedMotion();

    this.setupCanvas();
    this.setupMouseTracking();
    this.setupVisibilityHandler();
    this.initLines();
    this.initParticles();
    this.colorObserver.start();
  }

  setupCanvas() {
    this.resizeHandler = () => {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
      if (this.lines.length === 0) {
        this.initLines();
        this.initParticles();
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

    this.touchMoveHandler = (e) => {
      if (e.touches.length > 0) {
        e.preventDefault();
        this.mouse.x = e.touches[0].clientX;
        this.mouse.y = e.touches[0].clientY;
      }
    };

    this.touchEndHandler = () => {
      this.mouse.x = null;
      this.mouse.y = null;
    };

    window.addEventListener('mousemove', this.mouseMoveHandler);
    window.addEventListener('mouseleave', this.mouseLeaveHandler);
    window.addEventListener('touchmove', this.touchMoveHandler, { passive: false });
    window.addEventListener('touchend', this.touchEndHandler);
    window.addEventListener('touchcancel', this.touchEndHandler);
  }

  setupVisibilityHandler() {
    this.cleanupVisibility = createVisibilityHandler(
      () => this.resume(),
      () => this.pause()
    );
  }

  initParticles() {
    this.particles = [];
    const w = this.canvas.width;
    const h = this.canvas.height;

    for (let i = 0; i < this.config.particleCount; i++) {
      this.particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        size: this.config.particleBaseSize + Math.random() * this.config.particleSizeVariance,
        vx: (Math.random() - 0.5) * this.config.particleDriftSpeed,
        vy: (Math.random() - 0.5) * this.config.particleDriftSpeed,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  initLines() {
    this.lines = [];
    const w = this.canvas.width;
    const h = this.canvas.height;
    const totalLines = this.config.lineCount + this.config.accentLineCount;

    for (let i = 0; i < totalLines; i++) {
      const isAccent = i >= this.config.lineCount;
      const isHorizontal = Math.random() > 0.5;

      this.lines.push({
        x: Math.random() * w,
        y: Math.random() * h,
        isHorizontal,
        vx: isHorizontal ? 0 : (Math.random() - 0.5) * this.config.driftSpeed,
        vy: isHorizontal ? (Math.random() - 0.5) * this.config.driftSpeed : 0,
        thickness: isAccent ? 2.5 + Math.random() * 2 : 1 + Math.random() * 1.5,
        phase: Math.random() * Math.PI * 2,
        isAccent,
        hasDouble: Math.random() > 0.6,
        doubleOffset: 4 + Math.random() * 6,
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

    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);

    const { r, g, b } = this.colorObserver.getRgb();
    const copyColor = '45, 45, 45';

    this.drawGrid(ctx, w, h, copyColor);
    this.updateLines(w, h);
    this.drawLines(ctx, r, g, b, copyColor);
    this.updateParticles(w, h);
    this.drawParticles(ctx, r, g, b);
  }

  drawGrid(ctx, w, h, copyColor) {
    const spacing = this.config.gridSpacing;
    const baseOpacity = this.config.lineOpacity;

    ctx.lineWidth = 0.5;

    for (let x = 0; x < w; x += spacing) {
      let opacity = baseOpacity;

      if (this.mouse.x !== null) {
        const dist = Math.abs(this.mouse.x - x);
        if (dist < this.config.mouseInfluenceRadius) {
          const influence = 1 - dist / this.config.mouseInfluenceRadius;
          opacity += influence * 0.06;
        }
      }

      ctx.strokeStyle = `rgba(${copyColor}, ${opacity})`;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    for (let y = 0; y < h; y += spacing) {
      let opacity = baseOpacity;

      if (this.mouse.y !== null) {
        const dist = Math.abs(this.mouse.y - y);
        if (dist < this.config.mouseInfluenceRadius) {
          const influence = 1 - dist / this.config.mouseInfluenceRadius;
          opacity += influence * 0.06;
        }
      }

      ctx.strokeStyle = `rgba(${copyColor}, ${opacity})`;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  }

  updateLines(w, h) {
    this.lines.forEach((line) => {
      line.x += line.vx;
      line.y += line.vy;

      if (line.isHorizontal) {
        if (line.y < 0) line.y = h;
        if (line.y > h) line.y = 0;
      } else {
        if (line.x < 0) line.x = w;
        if (line.x > w) line.x = 0;
      }
    });
  }

  drawLines(ctx, r, g, b, copyColor) {
    this.lines.forEach((line) => {
      const pulse =
        Math.sin(this.time * 1000 * this.config.pulseSpeed + line.phase) * 0.5 + 0.5;

      let mouseProximity = 0;
      if (this.mouse.x !== null && this.mouse.y !== null) {
        const dx = this.mouse.x - line.x;
        const dy = this.mouse.y - line.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < this.config.mouseInfluenceRadius) {
          mouseProximity = 1 - dist / this.config.mouseInfluenceRadius;
        }
      }

      const color = line.isAccent ? `${r}, ${g}, ${b}` : copyColor;
      const baseOpacity = line.isAccent ? this.config.accentOpacity : this.config.segmentOpacity;
      const opacity = baseOpacity + pulse * 0.04 + mouseProximity * 0.06;

      let x1, y1, x2, y2;

      if (line.isHorizontal) {
        x1 = 0;
        x2 = this.canvas.width;
        y1 = line.y;
        y2 = line.y;
      } else {
        x1 = line.x;
        x2 = line.x;
        y1 = 0;
        y2 = this.canvas.height;
      }

      ctx.strokeStyle = `rgba(${color}, ${opacity})`;
      ctx.lineWidth = line.thickness;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      if (line.hasDouble) {
        const off = line.doubleOffset;
        ctx.strokeStyle = `rgba(${color}, ${opacity * 0.5})`;
        ctx.lineWidth = line.thickness * 0.5;
        ctx.beginPath();
        if (line.isHorizontal) {
          ctx.moveTo(x1, y1 + off);
          ctx.lineTo(x2, y2 + off);
        } else {
          ctx.moveTo(x1 + off, y1);
          ctx.lineTo(x2 + off, y2);
        }
        ctx.stroke();
      }
    });
  }

  updateParticles(w, h) {
    this.particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) p.x = w;
      if (p.x > w) p.x = 0;
      if (p.y < 0) p.y = h;
      if (p.y > h) p.y = 0;

      if (this.mouse.x !== null && this.mouse.y !== null) {
        const dx = p.x - this.mouse.x;
        const dy = p.y - this.mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < this.config.mouseInfluenceRadius && dist > 0) {
          const force = (1 - dist / this.config.mouseInfluenceRadius) * 0.5;
          p.x += (dx / dist) * force;
          p.y += (dy / dist) * force;
        }
      }
    });
  }

  drawParticles(ctx, r, g, b) {
    this.particles.forEach((p) => {
      const pulse =
        Math.sin(this.time * 1000 * this.config.pulseSpeed + p.phase) * 0.5 + 0.5;
      const opacity = 0.15 + pulse * 0.15;

      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
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

    if (this.touchMoveHandler) {
      window.removeEventListener('touchmove', this.touchMoveHandler);
      this.touchMoveHandler = null;
    }

    if (this.touchEndHandler) {
      window.removeEventListener('touchend', this.touchEndHandler);
      window.removeEventListener('touchcancel', this.touchEndHandler);
      this.touchEndHandler = null;
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
