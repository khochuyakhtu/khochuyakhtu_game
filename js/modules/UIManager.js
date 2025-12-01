import { CONFIG } from '../config.js';
import { Sound } from './AudioManager.js';

export class UIManager {
    constructor() {
        this.selectedSlot = null;
    }

    updateUI(game) {
        const { player, currentBiome, gameTime } = game;
        document.getElementById('money-display').innerText = player.money;
        document.getElementById('biome-display').innerText = `${currentBiome.name}`;
        document.getElementById('biome-display').style.color = currentBiome.color;
        document.getElementById('day-count').innerText = Math.floor(gameTime / CONFIG.dayDuration) + 1;
        document.getElementById('temp-val').innerText = player.bodyTemp.toFixed(1) + "°C";

        let tBar = document.getElementById('temp-bar');
        tBar.style.width = Math.min(100, (player.bodyTemp / 37) * 100) + "%";
        if (player.bodyTemp < 32) tBar.className = "bg-red-500 h-full w-full transition-all";
        else if (player.bodyTemp < 35) tBar.className = "bg-orange-400 h-full w-full transition-all";
        else tBar.className = "bg-emerald-500 h-full w-full transition-all";

        document.getElementById('armor-val').innerText = `Lvl ${player.armorLvl}`;
    }

    updateCrewUI(player) {
        // Mechanic
        const mechBtn = document.getElementById('hire-mech');
        if (player.crew.mechanic) {
            mechBtn.innerText = "НАЙНЯТО"; mechBtn.className = "bg-slate-600 text-slate-400 text-xs px-3 py-2 rounded font-bold cursor-default";
        } else {
            mechBtn.innerText = "$500"; mechBtn.className = "bg-green-600 hover:bg-green-500 text-white text-xs px-3 py-2 rounded font-bold";
        }
        // Navigator
        const navBtn = document.getElementById('hire-nav');
        if (player.crew.navigator) {
            navBtn.innerText = "НАЙНЯТО"; navBtn.className = "bg-slate-600 text-slate-400 text-xs px-3 py-2 rounded font-bold cursor-default";
        } else {
            navBtn.innerText = "$500"; navBtn.className = "bg-green-600 hover:bg-green-500 text-white text-xs px-3 py-2 rounded font-bold";
        }
    }

    renderInventory(game) {
        const { inventory, equip } = game;
        const grid = document.getElementById('inventory-grid'); grid.innerHTML = '';
        inventory.forEach((item, i) => {
            let el = document.createElement('div'); el.className = `item-slot ${item ? 'tier-' + item.tier : ''}`;
            if (this.selectedSlot && this.selectedSlot.loc === 'inv' && this.selectedSlot.idx === i) el.classList.add('selected');
            if (item) {
                el.innerText = CONFIG.partTypes[item.type].icon;
                let badge = document.createElement('div'); badge.className = "absolute bottom-0 right-0 text-[8px] bg-black/50 px-1 rounded text-white"; badge.innerText = item.tier; el.appendChild(badge);
            }
            el.onclick = () => this.handleSlotClick('inv', i, game); grid.appendChild(el);
        });

        ['hull', 'engine', 'cabin', 'magnet', 'radar'].forEach(type => {
            let el = document.getElementById(`equip-${type}`); let item = equip[type];
            el.className = `item-slot w-full aspect-square ${item ? 'tier-' + item.tier : ''}`;
            el.innerText = item ? CONFIG.partTypes[item.type].icon : '';
            if (this.selectedSlot && this.selectedSlot.loc === 'equip' && this.selectedSlot.idx === type) el.classList.add('selected');
            if (item) {
                let badge = document.createElement('div'); badge.className = "absolute bottom-0 right-0 text-[8px] bg-black/50 px-1 rounded text-white"; badge.innerText = item.tier; el.appendChild(badge);
            }
            el.onclick = () => this.handleSlotClick('equip', type, game);
        });
    }

    handleSlotClick(loc, idx, game) {
        const { inventory, equip } = game;
        let item = loc === 'inv' ? inventory[idx] : equip[idx];
        if (!this.selectedSlot) {
            if (item) { this.selectedSlot = { loc, idx }; this.renderInventory(game); }
        } else {
            let sItem = this.selectedSlot.loc === 'inv' ? inventory[this.selectedSlot.idx] : equip[this.selectedSlot.idx];
            let actionDone = false;
            if (this.selectedSlot.loc === loc && this.selectedSlot.idx === idx) {
                this.selectedSlot = null;
            } else if (this.selectedSlot.loc === 'inv' && loc === 'inv') {
                if (item && item.type === sItem.type && item.tier === sItem.tier && item.tier < 7) {
                    inventory[idx].tier++; inventory[this.selectedSlot.idx] = null; Sound.play('merge'); actionDone = true;
                } else {
                    let temp = inventory[idx]; inventory[idx] = sItem; inventory[this.selectedSlot.idx] = temp; actionDone = true;
                }
            } else if (this.selectedSlot.loc === 'inv' && loc === 'equip') {
                if (idx === sItem.type) {
                    let temp = equip[idx]; equip[idx] = sItem; inventory[this.selectedSlot.idx] = temp; Sound.play('buy'); game.recalcStats(); actionDone = true;
                }
            } else if (this.selectedSlot.loc === 'equip' && loc === 'inv') {
                if (!item) {
                    inventory[idx] = sItem; equip[this.selectedSlot.idx] = null; game.recalcStats(); actionDone = true;
                }
            }
            if (actionDone) { this.selectedSlot = null; game.saveGame(); }
            this.renderInventory(game);
        }
    }

    switchTab(tab, game) {
        document.getElementById('tab-parts').classList.add('hidden');
        document.getElementById('tab-crew').classList.add('hidden');
        if (tab === 'parts') document.getElementById('tab-parts').classList.remove('hidden');
        if (tab === 'crew') {
            document.getElementById('tab-crew').classList.remove('hidden');
            document.getElementById('tab-crew').classList.add('flex');
            this.updateCrewUI(game.player);
        }
    }

    toggleGarage(show, game) {
        const modal = document.getElementById('garage-modal');
        game.paused = show;
        if (show) { modal.classList.remove('hidden'); this.switchTab('parts', game); this.renderInventory(game); }
        else { modal.classList.add('hidden'); this.selectedSlot = null; }
    }

    showFloatText(text, x, y, color, camY) {
        let el = document.createElement('div');
        el.className = 'absolute font-bold text-shadow pointer-events-none transition-all duration-1000 ease-out z-50';
        el.style.left = x + 'px'; el.style.top = (y - camY) + 'px'; el.style.color = color; el.style.textShadow = '1px 1px 0 #000';
        el.innerText = text; document.body.appendChild(el);
        requestAnimationFrame(() => { el.style.transform = 'translateY(-50px)'; el.style.opacity = 0; });
        setTimeout(() => el.remove(), 1000);
    }
}
