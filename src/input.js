export default class Input {
  constructor(canvas) {
    this.keys = {};
    this.canvas = canvas;
    this.touchDir = null;
    this._attack = false;
    this._attackSticky = false;
    window.addEventListener('keydown', e => this.keys[e.key.toLowerCase()] = true);
    window.addEventListener('keyup', e => this.keys[e.key.toLowerCase()] = false);
    // attack on space
    window.addEventListener('keydown', e => { if (e.code === 'Space') { this._attack = true; this._attackSticky = true; e.preventDefault(); } });
    window.addEventListener('keyup', e => { if (e.code === 'Space') this._attackSticky = false; });

    // mouse click/tap to focus and also optionally attack
    canvas.addEventListener('mousedown', (e) => { canvas.focus(); });
    canvas.addEventListener('touchstart', (e) => { canvas.focus(); });
  }

  setTouchDir(dir) { this.touchDir = dir; }
  clearTouchDir() { this.touchDir = null; }
  attackPress(){ this._attack = true; this._attackSticky = true; }

  movementVector() {
    const v = { x:0, y:0 };
    if (this.keys['arrowup'] || this.keys['w'] ) v.y -= 1;
    if (this.keys['arrowdown'] || this.keys['s']) v.y += 1;
    if (this.keys['arrowleft'] || this.keys['a']) v.x -= 1;
    if (this.keys['arrowright'] || this.keys['d']) v.x += 1;
    return v;
  }

  attackPressed() {
    if (this._attack) {
      this._attack = false;
      return true;
    }
    // allow holding space to repeat only occasionally
    return false;
  }
}