import { createRealTimeBpmProcessor, getBiquadFilter } from 'realtime-bpm-analyzer';

export class BPMDetector {
  constructor(audioElement, visualizer) {
    this.audioElement = audioElement;
    this.visualizer = visualizer;
    this.audioContext = null;
    this.analyzerNode = null;
    this.isInitialized = false;
    this.currentBPM = null;
    this.isStable = false;
  }

  async init() {
    if (this.isInitialized) return;

    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContextClass();
      this.analyzerNode = await createRealTimeBpmProcessor(this.audioContext);
      const source = this.audioContext.createMediaElementSource(this.audioElement);
      const lowpass = getBiquadFilter(this.audioContext);

      source.connect(lowpass);
      lowpass.connect(this.analyzerNode);
      source.connect(this.audioContext.destination);

      this.analyzerNode.port.onmessage = (event) => this.handleBPMEvent(event);
      this.isInitialized = true;
      this.visualizer.setStatus('ready');
    } catch (error) {
      const isCorsError = error.name === 'SecurityError' || error.message.includes('cross-origin');
      this.visualizer.setStatus('error', isCorsError ? 'CORS blocked' : 'Unavailable');
    }
  }

  handleBPMEvent(event) {
    const { message, data } = event.data;
    const bpmValue = Array.isArray(data.bpm) ? data.bpm[0]?.tempo : data.bpm;

    if (!bpmValue) return;

    this.currentBPM = Math.round(bpmValue);
    this.isStable = message === 'BPM_STABLE';
    this.visualizer.updateBPM(this.currentBPM, this.isStable);
  }

  async start() {
    if (!this.isInitialized) await this.init();
    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume();
    }
    this.visualizer.setStatus('analyzing');
  }

  reset() {
    this.currentBPM = null;
    this.isStable = false;
    this.visualizer.reset();
  }

  destroy() {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.isInitialized = false;
  }
}
