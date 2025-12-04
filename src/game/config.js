// Game Configuration and Constants

export const CONFIG = {
    biomes: [
        { name: "Тропіки", color: "#0891b2", danger: 1, temp: 25, startY: 0, weather: 'sun' },
        { name: "Атлантика", color: "#1e40af", danger: 3, temp: 10, startY: -5000, weather: 'rain' },
        { name: "Північне море", color: "#1e3a8a", danger: 5, temp: 0, startY: -15000, weather: 'storm' },
        { name: "Арктика", color: "#0f172a", danger: 8, temp: -20, startY: -30000, weather: 'snow' }
    ],
    partTypes: {
        'hull': { icon: '🛡️', name: 'Броня', bonus: 'Armor' },
        'engine': { icon: '⚙️', name: 'Мотор', bonus: 'Speed' },
        'cabin': { icon: '🏠', name: 'Рубка', bonus: 'Heat' },
        'magnet': { icon: '🧲', name: 'Магніт', bonus: 'Range' },
        'radar': { icon: '📡', name: 'Радар', bonus: 'Vision' }
    },
    tierColors: ['#9ca3af', '#4ade80', '#60a5fa', '#c084fc', '#facc15', '#f87171', '#22d3ee', '#ffffff'],
    baseCost: 10,
    moneyValue: 5,
    dayDuration: 3600,
    crewTypes: {
        mechanic: { icon: '👨‍🔧', name: 'Механік', desc: 'Повільно відновлює температуру' },
        navigator: { icon: '🧭', name: 'Штурман', desc: 'Збільшує огляд радара на 50%' },
        doctor: { icon: '👨‍⚕️', name: 'Лікар', desc: 'Резистентність до холоду та шанс уникнути смерті' },
        merchant: { icon: '💼', name: 'Торговець', desc: 'Знижує ціни в магазині' },
        gunner: { icon: '🔫', name: 'Канонір', desc: 'Автоматично стріляє у ворогів' }
    },
    crewUpgradeCosts: [500, 750, 1000, 1500, 2500] // Level 1-5 costs
};

export const Haptics = {
    impact: (style) => {
        if (window.Telegram?.WebApp?.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.impactOccurred(style);
        }
    },
    notify: (type) => {
        if (window.Telegram?.WebApp?.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.notificationOccurred(type);
        }
    },
    selection: () => {
        if (window.Telegram?.WebApp?.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.selectionChanged();
        }
    }
};
