// Game Configuration and Constants
// Island Haven: Rescue & Build

// ============================================================
// RESOURCE SYSTEM
// ============================================================

export let RESOURCES = {};

export let INITIAL_RESOURCES = {
    money: 0,
    wood: 0,
    stone: 0,
    metal: 0,
    plastic: 0,
    food: 0,
    water: 0,
    energy: 0,
    science: 0,
    coal: 0
};

export let INITIAL_RESOURCE_LIMITS = {
    wood: 100,
    stone: 100,
    metal: 50,
    plastic: 50,
    food: 50,
    water: 50,
    energy: 0,  // No limit initially
    coal: 20
};

// ============================================================
// CONFIGURATION CONTAINER
// ============================================================

export let CONFIG = {
    biomes: [],
    yachtModules: {},
    yachtVisualTiers: [],
    tierColors: [], // If DB doesn't have it, we might need to keep it or fetch it. Assuming hardcoded for now or fetched as settings. 
    // Keeping tierColors hardcoded as it's purely UI/visual and long list, unless user wants it in DB too.
    // User asked to remove configs. I'll keep UI constants like this if not in DB.

    baseCost: 10,
    moneyValue: 5,
    dayDuration: 3600,

    crewTypes: {},
    professions: {},
    rescueTypes: [],
    floatingResources: [],
    weatherTypes: {},
    buildings: {},
    missions: {},

    // UI Categories (Static for now, or could be fetched)
    buildingCategories: {
        housing: { icon: '🏠', name: 'Житло' },
        production: { icon: '⚙️', name: 'Виробництво' },
        service: { icon: '💼', name: 'Сервіс' },
        storage: { icon: '📦', name: 'Сховища' },
        energy: { icon: '⚡', name: 'Енергія' },
        special: { icon: '🌟', name: 'Особливі' }
    },

    // Legacy compatibility
    partTypes: {
        'hull': { icon: '🛡️', name: 'Броня', bonus: 'Armor' },
        'engine': { icon: '⚙️', name: 'Мотор', bonus: 'Speed' },
        'cabin': { icon: '🏠', name: 'Рубка', bonus: 'Heat' },
        'magnet': { icon: '🧲', name: 'Магніт', bonus: 'Range' },
        'radar': { icon: '📡', name: 'Радар', bonus: 'Vision' }
    }
};

// Restore tierColors as it is UI constant not in DB yet (unless added to settings)
CONFIG.tierColors = [
    '#9ca3af', '#4ade80', '#60a5fa', '#c084fc', '#facc15',
    '#f87171', '#22d3ee', '#ffffff', '#fbbf24', '#a78bfa',
    '#fb923c', '#34d399', '#f472b6', '#818cf8', '#fde047',
    '#e879f9', '#2dd4bf', '#fb7185', '#a3e635', '#c026d3',
    '#fcd34d', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444',
    '#3b82f6', '#ec4899', '#14b8a6', '#f97316', '#6366f1',
    '#84cc16', '#d946ef', '#22c55e', '#eab308', '#a855f7',
    '#06b6d4', '#f43f5e', '#0ea5e9', '#8b5cf6', '#10b981',
    '#f59e0b', '#6366f1', '#ec4899', '#14b8a6', '#f97316',
    '#84cc16', '#d946ef', '#22c55e', '#eab308', '#a855f7',
    '#ffd700'
];

// ============================================================
// HELPER FUNCTIONS
// ============================================================

