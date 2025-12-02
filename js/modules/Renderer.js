import { CONFIG } from '../config.js';

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    draw(game) {
        const { player, entities, camY, dayPhase, currentBiome, equip, input, gameTime, debug, mission } = game;

        // Background
        this.drawBackground(dayPhase, currentBiome, camY);

        // Waves
        this.drawWaves(camY, gameTime);

        this.ctx.save();
        this.ctx.translate(0, -camY);

        // Helper to check if entity is in viewport
        // We need to recalculate viewport bounds here or pass them
        const viewportTop = player.y - window.innerHeight / 2 - 100;
        const viewportBottom = player.y + window.innerHeight / 2 + 100;
        const viewportLeft = -100;
        const viewportRight = window.innerWidth + 100;

        const isVisible = (entity) => {
            return entity.y > viewportTop && entity.y < viewportBottom &&
                entity.x > viewportLeft && entity.x < viewportRight;
        };

        // Whirlpools
        entities.whirlpools.forEach(w => {
            if (!isVisible(w)) return;
            this.ctx.save();
            this.ctx.translate(w.x, w.y);
            this.ctx.rotate(gameTime * 0.05);
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.lineWidth = 2;
            for (let i = 1; i < 4; i++) {
                this.ctx.beginPath();
                this.ctx.arc(0, 0, w.r * (i / 3), 0, Math.PI * 2);
                this.ctx.stroke();
            }
            this.ctx.restore();
        });

        // Icebergs
        entities.icebergs.forEach(ice => {
            if (!isVisible(ice)) return;
            this.ctx.fillStyle = '#e2e8f0';
            this.ctx.fillRect(ice.x - ice.w / 2, ice.y - ice.h / 2, ice.w, ice.h);
            this.ctx.fillStyle = '#cbd5e1';
            this.ctx.fillRect(ice.x - ice.w / 2, ice.y + ice.h / 2 - 10, ice.w, 10);
        });

        // Mission Target
        if (mission) {
            this.ctx.save();
            this.ctx.translate(mission.tx, mission.ty);
            this.ctx.fillStyle = '#facc15';
            this.ctx.beginPath();
            this.ctx.moveTo(0, -20); this.ctx.lineTo(10, 0); this.ctx.lineTo(0, 20); this.ctx.lineTo(-10, 0);
            this.ctx.fill();
            this.ctx.restore();

            // Arrow
            let angle = Math.atan2(mission.ty - player.y, mission.tx - player.x);
            let dist = 150;
            this.ctx.save();
            this.ctx.translate(player.x + Math.cos(angle) * dist, player.y + Math.sin(angle) * dist);
            this.ctx.rotate(angle);
            this.ctx.fillStyle = '#facc15';
            this.ctx.beginPath();
            this.ctx.moveTo(10, 0); this.ctx.lineTo(-10, 10); this.ctx.lineTo(-10, -10);
            this.ctx.fill();
            this.ctx.restore();
        }

        // Kraken
        entities.tentacles.forEach(t => {
            if (!t.active || !isVisible(t)) return;
            this.ctx.fillStyle = '#7f1d1d';
            this.ctx.beginPath();
            this.ctx.moveTo(t.x, t.y);
            this.ctx.quadraticCurveTo(t.x + Math.sin(gameTime / 10) * 50, t.y - 100, t.x, t.y - 200);
            this.ctx.lineTo(t.x + 20, t.y - 200);
            this.ctx.quadraticCurveTo(t.x + Math.sin(gameTime / 10) * 50 + 20, t.y - 100, t.x + 20, t.y);
            this.ctx.fill();
        });

        // Particles
        entities.particles.forEach(p => {
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = p.life / 40;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1;

        // Sharks
        entities.sharks.forEach(s => {
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
        entities.mines.forEach(m => {
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
                let a = (Math.PI * 2 / 8) * i + (gameTime * 0.02);
                this.ctx.beginPath(); this.ctx.moveTo(m.x, m.y); this.ctx.lineTo(m.x + Math.cos(a) * (m.r + 5), m.y + Math.sin(a) * (m.r + 5)); this.ctx.stroke();
            }
            this.ctx.restore();

            this.ctx.fillStyle = 'white'; this.ctx.font = 'bold 12px Arial'; this.ctx.textAlign = 'center'; this.ctx.textBaseline = 'middle'; this.ctx.fillText(m.lvl, m.x, m.y);
        });

        // Coins
        const baseMagnet = player.isYacht ? 60 : 30;
        const magnetR = baseMagnet * player.pickupRange;

        entities.coins.forEach(c => {
            if (!isVisible(c)) return;

            // Magnet Visual
            let d = Math.hypot(c.x - player.x, c.y - player.y);
            if (d < magnetR) {
                this.ctx.save();
                this.ctx.strokeStyle = 'rgba(250, 204, 21, 0.4)';
                this.ctx.lineWidth = 2;
                this.ctx.setLineDash([5, 5]);
                this.ctx.beginPath();
                this.ctx.moveTo(player.x, player.y);
                this.ctx.lineTo(c.x, c.y);
                this.ctx.stroke();
                this.ctx.restore();
            }

            this.ctx.fillStyle = '#facc15'; this.ctx.beginPath(); this.ctx.arc(c.x, c.y, 8, 0, Math.PI * 2); this.ctx.fill();
            this.ctx.fillStyle = '#ca8a04'; this.ctx.fillText('$', c.x, c.y + 1);
        });

        // Coffee
        entities.coffee.forEach(coffee => {
            if (!isVisible(coffee)) return;

            // Magnet Visual
            let d = Math.hypot(coffee.x - player.x, coffee.y - player.y);
            if (d < magnetR) {
                this.ctx.save();
                this.ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
                this.ctx.lineWidth = 2;
                this.ctx.setLineDash([5, 5]);
                this.ctx.beginPath();
                this.ctx.moveTo(player.x, player.y);
                this.ctx.lineTo(coffee.x, coffee.y);
                this.ctx.stroke();
                this.ctx.restore();
            }

            this.ctx.font = "20px Arial";
            this.ctx.textAlign = "center";
            this.ctx.textBaseline = "middle";
            this.ctx.fillText("☕", coffee.x, coffee.y);
        });

        // Repair Kits
        entities.repairKits.forEach(kit => {
            if (!isVisible(kit)) return;

            // Magnet Visual
            let d = Math.hypot(kit.x - player.x, kit.y - player.y);
            if (d < magnetR) {
                this.ctx.save();
                this.ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
                this.ctx.lineWidth = 2;
                this.ctx.setLineDash([5, 5]);
                this.ctx.beginPath();
                this.ctx.moveTo(player.x, player.y);
                this.ctx.lineTo(kit.x, kit.y);
                this.ctx.stroke();
                this.ctx.restore();
            }

            this.ctx.font = "20px Arial";
            this.ctx.textAlign = "center";
            this.ctx.textBaseline = "middle";
            this.ctx.fillText("🔧", kit.x, kit.y);
        });

        // Player
        this.ctx.translate(player.x, player.y);
        this.ctx.rotate(player.angle + Math.PI / 2);

        if (player.isYacht) {
            this.ctx.fillStyle = '#f8fafc';
            this.ctx.beginPath();
            this.ctx.moveTo(0, -40);
            this.ctx.bezierCurveTo(20, -10, 20, 30, 0, 40);
            this.ctx.bezierCurveTo(-20, 30, -20, -10, 0, -40);
            this.ctx.fill();
            this.ctx.fillStyle = CONFIG.tierColors[equip.hull?.tier || 0];
            this.ctx.fillRect(-15, -10, 30, 40);

            if (equip.radar) {
                this.ctx.strokeStyle = 'rgba(34, 211, 238, 0.3)';
                this.ctx.lineWidth = 1;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, 100 * player.radarRange, 0, Math.PI * 2);
                this.ctx.stroke();

                let sweep = (gameTime % 60) / 60 * Math.PI * 2;
                this.ctx.beginPath(); this.ctx.moveTo(0, 0); this.ctx.arc(0, 0, 100 * player.radarRange, sweep, sweep + 0.5);
                this.ctx.fillStyle = 'rgba(34, 211, 238, 0.1)'; this.ctx.fill();
            }

            if (player.skills.nitro.active) {
                this.ctx.fillStyle = '#facc15';
                this.ctx.beginPath(); this.ctx.moveTo(-10, 40); this.ctx.lineTo(0, 40 + Math.random() * 30); this.ctx.lineTo(10, 40); this.ctx.fill();
            }
        } else {
            this.ctx.font = "40px Arial"; this.ctx.textAlign = "center"; this.ctx.textBaseline = "middle"; this.ctx.fillText("🍩", 0, 0);
        }
        this.ctx.restore();

        // Night Overlay
        this.drawNightOverlay(dayPhase, camY, gameTime);

        // Radar UI Indicators
        if (player.isYacht && equip.radar) {
            this.ctx.save();
            let radarMax = 300 + (player.radarRange * 500);
            if (player.crew.navigator) radarMax *= 1.5;

            // Mines dots
            entities.mines.forEach(m => {
                let d = Math.hypot(m.x - player.x, m.y - player.y);
                if (d > 300 && d < radarMax) {
                    let a = Math.atan2(m.y - player.y, m.x - player.x);
                    this.ctx.fillStyle = 'red'; this.ctx.beginPath(); this.ctx.arc(window.innerWidth / 2 + Math.cos(a) * 100, window.innerHeight / 2 + Math.sin(a) * 100, 4, 0, Math.PI * 2); this.ctx.fill();
                }
            });
            entities.sharks.forEach(s => {
                let d = Math.hypot(s.x - player.x, s.y - player.y);
                if (d > 300 && d < radarMax) {
                    let a = Math.atan2(s.y - player.y, s.x - player.x);
                    this.ctx.fillStyle = 'orange'; this.ctx.beginPath(); this.ctx.arc(window.innerWidth / 2 + Math.cos(a) * 100, window.innerHeight / 2 + Math.sin(a) * 100, 6, 0, Math.PI * 2); this.ctx.fill();
                }
            });
            this.ctx.restore();
        }

        // Cold Vignette
        let coldness = (36.6 - player.bodyTemp) / 10;
        coldness = Math.max(0, Math.min(1, coldness));
        document.getElementById('cold-vignette').style.boxShadow = `inset 0 0 ${150 * coldness}px rgba(59, 130, 246, ${coldness})`;

        // Joystick Visual
        if (input.active) {
            this.ctx.save();
            this.ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform to draw on screen

            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.lineWidth = 4;
            this.ctx.beginPath();
            this.ctx.arc(input.origin.x, input.origin.y, 50, 0, Math.PI * 2);
            this.ctx.stroke();

            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            this.ctx.beginPath();
            this.ctx.arc(input.x, input.y, 20, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.restore();
        }

        // Debug
        if (debug) {
            this.drawDebug(game);
        }
    }

    drawBackground(p, biome, camY) {
        let r = 20, g = 40, b = 80;
        if (p < 0.2 || p > 0.8) { r = 10; g = 15; b = 40; }
        else if (p < 0.7 && p > 0.3) { r = 0; g = 160; b = 220; }

        let biomeC = this.hexToRgb(biome.color);
        r = (r + biomeC.r) / 2; g = (g + biomeC.g) / 2; b = (b + biomeC.b) / 2;

        this.ctx.fillStyle = `rgb(${Math.floor(r)},${Math.floor(g)},${Math.floor(b)})`;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawWaves(camY, gameTime) {
        this.ctx.save();
        this.ctx.translate(0, -camY % 100);
        this.ctx.strokeStyle = `rgba(255,255,255,0.1)`;
        this.ctx.lineWidth = 2;
        let waveOffset = gameTime * 0.5;
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
    }

    drawNightOverlay(p, camY, gameTime) {
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
                const starY = ((seed * 789.012 + camY * 0.1) % this.canvas.height);
                const brightness = 0.5 + (Math.sin(gameTime * 0.05 + i) * 0.5 + 0.5) * 0.5;

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
    }

    drawDebug(game) {
        const { player, entities, camY } = game;
        this.ctx.save();
        this.ctx.translate(0, -camY);

        // Magnet Range
        const baseMagnet = player.isYacht ? 60 : 30;
        const magnetR = baseMagnet * player.pickupRange;
        this.ctx.strokeStyle = 'rgba(250, 204, 21, 0.5)';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath(); this.ctx.arc(player.x, player.y, magnetR, 0, Math.PI * 2); this.ctx.stroke();
        this.ctx.setLineDash([]);

        // Player Hitbox
        this.ctx.strokeStyle = 'lime';
        this.ctx.lineWidth = 2;
        if (player.isYacht) {
            const boatLen = 80;
            const halfLen = boatLen / 2;
            const cos = Math.cos(player.angle);
            const sin = Math.sin(player.angle);
            const x1 = player.x + cos * halfLen;
            const y1 = player.y + sin * halfLen;
            const x2 = player.x - cos * halfLen;
            const y2 = player.y - sin * halfLen;
            this.ctx.beginPath(); this.ctx.moveTo(x1, y1); this.ctx.lineTo(x2, y2); this.ctx.stroke();

            // Draw capsule ends
            this.ctx.beginPath(); this.ctx.arc(x1, y1, 5, 0, Math.PI * 2); this.ctx.stroke();
            this.ctx.beginPath(); this.ctx.arc(x2, y2, 5, 0, Math.PI * 2); this.ctx.stroke();
        } else {
            // Donut Hitbox (Visual approx)
            this.ctx.beginPath(); this.ctx.arc(player.x, player.y, 20, 0, Math.PI * 2); this.ctx.stroke();
        }

        // Entity Hitboxes
        entities.mines.forEach(m => {
            // Draw actual collision circle (R + PlayerMargin)
            this.ctx.strokeStyle = 'red';
            this.ctx.beginPath(); this.ctx.arc(m.x, m.y, m.r + 15, 0, Math.PI * 2); this.ctx.stroke();

            // Draw visual radius
            this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
            this.ctx.beginPath(); this.ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2); this.ctx.stroke();
        });

        entities.sharks.forEach(s => {
            this.ctx.strokeStyle = 'red';
            this.ctx.beginPath(); this.ctx.arc(s.x, s.y, 35, 0, Math.PI * 2); this.ctx.stroke();
        });

        this.ctx.restore();
    }

    hexToRgb(hex) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : { r: 0, g: 0, b: 0 };
    }
}
