import Game from './game.js';

const canvas = document.getElementById('game');
const seedInput = document.getElementById('seed-input');
const btnRestart = document.getElementById('btn-restart');
const btnNewSeed = document.getElementById('btn-new-seed');

const game = new Game({ canvas });

function resize() {
  // maintain integer scaling for crisp pixel look
  const targetWidth = Math.min(window.innerWidth - 40, 1000);
  const targetHeight = Math.min(window.innerHeight - 180, 700);
  canvas.style.width = targetWidth + 'px';
  canvas.style.height = targetHeight + 'px';
  // canvas internal resolution is set in Game to be map-based
}
window.addEventListener('resize', resize);

btnRestart.addEventListener('click', () => game.reset(seedInput.value || null));
btnNewSeed.addEventListener('click', () => {
  const s = Math.floor(Math.random()*1e9).toString(36);
  seedInput.value = s;
  game.reset(s);
});

// focus canvas on click so keyboard works
canvas.addEventListener('click', () => canvas.focus());

document.addEventListener('visibilitychange', () => {
  if (document.hidden) game.pause(); else game.resume();
});

game.start();
resize();