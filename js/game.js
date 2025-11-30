// --- Audio System ---
const Sound = {
    ctx: null, enabled: false,
    init: function () {
        if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        if (this.ctx.state === 'suspended') this.ctx.resume();
        this.enabled = true;
        document.getElementById('audio-btn').style.opacity = '1';
        document.getElementById('audio-btn').innerText = '🔊 Звук';
    },
    play: function (type) {
        if (!this.enabled) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain); gain.connect(this.ctx.destination);
        const now = this.ctx.currentTime;
        switch (type) {
            case 'coin': osc.type = 'sine'; osc.frequency.setValueAtTime(1200, now); osc.frequency.exponentialRampToValueAtTime(2000, now + 0.1); gain.gain.setValueAtTime(0.3, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1); osc.start(now); osc.stop(now + 0.1); break;
            case 'buy': osc.type = 'square'; osc.frequency.setValueAtTime(400, now); osc.frequency.exponentialRampToValueAtTime(600, now + 0.1); gain.gain.setValueAtTime(0.2, now); gain.gain.linearRampToValueAtTime(0, now + 0.2); osc.start(now); osc.stop(now + 0.2); break;
            case 'merge': osc.type = 'triangle'; osc.frequency.setValueAtTime(300, now); osc.frequency.linearRampToValueAtTime(800, now + 0.15); gain.gain.setValueAtTime(0.3, now); gain.gain.linearRampToValueAtTime(0, now + 0.3); osc.start(now); osc.stop(now + 0.3); break;
            case 'explode': osc.type = 'sawtooth'; osc.frequency.setValueAtTime(100, now); osc.frequency.exponentialRampToValueAtTime(10, now + 0.4); gain.gain.setValueAtTime(0.5, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4); osc.start(now); osc.stop(now + 0.4); break;
            case 'skill': osc.type = 'sine'; osc.frequency.setValueAtTime(600, now); osc.frequency.linearRampToValueAtTime(300, now + 0.3); gain.gain.setValueAtTime(0.3, now); gain.gain.linearRampToValueAtTime(0, now + 0.3); osc.start(now); osc.stop(now + 0.3); break;
            case 'mission': osc.type = 'sine'; osc.frequency.setValueAtTime(400, now); osc.frequency.linearRampToValueAtTime(800, now + 0.2); gain.gain.setValueAtTime(0.3, now); gain.gain.linearRampToValueAtTime(0, now + 0.5); osc.start(now); osc.stop(now + 0.5); break;
        }
    }
};

const Haptics = {
    impact: (style) => window.Telegram?.WebApp?.HapticFeedback?.impactOccurred(style),
    notify: (type) => window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred(type),
    selection: () => window.Telegram?.WebApp?.HapticFeedback?.selectionChanged()
};

