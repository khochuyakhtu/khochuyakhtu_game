// CloudService.js

const API_URL = 'https://khochuyakhtu-backend.ky1.workers.dev'; // Dev URL, will change in prod

class CloudService {
    constructor() {
        this.token = null;
        this.user = null;
    }

    async login() {
        if (this.token) return this.user;

        let initData = '';
        let user = null;

        if (window.Telegram?.WebApp) {
            initData = window.Telegram.WebApp.initData;
            user = window.Telegram.WebApp.initDataUnsafe?.user;
        }

        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ initData, user })
            });

            if (!res.ok) throw new Error('Login failed');

            const data = await res.json();
            this.token = data.token;
            this.user = data.user;
            console.log('Logged in as:', this.user);
            return this.user;
        } catch (e) {
            console.error('Cloud Login Error:', e);
            return null;
        }
    }

    async loadConfig() {
        try {
            const res = await fetch(`${API_URL}/config/all`);
            if (!res.ok) throw new Error('Failed to fetch config');
            return await res.json();
        } catch (e) {
            console.error('Config Fetch Error:', e);
            return null;
        }
    }

    async saveGame(state) {
        if (!this.token) await this.login();
        if (!this.token) return false;

        try {
            // Get nickname from local storage (best effort since we can't easily access store hook here without refactor)
            // Actually, we can access the persisted state from localStorage
            let nickname = 'Captain';
            try {
                const settingsStr = localStorage.getItem('yacht-settings-storage');
                if (settingsStr) {
                    const settings = JSON.parse(settingsStr);
                    if (settings.state?.nickname) {
                        nickname = settings.state.nickname;
                    }
                }
            } catch (e) {
                console.warn('Failed to read nickname:', e);
            }

            const res = await fetch(`${API_URL}/game/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: this.user.id,
                    state,
                    nickname: nickname // Add nickname
                })
            });
            return res.ok;
        } catch (e) {
            console.error('Save Error:', e);
            return false;
        }
    }

    async loadGame() {
        if (!this.token) await this.login();
        if (!this.token) return null;

        try {
            const res = await fetch(`${API_URL}/game/load/${this.user.id}`);
            if (!res.ok) return null;

            const data = await res.json();
            return data.state;
        } catch (e) {
            console.error('Load Error:', e);
            return null;
        }
    }

    async saveNickname(nickname) {
        if (!this.token) await this.login();
        if (!this.token) return false;

        try {
            const res = await fetch(`${API_URL}/game/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: this.user.id,
                    nickname: nickname
                    // No state passed, safely updates only nickname
                })
            });
            return res.ok;
        } catch (e) {
            console.error('Save Nickname Error:', e);
            return false;
        }
    }

    async getLeaderboard(type = 'distance') {
        try {
            const res = await fetch(`${API_URL}/leaderboard?type=${type}`);
            if (!res.ok) return [];
            const data = await res.json();
            return data.leaderboard || [];
        } catch (e) {
            console.error('Leaderboard fetch error:', e);
            return [];
        }
    }

    // ================================================================
    // ISLAND STATE SYNC
    // ================================================================

    /**
     * Save island state to cloud
     * @param {Object} islandState - Current island state from useGameStore
     */
    async saveIsland(islandState) {
        if (!this.token) await this.login();
        if (!this.token) return false;

        try {
            const { resources, island, resourceLimits } = islandState;

            const payload = {
                userId: this.user.id,
                resources: resources,
                buildings: island.buildings,
                residents: island.residents,
                islandMeta: {
                    populationCap: island.populationCap,
                    averageMood: island.averageMood,
                    averageHealth: island.averageHealth,
                    weather: island.weather
                }
            };

            const res = await fetch(`${API_URL}/island/save`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const error = await res.json();
                console.error('Island save error:', error);
                return false;
            }

            console.log('Island saved successfully');
            return true;
        } catch (e) {
            console.error('Island Save Error:', e);
            return false;
        }
    }

    /**
     * Load island state from cloud
     * @returns {Object|null} Island state or null if not found
     */
    async loadIsland() {
        if (!this.token) await this.login();
        if (!this.token) return null;

        try {
            const res = await fetch(`${API_URL}/island/load/${this.user.id}`);
            if (!res.ok) return null;

            const data = await res.json();

            if (!data.success || !data.island) {
                return null;
            }

            // Transform to match useGameStore structure
            return {
                resources: data.island.resources || {},
                island: {
                    buildings: data.island.buildings || [],
                    residents: data.island.residents || [],
                    animals: [],
                    populationCap: data.island.populationCap || 5,
                    averageMood: data.island.averageMood || 100,
                    averageHealth: data.island.averageHealth || 100,
                    weather: data.island.weather || {
                        type: 'sunny',
                        duration: 3600,
                        effects: { waterBonus: 0, moodBonus: 5, canSail: true }
                    }
                }
            };
        } catch (e) {
            console.error('Island Load Error:', e);
            return null;
        }
    }

    /**
     * Check if user has cloud island data
     */
    async hasCloudIsland() {
        const island = await this.loadIsland();
        return island !== null && (island.island.buildings.length > 0 || island.island.residents.length > 0);
    }
}

export const cloudService = new CloudService();

