import { CONFIG, Haptics } from './config.js';
import { InputManager } from './modules/InputManager.js';
import { CollisionDetection } from './modules/CollisionDetection.js';
import { Renderer } from './modules/Renderer.js';
import { EntityManager } from './modules/EntityManager.js';
import { UIManager } from './modules/UIManager.js';
import { Sound } from './modules/AudioManager.js';
import { WeatherManager } from './modules/WeatherManager.js';

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');

        // --- Telegram Init ---
        this.tg = window.Telegram?.WebApp;
        if (this.tg) {
            this.tg.ready();
            this.tg.expand();
            // disableVerticalSwipes requires version 7.7+
            if (this.tg.version && parseFloat(this.tg.version) >= 7.7) {
                this.tg.disableVerticalSwipes();
            }
            // enableClosingConfirmation requires version 6.2+
            if (this.tg.version && parseFloat(this.tg.version) >= 6.2) {
                this.tg.enableClosingConfirmation();
            }
        }

        // --- Modules ---
        this.input = new InputManager(this.canvas, (skill) => this.activateSkill(skill), () => this.debug = !this.debug);
        this.collision = new CollisionDetection();
        this.renderer = new Renderer(this.canvas);
        this.entityManager = new EntityManager();
        this.ui = new UIManager();
        this.weather = new WeatherManager();

        // --- Game State ---
        this.gameTime = 0;
        this.paused = true;
        this.debug = false;
        this.dayPhase = 0;
        this.camY = 0;
        this.distanceTraveled = 0;
        this.mission = null;

        this.player = {
            x: window.innerWidth / 2, y: 0, angle: -Math.PI / 2, vel: { x: 0, y: 0 },
            money: 0, bodyTemp: 36.6, armorLvl: 0, heatResist: 0, pickupRange: 1, radarRange: 0,
            speedMult: 1, isYacht: false, isDead: false, invulnerable: 0,
            crew: {
                mechanic: { hired: false, level: 0 },
                navigator: { hired: false, level: 0 },
                doctor: { hired: false, level: 0 },
                merchant: { hired: false, level: 0 },
                gunner: { hired: false, level: 0 }
            },
            gunner: { lastShot: 0 },
            skills: {
                nitro: { active: false, cd: 0, max: 600, timer: 0 },
                flare: { cd: 0, max: 1800 },
                repair: { cd: 0, max: 3600 }
            }
        };

        this.inventory = Array(10).fill(null);
        this.equip = { hull: null, engine: null, cabin: null, magnet: null, radar: null };
        this.selectedSlot = null;

        this.entities = { mines: [], coins: [], particles: [], sharks: [], whirlpools: [], icebergs: [], tentacles: [], coffee: [], repairKits: [], pirates: [], pirateBullets: [] };
        this.currentBiome = CONFIG.biomes[0];

        // Listeners
        document.getElementById('garage-btn').onclick = () => this.ui.toggleGarage(true, this);
        document.getElementById('close-garage').onclick = () => this.ui.toggleGarage(false, this);
        document.getElementById('start-game-btn').onclick = () => {
            document.getElementById('main-menu').style.display = 'none';
            document.getElementById('game-canvas').style.display = 'block';

            // Show HUD
            document.getElementById('hud-money').style.display = 'flex';
            document.getElementById('hud-stats').style.display = 'block';
            document.getElementById('hud-biome').style.display = 'block';
            document.getElementById('garage-btn').style.display = 'flex';
            document.getElementById('skills-container').style.display = 'flex';

            // Start fresh every time
            this.respawn();
            this.paused = false;
            if (!Sound.ctx) {
                Sound.init();
                Sound.enabled = this.settings.sound;
            }
            this.loop();
        };

        // Other UI listeners handled via inline onclick in HTML or here
        // Note: hire-mech, hire-nav, auto-merge, buy-items have inline onclicks relying on window.game

        // Tasks Menu
        document.getElementById('tasks-btn').onclick = () => {
            document.getElementById('main-menu').style.display = 'none';
            document.getElementById('tasks-screen').style.display = 'flex';
        };
        document.getElementById('back-to-menu-btn').onclick = () => {
            document.getElementById('tasks-screen').style.display = 'none';
            document.getElementById('main-menu').style.display = 'flex';
        };

        // Settings
        this.settings = {
            nickname: localStorage.getItem('yacht_nickname') || 'Captain',
            sound: localStorage.getItem('yacht_sound') !== 'false', // Default true
            vibration: localStorage.getItem('yacht_vibration') !== 'false' // Default true
        };

        // Apply initial settings
        Sound.enabled = this.settings.sound;
        document.getElementById('nickname-input').value = this.settings.nickname;
        document.getElementById('sound-toggle').checked = this.settings.sound;
        document.getElementById('vibration-toggle').checked = this.settings.vibration;

        // Settings Listeners
        document.getElementById('settings-btn').onclick = () => {
            document.getElementById('main-menu').style.display = 'none';
            document.getElementById('settings-screen').style.display = 'flex';
        };
        document.getElementById('back-from-settings-btn').onclick = () => {
            document.getElementById('settings-screen').style.display = 'none';
            document.getElementById('main-menu').style.display = 'flex';
        };

        document.getElementById('save-nickname-btn').onclick = () => {
            const newNick = document.getElementById('nickname-input').value.trim();
            if (newNick) {
                this.settings.nickname = newNick;
                localStorage.setItem('yacht_nickname', newNick);
                alert('Нікнейм збережено!');
            }
        };

        document.getElementById('sound-toggle').onchange = (e) => {
            this.settings.sound = e.target.checked;
            localStorage.setItem('yacht_sound', this.settings.sound);
            if (this.settings.sound) {
                Sound.init(); // Always init when enabling sound
            } else {
                Sound.enabled = false;
            }
        };

        // Leaderboard
        this.leaderboard = JSON.parse(localStorage.getItem('yacht_leaderboard')) || [];

        document.getElementById('leaderboard-btn').onclick = () => {
            document.getElementById('main-menu').style.display = 'none';
            document.getElementById('leaderboard-screen').style.display = 'flex';
            this.renderLeaderboard();
        };

        document.getElementById('back-from-leaderboard-btn').onclick = () => {
            document.getElementById('leaderboard-screen').style.display = 'none';
            document.getElementById('main-menu').style.display = 'flex';
        };

        // Saves screen
        document.getElementById('saves-btn').onclick = () => {
            document.getElementById('main-menu').style.display = 'none';
            document.getElementById('saves-screen').style.display = 'flex';
            this.renderSaveSlots();
        };

        document.getElementById('back-from-saves-btn').onclick = () => {
            document.getElementById('saves-screen').style.display = 'none';
            document.getElementById('main-menu').style.display = 'flex';
        };

        document.getElementById('save-game-btn').onclick = () => {
            this.showSaveModal();
        };

        document.getElementById('cancel-save-btn').onclick = () => {
            document.getElementById('save-slot-modal').style.display = 'none';
        };

        document.getElementById('vibration-toggle').onchange = (e) => {
            this.settings.vibration = e.target.checked;
            localStorage.setItem('yacht_vibration', this.settings.vibration);
        };

        // Subscription
        document.getElementById('subscribe-btn').onclick = () => {
            window.open('https://t.me/khochuyakhtu', '_blank');
            localStorage.setItem('channelSubscribed', 'true');
        };
        document.getElementById('check-subscription-btn').onclick = () => {
            const subscribed = localStorage.getItem('channelSubscribed') === 'true';
            if (subscribed) {
                localStorage.setItem('subscriptionRewarded', 'true');
                document.getElementById('reward-status').style.display = 'block';
                document.getElementById('subscribe-btn').disabled = true;
                document.getElementById('subscribe-btn').style.opacity = '0.5';
                document.getElementById('check-subscription-btn').disabled = true;
                document.getElementById('check-subscription-btn').style.opacity = '0.5';

                // Add money
                this.player.money += 500;
                this.saveGame();
                alert('Вітаємо! Ви отримали 500$ за підписку на канал! 🎉');
            } else {
                alert('Будь ласка, спочатку підпишіться на канал!');
            }
        };

        // Check initial subscription status
        if (localStorage.getItem('subscriptionRewarded') === 'true') {
            document.getElementById('reward-status').style.display = 'block';
            document.getElementById('subscribe-btn').disabled = true;
            document.getElementById('subscribe-btn').style.opacity = '0.5';
            document.getElementById('check-subscription-btn').disabled = true;
            document.getElementById('check-subscription-btn').style.opacity = '0.5';
        }

        // Fake Loading
        setTimeout(() => {
            document.getElementById('loading-screen').style.display = 'none';
            document.getElementById('main-menu').style.display = 'flex';
        }, 1500);

        // Resize
        window.addEventListener('resize', () => this.resize());
        this.resize();
    }

    resize() {
        if (this.tg) {
            this.canvas.width = window.innerWidth;
            this.canvas.height = this.tg.viewportStableHeight || window.innerHeight;
        } else {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        }
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

        // Input & Movement
        // Get input from InputManager
        // We need to sync InputManager state with player movement logic
        // The original code accessed this.input directly. 
        // Now InputManager stores state.

        const inputState = this.input.getJoystickInput();
        const keys = this.input.getKeyboardInput();

        if (inputState.active) {
            let dx = inputState.x - inputState.origin.x;
            let dy = inputState.y - inputState.origin.y;
            let angle = Math.atan2(dy, dx);
            let dist = Math.min(50, Math.hypot(dx, dy));
            let speed = (dist / 50) * 4 * this.player.speedMult;
            if (this.player.skills.nitro.active) speed *= 2;

            this.player.vel.x += Math.cos(angle) * speed * 0.1;
            this.player.vel.y += Math.sin(angle) * speed * 0.1;
            this.player.angle = angle;

            // Wind particles
            if (this.gameTime % 5 === 0) {
                this.entities.particles.push({
                    x: this.player.x - Math.cos(this.player.angle) * 20,
                    y: this.player.y - Math.sin(this.player.angle) * 20,
                    vx: -Math.cos(this.player.angle) * 2 + (Math.random() - 0.5),
                    vy: -Math.sin(this.player.angle) * 2 + (Math.random() - 0.5),
                    life: 20, r: Math.random() * 2 + 1, color: 'rgba(200, 240, 255, 0.5)'
                });
            }
        } else {
            // Keyboard
            let kx = 0, ky = 0;
            if (keys.ArrowUp) ky -= 1;
            if (keys.ArrowDown) ky += 1;
            if (keys.ArrowLeft) kx -= 1;
            if (keys.ArrowRight) kx += 1;

            if (kx !== 0 || ky !== 0) {
                let angle = Math.atan2(ky, kx);
                let speed = 4 * this.player.speedMult;
                if (this.player.skills.nitro.active) speed *= 2;
                this.player.vel.x += Math.cos(angle) * speed * 0.1;
                this.player.vel.y += Math.sin(angle) * speed * 0.1;
                this.player.angle = angle;

                // Wind particles
                if (this.gameTime % 5 === 0) {
                    this.entities.particles.push({
                        x: this.player.x - Math.cos(this.player.angle) * 20,
                        y: this.player.y - Math.sin(this.player.angle) * 20,
                        vx: -Math.cos(this.player.angle) * 2 + (Math.random() - 0.5),
                        vy: -Math.sin(this.player.angle) * 2 + (Math.random() - 0.5),
                        life: 20, r: Math.random() * 2 + 1, color: 'rgba(200, 240, 255, 0.5)'
                    });
                }
            }
        }

        // Physics
        this.player.x += this.player.vel.x;
        this.player.y += this.player.vel.y;
        this.player.vel.x *= 0.92;
        this.player.vel.y *= 0.92;

        // Vertical bounds
        if (this.player.y > 0) {
            this.player.y = 0;
            this.player.vel.y = Math.min(0, this.player.vel.y);
        }

        // Horizontal bounds
        if (this.player.x < 0) {
            this.player.x = 0;
            this.player.vel.x = Math.max(0, this.player.vel.x);
        } else if (this.player.x > window.innerWidth) {
            this.player.x = window.innerWidth;
            this.player.vel.x = Math.min(0, this.player.vel.x);
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

        // Doctor cold resistance
        let coldResist = 0;
        if (this.player.crew.doctor.hired) {
            coldResist = this.player.crew.doctor.level * 3; // +3°C per level
        }

        let feltTemp = ambientTemp + (this.player.heatResist * 5) + coldResist;
        if (feltTemp < 30) {
            let lossRate = (30 - feltTemp) * 0.0001;
            this.player.bodyTemp -= lossRate;
        } else if (feltTemp > 35 && this.player.bodyTemp < 36.6) {
            this.player.bodyTemp += 0.05;
        }
        if (this.player.bodyTemp <= 28) this.die("Гіпотермія (Замерз)");

        // Entities & Mission
        this.entityManager.spawn(this);
        this.entityManager.update(this);
        this.weather.update(this.gameTime);
        this.checkCollisions();

        // Weather UI
        const weatherEl = document.getElementById('weather-indicator');
        if (this.weather.isFogVisible()) {
            weatherEl.style.display = 'block';
            weatherEl.innerText = '🌫️';
        } else {
            weatherEl.style.display = 'none';
        }

        // Mission Update
        if (this.mission) {
            let d = Math.hypot(this.mission.tx - this.player.x, this.mission.ty - this.player.y);
            document.getElementById('mission-dist').innerText = Math.round(d) + 'm';
            if (d < 100) this.completeMission();
        }

        if (this.player.invulnerable > 0) this.player.invulnerable--;

        // Gunner auto-shoot
        if (this.player.crew.gunner.hired && this.player.isYacht) {
            const shootInterval = 180 - (this.player.crew.gunner.level * 30); // 3s to 0.5s (180 frames to 30 frames)
            if (this.gameTime - this.player.gunner.lastShot > shootInterval) {
                this.gunnerShoot();
            }
        }

        this.passiveEffects();
        this.ui.updateUI(this);
    }

    passiveEffects() {
        if (this.player.isDead || this.paused) return;
        // Mechanic
        if (this.player.crew.mechanic.hired) {
            if (this.player.bodyTemp < 36.6 && this.player.bodyTemp > 30) {
                this.player.bodyTemp += 0.1;
                this.ui.updateUI(this);
            }
        }
    }

    activateSkill(name) {
        let skill = this.player.skills[name];
        if (skill.cd > 0) return;
        Sound.play('skill');
        skill.cd = skill.max;
        if (name === 'nitro') {
            skill.active = true;
            skill.timer = 120;
            this.ui.showFloatText("⚡ NITRO!", this.player.x, this.player.y, '#facc15', this.camY);
        } else if (name === 'repair') {
            this.player.bodyTemp = 36.6;
            this.player.invulnerable = 180;
            this.ui.showFloatText("🔧 REPAIR!", this.player.x, this.player.y, '#4ade80', this.camY);
        } else if (name === 'flare') {
            this.entities.mines.forEach((m, i) => {
                if (Math.hypot(m.x - this.player.x, m.y - this.player.y) < 400) {
                    this.entityManager.addExplosion(m.x, m.y, this.entities); this.entities.mines.splice(i, 1);
                }
            });
            this.entities.sharks.forEach(s => s.flee = 300);
            this.entities.tentacles.forEach(t => t.active = false); // Scare Kraken
            this.ui.showFloatText("🧨 FLARE!", this.player.x, this.player.y, '#f87171', this.camY);
        }
    }

    gunnerShoot() {
        const range = 300;
        let target = null;
        let minDist = range;

        // PRIORITY 1: Find closest pirate
        this.entities.pirates.forEach((p, idx) => {
            const d = Math.hypot(p.x - this.player.x, p.y - this.player.y);
            if (d < minDist) {
                minDist = d;
                target = { entity: p, type: 'pirate', index: idx };
            }
        });

        // PRIORITY 2: Find closest mine (only if no pirate found)
        if (!target) {
            this.entities.mines.forEach((m, idx) => {
                const d = Math.hypot(m.x - this.player.x, m.y - this.player.y);
                if (d < minDist) {
                    minDist = d;
                    target = { entity: m, type: 'mine', index: idx };
                }
            });
        }

        // PRIORITY 3: Find closest shark (only if no pirate/mine found)
        if (!target) {
            this.entities.sharks.forEach((s, idx) => {
                const d = Math.hypot(s.x - this.player.x, s.y - this.player.y);
                if (d < minDist) {
                    minDist = d;
                    target = { entity: s, type: 'shark', index: idx };
                }
            });
        }

        if (target) {
            Sound.play('skill');

            // Create bullet particle
            this.entities.particles.push({
                x: this.player.x,
                y: this.player.y,
                vx: (target.entity.x - this.player.x) / 10,
                vy: (target.entity.y - this.player.y) / 10,
                life: 10,
                r: 3,
                color: 'rgba(255, 200, 0, 1)'
            });

            if (target.type === 'pirate') {
                // Damage pirate
                target.entity.health -= 10;
                if (target.entity.health <= 0) {
                    this.entities.pirates.splice(target.index, 1);
                    this.entityManager.addExplosion(target.entity.x, target.entity.y, this.entities);
                    // Award money for destroying pirate
                    this.player.money += 50;
                    this.ui.showFloatText('+$50', target.entity.x, target.entity.y, '#4ade80', this.camY);
                }
            } else if (target.type === 'mine') {
                if (target.entity.lvl > 1) {
                    target.entity.lvl -= 1;
                } else {
                    this.entities.mines.splice(target.index, 1);
                    this.entityManager.addExplosion(target.entity.x, target.entity.y, this.entities);
                }
            } else if (target.type === 'shark') {
                target.entity.flee = 300;
            }

            this.player.gunner.lastShot = this.gameTime;
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
                    this.ui.showFloatText(`+$${c.val}`, c.x, c.y, '#4ade80', this.camY);
                    this.entities.coins.splice(i, 1); this.ui.updateUI(this);
                }
            }
        }

        // Coffee - temperature boost
        for (let i = this.entities.coffee.length - 1; i >= 0; i--) {
            let coffee = this.entities.coffee[i];
            if (!isVisible(coffee)) continue;

            let d = Math.hypot(coffee.x - this.player.x, coffee.y - this.player.y);
            if (d < magnetR) {
                coffee.x += (this.player.x - coffee.x) * 0.1; coffee.y += (this.player.y - coffee.y) * 0.1;
                if (d < 20) {
                    Sound.play('coin');
                    this.player.bodyTemp = Math.min(37, this.player.bodyTemp + 2);
                    this.ui.showFloatText(`☕ +2°C`, coffee.x, coffee.y, '#f59e0b', this.camY);
                    this.entities.coffee.splice(i, 1); this.ui.updateUI(this);
                }
            }
        }

        // Repair Kits - full temperature restore
        for (let i = this.entities.repairKits.length - 1; i >= 0; i--) {
            let kit = this.entities.repairKits[i];
            if (!isVisible(kit)) continue;

            let d = Math.hypot(kit.x - this.player.x, kit.y - this.player.y);
            if (d < magnetR) {
                kit.x += (this.player.x - kit.x) * 0.1; kit.y += (this.player.y - kit.y) * 0.1;
                if (d < 20) {
                    Sound.play('buy');
                    this.player.bodyTemp = 36.6;
                    this.ui.showFloatText(`🔧 Температура відновлена!`, kit.x, kit.y, '#10b981', this.camY);
                    this.entities.repairKits.splice(i, 1); this.ui.updateUI(this);
                }
            }
        }

        if (this.player.invulnerable <= 0) {
            // Mines - Capsule Collision
            for (let i = this.entities.mines.length - 1; i >= 0; i--) {
                let m = this.entities.mines[i];
                if (!isVisible(m)) continue;

                // Use capsule collision: Entity radius + Boat half-width (approx 15)
                if (this.collision.checkPlayerCollision(m, m.r + 15, this.player)) {
                    this.handleHit(m.lvl, 'mine'); this.entities.mines.splice(i, 1);
                    this.entityManager.addExplosion(m.x, m.y, this.entities); break;
                }
            }
            // Sharks - Capsule Collision
            for (let i = this.entities.sharks.length - 1; i >= 0; i--) {
                let s = this.entities.sharks[i];
                if (!isVisible(s)) continue;

                if (this.collision.checkPlayerCollision(s, 35 + 15, this.player)) {
                    this.handleHit(5, 'shark');
                    // Push shark away
                    s.x += Math.cos(s.angle + Math.PI) * 100;
                    s.y += Math.sin(s.angle + Math.PI) * 100;
                    break;
                }
            }
            // Icebergs
            this.entities.icebergs.forEach(ice => {
                if (!isVisible(ice)) return;
                // Simple box collision
                if (this.collision.checkBoxCollision(this.player, ice)) {
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

            // Pirate Bullets
            for (let i = this.entities.pirateBullets.length - 1; i >= 0; i--) {
                const bullet = this.entities.pirateBullets[i];
                if (!isVisible(bullet)) continue;

                const d = Math.hypot(bullet.x - this.player.x, bullet.y - this.player.y);
                if (d < 20) { // Hit yacht
                    this.handleHit(bullet.damage, 'pirate');
                    this.entities.pirateBullets.splice(i, 1);
                    break;
                }
            }
        }
    }

    handleHit(lvl, type) {
        Sound.play('explode');
        document.body.style.transform = `translate(${Math.random() * 10 - 5}px, ${Math.random() * 10 - 5}px)`;
        setTimeout(() => document.body.style.transform = 'none', 200);
        if (this.settings.vibration) Haptics.impact('heavy');

        if (!this.player.isYacht) { this.die(type === 'shark' ? "З'їдений акулою" : "Знищено"); return; }

        let damage = Math.max(0, lvl - this.player.armorLvl);
        if (damage === 0) { this.ui.showFloatText("БЛОКОВАНО!", this.player.x, this.player.y, '#fff', this.camY); return; }

        let parts = Object.keys(this.equip).filter(k => this.equip[k] !== null);
        if (parts.length === 0) { this.die("Яхта знищена"); return; }

        let targetKey = parts[Math.floor(Math.random() * parts.length)];
        let part = this.equip[targetKey];

        document.getElementById('damage-overlay').classList.add('damage-anim');
        setTimeout(() => document.getElementById('damage-overlay').classList.remove('damage-anim'), 300);
        this.player.invulnerable = 60;

        if (part.tier > 0) {
            part.tier--;
            this.ui.showFloatText(`⚠️ ${CONFIG.partTypes[targetKey].name} -1 Lvl`, this.player.x, this.player.y, '#ef4444', this.camY);
        } else {
            this.equip[targetKey] = null;
            this.ui.showFloatText(`💥 ${CONFIG.partTypes[targetKey].name} ЗНИЩЕНО!`, this.player.x, this.player.y, '#ef4444', this.camY);
        }
        this.recalcStats();
    }

    die(reason) {
        // Doctor death avoidance chance
        if (this.player.crew.doctor.hired) {
            const avoidChance = this.player.crew.doctor.level * 0.10; // 10% per level
            if (Math.random() < avoidChance) {
                this.player.bodyTemp = 36.6;
                this.player.invulnerable = 180;
                this.ui.showFloatText("💊 ЛІКАР ВРЯТУВАВ!", this.player.x, this.player.y, '#4ade80', this.camY);
                Sound.play('buy');
                return;
            }
        }

        this.player.isDead = true;
        this.saveScore(this.player.money); // Save score on death
        document.getElementById('game-over-modal').style.display = 'flex';
        document.getElementById('go-reason').innerText = reason;
        document.getElementById('final-score').innerText = `$${this.player.money}`;
        document.getElementById('go-emoji').innerText = reason.includes("Замерз") ? "🥶" : "💀";
        localStorage.removeItem(this.getSaveKey());
    }

    respawn() {
        this.player.isDead = false;
        this.player.y = 0;
        this.player.x = window.innerWidth / 2; // Reset X
        this.player.bodyTemp = 36.6;
        this.player.money = 0; // Reset Money
        this.inventory = Array(10).fill(null); // Reset Inventory
        this.equip = { hull: null, engine: null, cabin: null, magnet: null, radar: null }; // Reset Equip
        this.player.crew = {
            mechanic: { hired: false, level: 0 },
            navigator: { hired: false, level: 0 },
            doctor: { hired: false, level: 0 },
            merchant: { hired: false, level: 0 },
            gunner: { hired: false, level: 0 }
        }; // Reset Crew
        this.player.gunner = { lastShot: 0 };
        this.recalcStats();

        this.entities = { mines: [], coins: [], particles: [], sharks: [], whirlpools: [], icebergs: [], tentacles: [], coffee: [], repairKits: [], pirates: [], pirateBullets: [] };
        document.getElementById('game-over-modal').style.display = 'none';
        this.startMission();
        this.saveGame();
        this.ui.updateUI(this);
        this.ui.updateCrewUI(this.player);
        this.ui.renderInventory(this);
    }

    hardReset() {
        localStorage.removeItem(this.getSaveKey());
        localStorage.removeItem('channelSubscribed');
        localStorage.removeItem('subscriptionRewarded');
        location.reload();
    }

    draw() {
        // Delegate to Renderer
        // We pass 'this' which is the Game instance containing all state
        // Renderer expects { player, entities, camY, dayPhase, currentBiome, equip, input, gameTime, debug, mission }
        // We need to make sure 'input' in Renderer matches what we have.
        // Renderer uses this.input.active etc.
        // Our 'this.input' is InputManager instance.
        // We should pass the raw input state to Renderer or update Renderer to use InputManager.
        // Let's update Renderer to accept the game object and extract what it needs.
        // But wait, Renderer.js I wrote expects 'input' object with {x,y,active,origin}.
        // InputManager has getJoystickInput() which returns exactly that object.
        // So we can pass a proxy object or just update Renderer to call input.getJoystickInput() if it detects it's a manager.
        // Or simpler: pass { ...this, input: this.input.getJoystickInput() }

        this.renderer.draw({
            ...this,
            input: this.input.getJoystickInput()
        });
    }

    loop() {
        if (!this.paused) this.update();
        this.draw();
        requestAnimationFrame(() => this.loop());
    }

    // --- Persistence ---
    getSaveKey() {
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
            crew: this.player.crew,
            weather: this.weather.toJSON()
        };
        localStorage.setItem(this.getSaveKey(), JSON.stringify(data));
    }

    loadGame() {
        const saved = localStorage.getItem(this.getSaveKey());
        if (saved) {
            const data = JSON.parse(saved);
            this.player.money = data.money || 0;
            this.inventory = data.inventory || Array(10).fill(null);

            // Robust Equip Load
            const defaultEquip = { hull: null, engine: null, cabin: null, magnet: null, radar: null };
            this.equip = { ...defaultEquip, ...(data.equip || {}) };

            this.player.y = data.y || 0;
            this.gameTime = data.time || 0;

            // Robust Crew Load
            const defaultCrew = {
                mechanic: { hired: false, level: 0 },
                navigator: { hired: false, level: 0 },
                doctor: { hired: false, level: 0 },
                merchant: { hired: false, level: 0 },
                gunner: { hired: false, level: 0 }
            };
            const savedCrew = data.crew || {};
            this.player.crew = {};
            for (const role in defaultCrew) {
                this.player.crew[role] = { ...defaultCrew[role], ...(savedCrew[role] || {}) };
            }

            if (data.weather) this.weather.fromJSON(data.weather);

            this.recalcStats();
        }
        this.startMission();
        this.ui.updateUI(this);
        this.ui.updateCrewUI(this.player);
    }

    startMission() {
        let dist = 5000 + Math.random() * 5000;
        let angle = -Math.PI / 2 + (Math.random() - 0.5); // Upwards (player swims up, so mission should be above)

        let tx = this.player.x + Math.cos(angle) * dist;
        let ty = this.player.y + Math.sin(angle) * dist;

        // Clamp X to screen bounds with padding
        tx = Math.max(50, Math.min(window.innerWidth - 50, tx));

        this.mission = {
            tx: tx,
            ty: ty,
            reward: 1000 + Math.floor(Math.abs(this.player.y) / 10)
        };

        // Show panel
        document.getElementById('mission-panel').style.display = 'block';
        document.getElementById('mission-desc').innerText = "Доставте вантаж";
        document.getElementById('mission-reward').innerText = `$${this.mission.reward}`;
    }

    completeMission() {
        Sound.play('mission');
        this.player.money += this.mission.reward;
        this.ui.showFloatText(`MISSION COMPLETE! +$${this.mission.reward}`, this.player.x, this.player.y, '#facc15', this.camY);
        this.startMission();
        this.ui.updateUI(this);
    }

    hireCrew(type) {
        const crewMember = this.player.crew[type];
        let cost = 500;

        if (!crewMember.hired) {
            // Initial hire
            if (this.player.money >= cost) {
                Sound.play('buy');
                this.player.money -= cost;
                crewMember.hired = true;
                crewMember.level = 1;
                this.ui.updateCrewUI(this.player);
                this.ui.updateUI(this);
                this.saveGame();
            }
        } else if (crewMember.level < 5) {
            // Upgrade
            cost = CONFIG.crewUpgradeCosts[crewMember.level]; // Index matches next level cost
            if (this.player.money >= cost) {
                Sound.play('buy');
                this.player.money -= cost;
                crewMember.level++;
                this.ui.updateCrewUI(this.player);
                this.ui.updateUI(this);
                this.saveGame();
            }
        }
    }

    switchTab(tab) {
        this.ui.switchTab(tab, this);
    }

    buyItem(type) {
        let cost = CONFIG.baseCost;

        // Merchant discount
        if (this.player.crew.merchant.hired) {
            const discount = this.player.crew.merchant.level * 0.05; // 5% per level
            cost = Math.floor(cost * (1 - discount));
        }

        if (this.player.money >= cost) {
            let emptyIdx = this.inventory.findIndex(e => e === null);
            if (emptyIdx > -1) {
                Sound.play('buy');
                this.player.money -= cost;
                this.inventory[emptyIdx] = { type: type, tier: 0, id: Math.random() };
                this.ui.updateUI(this); this.ui.renderInventory(this); this.saveGame();
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
        if (merged) { this.ui.renderInventory(this); this.saveGame(); this.ui.showFloatText("AUTO-MERGE!", this.player.x, this.player.y, '#22d3ee', this.camY); }
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

        if (this.equip.engine) this.player.speedMult += (this.equip.engine.tier || 0) * 0.2;
        if (this.equip.hull) this.player.armorLvl = (this.equip.hull.tier || 0);
        if (this.equip.cabin) this.player.heatResist = (this.equip.cabin.tier || 0) + 1;
        if (this.equip.magnet) this.player.pickupRange += (this.equip.magnet.tier || 0) * 0.5;
        if (this.equip.radar) this.player.radarRange = 1 + ((this.equip.radar.tier || 0) * 0.5);

        this.ui.updateUI(this);
    }

    saveScore(score) {
        const newEntry = {
            name: this.settings.nickname,
            score: score,
            date: new Date().toLocaleDateString()
        };

        this.leaderboard.push(newEntry);
        this.leaderboard.sort((a, b) => b.score - a.score);
        this.leaderboard = this.leaderboard.slice(0, 10);

        localStorage.setItem('yacht_leaderboard', JSON.stringify(this.leaderboard));
    }

    renderLeaderboard() {
        const list = document.getElementById('leaderboard-list');
        list.innerHTML = '';

        if (this.leaderboard.length === 0) {
            list.innerHTML = '<div style="text-align: center; color: #94a3b8; padding: 20px;">Поки що немає результатів. Станьте першим!</div>';
            return;
        }

        this.leaderboard.forEach((entry, index) => {
            const item = document.createElement('div');
            item.style.cssText = 'background: rgba(255, 255, 255, 0.05); padding: 15px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center; border: 1px solid rgba(255, 255, 255, 0.1);';

            let medal = '';
            if (index === 0) medal = '🥇 ';
            else if (index === 1) medal = '🥈 ';
            else if (index === 2) medal = '🥉 ';
            else medal = `#${index + 1} `;

            item.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 20px;">${medal}</span>
                    <span style="font-weight: bold; color: white; font-size: 16px;">${entry.name}</span>
                </div>
                <div style="text-align: right;">
                    <div style="color: #4ade80; font-weight: bold; font-family: monospace; font-size: 18px;">$${entry.score}</div>
                    <div style="color: #64748b; font-size: 10px;">${entry.date}</div>
                </div>
            `;
            list.appendChild(item);
        });
    }

    // Save/Load System
    saveToSlot(slotNumber) {
        const saveData = {
            timestamp: Date.now(),
            playerData: {
                x: this.player.x,
                y: this.player.y,
                money: this.player.money,
                bodyTemp: this.player.bodyTemp,
                inventory: this.inventory,
                equip: this.equip,
                crew: this.player.crew
            },
            gameState: {
                currentBiome: this.currentBiome,
                day: this.day,
                mission: this.mission
            },
            summary: {
                distance: Math.abs(this.player.y),
                money: this.player.money,
                day: this.day
            },
            gameState: {
                currentBiome: this.currentBiome,
                day: this.day,
                mission: this.mission,
                weather: this.weather.toJSON()
            }
        };

        localStorage.setItem(`yacht_save_slot_${slotNumber}`, JSON.stringify(saveData));
        alert(`Гру збережено в слот ${slotNumber}!`);
        document.getElementById('save-slot-modal').style.display = 'none';
    }

    loadFromSlot(slotNumber) {
        const saveJson = localStorage.getItem(`yacht_save_slot_${slotNumber}`);
        if (!saveJson) {
            alert('Слот порожній!');
            return;
        }

        const saveData = JSON.parse(saveJson);

        // Restore player data
        this.player.x = saveData.playerData.x || window.innerWidth / 2;
        this.player.y = saveData.playerData.y || 0;
        this.player.money = saveData.playerData.money || 0;
        this.player.bodyTemp = saveData.playerData.bodyTemp || 36.6;
        this.inventory = saveData.playerData.inventory || Array(10).fill(null);

        // Robust Equip Load
        const defaultEquip = { hull: null, engine: null, cabin: null, magnet: null, radar: null };
        this.equip = { ...defaultEquip, ...(saveData.playerData.equip || {}) };

        // Robust Crew Load
        const defaultCrew = {
            mechanic: { hired: false, level: 0 },
            navigator: { hired: false, level: 0 },
            doctor: { hired: false, level: 0 },
            merchant: { hired: false, level: 0 },
            gunner: { hired: false, level: 0 }
        };
        const savedCrew = saveData.playerData.crew || {};
        this.player.crew = {};
        for (const role in defaultCrew) {
            this.player.crew[role] = { ...defaultCrew[role], ...(savedCrew[role] || {}) };
        }

        // Restore game state
        this.currentBiome = saveData.gameState.currentBiome;
        this.day = saveData.gameState.day;
        this.mission = saveData.gameState.mission;
        if (saveData.gameState.weather) this.weather.fromJSON(saveData.gameState.weather);

        // Reset entities (will spawn new ones based on position)
        this.entities = { mines: [], coins: [], particles: [], sharks: [], whirlpools: [], icebergs: [], tentacles: [], coffee: [], repairKits: [], pirates: [], pirateBullets: [] };

        // Recalculate stats
        this.recalcStats();

        // Set camera position to player
        this.camY = this.player.y + window.innerHeight / 2;

        // Initialize canvas size
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        // Update UI
        this.ui.updateUI(this);

        // Hide saves screen and show game
        document.getElementById('saves-screen').style.display = 'none';
        document.getElementById('main-menu').style.display = 'none';
        document.getElementById('game-canvas').style.display = 'block';

        // Show HUD
        document.getElementById('hud-money').style.display = 'flex';
        document.getElementById('hud-stats').style.display = 'block';
        document.getElementById('hud-biome').style.display = 'block';
        document.getElementById('garage-btn').style.display = 'flex';
        document.getElementById('skills-container').style.display = 'flex';
        if (this.mission) document.getElementById('mission-panel').style.display = 'block';

        // Start game
        this.paused = false;
        this.gameRunning = true;
        document.getElementById('garage-modal').classList.add('hidden');

        // Initialize audio if needed
        if (!Sound.ctx) Sound.init();

        // Start game loop
        this.loop();

        alert(`Гру завантажено з слоту ${slotNumber}!`);
    }

    getSaveSlots() {
        const slots = [];
        for (let i = 1; i <= 5; i++) {
            const saveJson = localStorage.getItem(`yacht_save_slot_${i}`);
            if (saveJson) {
                const data = JSON.parse(saveJson);
                slots.push({
                    slotNumber: i,
                    timestamp: data.timestamp,
                    summary: data.summary
                });
            } else {
                slots.push({
                    slotNumber: i,
                    timestamp: null,
                    summary: null
                });
            }
        }
        return slots;
    }

    deleteSave(slotNumber) {
        if (confirm(`Видалити збереження зі слоту ${slotNumber}?`)) {
            localStorage.removeItem(`yacht_save_slot_${slotNumber}`);
            this.renderSaveSlots();
        }
    }

    renderSaveSlots() {
        const list = document.getElementById('saves-list');
        list.innerHTML = '';

        const slots = this.getSaveSlots();

        slots.forEach(slot => {
            const item = document.createElement('div');
            item.style.cssText = 'background: rgba(15, 23, 42, 0.8); border: 1px solid #334155; border-radius: 12px; padding: 20px;';

            if (slot.summary) {
                const date = new Date(slot.timestamp).toLocaleString('uk-UA');
                item.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="color: #60a5fa; font-weight: bold; font-size: 18px; margin-bottom: 8px;">Слот ${slot.slotNumber}</div>
                            <div style="color: #94a3b8; font-size: 12px; margin-bottom: 4px;">📅 ${date}</div>
                            <div style="color: white; font-size: 14px;">
                                📏 ${Math.floor(slot.summary.distance)}m | 💰 $${slot.summary.money} | 🌅 День ${slot.summary.day}
                            </div>
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 8px;">
                            <button class="load-btn" data-slot="${slot.slotNumber}"
                                style="background: #10b981; color: white; font-weight: bold; padding: 8px 16px; border: none; border-radius: 8px; cursor: pointer;">Завантажити</button>
                            <button class="delete-btn" data-slot="${slot.slotNumber}"
                                style="background: #dc2626; color: white; font-weight: bold; padding: 8px 16px; border: none; border-radius: 8px; cursor: pointer;">Видалити</button>
                        </div>
                    </div>
                `;
            } else {
                item.innerHTML = `
                    <div style="text-align: center; color: #64748b; padding: 20px;">
                        <div style="font-size: 18px; margin-bottom: 8px;">Слот ${slot.slotNumber}</div>
                        <div style="font-size: 14px;">Порожній слот</div>
                    </div>
                `;
            }

            list.appendChild(item);
        });

        // Attach event listeners
        document.querySelectorAll('.load-btn').forEach(btn => {
            btn.onclick = () => this.loadFromSlot(parseInt(btn.dataset.slot));
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.onclick = () => this.deleteSave(parseInt(btn.dataset.slot));
        });
    }

    showSaveModal() {
        const modal = document.getElementById('save-slot-modal');
        const slotList = document.getElementById('save-slot-list');
        slotList.innerHTML = '';

        const slots = this.getSaveSlots();

        slots.forEach(slot => {
            const item = document.createElement('button');
            item.style.cssText = 'background: rgba(15, 23, 42, 0.8); border: 1px solid #334155; border-radius: 8px; padding: 15px; cursor: pointer; text-align: left; color: white; width: 100%;';

            if (slot.summary) {
                const date = new Date(slot.timestamp).toLocaleString('uk-UA');
                item.innerHTML = `
                    <div style="font-weight: bold; font-size: 16px; margin-bottom: 4px; color: #60a5fa;">Слот ${slot.slotNumber} (Зайнято)</div>
                    <div style="font-size: 12px; color: #94a3b8;">${date}</div>
                    <div style="font-size: 12px; color: #facc15; margin-top: 4px;">⚠️ Буде перезаписано</div>
                `;
            } else {
                item.innerHTML = `
                    <div style="font-weight: bold; font-size: 16px; color: #10b981;">Слот ${slot.slotNumber} (Порожній)</div>
                `;
            }

            item.onclick = () => this.saveToSlot(slot.slotNumber);
            slotList.appendChild(item);
        });

        modal.style.display = 'flex';
    }
}

// Global game instance for HTML onclick handlers if any (though we used addEventListener mostly)
// But wait, some HTML elements might use onclick="game.something()".
// I checked game.js and it seems it attaches listeners in constructor.
// But I should check index.html to be sure.
// Assuming listeners are attached in JS.

// Start the game instance
const game = new Game();
window.game = game;

