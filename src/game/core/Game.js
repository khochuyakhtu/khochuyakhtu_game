// Main Game class - Full game loop with all entities and systems
import { Renderer } from '../systems/Renderer';
import { InputManager } from '../systems/InputManager';
import { EntityManager } from '../systems/EntityManager';
import { CONFIG } from '../config';

export class Game {
    constructor(canvas, gameStore) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.gameStore = gameStore;

        // Systems
        this.renderer = new Renderer(canvas);
        this.inputManager = new InputManager(canvas);
        this.entityManager = new EntityManager();

        // Game state
        this.gameTime = 0;
        this.paused = false;
        this.camY = 0;
        this.distanceTraveled = 0;
        this.dayPhase = 0;
        this.debug = false;
        this.animationFrameId = null;

        // Current biome
        this.currentBiome = CONFIG.biomes[0];

        // Mission
        this.mission = null;

        // Entities - всі типи
        this.entities = {
            mines: [],
            coins: [],
            particles: [],
            sharks: [],
            whirlpools: [],
            icebergs: [],
            tentacles: [],
            coffee: [],
            repairKits: [],
            pirates: [],
            pirateBullets: [],
            oilSlicks: []
        };

        // Gunner tracking
        this.gunnerLastShot = 0;

        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    start() {
        // Захист від повторного виклику - якщо гра вже працює, не перезапускаємо
        if (this.isStarting) {
            console.log('Game.start() - already starting, ignoring');
            return;
        }
        this.isStarting = true;

        const state = this.gameStore.getState();

        // Reset all entities
        this.entities = {
            mines: [],
            coins: [],
            particles: [],
            sharks: [],
            whirlpools: [],
            icebergs: [],
            tentacles: [],
            coffee: [],
            repairKits: [],
            pirates: [],
            pirateBullets: [],
            oilSlicks: []
        };

        // Reset game state
        // gameTime and distanceTraveled initialization moved to logic block below
        this.dayPhase = 0;
        this.currentBiome = CONFIG.biomes[0];
        this.gunnerLastShot = 0;

        // Перевіряємо timestamp завантаження
        const loadTimestamp = localStorage.getItem('yacht-load-timestamp');
        let isRecentLoad = false;

        if (loadTimestamp) {
            const timeDiff = Date.now() - parseInt(loadTimestamp);
            // Якщо пройшло менше 2 секунд з моменту завантаження - вважаємо це завантаженням збереження
            if (timeDiff < 2000) {
                isRecentLoad = true;
            } else {
                // Якщо timestamp старий - видаляємо його
                localStorage.removeItem('yacht-load-timestamp');
            }
        }

        console.log('Game.start() isRecentLoad:', isRecentLoad);
        console.log('Player money before reset check:', state.player.money);

        if (!isRecentLoad) {
            // Повний скид стану гравця (гроші, позиція, температура, тощо)
            state.resetPlayer();
            // Reset game stats strictly on new game
            this.gameTime = 0;
            this.distanceTraveled = 0;

            console.log('Player reset, money after:', state.player.money);

            // Apply bonuses for completed subscription tasks
            let totalBonus = 0;
            const channel1Rewarded = localStorage.getItem('channel1_rewarded') === 'true';
            const channel2Rewarded = localStorage.getItem('channel2_rewarded') === 'true';

            if (channel1Rewarded) {
                totalBonus += 100;
                console.log('Channel 1 task completed: +100$');
            }

            if (channel2Rewarded) {
                totalBonus += 100;
                console.log('Channel 2 task completed: +100$');
            }

            if (totalBonus > 0) {
                state.addMoney(totalBonus);
                console.log(`Total task bonus applied: +${totalBonus}$`);
            }
        } else {
            console.log('Skipping reset, keeping saved data');
            // Restore game stats from store
            const gameState = state.gameState;
            this.gameTime = gameState.gameTime || 0;
            this.distanceTraveled = gameState.distanceTraveled || 0;
            this.dayPhase = (this.gameTime % CONFIG.dayDuration) / CONFIG.dayDuration;
        }

        // Update position for game start
        state.updatePlayer({
            x: window.innerWidth / 2,
            y: 0,
            invulnerable: 180,
            bodyTemp: 36.6,
            isDead: false
        });

        // Recalculate stats based on current equipment
        state.recalcStats();

        // Reset camera
        this.camY = -window.innerHeight / 2;

        this.startMission();
        this.paused = false;

        this.isStarting = false;

        this.loop();
    }

