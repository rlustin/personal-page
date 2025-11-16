import { createRealTimeBpmProcessor, getBiquadFilter } from 'realtime-bpm-analyzer';

const BPM_MESSAGE_STABLE = 'BPM_STABLE';

/**
 * BPMDetector analyzes audio in real-time to detect beats per minute (BPM)
 * using the Web Audio API and realtime-bpm-analyzer library.
 */
export class BPMDetector {
  constructor(audioElement, visualizer, audioContext) {
    this.audioElement = audioElement;
    this.visualizer = visualizer;
    this.audioContext = audioContext;
    this.analyzerNode = null;
    this.source = null;
    this.isInitialized = false;
    this.currentBPM = null;
    this.isStable = false;
  }

  async init() {
    if (this.isInitialized) return;

    try {
      this.analyzerNode = await createRealTimeBpmProcessor(this.audioContext);
      this.source = this.audioContext.createMediaElementSource(this.audioElement);
      const lowpass = getBiquadFilter(this.audioContext);

      this.source.connect(lowpass);
      lowpass.connect(this.analyzerNode);
      this.source.connect(this.audioContext.destination);

      this.analyzerNode.port.onmessage = (event) => this.handleBPMEvent(event);
      this.isInitialized = true;
      this.visualizer.setStatus('ready');
    } catch (error) {
      const isCorsError = error.name === 'SecurityError' || error.message.includes('cross-origin');
      this.visualizer.setStatus('error', isCorsError ? 'CORS blocked' : 'Unavailable');
      throw error;
    }
  }

  handleBPMEvent(event) {
    const { message, data } = event.data;
    const bpmValue = Array.isArray(data.bpm) ? data.bpm[0]?.tempo : data.bpm;

    if (!bpmValue) return;

    this.currentBPM = Math.round(bpmValue);
    this.isStable = message === BPM_MESSAGE_STABLE;
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
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.analyzerNode) {
      this.analyzerNode.disconnect();
      this.analyzerNode = null;
    }
    this.isInitialized = false;
  }
}
