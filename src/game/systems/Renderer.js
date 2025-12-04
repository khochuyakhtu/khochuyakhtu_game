// Renderer for Canvas-based gameplay - displays all entities and game elements
import { CONFIG } from '../config';

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

        // Viewport culling helper
        const viewportTop = player.y - window.innerHeight / 2 - 100;
        const viewportBottom = player.y + window.innerHeight / 2 + 100;
        const viewportLeft = -100;
        const viewportRight = window.innerWidth + 100;

        const isVisible = (entity) => {
            return entity.y > viewportTop && entity.y < viewportBottom &&
                entity.x > viewportLeft && entity.x < viewportRight;
        };

        // Particles
        entities.particles?.forEach(p => {
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = p.life / 40;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1;

        // Oil slicks
        entities.oilSlicks?.forEach(oil => {
            if (!isVisible(oil)) return;
            const gradient = this.ctx.createRadialGradient(oil.x, oil.y, 0, oil.x, oil.y, oil.r);
            gradient.addColorStop(0, 'rgba(20, 20, 20, 0.8)');
            gradient.addColorStop(0.7, 'rgba(30, 30, 30, 0.6)');
            gradient.addColorStop(1, 'rgba(40, 40, 40, 0.2)');
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(oil.x, oil.y, oil.r, 0, Math.PI * 2);
            this.ctx.fill();
        });

        // Icebergs
        entities.icebergs?.forEach(ice => {
            if (!isVisible(ice)) return;
            this.ctx.fillStyle = '#e2e8f0';
            this.ctx.fillRect(ice.x - ice.w / 2, ice.y - ice.h / 2, ice.w, ice.h);
            this.ctx.fillStyle = '#cbd5e1';
            this.ctx.fillRect(ice.x - ice.w / 2, ice.y + ice.h / 2 - 10, ice.w, 10);
        });

        // Whirlpools
        entities.whirlpools?.forEach(w => {
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

        // Tentacles (Kraken)
        entities.tentacles?.forEach(t => {
            if (!t.active || !isVisible(t)) return;
            this.ctx.fillStyle = '#7f1d1d';
            this.ctx.beginPath();
            this.ctx.moveTo(t.x, t.y);
            this.ctx.quadraticCurveTo(t.x + Math.sin(gameTime / 10) * 50, t.y - 100, t.x, t.y - 200);
            this.ctx.lineTo(t.x + 20, t.y - 200);
            this.ctx.quadraticCurveTo(t.x + Math.sin(gameTime / 10) * 50 + 20, t.y - 100, t.x + 20, t.y);
            this.ctx.fill();
        });

        // Mission target
        if (mission) {
            this.ctx.save();
            this.ctx.translate(mission.tx, mission.ty);
            this.ctx.fillStyle = '#facc15';
            this.ctx.beginPath();
            this.ctx.moveTo(0, -20);
            this.ctx.lineTo(10, 0);
            this.ctx.lineTo(0, 20);
            this.ctx.lineTo(-10, 0);
            this.ctx.fill();
            this.ctx.restore();

            // Arrow pointer
            const angle = Math.atan2(mission.ty - player.y, mission.tx - player.x);
            const dist = 150;
            this.ctx.save();
            this.ctx.translate(player.x + Math.cos(angle) * dist, player.y + Math.sin(angle) * dist);
            this.ctx.rotate(angle);
            this.ctx.fillStyle = '#facc15';
            this.ctx.beginPath();
            this.ctx.moveTo(10, 0);
            this.ctx.lineTo(-10, 10);
            this.ctx.lineTo(-10, -10);
            this.ctx.fill();
            this.ctx.restore();
        }

        // Sharks
        entities.sharks?.forEach(s => {
            if (!isVisible(s)) return;
            this.ctx.save();
            this.ctx.translate(s.x, s.y);
            this.ctx.rotate(s.angle);
            this.ctx.fillStyle = '#475569';
            this.ctx.beginPath();
            this.ctx.moveTo(20, 0);
            this.ctx.lineTo(-20, -10);
            this.ctx.lineTo(-20, 10);
            this.ctx.fill();
            this.ctx.restore();
        });

        // Pirates
        entities.pirates?.forEach(p => {
            if (!isVisible(p)) return;
            this.ctx.save();
            this.ctx.translate(p.x, p.y);
            this.ctx.rotate(p.angle);

            // Pirate boat body
            this.ctx.fillStyle = p.fleeing ? '#7c2d12' : '#991b1b';
            this.ctx.beginPath();
            this.ctx.moveTo(25, 0);
            this.ctx.lineTo(-15, -12);
            this.ctx.lineTo(-20, 0);
            this.ctx.lineTo(-15, 12);
            this.ctx.fill();
            this.ctx.restore();

            // Pirate flag
            this.ctx.font = '16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('☠️', p.x, p.y - 20);

            // Health bar
            this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
            this.ctx.fillRect(p.x - 20, p.y - 30, 40, 4);
            this.ctx.fillStyle = p.health > 15 ? '#10b981' : '#ef4444';
            this.ctx.fillRect(p.x - 20, p.y - 30, (p.health / 30) * 40, 4);
        });

        // Pirate Bullets
        entities.pirateBullets?.forEach(b => {
            if (!isVisible(b)) return;
            this.ctx.save();
            this.ctx.shadowBlur = 8;
            this.ctx.shadowColor = '#fbbf24';
            this.ctx.fillStyle = '#fbbf24';
            this.ctx.beginPath();
            this.ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });

        // Mines
        entities.mines?.forEach(m => {
            if (!isVisible(m)) return;
            const color = CONFIG.tierColors[m.lvl] || '#fff';

            this.ctx.save();
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = color;

            this.ctx.fillStyle = '#1e293b';
            this.ctx.beginPath();
            this.ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.fillStyle = color;
            this.ctx.beginPath();
            this.ctx.arc(m.x, m.y, m.r * 0.5, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 2;
            for (let i = 0; i < 8; i++) {
                const a = (Math.PI * 2 / 8) * i + (gameTime * 0.02);
                this.ctx.beginPath();
                this.ctx.moveTo(m.x, m.y);
                this.ctx.lineTo(m.x + Math.cos(a) * (m.r + 5), m.y + Math.sin(a) * (m.r + 5));
                this.ctx.stroke();
            }
            this.ctx.restore();

            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(m.lvl, m.x, m.y);
        });

        // Coins + Coffee + Repair Kits (with magnet)
        const baseMagnet = player.isYacht ? 60 : 30;
        const magnetR = baseMagnet * player.pickupRange;

        entities.coins?.forEach(c => {
            if (!isVisible(c)) return;

            const d = Math.hypot(c.x - player.x, c.y - player.y);
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

            this.ctx.fillStyle = '#facc15';
            this.ctx.beginPath();
            this.ctx.arc(c.x, c.y, 8, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.fillStyle = '#ca8a04';
            this.ctx.fillText('$', c.x, c.y + 1);
        });

        entities.coffee?.forEach(coffee => {
            if (!isVisible(coffee)) return;

            const d = Math.hypot(coffee.x - player.x, coffee.y - player.y);
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

        entities.repairKits?.forEach(kit => {
            if (!isVisible(kit)) return;

            const d = Math.hypot(kit.x - player.x, kit.y - player.y);
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
        this.ctx.save();
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

            if (player.skills.nitro.active) {
                this.ctx.fillStyle = '#facc15';
                this.ctx.beginPath();
                this.ctx.moveTo(-10, 40);
                this.ctx.lineTo(0, 40 + Math.random() * 30);
                this.ctx.lineTo(10, 40);
                this.ctx.fill();
            }
        } else {
            this.ctx.font = "40px Arial";
            this.ctx.textAlign = "center";
            this.ctx.textBaseline = "middle";
            this.ctx.fillText("🍩", 0, 0);
        }
        this.ctx.restore();

        this.ctx.restore();

        // Joystick visual
        if (input.active) {
            this.ctx.save();
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
    }

    drawBackground(p, biome, camY) {
        let r = 20, g = 40, b = 80;
        if (p < 0.2 || p > 0.8) { r = 10; g = 15; b = 40; }
        else if (p < 0.7 && p > 0.3) { r = 0; g = 160; b = 220; }

        const biomeC = this.hexToRgb(biome.color);
        r = (r + biomeC.r) / 2;
        g = (g + biomeC.g) / 2;
        b = (b + biomeC.b) / 2;

        this.ctx.fillStyle = `rgb(${Math.floor(r)},${Math.floor(g)},${Math.floor(b)})`;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawWaves(camY, gameTime) {
        this.ctx.save();
        this.ctx.translate(0, -camY % 100);
        this.ctx.strokeStyle = `rgba(255,255,255,0.1)`;
        this.ctx.lineWidth = 2;
        const waveOffset = gameTime * 0.5;

        for (let y = 0; y < this.canvas.height + 100; y += 50) {
            this.ctx.beginPath();
            for (let x = 0; x < this.canvas.width; x += 50) {
                const waveY = Math.sin((x + waveOffset) / 100) * 10;
                this.ctx.moveTo(x, y + waveY);
                this.ctx.lineTo(x + 30, y + waveY);
            }
            this.ctx.stroke();
        }
        this.ctx.restore();
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ?
            { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } :
            { r: 0, g: 0, b: 0 };
    }
}
