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
    dayDuration: 3600
};

export const Haptics = {
    impact: (style) => window.Telegram?.WebApp?.HapticFeedback?.impactOccurred(style),
    notify: (type) => window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred(type),
    selection: () => window.Telegram?.WebApp?.HapticFeedback?.selectionChanged()
};
