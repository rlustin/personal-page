import { BPMDetector } from './bpm-detector.js';
import { BPMVisualizer } from './bpm-visualizer.js';

document.addEventListener('DOMContentLoaded', () => {
  const audioElement = document.querySelector('audio');
  const bpmContainer = document.getElementById('bpm-container');

  if (!audioElement || !bpmContainer) return;

  const visualizer = new BPMVisualizer('bpm-container');
  const audioSrc = audioElement.src || audioElement.currentSrc;
  const isCrossOrigin = audioSrc && !audioSrc.startsWith(window.location.origin) && !audioSrc.startsWith('/');

  if (isCrossOrigin) {
    visualizer.setStatus('error', 'Cross-origin audio');
    return;
  }

  const detector = new BPMDetector(audioElement, visualizer);

  audioElement.addEventListener('play', async () => {
    try {
      await detector.start();
    } catch (error) {
      visualizer.setStatus('error', 'Unavailable');
    }
  });

  audioElement.addEventListener('pause', () => visualizer.stopPulse());
  audioElement.addEventListener('ended', () => detector.reset());

  audioElement.addEventListener('seeked', async () => {
    if (!audioElement.paused) {
      detector.reset();
      await detector.start();
    }
  });

  window.addEventListener('beforeunload', () => {
    detector.destroy();
    visualizer.destroy();
  });
});
