/**
 * Island Haven: Rescue & Build
 * TypeScript Type Definitions
 */

// ============================================================
// RESOURCE SYSTEM
// ============================================================

/** All available resource types in the game */
export type ResourceType =
    | 'money'    // 💰 Дублони - основна валюта
    | 'wood'     // 🪵 Дерево - базовий будівельний ресурс
    | 'stone'    // 🪨 Камінь - базовий будівельний ресурс
    | 'metal'    // ⚙️ Металобрухт - з моря
    | 'plastic'  // ♻️ Пластик - переробляється зі сміття
    | 'food'     // 🍖 Їжа - споживча
    | 'water'    // 💧 Вода - споживча
    | 'energy'   // ⚡ Енергія - для будівель
    | 'science'  // 🔬 Наука - для досліджень
    | 'coal';    // ⛏️ Вугілля - паливо

/** Resource amounts container */
export interface Resources {
    money: number;
    wood: number;
    stone: number;
    metal: number;
    plastic: number;
    food: number;
    water: number;
    energy: number;
    science: number;
    coal: number;
}

/** Resource configuration from database */
export interface ResourceConfig {
    id: ResourceType;
    name: string;
    icon: string;
}

// ============================================================
// YACHT SYSTEM (Expedition Mode)
// ============================================================

/** Yacht module types */
export type YachtModuleType = 'hull' | 'engine' | 'cabin' | 'magnet' | 'radar';

/** Single yacht module with level */
export interface YachtModule {
    id: YachtModuleType;
    level: number;        // 1-50
    tier: number;         // Visual tier (changes at 10, 25, 50)
}

/** Yacht module configuration from database */
export interface YachtModuleConfig {
    id: YachtModuleType;
    name: string;
    icon: string;
    statName: string;
    baseStat: number;
    statMultiplier: number;
    costMultiplier: number;
    description: string;
}

/** Crew member types for yacht */
export type CrewType =
    | 'mechanic'      // 👨‍🔧 Ремонт на ходу
    | 'navigator'     // 🧭 Уникнення
    | 'doctor'        // 👨‍⚕️ Життєзабезпечення
    | 'merchant'      // 💼 Золотий бонус
    | 'gunner'        // 🔫 Скорострільність
    | 'quartermaster' // 📦 Стиснення ресурсів
    | 'supplier'      // 🛒 Пасивний лут
    | 'engineer';     // 🔧 Ефективність двигуна

/** Crew member state */
export interface CrewMember {
    id: CrewType;
    hired: boolean;
    level: number;    // 1-50+
}

/** Crew configuration from database */
export interface CrewConfig {
    id: CrewType;
    name: string;
    icon: string;
    effectType: string;
    baseEffectValue: number;
    description: string;
}

/** Full yacht state */
export interface YachtState {
    modules: Record<YachtModuleType, YachtModule>;
    crew: Record<CrewType, CrewMember>;
    hp: number;           // Current HP
    maxHp: number;        // Max HP based on hull level
    fuel: number;         // Current fuel
    maxFuel: number;      // Max fuel based on engine
    temperature: number;  // Body temperature (36.6 normal)
}

// ============================================================
// POPULATION SYSTEM (Island Mode)
// ============================================================

/** Profession types for island residents */
export type ProfessionType =
    | 'worker'        // Звичайна людина - базова праця
    | 'fisher'        // Рибалка
    | 'farmer'        // Фермер
    | 'builder'       // Будівельник
    | 'doctor'        // Лікар
    | 'nurse'         // Медсестра
    | 'scientist'     // Вчений
    | 'engineer'      // Інженер
    | 'guard'         // Охоронець
    | 'firefighter'   // Пожежник
    | 'chef'          // Кухар
    | 'entertainer'   // Аніматор
    | 'pilot'         // Пілот
    | 'steward'       // Стюард
    | 'strongman'     // Силач (пірат-дезертир)
    | 'vip';          // VIP персона

/** Skill level for profession */
export type SkillLevel = 'novice' | 'experienced' | 'master';

/** Single resident/person on island */
export interface Resident {
    id: string;           // UUID
    name: string;         // Generated name
    profession: ProfessionType;
    skillLevel: SkillLevel;
    level: number;        // 1-10
    health: number;       // 0-100
    mood: number;         // 0-100 (happiness)
    hunger: number;       // 0-100 (satiation)
    assignedBuildingId: string | null;  // Where working
    rescuedAt: number;    // Timestamp when rescued
}

/** Rescued animal types */
export type AnimalType = 'cat' | 'dog';

/** Animal companion */
export interface Animal {
    id: string;
    type: AnimalType;
    name: string;
    effect: 'mood_boost' | 'mission_bonus';
    effectValue: number;
}

/** VIP survivor with passive buffs */
export interface Vip {
    id: string;
    rescuedAt: number;
}

/** Social state of the settlement */
export interface SocialState {
    strikeDaysRemaining: number;
    activeFestivalDays: number;
    festivalCooldown: number;
    lastFestivalAt: number | null;
    lastCrisis: { type: 'strike' | 'sabotage'; at: number } | null;
}

// ============================================================
// BUILDING SYSTEM
// ============================================================

/** Building tier (era) */
export type BuildingTier = 1 | 2 | 3 | 4;

