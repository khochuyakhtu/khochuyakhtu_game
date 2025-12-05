// CloudService.js

const API_URL = 'https://khochuyakhtu-backend.ky1.workers.dev'; // Dev URL, will change in prod

class CloudService {
    constructor() {
        this.token = null;
        this.user = null;
    }

    async login() {
        if (this.token) return;

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

    async saveGame(state) {
        if (!this.token) await this.login();
        if (!this.token) return false;

        try {
            const res = await fetch(`${API_URL}/game/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // 'Authorization': `Bearer ${this.token}` // If using real validation
                },
                body: JSON.stringify({
                    userId: this.user.id, // For dev
                    state
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

    async getLeaderboard() {
        try {
            const res = await fetch(`${API_URL}/leaderboard`);
            if (!res.ok) return [];
            const data = await res.json();
            return data.leaderboard;
        } catch (e) {
            return [];
        }
    }
}

export const cloudService = new CloudService();