    stop() {
        this.paused = true;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
    }

    loop = () => {
        if (!this.paused) {
            this.update();
        }
        this.draw();
        this.animationFrameId = requestAnimationFrame(this.loop);
    };

    update() {
        const state = this.gameStore.getState();
        const player = state.player;

        if (player.isDead) return;

        this.gameTime++;
        this.dayPhase = (this.gameTime % CONFIG.dayDuration) / CONFIG.dayDuration;

        // Update biome
        this.distanceTraveled = Math.abs(Math.min(0, player.y));
        for (const b of CONFIG.biomes) {
            if (player.y <= b.startY) this.currentBiome = b;
        }

        // Update crew abilities (auto-buy, auto-merge)
        state.updateCrewAbilities();

        // Player movement
        this.updatePlayerMovement();

        // Spawn entities
        this.entityManager.spawn({
            player,
            entities: this.entities,
            currentBiome: this.currentBiome,
            gameTime: this.gameTime
        });

        // Update entities
        this.entityManager.update({
            player,
            entities: this.entities,
            gameTime: this.gameTime
        });

        // Sync stats to store periodically (every 1 sec / 60 frames)
        if (this.gameTime % 60 === 0) {
            state.updateGameState({
                gameTime: this.gameTime,
                distanceTraveled: this.distanceTraveled
            });
        }

        // Update camera
        this.camY = player.y - window.innerHeight / 2;

        // Update mission
        if (this.mission) {
            const d = Math.hypot(this.mission.tx - player.x, this.mission.ty - player.y);
            if (d < 100) {
                this.completeMission();
            }
        }

        // Update skills (need to track changes)
        const skillUpdates = {};
        Object.keys(player.skills).forEach(skillName => {
            const skill = player.skills[skillName];
            const updates = {};

            if (skill.cd > 0) updates.cd = skill.cd - 1;
            if (skill.active && skill.timer !== undefined) {
                updates.timer = skill.timer - 1;
                if (updates.timer <= 0) updates.active = false;
            }

            if (Object.keys(updates).length > 0) {
                skillUpdates[skillName] = { ...skill, ...updates };
            }
        });

        // Track player changes
        const playerUpdates = {};

        // Invulnerability
        if (player.invulnerable > 0) {
            playerUpdates.invulnerable = player.invulnerable - 1;
        }

        // Flag to check if Gunner logic was here? No, Gunner is above in separate block.
        // I will target the block that includes Gunner, Mechanic and Doctor logic.

        // Gunner auto-shoot
        if (player.crew.gunner.hired && player.isYacht) {
            // Level 1: 180 frames (3s), Level 20: 60 frames (1s)
            const shootInterval = Math.max(60, 180 - (player.crew.gunner.level * 6));
            if (this.gameTime - this.gunnerLastShot > shootInterval) {
                this.gunnerShoot();
            }
        }

        // Handle Flare skill - scare away enemies
        if (player.flareActive) {
            // Scare sharks
            this.entities.sharks.forEach(shark => {
                shark.flee = 300;
            });
            // Scare pirates
            this.entities.pirates.forEach(pirate => {
                pirate.flee = 300;
            });
            // Clear mines in radius
            const flareRadius = 200;
            this.entities.mines = this.entities.mines.filter(mine => {
                const d = Math.hypot(mine.x - player.x, mine.y - player.y);
                if (d < flareRadius) {
                    this.entityManager.addExplosion(mine.x, mine.y, this.entities);
                    return false;
                }
                return true;
            });
            // Reset flag
            playerUpdates.flareActive = false;
        }

        // Passive effects (mechanic) - rebalanced for 20 levels
        // Level 1: +0.005/frame, Level 20: +0.1/frame
        let newBodyTemp = player.bodyTemp;
        if (player.crew.mechanic.hired) {
            if (newBodyTemp < 36.6 && newBodyTemp > 30) {
                newBodyTemp += 0.005 * player.crew.mechanic.level;
            }
        }

        // Temperature degradation - always decreases, faster in cold biomes
        // In tropics (25°C): slow decrease
        // In arctic (-20°C): fast decrease
        const biomeTemp = this.currentBiome.temp;
        // Calculate base cooling rate: warmer biomes = slower cooling
        // At 25°C: rate = 0.002, at -20°C: rate = 0.02
        let tempLoss = Math.max(0.002, (25 - biomeTemp) * 0.0004 + 0.002);

        // Apply heat resistance from cabin
        if (player.heatResist > 0) {
            tempLoss *= Math.max(0.2, 1 - player.heatResist * 0.15);
        }

        // Doctor reduces cold damage - rebalanced for 20 levels
        // Level 1: -4% tempLoss, Level 20: -80% tempLoss
        if (player.crew.doctor.hired) {
            tempLoss *= Math.max(0.2, 1 - player.crew.doctor.level * 0.04);
        }

        newBodyTemp -= tempLoss;
        playerUpdates.bodyTemp = newBodyTemp;

        // Check hypothermia
        if (newBodyTemp <= 28) {
            // Doctor can save - rebalanced for 20 levels
            // Level 1: 4.5% chance, Level 20: 90% chance
            if (player.crew.doctor.hired && Math.random() < player.crew.doctor.level * 0.045) {
                playerUpdates.bodyTemp = 30;
                playerUpdates.invulnerable = 180;
            } else {
                this.die("Переохолодження");
                return; // Don't update if dead
            }
        }

        // Apply skill updates
        if (Object.keys(skillUpdates).length > 0) {
            playerUpdates.skills = { ...player.skills, ...skillUpdates };
        }

        // Update player state once with all changes (temperature, invulnerability, skills)
        if (Object.keys(playerUpdates).length > 0) {
            state.updatePlayer(playerUpdates);
        }

        // Check collisions AFTER temperature update
        // Coffee and repair kits will add temperature on top of the current value
        this.checkCollisions();
    }

