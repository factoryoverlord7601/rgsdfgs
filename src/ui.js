export default class UI {
  constructor(){
    this.hpEl = document.getElementById('hp-val');
    this.hpMaxEl = document.getElementById('hp-max');
    this.floorEl = document.getElementById('floor-val');
    this.logEl = document.getElementById('log');
  }
  updateHP(hp, maxHp){ if (this.hpEl) this.hpEl.textContent = Math.max(0, Math.floor(hp)); if (this.hpMaxEl) this.hpMaxEl.textContent = maxHp; }
  updateFloor(f){ if (this.floorEl) this.floorEl.textContent = f; }
  log(txt){
    if (!this.logEl) return;
    const now = new Date().toLocaleTimeString();
    this.logEl.textContent = `[${now}] ${txt}\n` + this.logEl.textContent;
    // keep short
    this.logEl.textContent = this.logEl.textContent.split('\n').slice(0,8).join('\n');
  }
}