import { CONFIG } from '../config.js';

export class EntityManager {
    constructor() {
    }

    spawn(game) {
        const { player, entities, currentBiome, gameTime } = game;
        const spawnY = player.y - window.innerHeight;

        // Coins
        if (entities.coins.length < 15 && Math.random() < 0.1) {
            entities.coins.push({ x: player.x + (Math.random() - 0.5) * window.innerWidth * 1.5, y: spawnY + Math.random() * 500, val: CONFIG.moneyValue });
        }

        // Mines
        if (entities.mines.length < 5 + currentBiome.danger && Math.random() < 0.02) {
            let minLvl = Math.max(0, currentBiome.danger - 2);
            let lvl = Math.min(7, Math.floor(minLvl + Math.random() * 3));
            entities.mines.push({ x: player.x + (Math.random() - 0.5) * window.innerWidth * 1.2, y: spawnY + Math.random() * 500, lvl: lvl, r: 15 + (lvl * 2), pulse: 0 });
        }

        // Sharks
        if (entities.sharks.length < Math.floor(currentBiome.danger / 3) && Math.random() < 0.005) {
            entities.sharks.push({ x: player.x + (Math.random() - 0.5) * window.innerWidth * 1.5, y: spawnY - 500, angle: 0, speed: 1.5 + (currentBiome.danger * 0.15), flee: 0 });
        }

        // Whirlpools (Rare)
        if (entities.whirlpools.length < 1 && Math.random() < 0.001) {
            entities.whirlpools.push({ x: player.x + (Math.random() - 0.5) * window.innerWidth, y: spawnY - 1000, r: 150 });
        }

        // Icebergs (Arctic only)
        if (currentBiome.name === 'Арктика' && entities.icebergs.length < 5 && Math.random() < 0.02) {
            entities.icebergs.push({ x: player.x + (Math.random() - 0.5) * window.innerWidth * 2, y: spawnY - 500, w: 100 + Math.random() * 100, h: 80 + Math.random() * 50 });
        }

        // Kraken (Boss) - Random event if deep enough
        if (entities.tentacles.length === 0 && Math.abs(player.y) > 10000 && Math.random() < 0.0005) {
            this.spawnKraken(game);
        }

        this.cleanup(entities.coins, player);
        this.cleanup(entities.mines, player);
        this.cleanup(entities.icebergs, player);
        this.cleanup(entities.whirlpools, player);

        // Debug: Log entity counts
        if (gameTime % 60 === 0) {
            console.log(`Entities - Coins: ${entities.coins.length}, Mines: ${entities.mines.length}`);
        }
    }

    spawnKraken(game) {
        const { player, entities } = game;
        document.getElementById('warning-label').classList.remove('hidden');
        setTimeout(() => document.getElementById('warning-label').classList.add('hidden'), 3000);

        for (let i = 0; i < 4; i++) {
            entities.tentacles.push({
                x: player.x + (Math.random() - 0.5) * 600,
                y: player.y - 400 - Math.random() * 200,
                active: true,
                timer: 0
            });
        }
    }

    update(game) {
        const { player, entities } = game;

        // Particles
        for (let i = entities.particles.length - 1; i >= 0; i--) {
            let p = entities.particles[i]; p.life--; p.x += p.vx; p.y += p.vy;
            if (p.life <= 0) entities.particles.splice(i, 1);
        }

        // Sharks
        entities.sharks.forEach(s => {
            let dx = player.x - s.x; let dy = player.y - s.y; let dist = Math.hypot(dx, dy);
            let targetAngle = Math.atan2(dy, dx);
            if (s.flee > 0) { targetAngle += Math.PI; s.flee--; }
            let diff = targetAngle - s.angle;
            while (diff < -Math.PI) diff += Math.PI * 2; while (diff > Math.PI) diff -= Math.PI * 2;
            s.angle += diff * 0.05;
            if (dist < 1000) { s.x += Math.cos(s.angle) * s.speed; s.y += Math.sin(s.angle) * s.speed; }
        });

        // Whirlpools (Physics)
        entities.whirlpools.forEach(w => {
            let dx = player.x - w.x; let dy = player.y - w.y; let dist = Math.hypot(dx, dy);
            if (dist < w.r + 100) {
                // Pull
                let force = (1 - dist / (w.r + 100)) * 2;
                if (player.skills.nitro.active) force *= 0.1; // Nitro resists pull
                let angle = Math.atan2(dy, dx);
                player.x -= Math.cos(angle) * force;
                player.y -= Math.sin(angle) * force;
                player.angle += 0.1; // Spin player
            }
        });

        // Tentacles
        entities.tentacles.forEach(t => {
            if (!t.active) return;
            t.timer++;
            // Move randomly
            t.y += Math.sin(t.timer / 10) * 2;
        });
        if (entities.tentacles.length > 0 && entities.tentacles[0].y > player.y + 500) {
            entities.tentacles = []; // Despawn behind
        }
    }

    cleanup(arr, player) {
        for (let i = arr.length - 1; i >= 0; i--) {
            const distY = Math.abs(arr[i].y - player.y);
            const distX = Math.abs(arr[i].x - player.x);

            // Remove if too far vertically OR horizontally
            if (distY > window.innerHeight + 300 || distX > window.innerWidth + 300) {
                arr.splice(i, 1);
            }
        }
    }

    addExplosion(x, y, entities) {
        for (let i = 0; i < 15; i++) {
            entities.particles.push({ x: x, y: y, vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 0.5) * 8, life: 40, r: Math.random() * 6 + 2, color: Math.random() > 0.5 ? '#f87171' : '#facc15' });
        }
    }
}