    updatePlayerMovement() {
        const state = this.gameStore.getState();
        const playerData = state.player;

        // Create mutable copy for calculations
        const player = {
            ...playerData,
            vel: { ...playerData.vel },
            skills: { ...playerData.skills }
        };

        const inputState = this.inputManager.getJoystickInput();
        const keys = this.inputManager.getKeyboardInput();

        let moved = false;

        // Touch/Mouse
        if (inputState.active) {
            const dx = inputState.x - inputState.origin.x;
            const dy = inputState.y - inputState.origin.y;
            const angle = Math.atan2(dy, dx);
            const dist = Math.min(50, Math.hypot(dx, dy));
            let speed = (dist / 50) * 4 * player.speedMult;
            if (player.skills.nitro.active) speed *= 2;

            // Oil slick slowdown
            this.entities.oilSlicks.forEach(oil => {
                const d = Math.hypot(oil.x - player.x, oil.y - player.y);
                if (d < oil.r) speed *= 0.2;
            });

            player.vel.x += Math.cos(angle) * speed * 0.1;
            player.vel.y += Math.sin(angle) * speed * 0.1;
            player.angle = angle;
            moved = true;

            // Wind particles
            if (this.gameTime % 5 === 0) {
                this.entities.particles.push({
                    x: player.x - Math.cos(player.angle) * 20,
                    y: player.y - Math.sin(player.angle) * 20,
                    vx: -Math.cos(player.angle) * 2 + (Math.random() - 0.5),
                    vy: -Math.sin(player.angle) * 2 + (Math.random() - 0.5),
                    life: 20,
                    r: Math.random() * 2 + 1,
                    color: 'rgba(200, 240, 255, 0.5)'
                });
            }
        }

        // Keyboard
        let kx = 0, ky = 0;
        if (keys.ArrowUp) ky -= 1;
        if (keys.ArrowDown) ky += 1;
        if (keys.ArrowLeft) kx -= 1;
        if (keys.ArrowRight) kx += 1;

        if (kx !== 0 || ky !== 0) {
            const angle = Math.atan2(ky, kx);
            let speed = 4 * player.speedMult;
            if (player.skills.nitro.active) speed *= 2;

            // Oil slick slowdown
            this.entities.oilSlicks.forEach(oil => {
                const d = Math.hypot(oil.x - player.x, oil.y - player.y);
                if (d < oil.r) speed *= 0.2;
            });

            player.vel.x += Math.cos(angle) * speed * 0.1;
            player.vel.y += Math.sin(angle) * speed * 0.1;
            player.angle = angle;
        }

        // Apply velocity
        player.x += player.vel.x;
        player.y += player.vel.y;
        player.vel.x *= 0.92;
        player.vel.y *= 0.92;

        // Bounds
        if (player.y > 0) {
            player.y = 0;
            player.vel.y = Math.min(0, player.vel.y);
        }
        if (player.x < 0) {
            player.x = 0;
            player.vel.x = Math.max(0, player.vel.x);
        } else if (player.x > window.innerWidth) {
            player.x = window.innerWidth;
            player.vel.x = Math.min(0, player.vel.x);
        }

        // Update store with new values
        state.updatePlayer({
            x: player.x,
            y: player.y,
            angle: player.angle,
            vel: player.vel
        });
    }

