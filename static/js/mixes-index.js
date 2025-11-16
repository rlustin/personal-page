import { GridPattern } from './grid-pattern.js';

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('grid-pattern');
  if (!canvas) return;

  const pattern = new GridPattern('grid-pattern');
  pattern.start();

  window.addEventListener('beforeunload', () => {
    pattern.destroy();
  });
});