const CONFIG = {
    biomes: [
        { name: "Тропіки", color: "#0891b2", danger: 1, temp: 25, startY: 0, weather: 'sun' },
        { name: "Атлантика", color: "#1e40af", danger: 3, temp: 10, startY: -5000, weather: 'rain' },
        { name: "Північне море", color: "#1e3a8a", danger: 5, temp: 0, startY: -15000, weather: 'storm' },
        { name: "Арктика", color: "#0f172a", danger: 8, temp: -20, startY: -30000, weather: 'snow' }
    ],
    partTypes: {
        'hull': { icon: '🛡️', name: 'Броня', bonus: 'Armor' },
        'engine': { icon: '⚙️', name: 'Мотор', bonus: 'Speed' },
        'cabin': { icon: '🏠', name: 'Рубка', bonus: 'Heat' },
        'magnet': { icon: '🧲', name: 'Магніт', bonus: 'Range' },
        'radar': { icon: '📡', name: 'Радар', bonus: 'Vision' }
    },
    tierColors: ['#9ca3af', '#4ade80', '#60a5fa', '#c084fc', '#facc15', '#f87171', '#22d3ee', '#ffffff'],
    baseCost: 10, moneyValue: 5, dayDuration: 3600
};

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');

        // --- Telegram Init ---
        this.tg = window.Telegram?.WebApp;
        if (this.tg) {
            this.tg.ready();
            this.tg.expand();
            this.tg.enableClosingConfirmation();
            // Optional: Use theme params
            document.body.style.backgroundColor = this.tg.themeParams.bg_color || '#000';
        }

        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Default State
        this.player = {
            x: window.innerWidth / 2, y: window.innerHeight / 2,
            angle: -Math.PI / 2, vel: { x: 0, y: 0 },
            money: 0, speedMult: 1, armorLvl: 0, heatResist: 0,
            pickupRange: 1, radarRange: 0, bodyTemp: 36.6,
            isYacht: false, invulnerable: 0,
            skills: {
                nitro: { cd: 0, max: 600 },
                flare: { cd: 0, max: 1200 },
                repair: { cd: 0, max: 1800 }
            },
            crew: { mechanic: false, navigator: false }
        };

        this.inventory = new Array(20).fill(null);
        this.equip = { hull: null, engine: null, cabin: null, magnet: null, radar: null };
        this.selectedSlot = null;
        this.mission = null; // { type, tx, ty, reward }
        this.paused = false;

        // World
        this.camY = 0;
        this.gameTime = 0;
        this.dayPhase = 0;
        this.currentBiome = CONFIG.biomes[0];

        this.entities = {
            mines: [], coins: [], crates: [], particles: [], weatherParticles: [], sharks: [],
            whirlpools: [], icebergs: [], tentacles: []
        };

        this.input = { x: 0, y: 0, active: false, origin: { x: 0, y: 0 } };

        this.loadGame();
        this.initInput();
        this.startMission();
        this.loop();

        // Listeners
        document.getElementById('garage-btn').onclick = () => this.toggleGarage(true);
        document.getElementById('close-garage').onclick = () => this.toggleGarage(false);
        document.getElementById('audio-btn').onclick = () => Sound.init();

        setInterval(() => this.saveGame(), 5000);
        setInterval(() => this.passiveEffects(), 1000); // Crew effects
    }

    resize() {
        // Handle Telegram Viewport if possible
        if (this.tg) {
            this.canvas.width = window.innerWidth;
            this.canvas.height = this.tg.viewportStableHeight || window.innerHeight;
        } else {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        }
    }

    initInput() {
        const start = (x, y) => {
            this.input.active = true;
            this.input.origin = { x, y };
            this.input.x = x; this.input.y = y;
        };
        const move = (x, y) => {
            if (this.input.active) { this.input.x = x; this.input.y = y; }
        };
        const end = () => this.input.active = false;

        this.canvas.addEventListener('mousedown', e => start(e.clientX, e.clientY));
        window.addEventListener('mousemove', e => move(e.clientX, e.clientY));
        window.addEventListener('mouseup', end);

        this.canvas.addEventListener('touchstart', e => start(e.touches[0].clientX, e.touches[0].clientY), { passive: false });
        window.addEventListener('touchmove', e => { e.preventDefault(); move(e.touches[0].clientX, e.touches[0].clientY) }, { passive: false });
        window.addEventListener('touchend', end);

        window.addEventListener('keydown', e => {
            if (e.key === '1') this.activateSkill('nitro');
            if (e.key === '2') this.activateSkill('flare');
            if (e.key === '3') this.activateSkill('repair');
        });
    }

    getSaveKey() {
        // Create unique key for TG user or fallback to generic
        let prefix = 'yachtSave';
        if (this.tg && this.tg.initDataUnsafe && this.tg.initDataUnsafe.user) {
            prefix += `_${this.tg.initDataUnsafe.user.id}`;
        }
        return prefix;
    }

    saveGame() {
        if (this.player.isDead) return;
        const data = {
            money: this.player.money,
            inventory: this.inventory,
            equip: this.equip,
            y: this.player.y,
            time: this.gameTime,
            crew: this.player.crew
        };
        localStorage.setItem(this.getSaveKey(), JSON.stringify(data));
    }

    loadGame() {
        const saved = localStorage.getItem(this.getSaveKey());
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.player.money = data.money || 0;
                this.inventory = data.inventory || new Array(20).fill(null);
                this.equip = data.equip || { hull: null, engine: null, cabin: null, magnet: null, radar: null };
                this.player.y = data.y || 0;
                this.gameTime = data.time || 0;
                this.player.crew = data.crew || { mechanic: false, navigator: false };
                this.recalcStats();
                this.updateCrewUI();
            } catch (e) { console.error("Save Corrupt", e); }
        }
    }

    hardReset() {
        localStorage.removeItem(this.getSaveKey());
        location.reload();
    }

    respawn() {
        this.player.isDead = false;
        this.player.y = 0;
        this.player.bodyTemp = 36.6;
        this.entities = { mines: [], coins: [], crates: [], particles: [], weatherParticles: [], sharks: [], whirlpools: [], icebergs: [], tentacles: [] };
        document.getElementById('game-over-modal').classList.add('hidden');
        this.startMission();
        this.saveGame();
        // this.loop() called automatically via requestAnimationFrame chain if not stopped, 
        // but if stopped by logic, we might need restart? 
        // Current impl relies on animation frame always running update() check.
    }

    passiveEffects() {
        if (this.player.isDead || this.paused) return;
        // Mechanic
        if (this.player.crew.mechanic) {
            if (this.player.bodyTemp < 36.6 && this.player.bodyTemp > 30) {
                this.player.bodyTemp += 0.1;
                this.updateUI();
            }
        }
    }

    startMission() {
        const dist = 3000 + Math.random() * 5000;
        const angle = -Math.PI / 2 + (Math.random() - 0.5); // Generally Up
        this.mission = {
            type: Math.random() > 0.5 ? 'delivery' : 'rescue',
            tx: this.player.x + Math.cos(angle) * dist,
            ty: this.player.y + Math.sin(angle) * dist,
            reward: 100 + Math.floor(Math.abs(this.player.y) / 100)
        };
        this.player.isYacht = false; this.player.speedMult = 1; this.player.armorLvl = 0;
        this.player.heatResist = 0; this.player.pickupRange = 1; this.player.radarRange = 0;

        let equipped = Object.values(this.equip).filter(e => e !== null);
        if (equipped.length === 5) {
            this.player.isYacht = true;
            document.getElementById('yacht-status').innerText = "Системи активні"; document.getElementById('yacht-status').className = "text-[10px] text-green-400 font-bold";
        } else {
            document.getElementById('yacht-status').innerText = `Зібрано ${equipped.length}/5`; document.getElementById('yacht-status').className = "text-[10px] text-red-400";
        }

        if (this.equip.engine) this.player.speedMult += this.equip.engine.tier * 0.5;
        if (this.equip.hull) this.player.armorLvl = this.equip.hull.tier;
        if (this.equip.cabin) this.player.heatResist = this.equip.cabin.tier + 1;
        if (this.equip.magnet) this.player.pickupRange += this.equip.magnet.tier * 0.5;
        if (this.equip.radar) this.player.radarRange = 1 + (this.equip.radar.tier * 0.5);

        this.updateUI();
    }

    renderInventory() {
        const grid = document.getElementById('inventory-grid'); grid.innerHTML = '';
        this.inventory.forEach((item, i) => {
            let el = document.createElement('div'); el.className = `item-slot ${item ? 'tier-' + item.tier : ''}`;
            if (this.selectedSlot && this.selectedSlot.loc === 'inv' && this.selectedSlot.idx === i) el.classList.add('selected');
            if (item) {
                el.innerText = CONFIG.partTypes[item.type].icon;
                let badge = document.createElement('div'); badge.className = "absolute bottom-0 right-0 text-[8px] bg-black/50 px-1 rounded text-white"; badge.innerText = item.tier; el.appendChild(badge);
            }
            el.onclick = () => this.handleSlotClick('inv', i); grid.appendChild(el);
        });

        ['hull', 'engine', 'cabin', 'magnet', 'radar'].forEach(type => {
            let el = document.getElementById(`equip-${type}`); let item = this.equip[type];
            el.className = `item-slot w-full aspect-square ${item ? 'tier-' + item.tier : ''}`;
            el.innerText = item ? CONFIG.partTypes[item.type].icon : '';
            if (this.selectedSlot && this.selectedSlot.loc === 'equip' && this.selectedSlot.idx === type) el.classList.add('selected');
            if (item) {
                let badge = document.createElement('div'); badge.className = "absolute bottom-0 right-0 text-[8px] bg-black/50 px-1 rounded text-white"; badge.innerText = item.tier; el.appendChild(badge);
            }
            el.onclick = () => this.handleSlotClick('equip', type);
        });
    }

    toggleGarage(show) {
        const modal = document.getElementById('garage-modal');
        this.paused = show; // Pause Logic
        if (show) { modal.classList.remove('hidden'); this.switchTab('parts'); this.renderInventory(); }
        else { modal.classList.add('hidden'); this.selectedSlot = null; }
    }

    updateUI() {
        document.getElementById('money-display').innerText = this.player.money;
        document.getElementById('biome-display').innerText = `${this.currentBiome.name}`;
        document.getElementById('biome-display').style.color = this.currentBiome.color;
        document.getElementById('day-count').innerText = Math.floor(this.gameTime / CONFIG.dayDuration) + 1;
        document.getElementById('temp-val').innerText = this.player.bodyTemp.toFixed(1) + "°C";

        let tBar = document.getElementById('temp-bar');
        tBar.style.width = Math.min(100, (this.player.bodyTemp / 37) * 100) + "%";
        if (this.player.bodyTemp < 32) tBar.className = "bg-red-500 h-full w-full transition-all";
        else if (this.player.bodyTemp < 35) tBar.className = "bg-orange-400 h-full w-full transition-all";
        else tBar.className = "bg-emerald-500 h-full w-full transition-all";

        document.getElementById('armor-val').innerText = `Lvl ${this.player.armorLvl}`;
    }
}

const game = new Game();
