export class WeatherManager {
    constructor() {
        this.fogActive = false;
        this.fogIntensity = 0; // 0-1, animated
        this.nextFogTime = this.getRandomFogInterval();
        this.fogDuration = 0;
        this.fogEndTime = 0;
        this.transitionSpeed = 0.02; // How fast fog fades in/out
    }

    // Random interval between fog events (30-90 seconds in game time)
    getRandomFogInterval() {
        return 60 * (30 + Math.random() * 60); // 30-90 seconds at 60fps
    }

    // Random fog duration (15-30 seconds)
    getRandomFogDuration() {
        return 60 * (15 + Math.random() * 15); // 15-30 seconds at 60fps
    }

    update(gameTime) {
        // Check if it's time to start fog
        if (!this.fogActive && gameTime >= this.nextFogTime) {
            this.fogActive = true;
            this.fogDuration = this.getRandomFogDuration();
            this.fogEndTime = gameTime + this.fogDuration;
            console.log('🌫️ Fog starting!');
        }

        // Check if it's time to end fog
        if (this.fogActive && gameTime >= this.fogEndTime) {
            this.fogActive = false;
            this.nextFogTime = gameTime + this.getRandomFogInterval();
            console.log('☀️ Fog clearing...');
        }

        // Animate fog intensity
        if (this.fogActive) {
            // Fade in
            if (this.fogIntensity < 1) {
                this.fogIntensity = Math.min(1, this.fogIntensity + this.transitionSpeed);
            }
        } else {
            // Fade out
            if (this.fogIntensity > 0) {
                this.fogIntensity = Math.max(0, this.fogIntensity - this.transitionSpeed);
            }
        }
    }

    // Get visibility radius based on equipment and crew
    getVisibilityRadius(player, equip) {
        let baseRadius = 150; // Base visibility during fog

        if (equip.radar) {
            baseRadius += 150; // Radar adds significant visibility
        }

        if (player.crew && player.crew.navigator && player.crew.navigator.hired) {
            baseRadius += 100; // Navigator adds extra visibility
        }

        return baseRadius;
    }

    // Check if fog is currently visible (intensity > 0)
    isFogVisible() {
        return this.fogIntensity > 0;
    }

    // Serialize for save/load
    toJSON() {
        return {
            fogActive: this.fogActive,
            fogIntensity: this.fogIntensity,
            nextFogTime: this.nextFogTime,
            fogDuration: this.fogDuration,
            fogEndTime: this.fogEndTime
        };
    }

    // Restore from save
    fromJSON(data) {
        if (!data) return;
        this.fogActive = data.fogActive || false;
        this.fogIntensity = data.fogIntensity || 0;
        this.nextFogTime = data.nextFogTime || this.getRandomFogInterval();
        this.fogDuration = data.fogDuration || 0;
        this.fogEndTime = data.fogEndTime || 0;
    }
}
