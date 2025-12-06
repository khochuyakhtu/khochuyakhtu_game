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
        mechanic: { icon: '👨‍🔧', name: 'Механік', desc: 'Стабілізує тепло: відновлює швидше, коли холодно' },
        navigator: { icon: '🧭', name: 'Штурман', desc: 'Збільшує огляд радара' },
        doctor: { icon: '👨‍⚕️', name: 'Лікар', desc: 'Зменшує втрати тепла та рятує від переохолодження' },
        merchant: { icon: '💼', name: 'Торговець', desc: 'Знижує ціни в магазині' },
        gunner: { icon: '🔫', name: 'Канонір', desc: 'Автоматично стріляє швидше й сильніше з рівнем' },
        quartermaster: { icon: '📦', name: 'Завгосп', desc: 'Додає +1 слот на складі за рівень' },
        supplier: { icon: '🛒', name: 'Постачальник', desc: 'Частіше купує випадкові деталі під час плавання' },
        engineer: { icon: '🔧', name: 'Інженер', desc: 'Об\'єднує деталі автоматично та все швидше' }
    }
};

export const getCrewUpgradeCost = (targetLevel = 1) => {
    const level = Math.max(1, targetLevel);
    return Math.floor(500 * Math.pow(1.25, level - 1));
};

export const getSupplierIntervalFrames = (level = 1) => {
    const safeLevel = Math.max(1, level);
    return Math.max(120, Math.round(3600 * Math.pow(0.92, safeLevel - 1)));
};

export const getEngineerIntervalFrames = (level = 1) => {
    const safeLevel = Math.max(1, level);
    return Math.max(60, Math.round(1500 * Math.pow(0.9, safeLevel - 1)));
};

export const getGunnerStats = (level = 1) => {
    const safeLevel = Math.max(1, level);
    return {
        interval: Math.max(45, 150 - (safeLevel - 1) * 4),
        range: 300 + safeLevel * 5,
        damage: 8 + safeLevel * 2,
        mineTier: safeLevel + 1
    };
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
