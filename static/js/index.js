import { BackgroundPattern } from './background-pattern.js';

document.addEventListener('DOMContentLoaded', () => {
  // Initialize background pattern
  const canvas = document.getElementById('background-pattern');
  if (canvas) {
    const pattern = new BackgroundPattern('background-pattern');
    pattern.start();

    window.addEventListener('beforeunload', () => {
      pattern.destroy();
    });
  }

  // Keyboard navigation (runs independently)
  const navLinks = document.querySelectorAll('.nav-link[data-key]');
  const keyMap = new Map();
  const pressedKeys = new Set();

  navLinks.forEach(link => {
    const key = link.dataset.key;
    if (key) {
      keyMap.set(key.toLowerCase(), link);
    }
  });

  document.addEventListener('keydown', (e) => {
    // Ignore if user is typing in an input field
    if (e.target.matches('input, textarea, select')) return;

    // Ignore if modifier keys are pressed (to not interfere with browser shortcuts)
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    const key = e.key.toLowerCase();
    const link = keyMap.get(key);

    if (link && !pressedKeys.has(key)) {
      e.preventDefault();
      pressedKeys.add(key);

      // Visual feedback - add pressed state
      link.classList.add('key-pressed');
    }
  });

  document.addEventListener('keyup', (e) => {
    // Ignore if user is typing in an input field
    if (e.target.matches('input, textarea, select')) return;

    const key = e.key.toLowerCase();
    const link = keyMap.get(key);

    if (link && pressedKeys.has(key)) {
      e.preventDefault();
      pressedKeys.delete(key);

      // Remove pressed state and navigate
      link.classList.remove('key-pressed');
      window.location.href = link.href;
    }
  });
});
