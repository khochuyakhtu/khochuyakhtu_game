// EntityManager - Handles spawning and updating all game entities
import { CONFIG } from '../config';

export class EntityManager {
    spawn(game) {
        const { player, entities, currentBiome, gameTime } = game;
        const spawnY = player.y - window.innerHeight;

        // Coins - optimized limit
        if (entities.coins.length < 8 && Math.random() < 0.08) {
            entities.coins.push({
                x: player.x + (Math.random() - 0.5) * window.innerWidth * 1.5,
                y: spawnY + Math.random() * 500,
                val: CONFIG.moneyValue
            });
        }

        // Coffee (Temperature boost) - optimized limit
        if (entities.coffee.length < 2 && Math.random() < 0.02) {
            entities.coffee.push({
                x: player.x + (Math.random() - 0.5) * window.innerWidth * 1.5,
                y: spawnY + Math.random() * 500
            });
        }

        // Repair Kits - optimized limit
        if (entities.repairKits.length < 1 && Math.random() < 0.01) {
            entities.repairKits.push({
                x: player.x + (Math.random() - 0.5) * window.innerWidth * 1.5,
                y: spawnY + Math.random() * 500
            });
        }

        // Mines - levels 0-20 based on biome (optimized limit)
        if (entities.mines.length < 3 + Math.floor(currentBiome.danger / 2) && Math.random() < 0.015) {
            // Level distribution based on danger:
            // Tropics (1): 0-4, Atlantica (3): 3-9, North Sea (5): 6-14, Arctic (8): 10-20
            const minLvl = Math.max(0, currentBiome.danger - 1);
            const maxLvl = Math.min(20, currentBiome.danger * 2.5);
            const lvl = Math.floor(minLvl + Math.random() * (maxLvl - minLvl + 1));
            entities.mines.push({
                x: player.x + (Math.random() - 0.5) * window.innerWidth * 1.2,
                y: spawnY + Math.random() * 500,
                lvl,
                r: 15 + (lvl * 2),
                pulse: 0
            });
        }

        // Sharks - optimized spawn
        if (entities.sharks.length < Math.max(1, Math.floor(currentBiome.danger / 2)) && Math.random() < 0.01) {
            entities.sharks.push({
                x: player.x + (Math.random() - 0.5) * window.innerWidth * 1.5,
                y: spawnY - 500,
                angle: 0,
                speed: 1.5 + (currentBiome.danger * 0.15),
                flee: 0
            });
        }

        // Whirlpools (Rare)
        if (entities.whirlpools.length < 1 && Math.random() < 0.001) {
            entities.whirlpools.push({
                x: player.x + (Math.random() - 0.5) * window.innerWidth,
                y: spawnY - 1000,
                r: 150
            });
        }

        // Icebergs (Arctic only)
        if (currentBiome.name === 'Арктика' && entities.icebergs.length < 5 && Math.random() < 0.02) {
            entities.icebergs.push({
                x: player.x + (Math.random() - 0.5) * window.innerWidth * 2,
                y: spawnY - 500,
                w: 100 + Math.random() * 100,
                h: 80 + Math.random() * 50
            });
        }

        // Kraken (Boss) - Random event if deep enough
        if (entities.tentacles.length === 0 && Math.abs(player.y) > 10000 && Math.random() < 0.0005) {
            this.spawnKraken(game);
        }

        // Pirates (Active enemies) - increased spawn chance
        if (currentBiome.danger >= 3 && entities.pirates.length < Math.floor(currentBiome.danger / 2) && Math.random() < 0.012) {
            entities.pirates.push({
                x: player.x + (Math.random() - 0.5) * window.innerWidth * 1.5,
                y: spawnY - 600,
                vx: 0,
                vy: 0,
                angle: 0,
                health: 30,
                lastShot: 0,
                fleeing: false
            });
        }

        // Oil Slicks (Environmental hazard) - optimized limit
        if (currentBiome.danger >= 2 && entities.oilSlicks.length < 2 && Math.random() < 0.008) {
            const radius = 80 + Math.random() * 40;
            entities.oilSlicks.push({
                x: player.x + (Math.random() - 0.5) * window.innerWidth * 1.5,
                y: spawnY + Math.random() * 600,
                r: radius
            });
        }

        // Cleanup off-screen entities
        this.cleanup(entities.coins, player);
        this.cleanup(entities.coffee, player);
        this.cleanup(entities.repairKits, player);
        this.cleanup(entities.mines, player);
        this.cleanup(entities.sharks, player);
        this.cleanup(entities.icebergs, player);
        this.cleanup(entities.whirlpools, player);
        this.cleanup(entities.pirates, player);
        this.cleanup(entities.pirateBullets, player);
        this.cleanup(entities.oilSlicks, player);
    }

