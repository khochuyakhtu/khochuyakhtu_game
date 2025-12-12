import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { nanoid } from 'nanoid';
import { cloudService } from '../services/CloudService';
import useNotificationStore from './useNotificationStore';
import {
    INITIAL_RESOURCES,
    INITIAL_RESOURCE_LIMITS,
    getCrewUpgradeCost,
    getEngineerIntervalFrames,
    getSupplierIntervalFrames,
    getYachtHP,
    getYachtSpeed,
    getYachtHeatResist,
    getYachtMagnetRange,
    getYachtRadarRange,
    generateName,
    EVENT_TYPES,
    CONFIG,
    calculateCalendar,
    FRAMES_PER_DAY,
    FRAMES_PER_WEEK,
    FRAMES_PER_SECOND,
    getBuildingLimit
} from '../game/config';

// ============================================================
// INITIAL STATE FACTORIES
// ============================================================

const createInitialYachtState = () => ({
    modules: {
        hull: { id: 'hull', level: 0, tier: 0 },
        engine: { id: 'engine', level: 0, tier: 0 },
        cabin: { id: 'cabin', level: 0, tier: 0 },
        magnet: { id: 'magnet', level: 0, tier: 0 },
        radar: { id: 'radar', level: 0, tier: 0 }
    },
    crew: {
        mechanic: { id: 'mechanic', hired: false, level: 0 },
        navigator: { id: 'navigator', hired: false, level: 0 },
        doctor: { id: 'doctor', hired: false, level: 0 },
        merchant: { id: 'merchant', hired: false, level: 0 },
        gunner: { id: 'gunner', hired: false, level: 0 },
        quartermaster: { id: 'quartermaster', hired: false, level: 0 },
        supplier: { id: 'supplier', hired: false, level: 0 },
        engineer: { id: 'engineer', hired: false, level: 0 }
    },
    hp: 100,
    maxHp: 100,
    fuel: 100,
    maxFuel: 100,
    temperature: 36.6
});

const createInitialIslandState = () => ({
    buildings: [],
    residents: [],
    animals: [],
    populationCap: 5,
    averageMood: 100,
    averageHealth: 100,
    weather: {
        type: 'sunny',
        duration: 3600,
        effects: { waterBonus: 0, moodBonus: 5, canSail: true }
    },
    eventLog: []
});

const createInitialExpeditionState = () => ({
    currentMission: null,
    distanceTraveled: 0,
    currentBiome: null,
    gameTime: 0,
    dayPhase: 0,
    crewTimers: { supplier: 0, engineer: 0 },
    missionProgress: {} // mapId -> highest completed missionNumber
});

const createInitialPlayerState = () => ({
    // Position in expedition mode
    x: 0,
    y: 0,
    angle: -Math.PI / 2,
    vel: { x: 0, y: 0 },

    // Computed stats (from yacht + crew)
    speedMult: 1,
    armorLvl: 0,
    heatResist: 0,
    pickupRange: 1,
    radarRange: 0,

    // Status
    isYacht: false,
    isDead: false,
    invulnerable: 0,
    bodyTemp: 36.6,

    // Active skills
    skills: {
        nitro: { active: false, cd: 0, max: 600, timer: 0 },
        flare: { cd: 0, max: 1800 },
        repair: { cd: 0, max: 3600 }
    }
});

// ============================================================
// LEGACY COMPATIBILITY - Inventory for merge mechanic
// ============================================================
const createInitialInventory = () => Array(10).fill(null);

const createInitialEquip = () => ({
    hull: null,
    engine: null,
    cabin: null,
    magnet: null,
    radar: null
});

const createInitialGameState = () => ({
    paused: true,
    gameTime: 0,
    playTimeSeconds: 0,
    dayPhase: 0,
    distanceTraveled: 0,
    currentBiome: null,
    mission: null,
    crewTimers: { supplier: 0, engineer: 0 },
    lastSyncTime: null,
    expeditionBaselineResources: null,
    expeditionBaselineIsland: null,
    calendar: calculateCalendar(0)
});