/** Building effect types */
export type BuildingEffectType =
    | 'population'        // Житло
    | 'prod_water'        // Виробництво води
    | 'prod_food'         // Виробництво їжі
    | 'prod_wood'         // Виробництво дерева
    | 'prod_stone'        // Виробництво каменю
    | 'prod_metal'        // Виробництво металу
    | 'prod_energy'       // Виробництво енергії
    | 'prod_science'      // Виробництво науки
    | 'prod_coal'         // Виробництво вугілля
    | 'store_wood'        // Зберігання дерева
    | 'store_stone'       // Зберігання каменю
    | 'heat'              // Тепло (радіус)
    | 'hygiene'           // Гігієна
    | 'defense'           // Захист
    | 'build_speed'       // Швидкість будівництва
    | 'heal_rate'         // Швидкість лікування
    | 'food_efficiency'   // Ефективність їжі
    | 'happiness'         // Настрій
    | 'ship_speed'        // Швидкість кораблів
    | 'yacht_limit'       // Ліміт покращення яхти
    | 'passive_income'    // Пасивний дохід
    | 'storm_protect'     // Захист від штормів
    | 'save_life'         // Рятування від смерті
    | 'mission_unlock'    // Відкриття місій
    | 'win_condition';    // Умова перемоги

/** Building configuration from database */
export interface BuildingConfig {
    id: string;
    name: string;
    tier: BuildingTier;
    baseCost: Partial<Resources>;
    costGrowth: number;
    baseEffect: {
        type: BuildingEffectType;
        value: number;
    };
    effectGrowth: number;
    consumption?: Partial<Resources>;  // What it consumes per tick
    requiredWorker?: ProfessionType;   // Required profession
    workerSlots?: number;              // How many workers can work
}

/** Player's building instance */
export interface Building {
    id: string;           // Instance UUID
    configId: string;     // Reference to BuildingConfig.id
    level: number;        // Current level
    position: {
        x: number;
        y: number;
    };
    workers: string[];    // Resident IDs assigned
    isActive: boolean;    // Has required workers?
    createdAt: number;
}

// ============================================================
// MISSION SYSTEM
// ============================================================

/** Map/Biome configuration */
export interface MapConfig {
    id: string;
    name: string;
    orderIndex: number;
    dangerLevel: number;
    temperature: number;
    color: string;
}

/** Mission configuration */
export interface MissionConfig {
    id: string;
    mapId: string;
    missionNumber: number;
    difficulty: number;
    rewards: Partial<Resources>;
    requirements: {
        yachtLevel?: number;
        buildings?: string[];
    };
}

/** Active mission state */
export interface Mission {
    configId: string;
    targetX: number;
    targetY: number;
    reward: number;
    distanceRemaining: number;
}

// ============================================================
// ARTIFACT SYSTEM
// ============================================================

/** Artifact configuration */
export interface ArtifactConfig {
    id: string;
    name: string;
    description: string;
    bonusType: 'global_boost' | 'specific_resource' | 'speed' | 'protection';
    bonusValue: number;
}

/** Player's collected artifact */
export interface Artifact {
    id: string;
    configId: string;
    acquiredAt: number;
}

// ============================================================
// WEATHER SYSTEM
// ============================================================

export type WeatherType = 'sunny' | 'cloudy' | 'rain' | 'storm';

export interface Weather {
    type: WeatherType;
    duration: number;     // Frames remaining
    effects: {
        waterBonus?: number;      // Rain increases water production
        moodPenalty?: number;     // Rain/storm reduces mood
        buildingRisk?: number;    // Storm can damage buildings
        canSail: boolean;         // Can go on expedition?
    };
}

// ============================================================
// GAME STATE
// ============================================================

export type GameMode = 'expedition' | 'island';

/** Full game state */
export interface GameState {
    mode: GameMode;

    // Resources
    resources: Resources;
    resourceLimits: Partial<Resources>;  // Storage limits

    // Yacht (Expedition)
    yacht: YachtState;

    // Island (Management)
    island: {
        buildings: Building[];
        residents: Resident[];
        animals: Animal[];
        vips: Vip[];
        unlockedUniqueBuildings: string[];
        populationCap: number;
        averageMood: number;
        averageHealth: number;
        weather: Weather;
        social: SocialState;
    };

    // Expedition
    expedition: {
        currentMission: Mission | null;
        distanceTraveled: number;
        currentBiome: MapConfig | null;
        gameTime: number;
        dayPhase: number;
    };

    // Progression
    artifacts: Artifact[];
    unlockedBuildings: string[];
    unlockedMaps: string[];

    // Meta
    lastSyncTime: number | null;
    createdAt: number;
}

// ============================================================
// ENTITIES (Sea/Expedition)
// ============================================================

/** Floating resource in sea */
export interface FloatingResource {
    id: string;
    x: number;
    y: number;
    type: ResourceType;
    amount: number;
    sprite: string;
}

/** Survivor to rescue */
export interface Survivor {
    id: string;
    x: number;
    y: number;
    profession: ProfessionType;
    name: string;
    onPlatform: 'buoy' | 'wreckage' | 'raft' | 'lifeboat';
}

/** Obstacle types */
export type ObstacleType =
    | 'mine'
    | 'wartimeMine'
    | 'shark'
    | 'pirateBoat'
    | 'whirlpool'
    | 'coralReef'
    | 'iceberg'
    | 'oilSlick';

/** Base entity interface */
export interface Entity {
    id: string;
    x: number;
    y: number;
    type: string;
}

// ============================================================
// API TYPES
// ============================================================

/** Save game request */
export interface SaveGameRequest {
    userId: string;
    state: Partial<GameState>;
    nickname?: string;
}

/** Load game response */
export interface LoadGameResponse {
    state: GameState | null;
}

/** Leaderboard entry */
export interface LeaderboardEntry {
    nickname: string;
    distanceRecord: number;
    money: number;
    playTime: number;
}
