import { BackgroundPattern } from './background-pattern.js';

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('background-pattern');
  if (!canvas) return;

  const pattern = new BackgroundPattern('background-pattern');
  pattern.start();

  window.addEventListener('beforeunload', () => {
    pattern.destroy();
  });
});