// Utility: recalc population cap and storage limits based on current buildings
const recalcHousingAndStorage = (state, getBuildingConfig) => {
    const buildings = state.island.buildings || [];
    let housingCap = 5;
    const storageBonuses = { all: 0 };

    buildings.forEach(building => {
        const config = getBuildingConfig ? getBuildingConfig(building.configId) : CONFIG.buildings?.[building.configId];
        if (!config) return;

        const level = Math.max(1, building.level || 1);
        const populationBonus =
            config.populationBonus ??
            config.population_bonus ??
            config.effect?.populationBonus ??
            config.effect?.population_bonus ??
            0;
        const effectType = config.effect?.type;
        const populationFromEffectType = (['population', 'housing', 'residents', 'capacity'].includes(effectType))
            ? (config.effect?.value || config.effect?.capacity || config.effect?.max || 0)
            : 0;
        const housingCategoryFallback = config.category === 'housing'
            ? (config.effect?.capacity || config.effect?.value || config.slots || config.effect?.slots || config.effect?.bonus || 0)
            : 0;
        const totalPopulationBonus = populationBonus || populationFromEffectType || housingCategoryFallback;

        if (totalPopulationBonus) {
            housingCap += totalPopulationBonus * level;
        }

        if (config.effect?.type === 'storage') {
            const amount = (config.effect.bonus || 0) * level;
            const resources = config.effect.resources || [];
            if (resources.includes('all')) {
                storageBonuses.all += amount;
            } else {
                resources.forEach(res => {
                    storageBonuses[res] = (storageBonuses[res] || 0) + amount;
                });
            }
        }
    });

    state.island.populationCap = housingCap;

    Object.keys(state.resourceLimits).forEach(res => {
        const base = INITIAL_RESOURCE_LIMITS[res] || 50;
        const bonus = (storageBonuses.all || 0) + (storageBonuses[res] || 0);
        state.resourceLimits[res] = base + bonus;
    });
};

const RESIDENT_FOOD_PER_TICK = 2;   // food units per resident per cycle
const RESIDENT_WATER_PER_TICK = 2;  // water units per resident per cycle

// ============================================================
// MAIN STORE
// ============================================================