    checkCollisions() {
        const state = this.gameStore.getState();
        const player = state.player;

        const baseMagnet = player.isYacht ? 60 : 30;
        const magnetR = baseMagnet * player.pickupRange;

        // Viewport for performance
        const viewportTop = player.y - window.innerHeight / 2 - 100;
        const viewportBottom = player.y + window.innerHeight / 2 + 100;
        const isVisible = (e) => e.y > viewportTop && e.y < viewportBottom;

        const playerUpdates = {};

        // Coins
        for (let i = this.entities.coins.length - 1; i >= 0; i--) {
            const c = this.entities.coins[i];
            if (!isVisible(c)) continue;

            const d = Math.hypot(c.x - player.x, c.y - player.y);
            if (d < magnetR) {
                c.x += (player.x - c.x) * 0.1;
                c.y += (player.y - c.y) * 0.1;
                if (d < 20) {
                    state.addMoney(c.val);
                    this.entities.coins.splice(i, 1);
                }
            }
        }

        // Coffee
        for (let i = this.entities.coffee.length - 1; i >= 0; i--) {
            const c = this.entities.coffee[i];
            if (!isVisible(c)) continue;

            const d = Math.hypot(c.x - player.x, c.y - player.y);
            if (d < magnetR) {
                c.x += (player.x - c.x) * 0.1;
                c.y += (player.y - c.y) * 0.1;
                if (d < 20) {
                    // Fix: Use playerUpdates instead of direct mutation
                    const currentTemp = playerUpdates.bodyTemp !== undefined ? playerUpdates.bodyTemp : player.bodyTemp;
                    playerUpdates.bodyTemp = Math.min(36.6, currentTemp + 2);
                    this.entities.coffee.splice(i, 1);
                }
            }
        }

        // Repair Kits
        for (let i = this.entities.repairKits.length - 1; i >= 0; i--) {
            const kit = this.entities.repairKits[i];
            if (!isVisible(kit)) continue;

            const d = Math.hypot(kit.x - player.x, kit.y - player.y);
            if (d < magnetR) {
                kit.x += (player.x - kit.x) * 0.1;
                kit.y += (player.y - kit.y) * 0.1;
                if (d < 20) {
                    // Fix: Use playerUpdates instead of direct mutation
                    playerUpdates.bodyTemp = 36.6;
                    playerUpdates.invulnerable = 120;
                    this.entities.repairKits.splice(i, 1);
                }
            }
        }

        if (player.invulnerable <= 0 && (playerUpdates.invulnerable === undefined || playerUpdates.invulnerable <= 0)) {
            // Mines
            for (let i = this.entities.mines.length - 1; i >= 0; i--) {
                const m = this.entities.mines[i];
                if (!isVisible(m)) continue;

                const d = Math.hypot(m.x - player.x, m.y - player.y);
                if (d < m.r + 15) {
                    this.handleHit(m.lvl);
                    this.entities.mines.splice(i, 1);
                    this.entityManager.addExplosion(m.x, m.y, this.entities);
                    break;
                }
            }

            // Sharks
            for (let i = this.entities.sharks.length - 1; i >= 0; i--) {
                const s = this.entities.sharks[i];
                if (!isVisible(s)) continue;

                const d = Math.hypot(s.x - player.x, s.y - player.y);
                if (d < 35) {
                    this.handleHit(3);
                    s.flee = 200;
                    break;
                }
            }

            // Icebergs
            for (let i = this.entities.icebergs.length - 1; i >= 0; i--) {
                const ice = this.entities.icebergs[i];
                if (!isVisible(ice)) continue;

                if (player.x > ice.x - ice.w / 2 && player.x < ice.x + ice.w / 2 &&
                    player.y > ice.y - ice.h / 2 && player.y < ice.y + ice.h / 2) {
                    this.handleHit(5);
                    break;
                }
            }

            // Tentacles
            for (let i = this.entities.tentacles.length - 1; i >= 0; i--) {
                const t = this.entities.tentacles[i];
                if (!t.active || !isVisible(t)) continue;

                const d = Math.hypot(t.x - player.x, t.y - player.y);
                if (d < 50) {
                    this.handleHit(6);
                    t.active = false;
                    break;
                }
            }

            // Pirate Bullets
            for (let i = this.entities.pirateBullets.length - 1; i >= 0; i--) {
                const b = this.entities.pirateBullets[i];
                const d = Math.hypot(b.x - player.x, b.y - player.y);
                if (d < 20) {
                    this.handleHit(b.damage);
                    this.entities.pirateBullets.splice(i, 1);
                    break;
                }
            }
        }

        // Apply all updates
        if (Object.keys(playerUpdates).length > 0) {
            state.updatePlayer(playerUpdates);
        }
    }

