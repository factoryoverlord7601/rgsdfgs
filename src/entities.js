// Player, Enemy, Item classes

export class Entity {
  constructor(x,y){ this.x = x; this.y = y; this.dead = false; this.picked = false; }
}

export class Player extends Entity {
  constructor(x,y){
    super(x,y);
    this.isPlayer = true;
    this.speed = 4; // tiles per second
    this.hp = 12;
    this.maxHp = 12;
    this.attackCooldown = 0;
  }
  update(dt, input, map, entities, game) {
    // movement
    const dir = input.movementVector();
    if (input.touchDir) {
      if (input.touchDir === 'up') dir.y = -1;
      if (input.touchDir === 'down') dir.y = 1;
      if (input.touchDir === 'left') dir.x = -1;
      if (input.touchDir === 'right') dir.x = 1;
    }
    const len = Math.hypot(dir.x, dir.y) || 1;
    const vx = (dir.x/len) * this.speed * dt;
    const vy = (dir.y/len) * this.speed * dt;
    // collision with walls (simple)
    if (!isWallAt(map, this.x + vx, this.y)) this.x += vx;
    if (!isWallAt(map, this.x, this.y + vy)) this.y += vy;

    // attack
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    if (input.attackPressed() && this.attackCooldown === 0) {
      this.attackCooldown = 0.4;
      // melee: damage enemies within 1 tile
      for (let e of entities.filter(x => x.isEnemy)) {
        const d = Math.hypot(e.x - this.x, e.y - this.y);
        if (d < 1.2) {
          e.damage(5);
          game.ui.log('You hit ' + e.name);
          soundHit();
        }
      }
    }
  }
  heal(amount) { this.hp = Math.min(this.maxHp, this.hp + amount); }
  damage(amount) { this.hp -= amount; }
}

export class Enemy extends Entity {
  constructor(x,y){
    super(x,y);
    this.isEnemy = true;
    this.name = ['Goblin','Skulk','Fiend','Ghoul'][Math.floor(Math.random()*4)];
    this.speed = 2.2;
    this.hp = 6;
    this.maxHp = 6;
    this.target = null;
    this.alertRange = 8;
  }
  update(dt, map, player){
    const dx = player.x - this.x, dy = player.y - this.y;
    const dist = Math.hypot(dx,dy);
    if (dist < 1.1) {
      // melee attack player
      player.damage(1);
      // small knockback
      this.x -= dx*0.1; this.y -= dy*0.1;
      return;
    }
    // if in alert range and line of sight (simple)
    if (dist < this.alertRange && los(map, this.x, this.y, player.x, player.y)) {
      // chase
      const nx = dx / dist, ny = dy / dist;
      const vx = nx * this.speed * dt;
      const vy = ny * this.speed * dt;
      if (!isWallAt(map, this.x + vx, this.y)) this.x += vx;
      if (!isWallAt(map, this.x, this.y + vy)) this.y += vy;
    } else {
      // wander
      this.x += (Math.sin(Math.random()*Math.PI*2)) * 0.01;
      this.y += (Math.cos(Math.random()*Math.PI*2)) * 0.01;
    }
  }
  damage(amount){ this.hp -= amount; if (this.hp <= 0) this.dead = true; }
}

export class Item extends Entity {
  constructor(x,y,type='health'){
    super(x,y);
    this.isItem = true;
    this.type = type;
  }
}

// helpers
function isWallAt(map, x, y) {
  const ix = Math.floor(x), iy = Math.floor(y);
  if (iy<0 || iy>=map.length || ix<0 || ix>=map[0].length) return true;
  return map[iy][ix] === 1;
}

function los(map, x1,y1,x2,y2) {
  // Bresenham-like sample on line; returns true if no wall between
  const dx = x2 - x1, dy = y2 - y1;
  const steps = Math.ceil(Math.hypot(dx,dy) * 2);
  for (let i=0;i<steps;i++){
    const t = i/steps;
    const x = x1 + dx*t, y = y1 + dy*t;
    if (isWallAt(map, x, y)) return false;
  }
  return true;
}

function soundHit(){
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'square';
    o.frequency.value = 220 + Math.random()*120;
    g.gain.value = 0.04;
    o.connect(g); g.connect(ctx.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
    o.stop(ctx.currentTime + 0.2);
  } catch(e){}
}