import { generateDungeon } from './generator.js';
import Renderer from './renderer.js';
import { Player, Enemy, Item } from './entities.js';
import Input from './input.js';
import UI from './ui.js';

export default class Game {
  constructor({ canvas }) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.input = new Input(canvas);
    this.ui = new UI();
    this.running = false;
    this.paused = false;
    this.frame = 0;
    this.last = performance.now();

    this.settings = {
      tileSize: 16,
      mapWidth: 80,
      mapHeight: 50,
      fovRadius: 10,
    };

    this.renderer = new Renderer(this.ctx, this.settings);
    this.seed = null;

    // wire UI buttons
    document.getElementById('btn-restart').addEventListener('click', () => this.reset(this.seed));
    document.getElementById('btn-new-seed');

    // touch buttons
    document.querySelectorAll('#dpad button').forEach(b => {
      b.addEventListener('touchstart', e => { e.preventDefault(); this.input.setTouchDir(b.dataset.dir); });
      b.addEventListener('touchend', e => { e.preventDefault(); this.input.clearTouchDir(); });
      b.addEventListener('mousedown', () => this.input.setTouchDir(b.dataset.dir));
      b.addEventListener('mouseup', () => this.input.clearTouchDir());
    });
    document.getElementById('touch-attack').addEventListener('click', () => this.input.attackPress());
    document.getElementById('seed-input').addEventListener('change', (e) => this.reset(e.target.value || null));
    document.getElementById('btn-new-seed').addEventListener('click', () => {
      const s = Math.floor(Math.random()*1e9).toString(36);
      document.getElementById('seed-input').value = s;
      this.reset(s);
    });

    this.reset();
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    requestAnimationFrame(this.loop.bind(this));
  }

  pause() { this.paused = true; }
  resume() { this.paused = false; this.last = performance.now(); }

  reset(seed = null) {
    this.seed = seed || Math.floor(Math.random()*1e9).toString(36);
    this.ui.log(`Seed: ${this.seed}`);
    // generate
    const mapData = generateDungeon({
      width: this.settings.mapWidth,
      height: this.settings.mapHeight,
      seed: this.seed
    });
    this.map = mapData.map;
    this.rooms = mapData.rooms;
    // create player in center of first room
    const spawn = this.rooms[0].center;
    this.player = new Player(spawn.x + 0.5, spawn.y + 0.5);
    // spawn some enemies and items in other rooms
    this.entities = [];
    for (let i = 1; i < this.rooms.length; i++) {
      const r = this.rooms[i];
      // chance to spawn enemy/item
      if (Math.random() < 0.6) {
        const epos = { x: r.center.x + (Math.random()-0.5)* (r.w-2), y: r.center.y + (Math.random()-0.5)*(r.h-2) };
        this.entities.push(new Enemy(epos.x, epos.y));
      }
      if (Math.random() < 0.25) {
        const ipos = { x: r.center.x + (Math.random()-0.4)*(r.w-2), y: r.center.y + (Math.random()-0.4)*(r.h-2) };
        this.entities.push(new Item(ipos.x, ipos.y, 'health'));
      }
    }
    // camera offset
    this.camera = { x: 0, y: 0 };
    // renderer setup
    this.renderer.setup(mapData, this.player);
    // update HUD
    this.ui.updateHP(this.player.hp, this.player.maxHp);
    this.ui.updateFloor(1);
  }

  loop(now) {
    if (!this.running) return;
    const dt = Math.min(100, now - this.last) / 1000;
    this.last = now;
    if (!this.paused) {
      this.update(dt);
      this.render();
      this.frame++;
    }
    requestAnimationFrame(this.loop.bind(this));
  }

  update(dt) {
    // input -> player movement
    this.player.update(dt, this.input, this.map, this.entities, this);
    // enemies
    for (let e of this.entities) {
      if (e.isEnemy) e.update(dt, this.map, this.player);
      if (e.dead) {
        this.ui.log(`${e.name} defeated.`);
        this.entities = this.entities.filter(x => x !== e);
        // drop loot occasionally
        if (Math.random() < 0.3) this.entities.push(new Item(e.x, e.y, 'health'));
      }
    }

    // collisions: player picks up items
    for (let it of this.entities.filter(x => x.isItem)) {
      const dx = it.x - this.player.x, dy = it.y - this.player.y;
      if (Math.hypot(dx,dy) < 0.6) {
        if (it.type === 'health') {
          this.player.heal(4);
          this.ui.log('You picked up a healing potion.');
          it.picked = true;
        }
      }
    }
    this.entities = this.entities.filter(x => !x.picked);

    // update HUD
    this.ui.updateHP(this.player.hp, this.player.maxHp);
    // camera: keep player centered
    this.camera.x = this.player.x - (this.renderer.viewW / 2);
    this.camera.y = this.player.y - (this.renderer.viewH / 2);

    // check player death
    if (this.player.hp <= 0) {
      this.ui.log('You died. Press Restart to try again.');
      this.pause();
    }
  }

  render() {
    this.renderer.render({
      map: this.map,
      entities: this.entities.concat([this.player]),
      camera: this.camera,
      player: this.player,
      fov: this.settings.fovRadius,
      frame: this.frame
    });
  }
}