const useGameStore = create(
    persist(
        immer((set, get) => ({
            // ============================================================
            // STATE
            // ============================================================

            // Game mode
            mode: 'island', // 'expedition' | 'island'

            // Resources
            resources: { ...INITIAL_RESOURCES },
            resourceLimits: { ...INITIAL_RESOURCE_LIMITS },

            // Yacht (for expedition)
            yacht: createInitialYachtState(),

            // Island (for management)
            island: createInitialIslandState(),

            // Expedition state
            expedition: createInitialExpeditionState(),
            lastMissionResult: null,

            // Player state (position, computed stats)
            player: createInitialPlayerState(),

            // Legacy: Inventory for merge mechanic
            inventory: createInitialInventory(),
            equip: createInitialEquip(),

            // Game state (legacy compatibility)
            gameState: createInitialGameState(),

            // ============================================================
            // MODE SWITCHING
            // ============================================================

            setMode: (mode) => set((state) => {
                // Snapshot resources before going to expedition
                if (mode === 'expedition' && state.mode === 'island') {
                    state.gameState.expeditionBaselineResources = { ...state.resources };
                    state.gameState.expeditionBaselineIsland = JSON.parse(JSON.stringify(state.island));
                }
                // Clear baseline when back to island
                if (mode === 'island') {
                    state.gameState.expeditionBaselineResources = null;
                    state.gameState.expeditionBaselineIsland = null;
                }
                state.mode = mode;
            }),

            resetAfterGameOver: () => set((state) => {
                const preservedMissionProgress = { ...(state.expedition?.missionProgress || {}) };
                state.mode = 'island';
                if (state.gameState.expeditionBaselineResources) {
                    state.resources = { ...state.gameState.expeditionBaselineResources };
                }
                if (state.gameState.expeditionBaselineIsland) {
                    state.island = JSON.parse(JSON.stringify(state.gameState.expeditionBaselineIsland));
                }
                state.yacht = createInitialYachtState();
                state.player = { ...createInitialPlayerState(), money: state.resources.money || 0 };
                state.inventory = createInitialInventory();
                state.equip = createInitialEquip();
                state.expedition = {
                    ...createInitialExpeditionState(),
                    missionProgress: preservedMissionProgress
                };
                state.gameState = createInitialGameState();
                // Keep island/resources but clear crew by resetting yacht
            }),

            // ============================================================
            // RESOURCE MANAGEMENT
            // ============================================================

            addResource: (type, amount) => set((state) => {
                const current = Number(state.resources[type] ?? 0);
                const next = current + amount;
                const limit = state.resourceLimits[type];
                if (limit !== undefined && limit !== null) {
                    state.resources[type] = Math.min(next, limit);
                    return;
                }
                state.resources[type] = next;
            }),

            spendResources: (cost) => {
                const state = get();
                // Check if can afford
                for (const [resource, amount] of Object.entries(cost)) {
                    if ((state.resources[resource] || 0) < amount) {
                        return false;
                    }
                }
                // Spend
                set((s) => {
                    for (const [resource, amount] of Object.entries(cost)) {
                        s.resources[resource] -= amount;
                    }
                });
                return true;
            },

            setResourceLimit: (type, limit) => set((state) => {
                state.resourceLimits[type] = limit;
            }),

            // Legacy: addMoney uses resources.money
            addMoney: (amount) => set((state) => {
                const delta = Number(amount) || 0;
                const current = Number(state.resources.money) || 0;
                state.resources.money = current + delta;
                // Also update legacy player.money for backwards compatibility
                if (state.player.money !== undefined) {
                    state.player.money = state.resources.money;
                }
            }),

            // ============================================================
            // ISLAND MANAGEMENT
            // ============================================================

            addResident: (profession) => set((state) => {
                if (state.island.residents.length >= state.island.populationCap) {
                    return; // At capacity
                }

                const resident = {
                    id: nanoid(),
                    name: generateName(),
                    profession,
                    skillLevel: 'novice',
                    level: 1,
                    health: 100,
                    mood: 80,
                    hunger: 100,
                    assignedBuildingId: null,
                    rescuedAt: Date.now()
                };

                state.island.residents.push(resident);
            }),

            assignWorker: (residentId, buildingId) => set((state) => {
                const resident = state.island.residents.find(r => r.id === residentId);
                const building = state.island.buildings.find(b => b.id === buildingId);
                if (!resident || !building) return;

                const config = state._getBuildingConfig(building.configId);
                const slots = config?.slots || 0;
                if (slots > 0) {
                    const assigned = state.island.residents.filter(r => r.assignedBuildingId === buildingId).length;
                    if (assigned >= slots) return; // building full
                }

                resident.assignedBuildingId = buildingId;
            }),

            unassignWorker: (residentId) => set((state) => {
                const resident = state.island.residents.find(r => r.id === residentId);
                if (resident) {
                    resident.assignedBuildingId = null;
                }
            }),

            updateResident: (residentId, updates) => set((state) => {
                const resident = state.island.residents.find(r => r.id === residentId);
                if (resident) {
                    Object.assign(resident, updates);
                }
            }),

            addBuilding: (configId, position) => set((state) => {
                const config = state._getBuildingConfig(configId);
                const limit = getBuildingLimit(config);
                const currentCount = state.island.buildings.filter(b => b.configId === configId).length;
                if (currentCount >= limit) {
                    console.warn(`Building limit reached for ${configId}: ${currentCount}/${limit}`);
                    return;
                }

                const building = {
                    id: nanoid(),
                    configId,
                    level: 1,
                    position,
                    workers: [],
                    isActive: false,
                    createdAt: Date.now()
                };
                state.island.buildings.push(building);
                recalcHousingAndStorage(state, state._getBuildingConfig);
            }),

            upgradeBuilding: (buildingId) => set((state) => {
                const building = state.island.buildings.find(b => b.id === buildingId);
                if (building) {
                    building.level += 1;
                    recalcHousingAndStorage(state, state._getBuildingConfig);
                }
            }),

            updateWeather: (weatherType, duration) => set((state) => {
                const weatherConfig = {
                    sunny: { waterBonus: 0, moodBonus: 5, canSail: true },
                    cloudy: { waterBonus: 0, moodBonus: 0, canSail: true },
                    rain: { waterBonus: 50, moodPenalty: 10, canSail: true },
                    storm: { waterBonus: 100, moodPenalty: 30, buildingRisk: 0.1, canSail: false }
                };

                state.island.weather = {
                    type: weatherType,
                    duration,
                    effects: weatherConfig[weatherType] || weatherConfig.sunny
                };
            }),

            increasePopulationCap: (amount) => set((state) => {
                state.island.populationCap += amount;
            }),

            // ============================================================
            // PRODUCTION LOOP - Called periodically to update island economy
            // ============================================================

            /**
             * Main island tick - runs every in-game day cycle
             * Call this from island mode update loop
             */
            tickIsland: () => set((state) => {
                const { buildings, residents, weather } = state.island;
                // Import INITIAL_RESOURCE_LIMITS inside if not available, but it is imported at top level.
                // However, we need to access it. It is available in scope.

                // Skip if no buildings
                if (buildings.length === 0 && residents.length === 0) return;

                // Skip cycle if there are no production buildings to avoid random resource gains
                const productiveBuildings = buildings.filter(b => {
                    const cfg = state._getBuildingConfig(b.configId);
                    return cfg?.output;
                });
                if (productiveBuildings.length === 0 && residents.length === 0) return;

                // 1. Production from buildings
                buildings.forEach(building => {
                    const config = state._getBuildingConfig(building.configId);
                    if (!config || !config.output) return;

                    // Count assigned workers
                    const workerCount = residents.filter(r => r.assignedBuildingId === building.id).length;
                    const maxSlots = config.slots || 0;

                    // No production without workers (unless slots === 0 which means auto)
                    if (maxSlots > 0 && workerCount === 0) return;

                    // Calculate efficiency (workers / slots)
                    const efficiency = maxSlots > 0 ? Math.min(1, workerCount / maxSlots) : 1;

                    // Base output scaled by level and efficiency
                    const baseOutput = config.baseOutput || 0;
                    const levelBonus = 1 + (building.level - 1) * 0.15; // +15% per level
                    const weatherBonus = weather.effects?.waterBonus && config.output === 'water'
                        ? 1 + weather.effects.waterBonus / 100
                        : 1;

                    const production = Math.floor(baseOutput * efficiency * levelBonus * weatherBonus);

                    // Check consumption requirements
                    let canProduce = true;
                    if (config.consumption) {
                        for (const [res, amount] of Object.entries(config.consumption)) {
                            if ((state.resources[res] || 0) < amount * efficiency) {
                                canProduce = false;
                                break;
                            }
                        }
                    }

                    // Add resources if can produce
                    if (canProduce && production > 0) {
                        // Deduct consumption
                        if (config.consumption) {
                            for (const [res, amount] of Object.entries(config.consumption)) {
                                state.resources[res] = Math.max(0, (state.resources[res] || 0) - amount * efficiency);
                            }
                        }

                        // Add production (respect limits)
                        const limit = state.resourceLimits[config.output] || Infinity;
                        state.resources[config.output] = Math.min(
                            limit,
                            (state.resources[config.output] || 0) + production
                        );

                        building.isActive = true;
                    } else {
                        building.isActive = false;
                    }
                });

                // 2. Apply building effects (mood, health bonuses)
                let totalMoodBonus = weather.effects?.moodBonus || 0;
                let totalHealthBonus = 0;

                buildings.forEach(building => {
                    const config = state._getBuildingConfig(building.configId);
                    if (!config?.effect) return;

                    const levelMult = 1 + (building.level - 1) * 0.1;

                    if (config.effect.type === 'mood') {
                        totalMoodBonus += config.effect.value * levelMult;
                    } else if (config.effect.type === 'health') {
                        totalHealthBonus += config.effect.value * levelMult;
                    }
                });

                // 3. Resident consumption and status update
                // Consume food and water per resident; if not enough, residents die
                let foodStock = state.resources.food || 0;
                let waterStock = state.resources.water || 0;
                const survivors = [];
                const deaths = [];

                residents.forEach(resident => {
                    const needFood = RESIDENT_FOOD_PER_TICK;
                    const needWater = RESIDENT_WATER_PER_TICK;
                    if (foodStock >= needFood && waterStock >= needWater) {
                        foodStock -= needFood;
                        waterStock -= needWater;
                        survivors.push(resident);
                    } else {
                        deaths.push(resident);
                    }
                });

                state.resources.food = foodStock;
                state.resources.water = waterStock;
                state.island.residents = survivors;
                let hadLosses = deaths.length > 0;
                if (hadLosses) {
                    const addNotification = useNotificationStore.getState()?.addNotification;
                    const names = deaths.map(r => r.name).join(', ');
                    if (addNotification) addNotification('warning', `Померли: ${names} (голод/спрага)`, 4000);
                    if (!state.island.eventLog) state.island.eventLog = [];
                    state.island.eventLog.unshift({
                        id: nanoid(),
                        type: 'death',
                        message: `${names} померли від голоду/спраги`,
                        timestamp: Date.now()
                    });
                    if (state.island.eventLog.length > 10) state.island.eventLog.pop();
                }

                // Rebind residents after possible deaths
                const aliveResidents = state.island.residents;

                // Update each resident
                aliveResidents.forEach(resident => {
                    // Mood changes
                    const baseMood = 50 + totalMoodBonus - (hadLosses ? 20 : 0);
                    const workMoodBonus = resident.assignedBuildingId ? 10 : -5;
                    const foodMoodPenalty = 0;
                    const waterMoodPenalty = 0;

                    const targetMood = Math.max(0, Math.min(100,
                        baseMood + workMoodBonus + foodMoodPenalty + waterMoodPenalty
                    ));

                    // Slowly move toward target mood
                    resident.mood = Math.round(resident.mood + (targetMood - resident.mood) * 0.2);

                    // Health changes
                    let healthDelta = totalHealthBonus / 10; // Buildings slowly heal
                    if (!hasEnoughFood) healthDelta -= 5;
                    if (!hasEnoughWater) healthDelta -= 10;
                    if (resident.mood < 20) healthDelta -= 5; // Severely unhappy affects health

                    resident.health = Math.max(0, Math.min(100, resident.health + healthDelta));

                    // Hunger tracking
                    resident.hunger = 100;
                });

                // Calculate averages
                if (aliveResidents.length > 0) {
                    state.island.averageMood = Math.round(
                        aliveResidents.reduce((sum, r) => sum + r.mood, 0) / aliveResidents.length
                    );
                    state.island.averageHealth = Math.round(
                        aliveResidents.reduce((sum, r) => sum + r.health, 0) / aliveResidents.length
                    );
                }

                recalcHousingAndStorage(state, state._getBuildingConfig);

                // 5. Random Events System (Daily Chance)
                // 1 tick = 1 day (assumed for now based on button, real-time likely different)
                // Actually button call is manual 'Next Day'.

                // 20% Change of event
                if (Math.random() < 0.2) {
                    // EVENT_TYPES imported at top
                    const possibleEvents = Object.values(EVENT_TYPES).filter(evt => {
                        if (evt.requires === 'weather_storm' && state.island.weather.type !== 'storm') return false;
                        if (evt.requires && !buildings.some(b => b.configId === evt.requires)) return false;
                        return true;
                    });

                    if (possibleEvents.length > 0) {
                        const event = possibleEvents[Math.floor(Math.random() * possibleEvents.length)];

                        // Apply effect
                        event.effect(state);

                        // Log event (we'll add a simple log array to state)
                        if (!state.island.eventLog) state.island.eventLog = [];
                        state.island.eventLog.unshift({
                            id: nanoid(),
                            type: event.type,
                            message: event.description,
                            timestamp: Date.now()
                        });

                        // Keep log short
                        if (state.island.eventLog.length > 10) state.island.eventLog.pop();
                    }
                }
            }),

            // Helper to get building config (internal)
            _getBuildingConfig: (configId) => {
                return CONFIG.buildings?.[configId] || null;
            },

            // Calculate production summary for UI
            getProductionSummary: () => {
                const state = get();
                const { buildings, residents } = state.island;
                const production = {};
                const consumption = {};

                buildings.forEach(building => {
                    const config = state._getBuildingConfig(building.configId);
                    if (!config) return;

                    const workerCount = residents.filter(r => r.assignedBuildingId === building.id).length;
                    const maxSlots = config.slots || 0;
                    const efficiency = maxSlots > 0 ? Math.min(1, workerCount / maxSlots) : 1;
                    const levelBonus = 1 + (building.level - 1) * 0.15;

                    if (config.output && config.baseOutput) {
                        const output = Math.floor(config.baseOutput * efficiency * levelBonus);
                        production[config.output] = (production[config.output] || 0) + output;
                    }

                    if (config.consumption) {
                        for (const [res, amount] of Object.entries(config.consumption)) {
                            consumption[res] = (consumption[res] || 0) + Math.floor(amount * efficiency);
                        }
                    }
                });

                // Resident consumption
                const residentUpkeep = residents.length;
                consumption.food = (consumption.food || 0) + residentUpkeep * RESIDENT_FOOD_PER_TICK;
                consumption.water = (consumption.water || 0) + residentUpkeep * RESIDENT_WATER_PER_TICK;

                return { production, consumption };
            },

            // ============================================================
            // YACHT MANAGEMENT (New 50-level system)
            // ============================================================

            upgradeYachtModule: (moduleId) => set((state) => {
                const module = state.yacht.modules[moduleId];
                if (module && module.level < 50) {
                    module.level += 1;
                    module.tier = Math.floor(module.level / 10);

                    // Update computed stats
                    if (moduleId === 'hull') {
                        state.yacht.maxHp = getYachtHP(module.level);
                        state.yacht.hp = state.yacht.maxHp;
                    }
                }
            }),

            setYachtHp: (hp) => set((state) => {
                state.yacht.hp = Math.max(0, Math.min(hp, state.yacht.maxHp));
            }),

            repairYacht: (amount) => set((state) => {
                state.yacht.hp = Math.min(state.yacht.hp + amount, state.yacht.maxHp);
            }),

            // ============================================================
            // LEGACY: PLAYER & INVENTORY ACTIONS (Backwards compatibility)
            // ============================================================

            updatePlayer: (updates) => set((state) => {
                Object.assign(state.player, updates);
            }),

            activateSkill: (skillId) => set((state) => {
                const skill = state.player.skills[skillId];
                if (!skill || skill.cd > 0) return;

                switch (skillId) {
                    case 'nitro':
                        skill.active = true;
                        skill.timer = 180;
                        skill.cd = skill.max;
                        break;
                    case 'flare':
                        skill.cd = skill.max;
                        state.player.flareActive = true;
                        break;
                    case 'repair':
                        state.yacht.temperature = 36.6;
                        state.player.bodyTemp = 36.6;
                        skill.cd = skill.max;
                        break;
                }
            }),

            buyItem: (type) => {
                let result = 'error';
                set((state) => {
                    let cost = 10;

                    if (state.yacht.crew.merchant?.hired) {
                        const discount = (state.yacht.crew.merchant.level || 0) * 0.025;
                        cost = Math.floor(cost * (1 - discount));
                    }

                    if (state.resources.money >= cost) {
                        const emptyIdx = state.inventory.findIndex(item => item === null);
                        if (emptyIdx !== -1) {
                            state.resources.money -= cost;
                            state.inventory[emptyIdx] = {
                                type,
                                tier: 0,
                                id: nanoid()
                            };
                            result = 'success';
                        } else {
                            result = 'full';
                        }
                    } else {
                        result = 'no_money';
                    }
                });
                return result;
            },

            moveItem: (fromIdx, toIdx) => set((state) => {
                const temp = state.inventory[fromIdx];
                state.inventory[fromIdx] = state.inventory[toIdx];
                state.inventory[toIdx] = temp;
            }),

            mergeItems: (idx1, idx2) => set((state) => {
                const item1 = state.inventory[idx1];
                const item2 = state.inventory[idx2];

                if (item1 && item2 &&
                    item1.type === item2.type &&
                    item1.tier === item2.tier &&
                    item1.tier < 50) {  // Extended to 50 tiers
                    state.inventory[idx1].tier += 1;
                    state.inventory[idx2] = null;
                }
            }),

            equipItem: (slotType, itemIdx) => set((state) => {
                const item = state.inventory[itemIdx];
                if (item && item.type === slotType) {
                    const prevEquipped = state.equip[slotType];
                    state.equip[slotType] = item;
                    state.inventory[itemIdx] = prevEquipped;

                    // Sync with new yacht modules
                    state.yacht.modules[slotType].level = item.tier;
                    state.yacht.modules[slotType].tier = Math.floor(item.tier / 10);
                }
            }),

            unequipItem: (slotType) => set((state) => {
                const item = state.equip[slotType];
                if (item) {
                    const emptyIdx = state.inventory.findIndex(i => i === null);
                    if (emptyIdx !== -1) {
                        state.inventory[emptyIdx] = item;
                        state.equip[slotType] = null;

                        // Reset yacht module
                        state.yacht.modules[slotType].level = 0;
                        state.yacht.modules[slotType].tier = 0;
                    }
                }
            }),

            damageEquip: (slotType) => set((state) => {
                const item = state.equip[slotType];
                if (item) {
                    if (item.tier > 0) {
                        item.tier--;
                        state.yacht.modules[slotType].level = item.tier;
                    } else {
                        state.equip[slotType] = null;
                        state.yacht.modules[slotType].level = 0;
                    }
                }
            }),

            hireCrew: (type) => {
                let result = 'error';
                set((state) => {
                    const crewMember = state.yacht.crew[type];

                    if (!crewMember) {
                        console.warn(`Crew member ${type} missing, initializing...`);
                        state.yacht.crew[type] = { id: type, hired: false, level: 0 };
                        return;
                    }

                    const nextLevel = crewMember.hired ? crewMember.level + 1 : 1;
                    const cost = getCrewUpgradeCost(nextLevel);

                    if (state.resources.money >= cost) {
                        state.resources.money -= cost;
                        crewMember.hired = true;
                        crewMember.level = nextLevel;

                        if (type === 'quartermaster') {
                            state.inventory.push(null);
                        }
                        result = 'success';
                    } else {
                        result = 'no_money';
                    }
                });
                return result;
            },

            updateCrewAbilities: () => set((state) => {
                const { yacht, inventory, expedition, equip, resources } = state;

                // Supplier Logic
                if (yacht.crew.supplier.hired) {
                    expedition.crewTimers.supplier -= 1;
                    if (expedition.crewTimers.supplier <= 0) {
                        const level = yacht.crew.supplier.level;
                        const interval = getSupplierIntervalFrames(level);

                        const cost = 10;
                        if (resources.money >= cost) {
                            const emptyIdx = inventory.findIndex(i => i === null);
                            const allTypes = ['hull', 'engine', 'cabin', 'magnet', 'radar'];
                            const validTypes = allTypes.filter(t => !equip[t] || equip[t].tier < 50);

                            if (emptyIdx !== -1 && validTypes.length > 0) {
                                resources.money -= cost;
                                const type = validTypes[Math.floor(Math.random() * validTypes.length)];
                                inventory[emptyIdx] = {
                                    type,
                                    tier: 0,
                                    id: nanoid()
                                };
                                expedition.crewTimers.supplier = interval;
                            } else {
                                expedition.crewTimers.supplier = 300;
                            }
                        } else {
                            expedition.crewTimers.supplier = 180;
                        }
                    }
                }

                // Engineer Logic
                if (yacht.crew.engineer.hired) {
                    expedition.crewTimers.engineer -= 1;
                    if (expedition.crewTimers.engineer <= 0) {
                        const level = yacht.crew.engineer.level;
                        const interval = getEngineerIntervalFrames(level);

                        let merged = false;
                        for (let i = 0; i < inventory.length; i++) {
                            if (!inventory[i]) continue;
                            for (let j = i + 1; j < inventory.length; j++) {
                                if (!inventory[j]) continue;
                                if (inventory[i].type === inventory[j].type &&
                                    inventory[i].tier === inventory[j].tier &&
                                    inventory[i].tier < 50) {
                                    inventory[i].tier += 1;
                                    inventory[j] = null;
                                    merged = true;
                                    break;
                                }
                            }
                            if (merged) break;
                        }

                        expedition.crewTimers.engineer = interval;
                    }
                }
            }),

            recalcStats: () => set((state) => {
                const { player, equip, yacht } = state;

                // Reset stats
                player.isYacht = false;
                player.speedMult = 1;
                player.armorLvl = 0;
                player.heatResist = 0;
                player.pickupRange = 1;
                player.radarRange = 0;

                // Check if all equip slots filled
                const equipped = Object.values(equip).filter(e => e !== null);
                player.isYacht = equipped.length === 5;

                // Apply bonuses from equipped items (using new formulas)
                if (equip.engine) {
                    const level = equip.engine.tier || 0;
                    player.speedMult = getYachtSpeed(level);
                }
                if (equip.hull) {
                    player.armorLvl = equip.hull.tier || 0;
                    yacht.maxHp = getYachtHP(equip.hull.tier || 1);
                }
                if (equip.cabin) {
                    player.heatResist = getYachtHeatResist(equip.cabin.tier || 0);
                }
                if (equip.magnet) {
                    player.pickupRange = getYachtMagnetRange(equip.magnet.tier || 1);
                }
                if (equip.radar) {
                    player.radarRange = getYachtRadarRange(equip.radar.tier || 1);
                }
            }),

            autoMerge: () => {
                let merged = false;

                set((state) => {
                    const { inventory } = state;

                    for (let i = 0; i < inventory.length; i++) {
                        if (!inventory[i]) continue;

                        for (let j = i + 1; j < inventory.length; j++) {
                            if (!inventory[j]) continue;

                            if (inventory[i].type === inventory[j].type &&
                                inventory[i].tier === inventory[j].tier &&
                                inventory[i].tier < 50) {
                                inventory[i].tier += 1;
                                inventory[j] = null;
                                merged = true;
                                break;
                            }
                        }
                    }
                });

                return merged;
            },

            resetPlayer: () => set((state) => {
                state.player = createInitialPlayerState();
                state.inventory = createInitialInventory();
                state.equip = createInitialEquip();
                state.yacht = createInitialYachtState();
                state.resources = { ...INITIAL_RESOURCES };
            }),

            startNewGame: () => set((state) => {
                state.mode = 'island';
                state.resources = { ...INITIAL_RESOURCES };
                state.resourceLimits = { ...INITIAL_RESOURCE_LIMITS };
                state.yacht = createInitialYachtState();
                state.island = createInitialIslandState();
                state.expedition = createInitialExpeditionState();
                state.player = createInitialPlayerState();
                state.inventory = createInitialInventory();
                state.equip = createInitialEquip();
                state.gameState = createInitialGameState();
                state.lastMissionResult = null;
            }),

            updateGameState: (updates) => set((state) => {
                const nextGameState = { ...state.gameState, ...updates };
                if (updates.gameTime !== undefined) {
                    nextGameState.calendar = calculateCalendar(updates.gameTime);
                    nextGameState.dayPhase = ((updates.gameTime % FRAMES_PER_DAY) / FRAMES_PER_DAY);
                }
                Object.assign(state.gameState, nextGameState);
                // Sync with expedition state
                if (updates.distanceTraveled !== undefined) {
                    state.expedition.distanceTraveled = updates.distanceTraveled;
                }
                if (updates.gameTime !== undefined) {
                    state.expedition.gameTime = updates.gameTime;
                }
            }),

            // ============================================================
            // MISSIONS
            // ============================================================
            startMission: (mission) => set((state) => {
                state.expedition.currentMission = mission;
                state.expedition.currentBiome = mission?.mapId || null;
                state.gameState.mission = mission;
            }),
            completeMission: (mission) => set((state) => {
                if (!mission?.mapId) return;
                const current = state.expedition.missionProgress[mission.mapId] || 0;
                if (mission.missionNumber > current) {
                    state.expedition.missionProgress[mission.mapId] = mission.missionNumber;
                }
                state.expedition.currentMission = null;
                state.gameState.mission = null;
                state.lastMissionResult = {
                    missionId: mission.id,
                    mapId: mission.mapId,
                    missionNumber: mission.missionNumber,
                    reward: mission.reward
                };
            }),
            setLastMissionResult: (result) => set((state) => {
                state.lastMissionResult = result;
            }),

            // ============================================================
            // CLOUD SYNC
            // ============================================================

            saveToCloud: async () => {
                const state = get();
                const saveData = {
                    mode: state.mode,
                    resources: state.resources,
                    yacht: state.yacht,
                    island: state.island,
                    expedition: state.expedition,
                    player: state.player,
                    inventory: state.inventory,
                    equip: state.equip,
                    gameState: state.gameState
                };

                const success = await cloudService.saveGame(saveData);
                if (success) {
                    set((s) => {
                        s.gameState.lastSyncTime = Date.now();
                    });
                }
                return success;
            },

            loadFromCloud: async () => {
                const cloudState = await cloudService.loadGame();
                if (cloudState) {
                    get().loadSave(cloudState);
                    set((state) => {
                        state.mode = 'island'; // Always resume on island after load
                        state.gameState.lastSyncTime = Date.now();
                        state.gameState.mission = null;
                        state.expedition.currentMission = null;
                    });
                    return true;
                }
                return false;
            },

            loadSave: (saveData) => set((state) => {
                // Always force island on load to avoid jumping into sea
                state.mode = 'island';
                if (saveData.resources) Object.assign(state.resources, saveData.resources);
                if (saveData.yacht) Object.assign(state.yacht, saveData.yacht);
                if (saveData.island) Object.assign(state.island, saveData.island);
                if (saveData.expedition) Object.assign(state.expedition, saveData.expedition);
                if (saveData.player) Object.assign(state.player, saveData.player);
                if (saveData.inventory) state.inventory = saveData.inventory;
                if (saveData.equip) Object.assign(state.equip, saveData.equip);
                if (saveData.gameState) Object.assign(state.gameState, saveData.gameState);
                recalcHousingAndStorage(state, state._getBuildingConfig);
            })
        })),
        {
            name: 'island-haven-storage',
            partialize: (state) => ({
                // EXCLUDE mode to always start on island
                // mode: state.mode, 
                resources: state.resources,
                resourceLimits: state.resourceLimits,
                yacht: state.yacht,
                island: state.island,
                expedition: state.expedition,
                player: state.player,
                inventory: state.inventory,
                equip: state.equip,
                gameState: state.gameState
            }),
            merge: (persistedState, currentState) => {
                if (!persistedState) return currentState;

                console.log('Merging persisted state:', persistedState);

                // Merge with defaults
                return {
                    ...currentState,
                    mode: currentState.mode, // Always use default mode (island) on reload
                    resources: { ...currentState.resources, ...persistedState.resources },
                    resourceLimits: { ...currentState.resourceLimits, ...persistedState.resourceLimits },
                    yacht: persistedState.yacht ? { ...currentState.yacht, ...persistedState.yacht } : currentState.yacht,
                    island: persistedState.island ? { ...currentState.island, ...persistedState.island } : currentState.island,
                    expedition: persistedState.expedition ? { ...currentState.expedition, ...persistedState.expedition } : currentState.expedition,
                    player: { ...currentState.player, ...persistedState.player },
                    inventory: persistedState.inventory || currentState.inventory,
                    equip: { ...currentState.equip, ...persistedState.equip },
                    gameState: { ...currentState.gameState, ...persistedState.gameState }
                };
            }
        }
    )
);

export default useGameStore;
