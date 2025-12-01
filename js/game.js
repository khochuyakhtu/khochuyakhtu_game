// --- Loading & Menu System ---
(function () {
    let loadingProgress = 0;
    const loadingScreen = document.getElementById('loading-screen');
    const mainMenu = document.getElementById('main-menu');
    const tasksScreen = document.getElementById('tasks-screen');
    const loadingBar = document.getElementById('loading-progress');
    const loadingText = document.getElementById('loading-text');

    // Simulate loading
    const loadInterval = setInterval(() => {
        loadingProgress += Math.random() * 15 + 5;
        if (loadingProgress >= 100) {
            loadingProgress = 100;
            clearInterval(loadInterval);
            setTimeout(() => {
                loadingScreen.style.display = 'none';
                mainMenu.style.display = 'flex';
            }, 300);
        }
        loadingBar.style.width = loadingProgress + '%';
        loadingText.textContent = `Завантаження... ${Math.floor(loadingProgress)}%`;
    }, 100);

    // Menu Navigation
    document.getElementById('start-game-btn').onclick = () => {
        mainMenu.style.display = 'none';
        document.getElementById('game-canvas').style.display = 'block';
        document.getElementById('hud-money').style.display = 'flex';
        document.getElementById('hud-stats').style.display = 'block';
        document.getElementById('hud-biome').style.display = 'block';
        document.getElementById('garage-btn').style.display = 'flex';
        document.getElementById('audio-btn').style.display = 'block';
        document.getElementById('skills-container').style.display = 'flex';

        // Initialize game if not already
        if (!window.game) {
            window.game = new Game();
        }
    };

    document.getElementById('tasks-btn').onclick = () => {
        mainMenu.style.display = 'none';
        tasksScreen.style.display = 'flex';
        checkSubscriptionStatus();
    };

    document.getElementById('back-to-menu-btn').onclick = () => {
        tasksScreen.style.display = 'none';
        mainMenu.style.display = 'flex';
    };

    // Channel Subscription Logic
    function checkSubscriptionStatus() {
        const subscribed = localStorage.getItem('channelSubscribed') === 'true';
        const rewarded = localStorage.getItem('subscriptionRewarded') === 'true';

        if (subscribed && rewarded) {
            document.getElementById('reward-status').style.display = 'block';
            document.getElementById('subscribe-btn').disabled = true;
            document.getElementById('subscribe-btn').style.opacity = '0.5';
            document.getElementById('check-subscription-btn').disabled = true;
            document.getElementById('check-subscription-btn').style.opacity = '0.5';
        }
    }

    document.getElementById('subscribe-btn').onclick = () => {
        // Open Telegram channel
        if (window.Telegram?.WebApp) {
            window.Telegram.WebApp.openTelegramLink('https://t.me/khochuyakhtu');
        } else {
            window.open('https://t.me/khochuyakhtu', '_blank');
        }
        // Enable check button after subscribe
        document.getElementById('check-subscription-btn').disabled = false;
        document.getElementById('check-subscription-btn').style.opacity = '1';
    };

    document.getElementById('check-subscription-btn').onclick = () => {
        // Mark as subscribed (honor system)
        localStorage.setItem('channelSubscribed', 'true');
        localStorage.setItem('subscriptionRewarded', 'true');

        // Show reward message
        document.getElementById('reward-status').style.display = 'block';
        document.getElementById('subscribe-btn').disabled = true;
        document.getElementById('subscribe-btn').style.opacity = '0.5';
        document.getElementById('check-subscription-btn').disabled = true;
        document.getElementById('check-subscription-btn').style.opacity = '0.5';

        // Add money to player if game started
        const saveKey = getSaveKeyFromStorage();
        const savedData = localStorage.getItem(saveKey);
        if (savedData) {
            const data = JSON.parse(savedData);
            data.money = (data.money || 0) + 500;
            localStorage.setItem(saveKey, JSON.stringify(data));
        } else {
            // Create initial save with bonus
            localStorage.setItem(saveKey, JSON.stringify({ money: 500 }));
        }

        alert('Вітаємо! Ви отримали 500$ за підписку на канал! 🎉');
    };

    function getSaveKeyFromStorage() {
        const tg = window.Telegram?.WebApp;
        let prefix = 'yachtSave';
        if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
            prefix += `_${tg.initDataUnsafe.user.id}`;
        }
        return prefix;
    }
})();

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
        this.updateUI(); // Initialize UI with starting values
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
        // Helper to convert screen coordinates to canvas coordinates
        const getCanvasCoords = (clientX, clientY) => {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            return {
                x: (clientX - rect.left) * scaleX,
                y: (clientY - rect.top) * scaleY
            };
        };

        const start = (clientX, clientY) => {
            const coords = getCanvasCoords(clientX, clientY);
            this.input.active = true;
            this.input.origin = { x: coords.x, y: coords.y };
            this.input.x = coords.x;
            this.input.y = coords.y;
        };
        const move = (clientX, clientY) => {
            if (this.input.active) {
                const coords = getCanvasCoords(clientX, clientY);
                this.input.x = coords.x;
                this.input.y = coords.y;
            }
        };
        const end = () => this.input.active = false;

        this.canvas.addEventListener('mousedown', e => start(e.clientX, e.clientY));
        window.addEventListener('mousemove', e => move(e.clientX, e.clientY));
        window.addEventListener('mouseup', end);

        this.canvas.addEventListener('touchstart', e => {
            if (e.target === this.canvas) e.preventDefault();
            start(e.touches[0].clientX, e.touches[0].clientY);
        }, { passive: false });
        window.addEventListener('touchmove', e => {
            e.preventDefault();
            if (e.touches[0]) move(e.touches[0].clientX, e.touches[0].clientY);
        }, { passive: false });
        window.addEventListener('touchend', end);

        // Keyboard controls
        this.keys = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false };

        window.addEventListener('keydown', e => {
            if (e.key === '1') this.activateSkill('nitro');
            if (e.key === '2') this.activateSkill('flare');
            if (e.key === '3') this.activateSkill('repair');
            if (e.key === '0') this.debug = !this.debug;

            // Arrow keys
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault();
                this.keys[e.key] = true;
            }
        });

        window.addEventListener('keyup', e => {
            if (this.keys.hasOwnProperty(e.key)) {
                this.keys[e.key] = false;
            }
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

        let tx = this.player.x + Math.cos(angle) * dist;
        let ty = this.player.y + Math.sin(angle) * dist;

        // Clamp X to screen bounds
        const margin = 50;
        tx = Math.max(margin, Math.min(window.innerWidth - margin, tx));

        this.mission = {
            type: Math.random() > 0.5 ? 'delivery' : 'rescue',
            tx: tx,
            ty: ty,
            reward: 100 + Math.floor(Math.abs(this.player.y) / 100)
        };

        const el = document.getElementById('mission-panel');
        el.classList.remove('hidden');
        document.getElementById('mission-desc').innerText = this.mission.type === 'delivery' ? "Доставте Вантаж" : "Врятуйте тих, хто вижив";
        document.getElementById('mission-reward').innerText = `$${this.mission.reward}`;
    }

    completeMission() {
        Sound.play('mission');
        this.player.money += this.mission.reward;
        this.showFloatText(`MISSION COMPLETE! +$${this.mission.reward}`, this.player.x, this.player.y, '#facc15');
        this.startMission();
        this.updateUI();
    }

    // --- Logic ---
    update() {
        if (this.player.isDead) return;
        this.gameTime++;
        this.dayPhase = (this.gameTime % CONFIG.dayDuration) / CONFIG.dayDuration;

        // Cooldowns
        for (let s in this.player.skills) {
            if (this.player.skills[s].cd > 0) this.player.skills[s].cd--;
            let pct = this.player.skills[s].cd / this.player.skills[s].max;
            document.getElementById(`cd-${s}`).style.height = `${pct * 100}%`;
        }

        // Biome
        this.distanceTraveled = Math.abs(Math.min(0, this.player.y));
        for (let b of CONFIG.biomes) {
            if (this.player.y <= b.startY) this.currentBiome = b;
        }

        // Movement
        let dx = 0, dy = 0;
        let speedBonus = 1;
        if (this.player.skills.nitro.active) speedBonus = 2.5;

        // Keyboard arrow controls
        let keyboardMove = false;
        if (this.keys.ArrowUp || this.keys.ArrowDown || this.keys.ArrowLeft || this.keys.ArrowRight) {
            keyboardMove = true;
            let kx = 0, ky = 0;
            if (this.keys.ArrowLeft) kx -= 1;
            if (this.keys.ArrowRight) kx += 1;
            if (this.keys.ArrowUp) ky -= 1;
            if (this.keys.ArrowDown) ky += 1;

            const speed = 3 * this.player.speedMult * speedBonus;
            this.player.vel.x = kx * speed;
            this.player.vel.y = ky * speed;

            if (kx !== 0 || ky !== 0) {
                const angle = Math.atan2(ky, kx);
                let targetAngle = angle;
                let diff = targetAngle - this.player.angle;
                while (diff < -Math.PI) diff += Math.PI * 2;
                while (diff > Math.PI) diff -= Math.PI * 2;
                this.player.angle += diff * 0.1;

                // Wind particles when moving
                if (this.gameTime % 3 === 0) {
                    // Spawn particles behind the player (opposite to movement direction)
                    const windX = this.player.x - Math.cos(angle) * 30;
                    const windY = this.player.y - Math.sin(angle) * 30;
                    this.entities.particles.push({
                        x: windX + (Math.random() - 0.5) * 20,
                        y: windY + (Math.random() - 0.5) * 20,
                        vx: -Math.cos(angle) * 2 + (Math.random() - 0.5) * 2,
                        vy: -Math.sin(angle) * 2 + (Math.random() - 0.5) * 2,
                        life: 30, r: Math.random() * 4 + 2,
                        color: 'rgba(200,220,255,0.6)' // Light blue wind
                    });
                }
            }
        }

        if (!keyboardMove && this.input.active) {
            dx = this.input.x - this.input.origin.x;
            dy = this.input.y - this.input.origin.y;
            const dist = Math.hypot(dx, dy);
            if (dist > 10) {
                const angle = Math.atan2(dy, dx);
                const speed = 3 * this.player.speedMult * speedBonus;
                this.player.vel.x = Math.cos(angle) * speed;
                this.player.vel.y = Math.sin(angle) * speed;

                let targetAngle = angle;
                let diff = targetAngle - this.player.angle;
                while (diff < -Math.PI) diff += Math.PI * 2;
                while (diff > Math.PI) diff -= Math.PI * 2;
                this.player.angle += diff * 0.1;

                // Wind particles for touch/joystick movement
                if (this.gameTime % 3 === 0) {
                    const windX = this.player.x - Math.cos(angle) * 30;
                    const windY = this.player.y - Math.sin(angle) * 30;
                    this.entities.particles.push({
                        x: windX + (Math.random() - 0.5) * 20,
                        y: windY + (Math.random() - 0.5) * 20,
                        vx: -Math.cos(angle) * 2 + (Math.random() - 0.5) * 2,
                        vy: -Math.sin(angle) * 2 + (Math.random() - 0.5) * 2,
                        life: 30, r: Math.random() * 4 + 2,
                        color: 'rgba(200,220,255,0.6)'
                    });
                }
            } else {
                this.player.vel.x *= 0.95; this.player.vel.y *= 0.95;
            }
        } else if (!keyboardMove) {
            this.player.vel.x *= 0.98; this.player.vel.y *= 0.98;
        }

        this.player.x += this.player.vel.x;
        this.player.y += this.player.vel.y;

        // Boundary constraints
        // Horizontal bounds - keep player within screen width
        const margin = 50; // Margin from edges
        this.player.x = Math.max(margin, Math.min(window.innerWidth - margin, this.player.x));

        // Vertical bounds - can only move upward (negative Y)
        if (this.player.y > 0) {
            this.player.y = 0; // Cannot go below starting position
            this.player.vel.y = Math.min(0, this.player.vel.y); // Stop downward velocity
        }

        this.camY = this.player.y - window.innerHeight / 2;

        if (this.player.skills.nitro.active) {
            this.player.skills.nitro.timer--;
            if (this.player.skills.nitro.timer <= 0) this.player.skills.nitro.active = false;
        }

        // Survival
        let ambientTemp = this.currentBiome.temp;
        if (!this.player.isYacht) ambientTemp -= 5;
        if (this.dayPhase > 0.75 || this.dayPhase < 0.25) ambientTemp -= 5;
        let feltTemp = ambientTemp + (this.player.heatResist * 5);
        if (feltTemp < 30) {
            let lossRate = (30 - feltTemp) * 0.0001;
            this.player.bodyTemp -= lossRate;
        } else if (feltTemp > 35 && this.player.bodyTemp < 36.6) {
            this.player.bodyTemp += 0.05;
        }
        if (this.player.bodyTemp <= 30) this.die("Гіпотермія (Замерз)");

        // Entities & Mission
        this.spawnManager();
        this.updateEntities();
        this.checkCollisions();

        // Mission Update
        if (this.mission) {
            let d = Math.hypot(this.mission.tx - this.player.x, this.mission.ty - this.player.y);
            document.getElementById('mission-dist').innerText = Math.round(d) + 'm';
            if (d < 100) this.completeMission();
        }

        if (this.player.invulnerable > 0) this.player.invulnerable--;
    }

    activateSkill(name) {
        let skill = this.player.skills[name];
        if (skill.cd > 0) return;
        Sound.play('skill');
        skill.cd = skill.max;
        if (name === 'nitro') {
            skill.active = true;
            skill.timer = 120;
            this.showFloatText("⚡ NITRO!", this.player.x, this.player.y, '#facc15');
        } else if (name === 'repair') {
            this.player.bodyTemp = 36.6;
            this.player.invulnerable = 180;
            this.showFloatText("🔧 REPAIR!", this.player.x, this.player.y, '#4ade80');
        } else if (name === 'flare') {
            this.entities.mines.forEach((m, i) => {
                if (Math.hypot(m.x - this.player.x, m.y - this.player.y) < 400) {
                    this.addExplosion(m.x, m.y); this.entities.mines.splice(i, 1);
                }
            });
            this.entities.sharks.forEach(s => s.flee = 300);
            this.entities.tentacles.forEach(t => t.active = false); // Scare Kraken
            this.showFloatText("🧨 FLARE!", this.player.x, this.player.y, '#f87171');
        }
    }

    spawnManager() {
        const spawnY = this.player.y - window.innerHeight;

        if (this.entities.coins.length < 15 && Math.random() < 0.1) {
            this.entities.coins.push({ x: this.player.x + (Math.random() - 0.5) * window.innerWidth * 1.5, y: spawnY + Math.random() * 500, val: CONFIG.moneyValue });
        }

        if (this.entities.mines.length < 5 + this.currentBiome.danger && Math.random() < 0.02) {
            let minLvl = Math.max(0, this.currentBiome.danger - 2);
            let lvl = Math.min(7, Math.floor(minLvl + Math.random() * 3));
            this.entities.mines.push({ x: this.player.x + (Math.random() - 0.5) * window.innerWidth * 1.2, y: spawnY + Math.random() * 500, lvl: lvl, r: 15 + (lvl * 2), pulse: 0 });
        }

        if (this.entities.sharks.length < Math.floor(this.currentBiome.danger / 3) && Math.random() < 0.005) {
            this.entities.sharks.push({ x: this.player.x + (Math.random() - 0.5) * window.innerWidth * 1.5, y: spawnY - 500, angle: 0, speed: 2.5 + (this.currentBiome.danger * 0.2), flee: 0 });
        }

        // Whirlpools (Rare)
        if (this.entities.whirlpools.length < 1 && Math.random() < 0.001) {
            this.entities.whirlpools.push({ x: this.player.x + (Math.random() - 0.5) * window.innerWidth, y: spawnY - 1000, r: 150 });
        }

        // Icebergs (Arctic only)
        if (this.currentBiome.name === 'Арктика' && this.entities.icebergs.length < 5 && Math.random() < 0.02) {
            this.entities.icebergs.push({ x: this.player.x + (Math.random() - 0.5) * window.innerWidth * 2, y: spawnY - 500, w: 100 + Math.random() * 100, h: 80 + Math.random() * 50 });
        }

        // Kraken (Boss) - Random event if deep enough
        if (this.entities.tentacles.length === 0 && Math.abs(this.player.y) > 10000 && Math.random() < 0.0005) {
            this.spawnKraken();
        }

        const cleanup = (arr) => {
            for (let i = arr.length - 1; i >= 0; i--) {
                const distY = Math.abs(arr[i].y - this.player.y);
                const distX = Math.abs(arr[i].x - this.player.x);

                // Remove if too far vertically OR horizontally
                if (distY > window.innerHeight + 300 || distX > window.innerWidth + 300) {
                    arr.splice(i, 1);
                }
            }
        };
        cleanup(this.entities.coins); cleanup(this.entities.mines); cleanup(this.entities.icebergs); cleanup(this.entities.whirlpools);

        // Debug: Log entity counts
        if (this.gameTime % 60 === 0) {
            console.log(`Entities - Coins: ${this.entities.coins.length}, Mines: ${this.entities.mines.length}`);
        }
    }

    spawnKraken() {
        document.getElementById('warning-label').classList.remove('hidden');
        setTimeout(() => document.getElementById('warning-label').classList.add('hidden'), 3000);

        for (let i = 0; i < 4; i++) {
            this.entities.tentacles.push({
                x: this.player.x + (Math.random() - 0.5) * 600,
                y: this.player.y - 400 - Math.random() * 200,
                active: true,
                timer: 0
            });
        }
    }

    updateEntities() {
        // Particles
        for (let i = this.entities.particles.length - 1; i >= 0; i--) {
            let p = this.entities.particles[i]; p.life--; p.x += p.vx; p.y += p.vy;
            if (p.life <= 0) this.entities.particles.splice(i, 1);
        }

        // Sharks
        this.entities.sharks.forEach(s => {
            let dx = this.player.x - s.x; let dy = this.player.y - s.y; let dist = Math.hypot(dx, dy);
            let targetAngle = Math.atan2(dy, dx);
            if (s.flee > 0) { targetAngle += Math.PI; s.flee--; }
            let diff = targetAngle - s.angle;
            while (diff < -Math.PI) diff += Math.PI * 2; while (diff > Math.PI) diff -= Math.PI * 2;
            s.angle += diff * 0.05;
            if (dist < 1000) { s.x += Math.cos(s.angle) * s.speed; s.y += Math.sin(s.angle) * s.speed; }
        });

        // Whirlpools (Physics)
        this.entities.whirlpools.forEach(w => {
            let dx = this.player.x - w.x; let dy = this.player.y - w.y; let dist = Math.hypot(dx, dy);
            if (dist < w.r + 100) {
                // Pull
                let force = (1 - dist / (w.r + 100)) * 2;
                if (this.player.skills.nitro.active) force *= 0.1; // Nitro resists pull
                let angle = Math.atan2(dy, dx);
                this.player.x -= Math.cos(angle) * force;
                this.player.y -= Math.sin(angle) * force;
                this.player.angle += 0.1; // Spin player
            }
        });

        // Tentacles
        this.entities.tentacles.forEach(t => {
            if (!t.active) return;
            t.timer++;
            // Move randomly
            t.y += Math.sin(t.timer / 10) * 2;
        });
        if (this.entities.tentacles.length > 0 && this.entities.tentacles[0].y > this.player.y + 500) {
            this.entities.tentacles = []; // Despawn behind
        }
    }

    checkCollisions() {
        // Calculate viewport bounds (Fixed X for vertical scroller)
        const viewportTop = this.player.y - window.innerHeight / 2 - 100;
        const viewportBottom = this.player.y + window.innerHeight / 2 + 100;
        const viewportLeft = -100; // Fixed left bound with margin
        const viewportRight = window.innerWidth + 100; // Fixed right bound with margin

        // Helper to check if entity is in viewport
        const isVisible = (entity) => {
            return entity.y > viewportTop && entity.y < viewportBottom &&
                entity.x > viewportLeft && entity.x < viewportRight;
        };

        const baseMagnet = this.player.isYacht ? 60 : 30;
        const magnetR = baseMagnet * this.player.pickupRange;

        // Coins - only check visible ones
        for (let i = this.entities.coins.length - 1; i >= 0; i--) {
            let c = this.entities.coins[i];
            if (!isVisible(c)) continue; // Skip off-screen coins

            let d = Math.hypot(c.x - this.player.x, c.y - this.player.y);
            if (d < magnetR) {
                c.x += (this.player.x - c.x) * 0.1; c.y += (this.player.y - c.y) * 0.1;
                if (d < 20) {
                    Sound.play('coin'); this.player.money += c.val;
                    this.showFloatText(`+$${c.val}`, c.x, c.y, '#4ade80');
                    this.entities.coins.splice(i, 1); this.updateUI();
                }
            }
        }

        if (this.player.invulnerable <= 0) {
            // Mines - Capsule Collision
            for (let i = this.entities.mines.length - 1; i >= 0; i--) {
                let m = this.entities.mines[i];
                if (!isVisible(m)) continue;

                // Use capsule collision: Entity radius + Boat half-width (approx 15)
                if (this.checkPlayerCollision(m, m.r + 15)) {
                    this.handleHit(m.lvl, 'mine'); this.entities.mines.splice(i, 1);
                    this.addExplosion(m.x, m.y); break;
                }
            }
            // Sharks - Capsule Collision
            for (let i = this.entities.sharks.length - 1; i >= 0; i--) {
                let s = this.entities.sharks[i];
                if (!isVisible(s)) continue;

                // Shark radius approx 20 + Boat half-width 15 = 35
                if (this.checkPlayerCollision(s, 35)) {
                    this.handleHit(5, 'shark'); s.x -= Math.cos(s.angle) * 100; s.y -= Math.sin(s.angle) * 100; s.flee = 60; break;
                }
            }
            // Whirlpools - Center point check is fine (large radius)
            this.entities.whirlpools.forEach(w => {
                if (!isVisible(w)) return;
                let d = Math.hypot(w.x - this.player.x, w.y - this.player.y);
                if (d < 15) this.die("Затягнуло у вирву");
            });
            // Icebergs - Box Collision (Keep as is or improve, but box is fine for rect)
            this.entities.icebergs.forEach(ice => {
                if (!isVisible(ice)) return;
                // Simple box collision
                if (this.player.x > ice.x - ice.w / 2 && this.player.x < ice.x + ice.w / 2 &&
                    this.player.y > ice.y - ice.h / 2 && this.player.y < ice.y + ice.h / 2) {
                    this.handleHit(7, 'iceberg');
                    // Bounce
                    this.player.y += 50;
                }
            });
            // Kraken
            this.entities.tentacles.forEach(t => {
                if (!t.active || !isVisible(t)) return;
                if (Math.hypot(t.x - this.player.x, t.y - this.player.y) < 30) {
                    this.handleHit(8, 'kraken');
                    t.active = false;
                }
            });
        }
    }

    // Capsule Collision Detection
    // Checks distance from entity point to the boat's line segment (spine)
    checkPlayerCollision(entity, hitDist) {
        // If player is just a Donut (not a Yacht), use simple circle collision
        if (!this.player.isYacht) {
            const distSq = (entity.x - this.player.x) ** 2 + (entity.y - this.player.y) ** 2;
            // Donut is small (~40px visual), so hitDist should be small. 
            // We use the passed hitDist which includes entity radius + margin.
            // For donut, margin should be smaller (e.g. 20px radius total).
            // Let's assume hitDist passed is (EntityR + 15). 
            // We'll use that directly as it approximates (EntityR + DonutR).
            return distSq < hitDist * hitDist;
        }

        // Boat dimensions
        const boatLen = 80; // Total length
        const halfLen = boatLen / 2;

        // Boat spine start and end points (relative to center, rotated)
        // Angle is -PI/2 (up) by default.
        const cos = Math.cos(this.player.angle);
        const sin = Math.sin(this.player.angle);

        // Tip of the boat
        const x1 = this.player.x + cos * halfLen;
        const y1 = this.player.y + sin * halfLen;

        // Rear of the boat
        const x2 = this.player.x - cos * halfLen;
        const y2 = this.player.y - sin * halfLen;

        // Vector from p1 to p2
        const dx = x2 - x1;
        const dy = y2 - y1;

        // Project point onto line segment (clamped 0..1)
        const t = ((entity.x - x1) * dx + (entity.y - y1) * dy) / (dx * dx + dy * dy);
        const tClamped = Math.max(0, Math.min(1, t));

        // Closest point on segment
        const closestX = x1 + tClamped * dx;
        const closestY = y1 + tClamped * dy;

        // Distance check
        const distSq = (entity.x - closestX) ** 2 + (entity.y - closestY) ** 2;
        return distSq < hitDist * hitDist;
    }

    handleHit(lvl, type) {
        Sound.play('explode');
        document.body.style.transform = `translate(${Math.random() * 10 - 5}px, ${Math.random() * 10 - 5}px)`;
        setTimeout(() => document.body.style.transform = 'none', 200);

        if (!this.player.isYacht) { this.die(type === 'shark' ? "З'їдений акулою" : "Знищено"); return; }

        let damage = Math.max(0, lvl - this.player.armorLvl);
        if (damage === 0) { this.showFloatText("БЛОКОВАНО!", this.player.x, this.player.y, '#fff'); return; }

        let parts = Object.keys(this.equip).filter(k => this.equip[k] !== null);
        if (parts.length === 0) { this.die("Яхта знищена"); return; }

        let targetKey = parts[Math.floor(Math.random() * parts.length)];
        let part = this.equip[targetKey];

        document.getElementById('damage-overlay').classList.add('damage-anim');
        setTimeout(() => document.getElementById('damage-overlay').classList.remove('damage-anim'), 300);
        this.player.invulnerable = 60;

        if (part.tier > 0) {
            part.tier--;
            this.showFloatText(`⚠️ ${CONFIG.partTypes[targetKey].name} -1 Lvl`, this.player.x, this.player.y, '#ef4444');
        } else {
            this.equip[targetKey] = null;
            this.showFloatText(`💥 ${CONFIG.partTypes[targetKey].name} ЗНИЩЕНО!`, this.player.x, this.player.y, '#ef4444');
        }
        this.recalcStats();
    }

    die(reason) {
        this.player.isDead = true;
        document.getElementById('game-over-modal').classList.remove('hidden');
        document.getElementById('go-reason').innerText = reason;
        document.getElementById('final-score').innerText = `$${this.player.money}`;
        document.getElementById('go-emoji').innerText = reason.includes("Замерз") ? "🥶" : "💀";
        localStorage.removeItem(this.getSaveKey());
    }

    // --- Rendering ---
    draw() {
        let p = this.dayPhase;
        let r = 20, g = 40, b = 80;
        if (p < 0.2 || p > 0.8) { r = 10; g = 15; b = 40; }
        else if (p < 0.7 && p > 0.3) { r = 0; g = 160; b = 220; }

        let biomeC = this.hexToRgb(this.currentBiome.color);
        r = (r + biomeC.r) / 2; g = (g + biomeC.g) / 2; b = (b + biomeC.b) / 2;

        this.ctx.fillStyle = `rgb(${Math.floor(r)},${Math.floor(g)},${Math.floor(b)})`;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.save();
        this.ctx.translate(0, -this.camY % 100);
        this.ctx.strokeStyle = `rgba(255,255,255,0.1)`;
        this.ctx.lineWidth = 2;
        let waveOffset = this.gameTime * 0.5;
        for (let y = 0; y < this.canvas.height + 100; y += 50) {
            this.ctx.beginPath();
            for (let x = 0; x < this.canvas.width; x += 50) {
                let waveY = Math.sin((x + waveOffset) / 100) * 10;
                this.ctx.moveTo(x, y + waveY);
                this.ctx.lineTo(x + 30, y + waveY);
            }
            this.ctx.stroke();
        }
        this.ctx.restore();

        this.ctx.save();
        this.ctx.translate(0, -this.camY);

        // Viewport bounds (Fixed X for vertical scroller)
        const viewportTop = this.player.y - window.innerHeight / 2 - 100;
        const viewportBottom = this.player.y + window.innerHeight / 2 + 100;
        const viewportLeft = -100; // Fixed left bound with margin
        const viewportRight = window.innerWidth + 100; // Fixed right bound with margin

        // Helper to check if entity is in viewport
        const isVisible = (entity) => {
            return entity.y > viewportTop && entity.y < viewportBottom &&
                entity.x > viewportLeft && entity.x < viewportRight;
        };

        // Whirlpools
        this.entities.whirlpools.forEach(w => {
            if (!isVisible(w)) return;
            this.ctx.strokeStyle = 'rgba(255,255,255,0.4)';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            let rot = this.gameTime * 0.1;
            for (let i = 0; i < 3; i++) {
                this.ctx.arc(w.x, w.y, w.r - (i * 30), rot + i, rot + i + Math.PI);
            }
            this.ctx.stroke();
        });

        // Icebergs
        this.entities.icebergs.forEach(ice => {
            if (!isVisible(ice)) return;
            this.ctx.fillStyle = '#e0f2fe';
            this.ctx.fillRect(ice.x - ice.w / 2, ice.y - ice.h / 2, ice.w, ice.h);
            this.ctx.fillStyle = '#bae6fd'; // Shadow
            this.ctx.fillRect(ice.x - ice.w / 2, ice.y + ice.h / 2 - 10, ice.w, 10);
        });

        // Mission Target
        if (this.mission) {
            this.ctx.save();
            this.ctx.translate(this.mission.tx, this.mission.ty);
            this.ctx.fillStyle = '#facc15';
            this.ctx.beginPath();
            this.ctx.moveTo(0, -20); this.ctx.lineTo(10, 0); this.ctx.lineTo(0, 20); this.ctx.lineTo(-10, 0);
            this.ctx.fill();
            this.ctx.restore();

            // Arrow
            let angle = Math.atan2(this.mission.ty - this.player.y, this.mission.tx - this.player.x);
            let dist = 150;
            this.ctx.save();
            this.ctx.translate(this.player.x + Math.cos(angle) * dist, this.player.y + Math.sin(angle) * dist);
            this.ctx.rotate(angle);
            this.ctx.fillStyle = '#facc15';
            this.ctx.beginPath();
            this.ctx.moveTo(10, 0); this.ctx.lineTo(-10, 10); this.ctx.lineTo(-10, -10);
            this.ctx.fill();
            this.ctx.restore();
        }

        // Kraken
        this.entities.tentacles.forEach(t => {
            if (!t.active || !isVisible(t)) return;
            this.ctx.fillStyle = '#7f1d1d';
            this.ctx.beginPath();
            this.ctx.moveTo(t.x, t.y);
            this.ctx.quadraticCurveTo(t.x + Math.sin(this.gameTime / 10) * 50, t.y - 100, t.x, t.y - 200);
            this.ctx.lineTo(t.x + 20, t.y - 200);
            this.ctx.quadraticCurveTo(t.x + Math.sin(this.gameTime / 10) * 50 + 20, t.y - 100, t.x + 20, t.y);
            this.ctx.fill();
        });

        // Particles
        this.entities.particles.forEach(p => {
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = p.life / 40;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1;

        // Sharks
        this.entities.sharks.forEach(s => {
            if (!isVisible(s)) return;
            this.ctx.save();
            this.ctx.translate(s.x, s.y);
            this.ctx.rotate(s.angle);
            this.ctx.fillStyle = '#475569';
            this.ctx.beginPath();
            this.ctx.moveTo(20, 0); this.ctx.lineTo(-20, -10); this.ctx.lineTo(-20, 10);
            this.ctx.fill();
            this.ctx.restore();
        });

        // Mines
        this.entities.mines.forEach(m => {
            if (!isVisible(m)) return;
            let color = CONFIG.tierColors[m.lvl] || '#fff';

            // Glow effect
            this.ctx.save();
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = color;

            this.ctx.fillStyle = '#1e293b';
            this.ctx.beginPath(); this.ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2); this.ctx.fill();
            this.ctx.fillStyle = color; this.ctx.beginPath(); this.ctx.arc(m.x, m.y, m.r * 0.5, 0, Math.PI * 2); this.ctx.fill();

            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 2;
            for (let i = 0; i < 8; i++) {
                let a = (Math.PI * 2 / 8) * i + (this.gameTime * 0.02);
                this.ctx.beginPath(); this.ctx.moveTo(m.x, m.y); this.ctx.lineTo(m.x + Math.cos(a) * (m.r + 5), m.y + Math.sin(a) * (m.r + 5)); this.ctx.stroke();
            }
            this.ctx.restore();

            this.ctx.fillStyle = 'white'; this.ctx.font = 'bold 12px Arial'; this.ctx.textAlign = 'center'; this.ctx.textBaseline = 'middle'; this.ctx.fillText(m.lvl, m.x, m.y);
        });

        // Coins
        const baseMagnet = this.player.isYacht ? 60 : 30;
        const magnetR = baseMagnet * this.player.pickupRange;

        this.entities.coins.forEach(c => {
            if (!isVisible(c)) return;

            // Magnet Visual
            let d = Math.hypot(c.x - this.player.x, c.y - this.player.y);
            if (d < magnetR) {
                this.ctx.save();
                this.ctx.strokeStyle = 'rgba(250, 204, 21, 0.4)';
                this.ctx.lineWidth = 2;
                this.ctx.setLineDash([5, 5]);
                this.ctx.beginPath();
                this.ctx.moveTo(this.player.x, this.player.y);
                this.ctx.lineTo(c.x, c.y);
                this.ctx.stroke();
                this.ctx.restore();
            }

            this.ctx.fillStyle = '#facc15'; this.ctx.beginPath(); this.ctx.arc(c.x, c.y, 8, 0, Math.PI * 2); this.ctx.fill();
            this.ctx.fillStyle = '#ca8a04'; this.ctx.fillText('$', c.x, c.y + 1);
        });

        // Player
        this.ctx.translate(this.player.x, this.player.y);
        this.ctx.rotate(this.player.angle + Math.PI / 2);

        if (this.player.isYacht) {
            this.ctx.fillStyle = '#f8fafc';
            this.ctx.beginPath();
            this.ctx.moveTo(0, -40);
            this.ctx.bezierCurveTo(20, -10, 20, 30, 0, 40);
            this.ctx.bezierCurveTo(-20, 30, -20, -10, 0, -40);
            this.ctx.fill();
            this.ctx.fillStyle = CONFIG.tierColors[this.equip.hull?.tier || 0];
            this.ctx.fillRect(-15, -10, 30, 40);

            if (this.equip.radar) {
                this.ctx.strokeStyle = 'rgba(34, 211, 238, 0.3)';
                this.ctx.lineWidth = 1;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, 100 * this.player.radarRange, 0, Math.PI * 2);
                this.ctx.stroke();

                let sweep = (this.gameTime % 60) / 60 * Math.PI * 2;
                this.ctx.beginPath(); this.ctx.moveTo(0, 0); this.ctx.arc(0, 0, 100 * this.player.radarRange, sweep, sweep + 0.5);
                this.ctx.fillStyle = 'rgba(34, 211, 238, 0.1)'; this.ctx.fill();
            }

            if (this.player.skills.nitro.active) {
                this.ctx.fillStyle = '#facc15';
                this.ctx.beginPath(); this.ctx.moveTo(-10, 40); this.ctx.lineTo(0, 40 + Math.random() * 30); this.ctx.lineTo(10, 40); this.ctx.fill();
            }
        } else {
            this.ctx.font = "40px Arial"; this.ctx.textAlign = "center"; this.ctx.textBaseline = "middle"; this.ctx.fillText("🍩", 0, 0);
        }
        this.ctx.restore();

        // Enhanced Night Overlay
        if (p < 0.2 || p > 0.8) {
            // Darker night overlay with gradient
            const nightIntensity = p < 0.2 ? (0.2 - p) / 0.2 : (p - 0.8) / 0.2;

            // Dark overlay
            this.ctx.fillStyle = `rgba(0,5,20,${0.7 * nightIntensity})`;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            // Stars
            this.ctx.save();
            this.ctx.globalAlpha = nightIntensity;
            for (let i = 0; i < 100; i++) {
                const seed = i * 137.5; // Use golden angle for distribution
                const starX = ((seed * 123.456) % this.canvas.width);
                const starY = ((seed * 789.012 + this.camY * 0.1) % this.canvas.height);
                const brightness = 0.5 + (Math.sin(this.gameTime * 0.05 + i) * 0.5 + 0.5) * 0.5;

                this.ctx.fillStyle = `rgba(255,255,255,${brightness})`;
                this.ctx.fillRect(starX, starY, 2, 2);
            }

            // Moon when in deep night
            if (nightIntensity > 0.5) {
                const moonX = this.canvas.width - 150;
                const moonY = 100;

                // Moon glow
                const gradient = this.ctx.createRadialGradient(moonX, moonY, 20, moonX, moonY, 60);
                gradient.addColorStop(0, 'rgba(255,255,230,0.3)');
                gradient.addColorStop(1, 'rgba(255,255,230,0)');
                this.ctx.fillStyle = gradient;
                this.ctx.fillRect(moonX - 60, moonY - 60, 120, 120);

                // Moon itself
                this.ctx.fillStyle = 'rgba(240,240,220,0.9)';
                this.ctx.beginPath();
                this.ctx.arc(moonX, moonY, 25, 0, Math.PI * 2);
                this.ctx.fill();

                // Moon craters
                this.ctx.fillStyle = 'rgba(200,200,180,0.3)';
                this.ctx.beginPath();
                this.ctx.arc(moonX - 8, moonY - 5, 6, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.beginPath();
                this.ctx.arc(moonX + 10, moonY + 8, 4, 0, Math.PI * 2);
                this.ctx.fill();
            }

            this.ctx.restore();
        }

        // Radar UI Indicators
        if (this.player.isYacht && this.equip.radar) {
            this.ctx.save();
            let radarMax = 300 + (this.player.radarRange * 500);
            if (this.player.crew.navigator) radarMax *= 1.5;

            // Mines dots
            this.entities.mines.forEach(m => {
                let d = Math.hypot(m.x - this.player.x, m.y - this.player.y);
                if (d > 300 && d < radarMax) {
                    let a = Math.atan2(m.y - this.player.y, m.x - this.player.x);
                    this.ctx.fillStyle = 'red'; this.ctx.beginPath(); this.ctx.arc(window.innerWidth / 2 + Math.cos(a) * 100, window.innerHeight / 2 + Math.sin(a) * 100, 4, 0, Math.PI * 2); this.ctx.fill();
                }
            });
            this.entities.sharks.forEach(s => {
                let d = Math.hypot(s.x - this.player.x, s.y - this.player.y);
                if (d > 300 && d < radarMax) {
                    let a = Math.atan2(s.y - this.player.y, s.x - this.player.x);
                    this.ctx.fillStyle = 'orange'; this.ctx.beginPath(); this.ctx.arc(window.innerWidth / 2 + Math.cos(a) * 100, window.innerHeight / 2 + Math.sin(a) * 100, 6, 0, Math.PI * 2); this.ctx.fill();
                }
            });
            this.ctx.restore();
        }

        let coldness = (36.6 - this.player.bodyTemp) / 10;
        coldness = Math.max(0, Math.min(1, coldness));
        document.getElementById('cold-vignette').style.boxShadow = `inset 0 0 ${150 * coldness}px rgba(59, 130, 246, ${coldness})`;

        // Joystick Visual
        if (this.input.active) {
            this.ctx.save();
            this.ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform to draw on screen

            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.lineWidth = 4;
            this.ctx.beginPath();
            this.ctx.arc(this.input.origin.x, this.input.origin.y, 50, 0, Math.PI * 2);
            this.ctx.stroke();

            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            this.ctx.beginPath();
            this.ctx.arc(this.input.x, this.input.y, 20, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.restore();
        }
    }

    hexToRgb(hex) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : { r: 0, g: 0, b: 0 };
    }

    addExplosion(x, y) {
        for (let i = 0; i < 15; i++) {
            this.entities.particles.push({ x: x, y: y, vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 0.5) * 8, life: 40, r: Math.random() * 6 + 2, color: Math.random() > 0.5 ? '#f87171' : '#facc15' });
        }
    }
    showFloatText(text, x, y, color) {
        let el = document.createElement('div');
        el.className = 'absolute font-bold text-shadow pointer-events-none transition-all duration-1000 ease-out z-50';
        el.style.left = x + 'px'; el.style.top = (y - this.camY) + 'px'; el.style.color = color; el.style.textShadow = '1px 1px 0 #000';
        el.innerText = text; document.body.appendChild(el);
        requestAnimationFrame(() => { el.style.transform = 'translateY(-50px)'; el.style.opacity = 0; });
        setTimeout(() => el.remove(), 1000);
    }

    loop() {
        if (!this.paused) this.update();
        this.draw();
        this.drawDebug();
        requestAnimationFrame(() => this.loop());
    }

    // --- Inventory & UI ---
    switchTab(tab) {
        document.getElementById('tab-parts').classList.add('hidden');
        document.getElementById('tab-crew').classList.add('hidden');
        if (tab === 'parts') document.getElementById('tab-parts').classList.remove('hidden');
        if (tab === 'crew') {
            document.getElementById('tab-crew').classList.remove('hidden');
            document.getElementById('tab-crew').classList.add('flex');
            this.updateCrewUI();
        }
    }

    hireCrew(type) {
        if (this.player.money >= 500 && !this.player.crew[type]) {
            Sound.play('buy');
            this.player.money -= 500;
            this.player.crew[type] = true;
            this.updateCrewUI();
            this.updateUI();
            this.saveGame();
        }
    }

    updateCrewUI() {
        // Mechanic
        const mechBtn = document.getElementById('hire-mech');
        if (this.player.crew.mechanic) {
            mechBtn.innerText = "НАЙНЯТО"; mechBtn.className = "bg-slate-600 text-slate-400 text-xs px-3 py-2 rounded font-bold cursor-default";
        } else {
            mechBtn.innerText = "$500"; mechBtn.className = "bg-green-600 hover:bg-green-500 text-white text-xs px-3 py-2 rounded font-bold";
        }
        // Navigator
        const navBtn = document.getElementById('hire-nav');
        if (this.player.crew.navigator) {
            navBtn.innerText = "НАЙНЯТО"; navBtn.className = "bg-slate-600 text-slate-400 text-xs px-3 py-2 rounded font-bold cursor-default";
        } else {
            navBtn.innerText = "$500"; navBtn.className = "bg-green-600 hover:bg-green-500 text-white text-xs px-3 py-2 rounded font-bold";
        }
    }

    buyItem(type) {
        if (this.player.money >= CONFIG.baseCost) {
            let emptyIdx = this.inventory.findIndex(e => e === null);
            if (emptyIdx > -1) {
                Sound.play('buy');
                this.player.money -= CONFIG.baseCost;
                this.inventory[emptyIdx] = { type: type, tier: 0, id: Math.random() };
                this.updateUI(); this.renderInventory(); this.saveGame();
            }
        }
    }

    autoMerge() {
        let merged = false;
        for (let i = 0; i < this.inventory.length; i++) {
            if (!this.inventory[i]) continue;
            for (let j = i + 1; j < this.inventory.length; j++) {
                if (!this.inventory[j]) continue;
                if (this.inventory[i].type === this.inventory[j].type && this.inventory[i].tier === this.inventory[j].tier && this.inventory[i].tier < 7) {
                    this.inventory[i].tier++; this.inventory[j] = null; merged = true; Sound.play('merge'); i--; break;
                }
            }
        }
        if (merged) { this.renderInventory(); this.saveGame(); this.showFloatText("AUTO-MERGE!", this.player.x, this.player.y, '#22d3ee'); }
    }

    handleSlotClick(loc, idx) {
        let item = loc === 'inv' ? this.inventory[idx] : this.equip[idx];
        if (!this.selectedSlot) {
            if (item) { this.selectedSlot = { loc, idx }; this.renderInventory(); }
        } else {
            let sItem = this.selectedSlot.loc === 'inv' ? this.inventory[this.selectedSlot.idx] : this.equip[this.selectedSlot.idx];
            let actionDone = false;
            if (this.selectedSlot.loc === loc && this.selectedSlot.idx === idx) {
                this.selectedSlot = null;
            } else if (this.selectedSlot.loc === 'inv' && loc === 'inv') {
                if (item && item.type === sItem.type && item.tier === sItem.tier && item.tier < 7) {
                    this.inventory[idx].tier++; this.inventory[this.selectedSlot.idx] = null; Sound.play('merge'); actionDone = true;
                } else {
                    let temp = this.inventory[idx]; this.inventory[idx] = sItem; this.inventory[this.selectedSlot.idx] = temp; actionDone = true;
                }
            } else if (this.selectedSlot.loc === 'inv' && loc === 'equip') {
                if (idx === sItem.type) {
                    let temp = this.equip[idx]; this.equip[idx] = sItem; this.inventory[this.selectedSlot.idx] = temp; Sound.play('buy'); this.recalcStats(); actionDone = true;
                }
            } else if (this.selectedSlot.loc === 'equip' && loc === 'inv') {
                if (!item) {
                    this.inventory[idx] = sItem; this.equip[this.selectedSlot.idx] = null; this.recalcStats(); actionDone = true;
                }
            }
            if (actionDone) { this.selectedSlot = null; this.saveGame(); }
            this.renderInventory();
        }
    }

    recalcStats() {
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

// const game = new Game(); // Removed auto-init