    handleHit(lvl) {
        const state = this.gameStore.getState();
        const player = state.player;

        if (!player.isYacht) {
            this.die("Знищено");
            return;
        }

        const damage = Math.max(0, lvl - player.armorLvl);
        if (damage === 0) {
            // No damage, just invulnerability frames
            state.updatePlayer({ invulnerable: 30 });
            return;
        }

        // Damage equipped item
        const equip = state.equip;
        const parts = Object.keys(equip).filter(k => equip[k] !== null);

        if (parts.length === 0) {
            this.die("Яхта знищена");
            return;
        }

        const targetKey = parts[Math.floor(Math.random() * parts.length)];

        // Use store action to damage equipment
        state.damageEquip(targetKey);
        state.recalcStats();
        state.updatePlayer({ invulnerable: 60 });

        // Visual feedback
        this.entityManager.addExplosion(player.x, player.y, this.entities);
    }

    die(reason) {
        const state = this.gameStore.getState();

        // Final sync of stats
        state.updateGameState({
            gameTime: this.gameTime,
            distanceTraveled: this.distanceTraveled
        });

        state.updatePlayer({ isDead: true });
        console.log("Game Over:", reason);

        // Auto-save to cloud to record leaderboard stats
        state.saveToCloud().then(success => {
            if (success) console.log('Death stats saved to cloud');
        });

        // Save score to leaderboard (local)
        const settingsStore = window.__settingsStore__;
        if (settingsStore) {
            const score = Math.floor(this.distanceTraveled);
            settingsStore.getState().saveScore(score);
        }

        // Trigger GameOver modal через useUIStore
        this.stop();

        // Показуємо modal через timeout щоб state встиг оновитись
        setTimeout(() => {
            const uiStore = window.__uiStore__;
            if (uiStore) {
                uiStore.getState().setModal('gameOver', true);
            }
        }, 100);
    }

