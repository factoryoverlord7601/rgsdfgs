export default class Renderer {
  constructor(ctx, settings) {
    this.ctx = ctx;
    this.settings = settings;
    this.tileSize = settings.tileSize;
    // view in tiles
    this.viewW = 40;
    this.viewH = 28;
    // internal canvas size
    this.ctx.canvas.width = this.viewW * this.tileSize;
    this.ctx.canvas.height = this.viewH * this.tileSize;
    // create offscreen for lighting
    this.lightCanvas = document.createElement('canvas');
    this.lightCanvas.width = this.ctx.canvas.width;
    this.lightCanvas.height = this.ctx.canvas.height;
    this.lightCtx = this.lightCanvas.getContext('2d');
  }

  setup(mapData, player) {
    this.mapData = mapData;
    // adjust view to map if small
    this.viewW = Math.min( Math.floor(this.ctx.canvas.width / this.tileSize), mapData.width );
    this.viewH = Math.min( Math.floor(this.ctx.canvas.height / this.tileSize), mapData.height );
    // store palette colors
    this.colors = {
      floor:'#1b2a3a',
      wall:'#0b1622',
      wallEdge:'#07111a',
      player:'#ffd166',
      enemy:'#ff6b6b',
      item:'#7bf1a8',
      fog:'#000a12'
    };
  }

  render({ map, entities, camera, player, fov, frame }) {
    const ctx = this.ctx;
    const ts = this.tileSize;

    // clear
    ctx.fillStyle = '#071127';
    ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);

    const camX = Math.floor(camera.x);
    const camY = Math.floor(camera.y);

    // draw tiles
    for (let y=0; y<this.viewH; y++){
      for (let x=0; x<this.viewW; x++){
        const mx = x + camX, my = y + camY;
        const sx = x*ts, sy=y*ts;
        if (my<0 || my>=map.length || mx<0 || mx>=map[0].length) {
          ctx.fillStyle = '#000';
          ctx.fillRect(sx,sy,ts,ts);
          continue;
        }
        if (map[my][mx] === 1) {
          // wall
          ctx.fillStyle = this.colors.wall;
          ctx.fillRect(sx,sy,ts,ts);
          // small edge highlight
          if ((x+y+frame)%7===0) ctx.fillStyle = this.colors.wallEdge, ctx.fillRect(sx+ts-2,sy+ts-2,2,2);
        } else {
          // floor with subtle noise
          const n = ((mx*73+my*97) % 30) / 255;
          const c = shade(this.colors.floor, n);
          ctx.fillStyle = c;
          ctx.fillRect(sx,sy,ts,ts);
        }
      }
    }

    // entities sorted by y for depth
    entities.sort((a,b)=> (a.y - b.y));
    for (let e of entities) {
      const ex = (e.x - camX) * ts;
      const ey = (e.y - camY) * ts;
      if (ex < -ts || ey < -ts || ex > ctx.canvas.width+ts || ey > ctx.canvas.height+ts) continue;
      if (e.isPlayer) {
        // simple player sprite: circle + eye
        ctx.fillStyle = this.colors.player;
        roundRect(ctx, ex+2, ey+2, ts-4, ts-4, 3);
        ctx.fill();
        // eye direction
        ctx.fillStyle = '#1b2a3a';
        ctx.fillRect(ex+ts/2-3, ey+ts/2-3, 4,4);
      } else if (e.isEnemy) {
        ctx.fillStyle = this.colors.enemy;
        roundRect(ctx, ex+2, ey+2, ts-4, ts-4, 3);
        ctx.fill();
        // health bar
        ctx.fillStyle = '#000';
        ctx.fillRect(ex+2, ey-6, ts-4, 4);
        ctx.fillStyle = '#ff6b6b';
        const hpPct = Math.max(0, e.hp / e.maxHp);
        ctx.fillRect(ex+2, ey-6, (ts-4)*hpPct, 4);
      } else if (e.isItem) {
        ctx.fillStyle = this.colors.item;
        ctx.beginPath();
        ctx.arc(ex+ts/2, ey+ts/2, ts/4, 0, Math.PI*2);
        ctx.fill();
      }
    }

    // lighting / fog of war
    this.lightCtx.clearRect(0,0,this.lightCanvas.width,this.lightCanvas.height);
    // darken everything
    this.lightCtx.fillStyle = 'rgba(0,10,18,0.88)';
    this.lightCtx.fillRect(0,0,this.lightCanvas.width,this.lightCanvas.height);
    // reveal circle around player
    const px = (player.x - camX) * ts;
    const py = (player.y - camY) * ts;
    const grad = this.lightCtx.createRadialGradient(px,py,0,px,py, (fov*ts));
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(0.6, 'rgba(0,0,0,0.3)');
    grad.addColorStop(1, 'rgba(0,0,0,0.85)');
    this.lightCtx.globalCompositeOperation = 'destination-out';
    this.lightCtx.fillStyle = grad;
    this.lightCtx.beginPath();
    this.lightCtx.arc(px,py, fov*ts, 0, Math.PI*2);
    this.lightCtx.fill();
    this.lightCtx.globalCompositeOperation = 'source-over';

    // apply light overlay on main ctx
    ctx.drawImage(this.lightCanvas, 0,0);

    // minimap
    this.drawMinimap(ctx, map, entities, player, {x:camX,y:camY});
  }

  drawMinimap(ctx, map, entities, player, cam) {
    const size = 120;
    const pad = 8;
    const x = ctx.canvas.width - size - pad;
    const y = pad;
    const w = size, h = Math.floor(size * (map.length > 0 ? map.length / map[0].length : 1));
    ctx.fillStyle = 'rgba(2,6,10,0.6)';
    ctx.fillRect(x-2,y-2,w+4,h+4);
    const tileW = w / map[0].length;
    const tileH = h / map.length;
    // draw map tiny
    for (let ry=0; ry<map.length; ry++) {
      for (let rx=0; rx<map[0].length; rx++) {
        ctx.fillStyle = map[ry][rx] === 1 ? '#08131a' : '#123040';
        ctx.fillRect(x + rx*tileW, y + ry*tileH, Math.ceil(tileW), Math.ceil(tileH));
      }
    }
    // entities
    for (let e of entities) {
      ctx.fillStyle = e.isEnemy ? '#ff6b6b' : (e.isItem ? '#7bf1a8' : '#ffd166');
      ctx.fillRect(x + e.x*tileW - 1, y + e.y*tileH - 1, 2,2);
    }
    // player
    ctx.fillStyle = '#ffd166';
    ctx.fillRect(x + player.x*tileW - 2, y + player.y*tileH - 2, 3,3);
  }
}

function roundRect(ctx,x,y,w,h,r){
  const rr = Math.min(r, w/2, h/2);
  ctx.beginPath();
  ctx.moveTo(x+rr,y);
  ctx.arcTo(x+w,y,x+w,y+h,rr);
  ctx.arcTo(x+w,y+h,x,y+h,rr);
  ctx.arcTo(x,y+h,x,y,rr);
  ctx.arcTo(x,y,x+w,y,rr);
  ctx.closePath();
}

function shade(hex, amount){
  // amount 0..1 to darken slightly
  const c = hex.slice(1);
  const num = parseInt(c,16);
  let r = (num >> 16) & 0xFF;
  let g = (num >> 8) & 0xFF;
  let b = num & 0xFF;
  r = Math.max(0, Math.min(255, r - Math.floor(amount*30)));
  g = Math.max(0, Math.min(255, g - Math.floor(amount*30)));
  b = Math.max(0, Math.min(255, b - Math.floor(amount*30)));
  return `rgb(${r},${g},${b})`;
}