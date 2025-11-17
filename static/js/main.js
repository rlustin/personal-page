import { BPMDetector } from './bpm-detector.js';
import { BPMVisualizer } from './bpm-visualizer.js';
import { AudioVisualizer } from './audio-visualizer.js';
import { CustomAudioControls } from './custom-audio-controls.js';
import { GridPattern } from './grid-pattern.js';

function isCrossOriginAudio(audioSrc) {
  if (!audioSrc) return false;
  return !audioSrc.startsWith(window.location.origin) && !audioSrc.startsWith('/');
}

function initializeGridPattern() {
  const canvas = document.getElementById('grid-pattern');
  if (!canvas) return null;

  const pattern = new GridPattern('grid-pattern');
  pattern.start();
  return pattern;
}

function initializeAudioFeatures() {
  const audioElement = document.getElementById('audio-player');
  const bpmContainer = document.getElementById('bpm-container');
  const visualizerCanvas = document.getElementById('audio-visualizer');

  if (!audioElement) return;

  // Initialize custom audio controls
  new CustomAudioControls(audioElement);

  if (!bpmContainer) return;

  const visualizer = new BPMVisualizer('bpm-container');
  const audioSrc = audioElement.src || audioElement.currentSrc;

  if (isCrossOriginAudio(audioSrc)) {
    visualizer.setStatus('error', 'Cross-origin audio');
    return;
  }

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  const audioContext = new AudioContextClass();

  const detector = new BPMDetector(audioElement, visualizer, audioContext);
  let audioVisualizer = null;

  if (visualizerCanvas) {
    audioVisualizer = new AudioVisualizer('audio-visualizer', audioContext);
  }

  audioElement.addEventListener('play', async () => {
    try {
      await detector.start();

      if (audioVisualizer) {
        if (!audioVisualizer.analyser) {
          audioVisualizer.init(detector.source);
        }
        audioVisualizer.start();
      }
    } catch (error) {
      console.error('Failed to start audio analysis:', error);
      visualizer.setStatus('error', 'Unavailable');
    }
  });

  audioElement.addEventListener('pause', () => {
    visualizer.stopPulse();
    if (audioVisualizer) {
      audioVisualizer.stop();
    }
  });

  audioElement.addEventListener('ended', () => {
    detector.reset();
    if (audioVisualizer) {
      audioVisualizer.stop();
    }
  });

  audioElement.addEventListener('seeked', async () => {
    if (!audioElement.paused) {
      try {
        detector.reset();
        await detector.start();
      } catch (error) {
        console.error('Failed to restart audio analysis after seek:', error);
      }
    }
  });

  window.addEventListener('beforeunload', () => {
    detector.destroy();
    visualizer.destroy();
    if (audioVisualizer) {
      audioVisualizer.destroy();
    }
    if (audioContext && audioContext.state !== 'closed') {
      audioContext.close();
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const gridPattern = initializeGridPattern();
  initializeAudioFeatures();

  window.addEventListener('beforeunload', () => {
    if (gridPattern) {
      gridPattern.destroy();
    }
  });
});
