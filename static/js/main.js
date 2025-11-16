import { BPMDetector } from './bpm-detector.js';
import { BPMVisualizer } from './bpm-visualizer.js';
import { AudioVisualizer } from './audio-visualizer.js';

function isCrossOriginAudio(audioSrc) {
  if (!audioSrc) return false;
  return !audioSrc.startsWith(window.location.origin) && !audioSrc.startsWith('/');
}

function initializeAudioFeatures() {
  const audioElement = document.querySelector('audio');
  const bpmContainer = document.getElementById('bpm-container');
  const visualizerCanvas = document.getElementById('audio-visualizer');

  if (!audioElement || !bpmContainer) return;

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

document.addEventListener('DOMContentLoaded', initializeAudioFeatures);
