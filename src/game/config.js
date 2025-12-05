// Game Configuration and Constants

export const CONFIG = {
    biomes: [
        { name: 'Тропіки', startY: 0, danger: 1, temp: 25, color: '#0ea5e9' },
        { name: 'Атлантика', startY: -50000, danger: 3, temp: 10, color: '#1e40af' },
        { name: 'Північне море', startY: -150000, danger: 5, temp: -5, color: '#475569' },
        { name: 'Арктика', startY: -300000, danger: 8, temp: -20, color: '#94a3b8' }
    ],
    partTypes: {
        'hull': { icon: '🛡️', name: 'Броня', bonus: 'Armor' },
        'engine': { icon: '⚙️', name: 'Мотор', bonus: 'Speed' },
        'cabin': { icon: '🏠', name: 'Рубка', bonus: 'Heat' },
        'magnet': { icon: '🧲', name: 'Магніт', bonus: 'Range' },
        'radar': { icon: '📡', name: 'Радар', bonus: 'Vision' }
    },
    tierColors: [
        '#9ca3af', // 0 - Gray
        '#4ade80', // 1 - Green
        '#60a5fa', // 2 - Blue
        '#c084fc', // 3 - Purple
        '#facc15', // 4 - Yellow
        '#f87171', // 5 - Red
        '#22d3ee', // 6 - Cyan
        '#ffffff', // 7 - White
        '#fbbf24', // 8 - Amber
        '#a78bfa', // 9 - Violet
        '#fb923c', // 10 - Orange
        '#34d399', // 11 - Emerald
        '#f472b6', // 12 - Pink
        '#818cf8', // 13 - Indigo
        '#fde047', // 14 - Bright Yellow
        '#e879f9', // 15 - Fuchsia
        '#2dd4bf', // 16 - Teal
        '#fb7185', // 17 - Rose
        '#a3e635', // 18 - Lime
        '#c026d3', // 19 - Magenta
        '#fcd34d'  // 20 - Gold
    ],
    baseCost: 10,
    moneyValue: 5,
    dayDuration: 3600,
    crewTypes: {
        mechanic: { icon: '👨‍🔧', name: 'Механік', desc: 'Повільно відновлює температуру' },
        navigator: { icon: '🧭', name: 'Штурман', desc: 'Збільшує огляд радара' },
        doctor: { icon: '👨‍⚕️', name: 'Лікар', desc: 'Резистентність до холоду та шанс уникнути смерті' },
        merchant: { icon: '💼', name: 'Торговець', desc: 'Знижує ціни в магазині' },
        gunner: { icon: '🔫', name: 'Канонір', desc: 'Автоматично стріляє у ворогів' },
        quartermaster: { icon: '📦', name: 'Завгосп', desc: 'Додає +1 слот на складі за рівень' },
        supplier: { icon: '🛒', name: 'Постачальник', desc: 'Купує випадкові деталі під час плавання' },
        engineer: { icon: '🔧', name: 'Інженер', desc: 'Автоматично об\'єднує деталі' }
    },
    crewUpgradeCosts: [
        500, 750, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 5000,      // Levels 1-10
        6000, 7500, 9000, 11000, 13000, 15000, 18000, 21000, 25000, 30000 // Levels 11-20
    ]
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
