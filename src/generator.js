// BSP dungeon generator: splits space into subrects and places rooms, connects with corridors.
// Returns { map, rooms } where map is a 2D array of tiles: 0=floor, 1=wall

class RNG {
  constructor(seed) {
    this.seed = seed || Math.floor(Math.random()*1e9).toString(36);
    // simple xorshift32 seeded by numeric hash of seed string
    let h = 2166136261;
    for (let i=0;i<this.seed.length;i++) h = Math.imul(h ^ this.seed.charCodeAt(i), 16777619);
    this.x = h >>> 0 || 123456789;
  }
  next() {
    this.x ^= this.x << 13;
    this.x ^= this.x >>> 17;
    this.x ^= this.x << 5;
    return (this.x >>> 0) / 0xFFFFFFFF;
  }
  int(min, max) { return Math.floor(this.next()*(max-min+1))+min; }
}

export function generateDungeon({ width=80, height=50, seed=null }) {
  const rng = new RNG(seed);
  const leafs = [];
  const MIN_SIZE = 8;
  const rooms = [];

  // FIX: Initialize map early so connectRooms can access it when called by Leaf.createRooms
  const map = Array.from({length:height},()=>Array.from({length:width},()=>1));

  class Leaf {
    constructor(x,y,w,h){
      this.x=x;this.y=y;this.w=w;this.h=h;
      this.left=null;this.right=null;this.room=null;
    }
    split() {
      if (this.left || this.right) return false;
      const splitH = rng.next() > 0.5;
      const max = (splitH ? this.h : this.w) - MIN_SIZE;
      if (max <= MIN_SIZE) return false;
      const split = rng.int(MIN_SIZE, max);
      if (splitH) {
        this.left = new Leaf(this.x,this.y,this.w,split);
        this.right = new Leaf(this.x,this.y+split,this.w,this.h-split);
      } else {
        this.left = new Leaf(this.x,this.y,split,this.h);
        this.right = new Leaf(this.x+split,this.y,this.w-split,this.h);
      }
      return true;
    }
    createRooms() {
      if (this.left || this.right) {
        if (this.left) this.left.createRooms();
        if (this.right) this.right.createRooms();
        if (this.left && this.right) connectRooms(this.left.getRoom(), this.right.getRoom());
      } else {
        const roomW = rng.int(Math.max(3, this.w-3), Math.max(3, this.w-1));
        const roomH = rng.int(Math.max(3, this.h-3), Math.max(3, this.h-1));
        const roomX = rng.int(this.x+1, this.x+this.w-roomW-1);
        const roomY = rng.int(this.y+1, this.y+this.h-roomH-1);
        this.room = { x:roomX, y:roomY, w:roomW, h:roomH, center:{x:roomX+Math.floor(roomW/2), y:roomY+Math.floor(roomH/2)} };
        rooms.push(this.room);
      }
    }
    getRoom() {
      if (this.room) return this.room;
      if (this.left) {
        const r = this.left.getRoom();
        if (r) return r;
      }
      if (this.right) return this.right.getRoom();
      return null;
    }
  }

  const root = new Leaf(1,1,width-2,height-2);
  leafs.push(root);
  
  // split until can't
  let did = true;
  for (let i=0;i<100 && did;i++){
    did=false;
    for (let l of leafs.slice()){
      if (!l.left && !l.right) {
        if (l.w > MIN_SIZE*2 || l.h > MIN_SIZE*2) {
          if (l.split()) {
            leafs.push(l.left);
            leafs.push(l.right);
            did = true;
          }
        }
      }
    }
  }

  // corridors list created via connectRooms closures
  function connectRooms(a,b){
    const x1 = a.center.x, y1 = a.center.y;
    const x2 = b.center.x, y2 = b.center.y;
    if (rng.next() < 0.5) {
      carveH(x1,x2,y1);
      carveV(y1,y2,x2);
    } else {
      carveV(y1,y2,x1);
      carveH(x1,x2,y2);
    }
  }
  function carveH(x1,x2,y) {
    for (let x = Math.min(x1,x2); x<=Math.max(x1,x2); x++) map[y][x]=0;
  }
  function carveV(y1,y2,x) {
    for (let y = Math.min(y1,y2); y<=Math.max(y1,y2); y++) map[y][x]=0;
  }

  // create rooms recursively (now map is defined, so connectRooms works)
  root.createRooms();

  // carve rooms
  for (let r of rooms){
    for (let yy=0; yy<r.h; yy++){
      for (let xx=0; xx<r.w; xx++){
        const x = r.x+xx, y = r.y+yy;
        if (x>=0 && x<width && y>=0 && y<height) map[y][x]=0;
      }
    }
  }

  return { map, rooms, width, height, seed };
}
