export class BPMVisualizer {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      throw new Error(`Container element with ID "${containerId}" not found`);
    }

    this.bpmValue = null;
    this.isStable = false;
    this.pulseInterval = null;
    this.beatCount = 0;

    this.init();
  }

  init() {
    this.valueElement = this.container.querySelector('.bpm-value');
    this.displayElement = this.container.querySelector('.bpm-display');
  }

  updateBPM(bpm, isStable = false) {
    this.bpmValue = bpm;
    this.isStable = isStable;

    if (bpm && bpm > 0) {
      this.container.style.display = 'block';
      this.valueElement.textContent = bpm;
      document.body.classList.add('bpm-active');

      if (isStable) {
        this.container.classList.add('stable');
      } else {
        this.container.classList.remove('stable');
      }

      this.startPulse(bpm);
    }
  }

  setStatus(status, message = null) {
    if (status === 'error') {
      this.container.style.display = 'none';
    }
  }

  startPulse(bpm) {
    if (this.pulseInterval) clearInterval(this.pulseInterval);

    const interval = 60000 / bpm;
    this.triggerPulse();
    this.pulseInterval = setInterval(() => this.triggerPulse(), interval);
  }

  triggerPulse() {
    this.beatCount++;

    this.displayElement.classList.add('beat');
    setTimeout(() => this.displayElement.classList.remove('beat'), 150);
  }

  stopPulse() {
    if (this.pulseInterval) {
      clearInterval(this.pulseInterval);
      this.pulseInterval = null;
    }
    this.displayElement.classList.remove('beat');
  }

  reset() {
    this.stopPulse();
    this.bpmValue = null;
    this.isStable = false;
    this.beatCount = 0;
    this.container.style.display = 'none';
    this.valueElement.textContent = '';
    this.container.classList.remove('stable', 'beat');
    document.body.classList.remove('bpm-active');
  }

  destroy() {
    this.stopPulse();
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}
