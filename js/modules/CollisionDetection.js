// Collision Detection Module

export class CollisionDetection {
    constructor() {
        this.boatLength = 80; // Yacht capsule length
    }

    /**
     * Check collision between player and entity using appropriate collision shape
     * @param {Object} entity - Entity with x, y coordinates
     * @param {number} hitDist - Hit distance (entity radius + margin)
     * @param {Object} player - Player object with x, y, angle, isYacht
     * @returns {boolean} - True if collision detected
     */
    checkPlayerCollision(entity, hitDist, player) {
        // If player is just a Donut (not a Yacht), use simple circle collision
        if (!player.isYacht) {
            const distSq = (entity.x - player.x) ** 2 + (entity.y - player.y) ** 2;
            return distSq < hitDist * hitDist;
        }

        // Yacht uses capsule collision (line segment with radius)
        const halfLen = this.boatLength / 2;

        // Boat spine start and end points (relative to center, rotated)
        const cos = Math.cos(player.angle);
        const sin = Math.sin(player.angle);

        // Tip of the boat
        const x1 = player.x + cos * halfLen;
        const y1 = player.y + sin * halfLen;

        // Rear of the boat
        const x2 = player.x - cos * halfLen;
        const y2 = player.y - sin * halfLen;

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

    /**
     * Check box collision (for icebergs)
     * @param {Object} player - Player with x, y
     * @param {Object} box - Box with x, y, w, h
     * @returns {boolean} - True if collision
     */
    checkBoxCollision(player, box) {
        return player.x > box.x - box.w / 2 &&
            player.x < box.x + box.w / 2 &&
            player.y > box.y - box.h / 2 &&
            player.y < box.y + box.h / 2;
    }

    /**
     * Check circle to point collision
     * @param {Object} point - Point with x, y
     * @param {Object} circle - Circle with x, y, r
     * @returns {boolean} - True if collision
     */
    checkCircleCollision(point, circle) {
        const dist = Math.hypot(circle.x - point.x, circle.y - point.y);
        return dist < circle.r;
    }
}