    gunnerShoot() {
        const state = this.gameStore.getState();
        const player = state.player;
        const range = 300;
        let target = null;
        let minDist = range;

        // Priority 1: Pirates
        this.entities.pirates.forEach((p, idx) => {
            const d = Math.hypot(p.x - player.x, p.y - player.y);
            if (d < minDist) {
                minDist = d;
                target = { entity: p, type: 'pirate', index: idx };
            }
        });

        // Priority 2: Mines
        if (!target) {
            this.entities.mines.forEach((m, idx) => {
                const d = Math.hypot(m.x - player.x, m.y - player.y);
                if (d < minDist) {
                    minDist = d;
                    target = { entity: m, type: 'mine', index: idx };
                }
            });
        }

        // Priority 3: Sharks  
        if (!target) {
            this.entities.sharks.forEach((s, idx) => {
                const d = Math.hypot(s.x - player.x, s.y - player.y);
                if (d < minDist) {
                    minDist = d;
                    target = { entity: s, type: 'shark', index: idx };
                }
            });
        }

        if (target) {
            this.gunnerLastShot = this.gameTime;

            // Create bullet particle
            const angle = Math.atan2(target.entity.y - player.y, target.entity.x - player.x);
            for (let i = 0; i < 10; i++) {
                this.entities.particles.push({
                    x: player.x,
                    y: player.y,
                    vx: Math.cos(angle) * 10 + (Math.random() - 0.5) * 2,
                    vy: Math.sin(angle) * 10 + (Math.random() - 0.5) * 2,
                    life: 20,
                    r: 2,
                    color: '#fbbf24'
                });
            }

            // Damage/destroy target
            if (target.type === 'pirate') {
                target.entity.health -= 10;
                if (target.entity.health <= 0) {
                    this.entityManager.addExplosion(target.entity.x, target.entity.y, this.entities);
                    this.entities.pirates.splice(target.index, 1);
                    state.addMoney(50);
                }
            } else if (target.type === 'mine') {
                this.entityManager.addExplosion(target.entity.x, target.entity.y, this.entities);
                this.entities.mines.splice(target.index, 1);
            } else if (target.type === 'shark') {
                target.entity.flee = 300;
            }
        }
    }

    startMission() {
        const state = this.gameStore.getState();
        const player = state.player;

        const dist = 5000 + Math.random() * 5000;
        const angle = -Math.PI / 2 + (Math.random() - 0.5);

        let tx = player.x + Math.cos(angle) * dist;
        let ty = player.y + Math.sin(angle) * dist;

        tx = Math.max(50, Math.min(window.innerWidth - 50, tx));

        this.mission = {
            tx,
            ty,
            reward: 200 + Math.floor(Math.abs(player.y) / 100)
        };

        state.updateGameState({ mission: this.mission });
    }

    completeMission() {
        const state = this.gameStore.getState();
        state.addMoney(this.mission.reward);
        this.startMission();
    }

    draw() {
        const state = this.gameStore.getState();
        const player = state.player;
        const equip = state.equip;

        this.renderer.draw({
            player,
            entities: this.entities,
            camY: this.camY,
            dayPhase: this.dayPhase,
            currentBiome: this.currentBiome,
            equip,
            input: this.inputManager.getJoystickInput(),
            gameTime: this.gameTime,
            debug: this.debug,
            mission: this.mission
        });
    }
}