    spawnKraken(game) {
        const { player, entities } = game;

        // Spawn 4 tentacles
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
        const { player, entities, gameTime } = game;

        // Particles
        for (let i = entities.particles.length - 1; i >= 0; i--) {
            const p = entities.particles[i];
            p.life--;
            p.x += p.vx;
            p.y += p.vy;
            if (p.life <= 0) entities.particles.splice(i, 1);
        }

        // Sharks AI
        entities.sharks.forEach(s => {
            const dx = player.x - s.x;
            const dy = player.y - s.y;
            const dist = Math.hypot(dx, dy);
            let targetAngle = Math.atan2(dy, dx);

            if (s.flee > 0) {
                targetAngle += Math.PI;
                s.flee--;
            }

            let diff = targetAngle - s.angle;
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;
            s.angle += diff * 0.05;

            if (dist < 1000) {
                s.x += Math.cos(s.angle) * s.speed;
                s.y += Math.sin(s.angle) * s.speed;
            }
        });

        // Whirlpools (Pull physics)
        entities.whirlpools.forEach(w => {
            const dx = player.x - w.x;
            const dy = player.y - w.y;
            const dist = Math.hypot(dx, dy);

            if (dist < w.r + 100) {
                let force = (1 - dist / (w.r + 100)) * 2;
                if (player.skills.nitro.active) force *= 0.1; // Nitro resists pull

                const angle = Math.atan2(dy, dx);
                player.x -= Math.cos(angle) * force;
                player.y -= Math.sin(angle) * force;
                player.angle += 0.1; // Spin player
            }
        });

        // Tentacles
        entities.tentacles.forEach(t => {
            if (!t.active) return;
            t.timer++;
            t.y += Math.sin(t.timer / 10) * 2; // Wave motion
        });

        // Despawn tentacles if behind player
        if (entities.tentacles.length > 0 && entities.tentacles[0].y > player.y + 500) {
            entities.tentacles = [];
        }

        // Pirates AI
        entities.pirates.forEach(pirate => {
            const dx = player.x - pirate.x;
            const dy = player.y - pirate.y;
            const dist = Math.hypot(dx, dy);
            const targetAngle = Math.atan2(dy, dx);

            // Flee if low health
            if (pirate.health < 10) {
                pirate.fleeing = true;
            }

            if (pirate.fleeing) {
                // Move away from player
                pirate.angle = targetAngle + Math.PI;
                pirate.vx = Math.cos(pirate.angle) * 2;
                pirate.vy = Math.sin(pirate.angle) * 2;
            } else if (dist < 500) {
                // In detection range
                if (dist > 250) {
                    // Chase player
                    const approachAngle = targetAngle + (Math.random() - 0.5) * 0.3;
                    pirate.vx += Math.cos(approachAngle) * 0.15;
                    pirate.vy += Math.sin(approachAngle) * 0.15;
                } else {
                    // Attack range - slow and shoot
                    pirate.vx *= 0.90;
                    pirate.vy *= 0.90;

                    // Shoot at player
                    if (gameTime - pirate.lastShot > 120) {
                        pirate.lastShot = gameTime;
                        const bulletSpeed = 3;
                        entities.pirateBullets.push({
                            x: pirate.x,
                            y: pirate.y,
                            vx: Math.cos(targetAngle) * bulletSpeed,
                            vy: Math.sin(targetAngle) * bulletSpeed,
                            angle: targetAngle,
                            damage: 3,
                            life: 180
                        });
                    }
                }
                pirate.angle = targetAngle;
            }

            // Apply velocity with friction
            pirate.x += pirate.vx;
            pirate.y += pirate.vy;
            pirate.vx *= 0.95;
            pirate.vy *= 0.95;
        });

        // Pirate Bullets
        for (let i = entities.pirateBullets.length - 1; i >= 0; i--) {
            const bullet = entities.pirateBullets[i];
            bullet.x += bullet.vx;
            bullet.y += bullet.vy;
            bullet.life--;
            if (bullet.life <= 0) {
                entities.pirateBullets.splice(i, 1);
            }
        }
    }

    cleanup(arr, player) {
        for (let i = arr.length - 1; i >= 0; i--) {
            const distY = Math.abs(arr[i].y - player.y);
            const distX = Math.abs(arr[i].x - player.x);

            // Remove if too far
            if (distY > window.innerHeight + 300 || distX > window.innerWidth + 300) {
                arr.splice(i, 1);
            }
        }
    }

    addExplosion(x, y, entities) {
        for (let i = 0; i < 15; i++) {
            entities.particles.push({
                x,
                y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 40,
                r: Math.random() * 6 + 2,
                color: Math.random() > 0.5 ? '#f87171' : '#facc15'
            });
        }
    }
}