export const getCrewUpgradeCost = (targetLevel = 1) => {
    const level = Math.max(1, targetLevel);
    // Use CONFIG value if available
    const base = CONFIG.baseCrewUpgradeCost || 500;
    const growth = CONFIG.crewCostGrowthFactor || 1.25;
    return Math.floor(base * Math.pow(growth, level - 1));
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

export const getYachtHP = (level = 1) => {
    const safeLevel = Math.max(1, Math.min(50, level));
    const hull = CONFIG?.yachtModules?.hull;
    const base = hull?.base_stat || 100;
    const mult = hull?.stat_multiplier || 1.1;
    return Math.floor(base * Math.pow(mult, safeLevel));
};

export const getYachtSpeed = (level = 1) => {
    const safeLevel = Math.max(1, Math.min(50, level));
    const engine = CONFIG?.yachtModules?.engine;
    const step = (engine?.stat_multiplier || 1.05) - 1;
    const base = engine?.base_stat || 1;
    return base + (safeLevel - 1) * step;
};

export const getYachtHeatResist = (level = 1) => {
    const safeLevel = Math.max(1, Math.min(50, level));
    return safeLevel - 1;
};

export const getYachtMagnetRange = (level = 1) => {
    const safeLevel = Math.max(1, Math.min(50, level));
    const magnet = CONFIG?.yachtModules?.magnet;
    const base = magnet?.base_stat || 2;
    return base + (safeLevel - 1) * 0.98;
};

export const getYachtRadarRange = (level = 1) => {
    const safeLevel = Math.max(1, Math.min(50, level));
    return 1 + (safeLevel - 1) * 0.082;
};

export const getYachtUpgradeCost = (baseCost, level, multiplier = 1.25) => {
    const safeLevel = Math.max(1, level);
    return Math.floor(baseCost * Math.pow(multiplier, safeLevel - 1));
};

export const getYachtVisualTier = (avgLevel) => {
    const tiers = CONFIG.yachtVisualTiers || [];
    // Sort descending by minLevel to find best match
    // Or iterate from end
    for (let i = tiers.length - 1; i >= 0; i--) {
        if (avgLevel >= tiers[i].minLevel) {
            return { ...tiers[i], tier: i + 1 };
        }
    }
    return { name: 'Шлюпка', emoji: '🚣', tier: 1 };
};

export const getBuildingProduction = (building, config, efficiency, weather) => {
    if (!config || !config.baseOutput) return 0;
    const levelBonus = 1 + (building.level - 1) * 0.15;
    let weatherBonus = 1;
    if (weather?.effects?.waterBonus && config.output === 'water') {
        weatherBonus += weather.effects.waterBonus / 100;
    }
    return Math.floor(config.baseOutput * efficiency * levelBonus * weatherBonus);
};

// Random Events
export const EVENT_TYPES = {
    harvest_boon: {
        id: 'harvest_boon', name: 'Щедрий Врожай', description: 'Ваші фермери зібрали надзвичайно великий врожай!',
        icon: '🌾', type: 'good', requires: 'farm',
        effect: (state) => { state.resources.food += 50; }
    },
    fish_tide: {
        id: 'fish_tide', name: 'Рибний Косяк', description: 'Величезна зграя риби біля берега!',
        icon: '🐟', type: 'good', requires: 'fishing_spot',
        effect: (state) => { state.resources.food += 40; }
    },
    storm_damage: {
        id: 'storm_damage', name: 'Наслідки Шторму', description: 'Сильний вітер пошкодив склади. Втрачено ресурси.',
        icon: '⛈️', type: 'bad', requires: 'weather_storm',
        effect: (state) => {
            state.resources.wood = Math.max(0, state.resources.wood - 20);
            state.resources.stone = Math.max(0, state.resources.stone - 10);
        }
    },
    festival: {
        id: 'festival', name: 'Свято Острова', description: 'Жителі влаштували гуляння в таверні!',
        icon: '🍺', type: 'good', requires: 'tavern',
        effect: (state) => {
            state.island.averageMood = Math.min(100, state.island.averageMood + 15);
            if (state.island.residents) state.island.residents.forEach(r => r.mood = Math.min(100, r.mood + 15));
        }
    },
    found_supplies: {
        id: 'found_supplies', name: 'Знайдений Скарб', description: 'На берег викинуло ящик з припасами.',
        icon: '📦', type: 'good', requires: null,
        effect: (state) => {
            state.resources.metal += 15;
            state.resources.plastic += 15;
        }
    }
};

// ============================================================
// CONFIG INITIALIZATION
// ============================================================

export const initGameConfig = async () => {
    try {
        console.log('Initializing Game Config...');
        const { cloudService } = await import('../services/CloudService');
        const data = await cloudService.loadConfig();

        if (!data) throw new Error('Failed to load config from CloudService');

        if (data.resources) RESOURCES = data.resources;

        if (data.biomes) CONFIG.biomes = data.biomes;
        if (data.missions) CONFIG.missions = data.missions;
        if (data.yachtModules) CONFIG.yachtModules = data.yachtModules;
        if (data.buildings) CONFIG.buildings = data.buildings;

        // Crew and Professions
        if (data.crewTypes) {
            CONFIG.crewTypes = {};
            CONFIG.professions = {};

            Object.values(data.crewTypes).forEach(item => {
                if (item.type === 'yacht') {
                    CONFIG.crewTypes[item.id] = item;
                } else if (item.type === 'island') {
                    CONFIG.professions[item.id] = item;
                } else {
                    // Hybrid/Fallback
                    if (item.id === 'doctor' || item.id === 'engineer') {
                        CONFIG.crewTypes[item.id] = item;
                        CONFIG.professions[item.id] = item;
                    }
                }
            });
            if (CONFIG.crewTypes['doctor'] && !CONFIG.professions['doctor']) CONFIG.professions['doctor'] = CONFIG.crewTypes['doctor'];
            if (CONFIG.crewTypes['engineer'] && !CONFIG.professions['engineer']) CONFIG.professions['engineer'] = CONFIG.crewTypes['engineer'];
        }

        // Parse JSON settings
        if (data.weatherTypes) {
            try { CONFIG.weatherTypes = typeof data.weatherTypes === 'string' ? JSON.parse(data.weatherTypes) : data.weatherTypes; } catch (e) { }
        }
        if (data.rescueTypes) {
            try { CONFIG.rescueTypes = typeof data.rescueTypes === 'string' ? JSON.parse(data.rescueTypes) : data.rescueTypes; } catch (e) { }
        }
        if (data.floatingResources) {
            try { CONFIG.floatingResources = typeof data.floatingResources === 'string' ? JSON.parse(data.floatingResources) : data.floatingResources; } catch (e) { }
        }
        if (data.yachtVisualTiers) {
            try { CONFIG.yachtVisualTiers = typeof data.yachtVisualTiers === 'string' ? JSON.parse(data.yachtVisualTiers) : data.yachtVisualTiers; } catch (e) { }
        }

        // Merge numeric settings
        if (data.baseCost) CONFIG.baseCost = data.baseCost;
        if (data.moneyValue) CONFIG.moneyValue = data.moneyValue;
        if (data.dayDuration) CONFIG.dayDuration = data.dayDuration;
        if (data.baseCrewUpgradeCost) CONFIG.baseCrewUpgradeCost = data.baseCrewUpgradeCost;
        if (data.crewCostGrowthFactor) CONFIG.crewCostGrowthFactor = data.crewCostGrowthFactor;

        console.log('Game config loaded from DB successfully!');
        return true;
    } catch (e) {
        console.error('Failed to load game config:', e);
        // Fallback or critical error? 
        // For now, we return false and let App.jsx handle (likely hang on loading or error state)
        return false;
    }
};

// ============================================================
// HAPTICS & NAME GENERATION
// ============================================================

export const Haptics = {
    impact: (style) => { window.Telegram?.WebApp?.HapticFeedback?.impactOccurred(style); },
    notify: (type) => { window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred(type); },
    selection: () => { window.Telegram?.WebApp?.HapticFeedback?.selectionChanged(); }
};

const FIRST_NAMES = ['Олександр', 'Марія', 'Іван', 'Анна', 'Петро', 'Олена', 'Михайло', 'Наталія', 'Андрій', 'Ірина', 'Сергій', 'Тетяна', 'Юрій', 'Оксана', 'Віктор', 'Людмила', 'Дмитро', 'Катерина', 'Василь', 'Світлана', 'Олег', 'Галина', 'Максим', 'Вікторія', 'Роман', 'Юлія', 'Артем', 'Дарина', 'Богдан', 'Софія', 'Владислав', 'Анастасія'];
const LAST_NAMES = ['Шевченко', 'Бондаренко', 'Коваленко', 'Ткаченко', 'Мельник', 'Кравченко', 'Олійник', 'Шевчук', 'Поліщук', 'Бойко', 'Ткачук', 'Коваль', 'Бондар', 'Павленко', 'Руденко', 'Мороз', 'Литвиненко', 'Назаренко', 'Савченко', 'Петренко', 'Кузьменко', 'Іванов', 'Лисенко', 'Мазур', 'Сидоренко', 'Гончаренко'];

export const generateName = () => {
    return `${FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]} ${LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]}`;
};

export const getBuildingUpgradeCost = (baseCost, level, multiplier = 1.2) => {
    const result = {};
    for (const [resource, amount] of Object.entries(baseCost)) {
        result[resource] = Math.floor(amount * Math.pow(multiplier, level - 1));
    }
    return result;
};

export const getBuildingOutput = (baseOutput, level, k = 0.1) => {
    return baseOutput * (1 + level * k);
};

export const canAfford = (resources, cost) => {
    for (const [resource, amount] of Object.entries(cost)) {
        if ((resources[resource] || 0) < amount) return false;
    }
    return true;
};

export const subtractCost = (resources, cost) => {
    const result = { ...resources };
    for (const [resource, amount] of Object.entries(cost)) {
        result[resource] = (result[resource] || 0) - amount;
    }
    return result;
};

export const getFoodConsumption = (resident) => {
    const base = 1;
    const moodModifier = resident.mood < 30 ? 1.5 : resident.mood < 60 ? 1.2 : 1.0;
    return base * moodModifier;
};

export const getWaterConsumption = (resident) => 1;

export const getWorkerProductivity = (resident) => {
    const skillMultiplier = { 'novice': 1.0, 'experienced': 1.5, 'master': 2.0 }[resident.skillLevel] || 1.0;
    const moodMultiplier = resident.mood < 30 ? 0.5 : resident.mood < 60 ? 0.75 : 1.0;
    return skillMultiplier * moodMultiplier * (1 + (resident.level - 1) * 0.1);
};

export const getBuildingCapacity = (baseCapacity, level, growthFactor = 1.1) => {
    return Math.floor(baseCapacity * Math.pow(growthFactor, level - 1));
};
