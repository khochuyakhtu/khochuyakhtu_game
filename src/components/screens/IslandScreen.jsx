import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import useGameStore from '../../stores/useGameStore';
import useUIStore from '../../stores/useUIStore';
import GarageModal from '../modals/GarageModal';
import SaveSlotModal from '../modals/SaveSlotsModal';
import BuildingDetailsModal from '../modals/BuildingDetailsModal';
import WorkerAssignmentModal from '../modals/WorkerAssignmentModal';
import MissionsModal from '../modals/MissionsModal';
import { CONFIG, RESOURCES, getBuildingUpgradeCost, getBuildingOutput, calculateCalendar, FRAMES_PER_WEEK, getBuildingLimit } from '../../game/config';
import BottomNav from '../ui/BottomNav';

/**
 * IslandScreen - Main island management interface
 * Shows buildings, residents, resources, and actions
 */
export default function IslandScreen() {
    const [activeTab, setActiveTab] = useState('overview');

    const island = useGameStore((state) => state.island);
    const resources = useGameStore((state) => state.resources);
    const gameState = useGameStore((state) => state.gameState);

    const { buildings, residents, populationCap, weather } = island;
    const weatherConfig = CONFIG.weatherTypes[weather.type] || CONFIG.weatherTypes.sunny;
    const currentFrame = gameState?.gameTime || 0;
    const calendar = calculateCalendar(currentFrame);
    const dayDuration = CONFIG.dayDuration || 3600;
    const dayFraction = (currentFrame % dayDuration) / dayDuration;
    const hour = Math.floor(dayFraction * 24).toString().padStart(2, '0');

    const saveToCloud = useGameStore((state) => state.saveToCloud);
    const loadFromCloud = useGameStore((state) => state.loadFromCloud);
    const tickIsland = useGameStore((state) => state.tickIsland);
    const updateGameState = useGameStore((state) => state.updateGameState);

    const handleCloudSave = async () => {
        const success = await saveToCloud();
        if (success) alert('✅ Гра збережена в хмару!');
        else alert('❌ Помилка збереження');
    };



    return (
        <div className="h-screen w-screen overflow-x-hidden flex flex-col bg-gradient-to-b from-cyan-900 via-teal-800 to-emerald-900">
            <MissionsModal />
            {/* Header */}
            <motion.div
                className="shrink-0 z-20 bg-gradient-to-b from-cyan-900/95 to-cyan-900/80 backdrop-blur-md p-4 border-b border-cyan-700/30"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-4">
                        <div>
                            <h1 className="text-xl font-bold text-white flex items-center gap-2">
                                🏝️ Острів Притулок
                            </h1>
                            <p className="text-xs text-cyan-300">Населення: {residents.length}/{populationCap}</p>
                        </div>

                        {/* Cloud Controls */}
                        <div className="flex gap-1">
                            <CloudButton
                                icon="☁️"
                                onClick={handleCloudSave}
                                label="Зберегти"
                            />
                        </div>
                    </div>

                    {/* Weather with calendar */}
                    <div className="bg-slate-800/60 rounded-xl px-3 py-1.5 flex items-center gap-2">
                        <span className="text-xl">{weatherConfig.icon}</span>
                        <div className="leading-tight">
                            <p className="text-white font-bold text-xs">{weatherConfig.name}</p>
                            <p className="text-[10px] text-slate-400">
                                {weatherConfig.effects.canSail ? '⛵ Можна плисти' : '⛔ Шторм'}
                            </p>
                            <p className="text-[10px] text-slate-200">
                                {hour}:00 · Д{calendar.day} Т{calendar.week} М{calendar.month} Р{calendar.year}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Quick Resources CTA removed per request */}
            </motion.div>

            {/* Tab Content Container - Flex 1 to take remaining space */}
            <div className="flex-1 overflow-y-auto relative p-4 pb-28 custom-scroll">
                <AnimatePresence mode="wait">
                    {activeTab === 'overview' && (
                        <OverviewTab
                            key="overview"
                            island={island}
                            resources={resources}
                            weatherConfig={weatherConfig}
                        />
                    )}
                    {activeTab === 'buildings' && (
                        <BuildingsTab
                            key="buildings"
                            buildings={buildings}
                            residents={residents}
                        />
                    )}
                    {activeTab === 'residents' && (
                        <ResidentsTab
                            key="residents"
                            residents={residents}
                            buildings={buildings}
                        />
                    )}
                    {activeTab === 'inventory' && (
                        <InventoryTab
                            key="inventory"
                            resources={resources}
                        />
                    )}
                </AnimatePresence>
            </div>

            {/* Bottom Navigation */}
            <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
    );
}

/**
 * Overview tab - stats and summary
 */
function OverviewTab({ island, resources, weatherConfig }) {
    const { residents, buildings, averageMood, averageHealth } = island;
    const tickIsland = useGameStore((state) => state.tickIsland);
    const getProductionSummary = useGameStore((state) => state.getProductionSummary);

    // Calculate production
    const workerCount = residents.filter(r => r.assignedBuildingId).length;
    const idleCount = residents.length - workerCount;

    // Get real production summary
    const { production, consumption } = getProductionSummary ? getProductionSummary() : { production: {}, consumption: {} };

    return (
        <motion.div
            className="space-y-4 pb-28"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
        >
            {/* Status Cards */}
            <div className="grid grid-cols-2 gap-3">
                <StatusCard
                    icon="😊"
                    label="Настрій"
                    value={`${Math.round(averageMood)}%`}
                    color={averageMood > 70 ? 'green' : averageMood > 40 ? 'yellow' : 'red'}
                />
                <StatusCard
                    icon="❤️"
                    label="Здоров'я"
                    value={`${Math.round(averageHealth)}%`}
                    color={averageHealth > 70 ? 'green' : averageHealth > 40 ? 'yellow' : 'red'}
                />
                <StatusCard
                    icon="👷"
                    label="Працюють"
                    value={`${workerCount}/${residents.length}`}
                    color="blue"
                />
                <StatusCard
                    icon="🏠"
                    label="Будівлі"
                    value={buildings.length}
                    color="purple"
                />
            </div>

            {/* Daily Production Summary */}
            <div className="bg-slate-800/60 rounded-xl p-4">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-white font-bold">📈 Виробництво / Цикл</h3>
                    <motion.button
                        className="bg-green-600 text-white text-xs px-3 py-1 rounded-lg font-bold"
                        onClick={() => {
                            tickIsland();
                            const store = useGameStore.getState();
                            const currentTime = store.gameState.gameTime || 0;
                            const newTime = currentTime + FRAMES_PER_WEEK;
                            const newCal = calculateCalendar(newTime);
                            store.updateGameState({ gameTime: newTime, calendar: newCal });
                        }}
                        whileTap={{ scale: 0.95 }}
                    >
                        ▶ Запустити цикл
                    </motion.button>
                </div>

                {/* Production */}
                <p className="text-green-400 text-xs mb-2">⬆️ Виробництво:</p>
                <div className="grid grid-cols-4 gap-2 text-center mb-3">
                    {Object.entries(production).length > 0 ? (
                        Object.entries(production).map(([res, amount]) => (
                            <ProductionStat
                                key={res}
                                icon={RESOURCES[res]?.icon || '📦'}
                                label={RESOURCES[res]?.name || res}
                                value={`+${amount}`}
                                positive={true}
                            />
                        ))
                    ) : (
                        <p className="col-span-4 text-slate-500 text-xs">Немає виробничих будівель</p>
                    )}
                </div>

                {/* Consumption */}
                <p className="text-red-400 text-xs mb-2">⬇️ Споживання:</p>
                <div className="grid grid-cols-4 gap-2 text-center">
                    {Object.entries(consumption).filter(([_, amt]) => amt > 0).map(([res, amount]) => (
                        <ProductionStat
                            key={res}
                            icon={RESOURCES[res]?.icon || '📦'}
                            label={RESOURCES[res]?.name || res}
                            value={`-${amount}`}
                            positive={false}
                        />
                    ))}
                </div>
            </div>

            {/* Idle Workers Alert */}
            {idleCount > 0 && (
                <motion.div
                    className="bg-yellow-600/30 border border-yellow-500/50 rounded-xl p-3 flex items-center gap-3"
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                >
                    <span className="text-2xl">⚠️</span>
                    <div>
                        <p className="text-yellow-200 font-bold">{idleCount} без роботи</p>
                        <p className="text-yellow-300/70 text-sm">Призначте їх до будівель</p>
                    </div>
                </motion.div>
            )}

            {/* Event Log */}
            <div className="bg-slate-800/60 rounded-xl p-4">
                <h3 className="text-white font-bold mb-3">📜 Останні Події</h3>
                <div className="space-y-2">
                    {island.eventLog && island.eventLog.length > 0 ? (
                        island.eventLog.map(event => (
                            <div key={event.id} className="bg-slate-700/50 p-2.5 rounded-lg flex items-center gap-3">
                                <span className="text-2xl">{event.icon || '📢'}</span>
                                <div>
                                    <p className={`text-sm font-bold ${event.type === 'bad' ? 'text-red-400' : 'text-green-400'}`}>
                                        {event.name || 'Подія'}
                                    </p>
                                    <p className="text-xs text-slate-300">{event.message}</p>
                                    <p className="text-[10px] text-slate-500 mt-1">
                                        {new Date(event.timestamp).toLocaleTimeString()}
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-slate-500 text-sm italic py-2 text-center">Спокійно... Поки що...</p>
                    )}
                </div>
            </div>

            {/* Weather Effects */}
            {weatherConfig.effects && (
                <div className="bg-slate-800/60 rounded-xl p-4">
                    <h3 className="text-white font-bold mb-2">
                        {weatherConfig.icon} Ефекти погоди
                    </h3>
                    <div className="space-y-1 text-sm">
                        {weatherConfig.effects.waterBonus > 0 && (
                            <p className="text-blue-300">💧 +{weatherConfig.effects.waterBonus}% збору води</p>
                        )}
                        {weatherConfig.effects.moodBonus > 0 && (
                            <p className="text-green-300">😊 +{weatherConfig.effects.moodBonus}% настрою</p>
                        )}
                        {weatherConfig.effects.moodPenalty > 0 && (
                            <p className="text-red-300">😢 -{weatherConfig.effects.moodPenalty}% настрою</p>
                        )}
                        {!weatherConfig.effects.canSail && (
                            <p className="text-red-400 font-bold">⛔ Неможливо виходити в море</p>
                        )}
                    </div>
                </div>
            )}
        </motion.div>
    );
}

function StatusCard({ icon, label, value, color }) {
    const colors = {
        green: 'from-green-600/30 to-green-700/20 border-green-500/30',
        yellow: 'from-yellow-600/30 to-yellow-700/20 border-yellow-500/30',
        red: 'from-red-600/30 to-red-700/20 border-red-500/30',
        blue: 'from-blue-600/30 to-blue-700/20 border-blue-500/30',
        purple: 'from-purple-600/30 to-purple-700/20 border-purple-500/30'
    };

    return (
        <div className={`bg-gradient-to-br ${colors[color]} border rounded-xl p-3`}>
            <div className="flex items-center gap-2">
                <span className="text-xl">{icon}</span>
                <div>
                    <p className="text-white font-bold text-lg">{value}</p>
                    <p className="text-slate-400 text-xs">{label}</p>
                </div>
            </div>
        </div>
    );
}

function ProductionStat({ icon, label, value, positive = true }) {
    return (
        <div className="bg-slate-700/50 rounded-lg p-2">
            <span className="text-lg">{icon}</span>
            <p className={`font-bold text-sm ${positive ? 'text-green-400' : 'text-red-400'}`}>{value}</p>
            <p className="text-slate-400 text-[10px] line-clamp-1">{label}</p>
        </div>
    );
}



/**
 * Buildings tab
 */
function BuildingsTab({ buildings, residents }) {
    const [subTab, setSubTab] = useState('shop'); // 'shop' | 'owned'
    const [selectedCategory, setSelectedCategory] = useState('all'); // Shop category
    const [selectedOwnedCategory, setSelectedOwnedCategory] = useState('all'); // Owned category
    const [selectedTier, setSelectedTier] = useState(1);
    const [selectedBuildingId, setSelectedBuildingId] = useState(null); // Changed to ID for live updates

    const weather = useGameStore((state) => state.island.weather);
    const resources = useGameStore((state) => state.resources);
    const spendResources = useGameStore((state) => state.spendResources);
    const addBuilding = useGameStore((state) => state.addBuilding);
    const unassignWorker = useGameStore((state) => state.unassignWorker);
    const assignWorker = useGameStore((state) => state.assignWorker);
    const upgradeBuilding = useGameStore((state) => state.upgradeBuilding);

    // Derive selected building from store data to ensure it's always fresh
    const selectedBuilding = buildings.find(b => b.id === selectedBuildingId) || null;

    // Get buildings from config
    const allBuildings = CONFIG.buildings || {};
    const categories = CONFIG.buildingCategories || {};

    const buildingCounts = buildings.reduce((acc, b) => {
        acc[b.configId] = (acc[b.configId] || 0) + 1;
        return acc;
    }, {});

    // PROCESSED DATA FOR SHOP
    const filteredShopBuildings = Object.values(allBuildings).filter(b => {
        const tierMatch = b.tier <= selectedTier;
        const categoryMatch = selectedCategory === 'all' || b.category === selectedCategory;
        return tierMatch && categoryMatch;
    });

    // PROCESSED DATA FOR OWNED
    const filteredOwnedBuildings = buildings.filter(b => {
        const config = allBuildings[b.configId] || {};
        return selectedOwnedCategory === 'all' || config.category === selectedOwnedCategory;
    });

    // Check if can afford
    const canAfford = (cost) => {
        if (!cost) return true;
        return Object.entries(cost).every(([res, amt]) => (resources[res] || 0) >= amt);
    };

    const handleBuild = (buildingConfig) => {
        const limit = getBuildingLimit(buildingConfig);
        const currentCount = buildingCounts[buildingConfig.id] || 0;
        if (currentCount >= limit) return;

        if (canAfford(buildingConfig.cost) && spendResources(buildingConfig.cost)) {
            addBuilding(buildingConfig.id, { x: 0, y: 0 });
            // Optional: Switch to owned tab or show success
        }
    };

    const handleUpgrade = (building) => {
        const config = allBuildings[building.configId];
        if (!config) return;

        // Calculate upgrade cost
        // Use base cost from config. Note: config.cost is the base cost in our current structure logic
        const upgradeCost = getBuildingUpgradeCost(config.cost, building.level);

        if (canAfford(upgradeCost) && spendResources(upgradeCost)) {
            upgradeBuilding(building.id);
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Sub-tabs Toggle */}
            <div className="flex bg-slate-800/60 p-1 rounded-xl mb-4 shrink-0">
                <button
                    className={`flex-1 py-1.5 rounded-lg text-sm font-bold transition-all ${subTab === 'shop' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                    onClick={() => setSubTab('shop')}
                >
                    🏗️ Магазин
                </button>
                <button
                    className={`flex-1 py-1.5 rounded-lg text-sm font-bold transition-all ${subTab === 'owned' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                    onClick={() => setSubTab('owned')}
                >
                    🏠 Мої будівлі
                </button>
            </div>

            <motion.div
                className="space-y-4 flex-1 overflow-y-auto min-h-0 pb-28 custom-scroll"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
            >
                {subTab === 'owned' && (
                    <>
                        {/* Category Filter for Owned */}
                        <div className="flex gap-2 overflow-x-auto pb-2 shrink-0">
                            <button
                                className={`px-3 py-1.5 rounded-lg text-sm font-bold ${selectedOwnedCategory === 'all' ? 'bg-cyan-600 text-white' : 'bg-slate-700/50 text-slate-400'
                                    }`}
                                onClick={() => setSelectedOwnedCategory('all')}
                            >
                                📋 Всі
                            </button>
                            {Object.entries(categories).map(([catId, cat]) => (
                                <button
                                    key={catId}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-bold min-w-fit ${selectedOwnedCategory === catId ? 'bg-cyan-600 text-white' : 'bg-slate-700/50 text-slate-400'
                                        }`}
                                    onClick={() => setSelectedOwnedCategory(catId)}
                                >
                                    {cat.icon} {cat.name}
                                </button>
                            ))}
                        </div>

                        <div className="space-y-2">
                            {filteredOwnedBuildings.length === 0 ? (
                                <div className="text-center py-10 bg-slate-800/30 rounded-xl">
                                    <span className="text-4xl opacity-50">🏝️</span>
                                    <p className="text-slate-400 mt-2">
                                        {buildings.length === 0
                                            ? "Ви ще нічого не побудували"
                                            : "У цій категорії немає будівель"
                                        }
                                    </p>
                                    {buildings.length === 0 && (
                                        <button
                                            className="mt-4 text-cyan-400 font-bold hover:underline"
                                            onClick={() => setSubTab('shop')}
                                        >
                                            Перейти в магазин
                                        </button>
                                    )}
                                </div>
                            ) : (
                                filteredOwnedBuildings.map((building) => (
                                    <BuildingCard
                                        key={building.id}
                                        building={building}
                                        residents={residents}
                                        onClick={() => setSelectedBuildingId(building.id)}
                                    />
                                ))
                            )}
                        </div>
                    </>
                )}

                {subTab === 'shop' && (
                    <>
                        {/* Era/Tier Filter - wrapped, modern chips */}
                        <div className="flex flex-wrap gap-2 pb-2 shrink-0">
                            {[1, 2, 3, 4, 5].map((tier) => {
                                const icon = tier === 1 ? '⛺' : tier === 2 ? '🏠' : tier === 3 ? '🏘️' : tier === 4 ? '🏭' : '🏰';
                                const label = ['І', 'ІІ', 'ІІІ', 'IV', 'V'][tier - 1];
                                const active = selectedTier >= tier;
                                return (
                                    <button
                                        key={tier}
                                        className={`px-3 py-1.5 rounded-xl text-sm font-bold shadow-sm transition-colors ${active
                                            ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-cyan-800/50'
                                            : 'bg-slate-800/70 text-slate-300 border border-slate-700 hover:border-cyan-500/50'
                                            }`}
                                        onClick={() => setSelectedTier(tier)}
                                        title={`Епоха ${label}`}
                                    >
                                        <span className="mr-2">{icon}</span>Епоха {label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Category Filter for Shop - wrapped pills */}
                        <div className="flex flex-wrap gap-2 pb-3 shrink-0">
                            <button
                                className={`px-3 py-1.5 rounded-xl text-sm font-bold ${selectedCategory === 'all' ? 'bg-cyan-600 text-white shadow-cyan-800/50' : 'bg-slate-800/70 text-slate-300 border border-slate-700 hover:border-cyan-500/50'
                                    }`}
                                onClick={() => setSelectedCategory('all')}
                            >
                                📋 Всі
                            </button>
                            {Object.entries(categories).map(([catId, cat]) => (
                                <button
                                    key={catId}
                                    className={`px-3 py-1.5 rounded-xl text-sm font-bold min-w-fit ${selectedCategory === catId ? 'bg-cyan-600 text-white shadow-cyan-800/50' : 'bg-slate-800/70 text-slate-300 border border-slate-700 hover:border-cyan-500/50'
                                        }`}
                                    onClick={() => setSelectedCategory(catId)}
                                >
                                    {cat.icon} {cat.name}
                                </button>
                            ))}
                        </div>

                        {/* Build List */}
                        <div className="grid grid-cols-2 gap-2 pb-10">
                            {filteredShopBuildings.map((buildingConfig) => {
                                const limit = getBuildingLimit(buildingConfig);
                                const currentCount = buildingCounts[buildingConfig.id] || 0;
                                const atLimit = currentCount >= limit;
                                const canBuild = !atLimit && canAfford(buildingConfig.cost);
                                const tierIcon = buildingConfig.tier === 1 ? '⛺' : buildingConfig.tier === 2 ? '🏠' : buildingConfig.tier === 3 ? '🏘️' : buildingConfig.tier === 4 ? '🏭' : '🏰';
                                const tierLabel = ['І', 'ІІ', 'ІІІ', 'IV', 'V'][buildingConfig.tier - 1] || buildingConfig.tier;
                                return (
                                    <motion.button
                                        key={buildingConfig.id}
                                        className={`relative overflow-hidden rounded-2xl p-3 text-left border transition-all ${canBuild
                                            ? 'border-slate-700/60 bg-slate-800/70 hover:border-cyan-500/50 hover:shadow-[0_10px_30px_rgba(34,211,238,0.15)]'
                                            : 'border-slate-700/60 bg-slate-800/50 opacity-70'
                                            }`}
                                        onClick={() => handleBuild(buildingConfig)}
                                        disabled={!canBuild}
                                        whileTap={{ scale: canBuild ? 0.98 : 1 }}
                                    >
                                        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-500/40 via-blue-500/30 to-purple-500/20" />
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="text-3xl">{buildingConfig.icon}</span>
                                            <div className="flex-1">
                                                <span className="text-white font-bold text-base line-clamp-1">{buildingConfig.name}</span>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-700/60 text-cyan-300 font-semibold text-[11px]">
                                                        {tierIcon} Епоха {tierLabel}
                                                    </span>
                                                    <span className={`text-[11px] px-2 py-0.5 rounded-full ${atLimit ? 'bg-red-900/40 text-red-200' : 'bg-emerald-900/30 text-emerald-300'}`}>
                                                        Ліміт {currentCount}/{limit}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-slate-300 text-xs mb-3 line-clamp-2 min-h-[32px]">{buildingConfig.description}</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {Object.entries(buildingConfig.cost || {}).map(([res, amount]) => (
                                                <span
                                                    key={res}
                                                    className={`text-xs rounded-lg px-2 py-1 border ${(resources[res] || 0) >= amount
                                                        ? 'border-slate-600 bg-slate-700/70 text-slate-100'
                                                        : 'border-red-700/50 bg-red-900/40 text-red-200'
                                                        }`}
                                                >
                                                    {RESOURCES[res]?.icon} {amount}
                                                </span>
                                            ))}
                                        </div>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </>
                )}
            </motion.div>

            {/* Details Modal */}
            <BuildingDetailsModal
                isOpen={!!selectedBuilding}
                onClose={() => setSelectedBuildingId(null)}
                building={selectedBuilding}
                residents={residents}
                allBuildings={buildings}
                weather={weather}
                onUnassign={unassignWorker}
                onAssign={(residentId) => assignWorker(residentId, selectedBuilding.id)}
                onUpgrade={() => handleUpgrade(selectedBuilding)}
                resources={resources}
            />
        </div>
    );
}

function BuildingCard({ building, residents, weather, onClick }) {
    const assignedWorkers = residents.filter(r => r.assignedBuildingId === building.id);
    const config = CONFIG.buildings[building.configId] || {};
    const cycle = calculateBuildingCycle(building, config, residents, weather);
    const productionEntries = Object.entries(cycle.production);
    const consumptionEntries = Object.entries(cycle.consumption);

    return (
        <motion.div
            className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50 cursor-pointer active:scale-[0.99] transition-transform"
            onClick={onClick}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="text-3xl">{config.icon || '🏠'}</span>
                    <div>
                        <p className="text-white font-bold">{config.name || building.configId}</p>
                        <p className="text-slate-400 text-xs">Рівень {building.level} · {config.category}</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="bg-slate-700/50 px-2 py-1 rounded-lg">
                        <p className="text-cyan-400 font-bold text-sm">{assignedWorkers.length} / {config.slots || 0} 👷</p>
                        <p className="text-slate-500 text-[10px]">Ефективність {Math.round(cycle.efficiency * 100)}%</p>
                    </div>
                </div>
            </div>

            <div className="mt-2 flex flex-wrap gap-2 text-xs">
                {productionEntries.length > 0 ? productionEntries.map(([res, amount]) => (
                    <span key={res} className="flex items-center gap-1 text-green-400 bg-green-500/10 px-2 py-1 rounded-lg">
                        +{formatCycleValue(amount)} {RESOURCES[res]?.icon || '📦'}/цикл
                    </span>
                )) : (
                    <span className="text-slate-500">Немає виробництва</span>
                )}

                {consumptionEntries.map(([res, amount]) => (
                    <span key={res} className="flex items-center gap-1 text-red-400 bg-red-500/10 px-2 py-1 rounded-lg">
                        -{formatCycleValue(amount)} {RESOURCES[res]?.icon || '📦'}/цикл
                    </span>
                ))}
            </div>
        </motion.div>
    );
}

/**
 * Residents tab
 */


function ResidentsTab({ residents, buildings }) {
    const assignWorker = useGameStore((state) => state.assignWorker);
    const unassignWorker = useGameStore((state) => state.unassignWorker);
    const [selectedWorker, setSelectedWorker] = useState(null);

    return (
        <motion.div
            className="space-y-4 pb-28"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
        >
            {residents.length === 0 ? (
                <div className="bg-slate-800/60 rounded-xl p-6 text-center">
                    <span className="text-4xl">🚣</span>
                    <p className="text-white font-bold mt-2">Ще немає жителів</p>
                    <p className="text-slate-400 text-sm">Вирушайте в море та рятуйте людей!</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {residents.map((resident) => (
                        <ResidentCard
                            key={resident.id}
                            resident={resident}
                            buildings={buildings}
                            onAssignClick={() => setSelectedWorker(resident)}
                            onUnassign={() => unassignWorker(resident.id)}
                        />
                    ))}
                </div>
            )}

            <WorkerAssignmentModal
                isOpen={!!selectedWorker}
                onClose={() => setSelectedWorker(null)}
                worker={selectedWorker}
                buildings={buildings}
                residents={residents}
                onAssign={(buildingId) => assignWorker(selectedWorker.id, buildingId)}
            />
        </motion.div>
    );
}

function ResidentCard({ resident, buildings, onAssignClick, onUnassign }) {
    const professionEmojis = {
        worker: '👷',
        fisher: '🎣',
        scientist: '👨‍🔬',
        pilot: '👨‍✈️',
        engineer: '👨‍🔧',
        doctor: '👨‍⚕️',
        vip: '👑',
        strongman: '💪'
    };

    const isWorking = !!resident.assignedBuildingId;

    return (
        <div className={`bg-slate-800/60 rounded-xl p-3 border ${isWorking ? 'border-green-500/30' : 'border-slate-700/50'
            }`}>
            <div className="flex items-center gap-3">
                <span className="text-3xl">{professionEmojis[resident.profession] || '🙋'}</span>
                <div className="flex-1">
                    <p className="text-white font-bold">{resident.name}</p>
                    <p className="text-slate-400 text-xs capitalize">{resident.profession} · Рівень {resident.level || 1}</p>
                    <div className="flex gap-2 mt-1">
                        <span className="text-xs text-green-400">❤️ {resident.health}%</span>
                        <span className="text-xs text-yellow-400">😊 {resident.mood}%</span>
                    </div>
                </div>
                <div>
                    {isWorking ? (
                        <motion.button
                            className="bg-red-600/20 text-red-400 px-2 py-1 rounded text-xs border border-red-500/30"
                            onClick={onUnassign}
                            whileTap={{ scale: 0.95 }}
                        >
                            Звільнити
                        </motion.button>
                    ) : (
                        <motion.button
                            className="bg-cyan-600/20 text-cyan-400 px-2 py-1 rounded text-xs border border-cyan-500/30"
                            onClick={onAssignClick}
                            whileTap={{ scale: 0.95 }}
                            disabled={buildings.length === 0}
                        >
                            Призначити
                        </motion.button>
                    )}
                </div>
            </div>
        </div>
    );
}

/**
 * Inventory tab - resource storage overview
 */
function InventoryTab({ resources }) {
    const resourceLimits = useGameStore((state) => state.resourceLimits);

    // Group resources by category
    const resourceCategories = {
        building: { name: 'Будівельні', icon: '🏗️', items: ['wood', 'stone', 'metal', 'plastic'] },
        consumable: { name: 'Споживання', icon: '🍖', items: ['food', 'water'] },
        energy: { name: 'Енергія', icon: '⚡', items: ['energy', 'coal'] },
        special: { name: 'Особливі', icon: '🌟', items: ['science', 'money'] }
    };

    return (
        <motion.div
            className="space-y-4 h-full overflow-y-auto pr-1 pb-28 custom-scrollbar"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
        >
            {Object.entries(resourceCategories).map(([catKey, category]) => (
                <div key={catKey} className="bg-slate-800/60 rounded-xl p-4">
                    <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                        <span>{category.icon}</span> {category.name}
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        {category.items.map((resKey) => {
                            const config = RESOURCES[resKey];
                            if (!config) return null;
                            const value = resources[resKey] || 0;
                            const limit = resourceLimits[resKey];
                            const percent = limit ? Math.min(100, (value / limit) * 100) : 0;

                            return (
                                <div key={resKey} className="bg-slate-700/50 rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl">{config.icon}</span>
                                            <span className="text-white font-bold text-sm">{config.name}</span>
                                        </div>
                                        <span className="text-cyan-400 font-bold text-sm">
                                            {formatNumber(value)}
                                            {limit && <span className="text-slate-500 text-xs">/{formatNumber(limit)}</span>}
                                        </span>
                                    </div>
                                    {limit && (
                                        <div className="h-1.5 bg-slate-600 rounded-full overflow-hidden">
                                            <motion.div
                                                className={`h-full rounded-full ${percent > 80 ? 'bg-green-500' :
                                                    percent > 30 ? 'bg-cyan-500' : 'bg-red-500'
                                                    }`}
                                                initial={{ width: 0 }}
                                                animate={{ width: `${percent}%` }}
                                                transition={{ duration: 0.5 }}
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </motion.div>
    );
}

function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return Math.floor(num).toString();
}

// Helpers to show real per-cycle production/consumption based on workers
function calculateBuildingCycle(building, config, residents, weather) {
    const workerCount = residents.filter(r => r.assignedBuildingId === building.id).length;
    const maxSlots = config.slots || 0;
    const efficiency = maxSlots > 0 ? Math.min(1, workerCount / maxSlots) : 1;
    const levelBonus = 1 + (building.level - 1) * 0.15;
    const weatherBonus = (config.output === 'water' && weather?.effects?.waterBonus)
        ? 1 + weather.effects.waterBonus / 100
        : 1;

    const production = {};
    const baseOutput = config.baseOutput ?? config.base_output ?? 0;
    if (typeof config.output === 'string' && baseOutput) {
        production[config.output] = Math.floor(baseOutput * efficiency * levelBonus * weatherBonus);
    } else if (config.output && typeof config.output === 'object') {
        Object.entries(config.output).forEach(([res, amount]) => {
            production[res] = Math.floor((amount || 0) * efficiency * levelBonus * weatherBonus);
        });
    }

    const consumption = {};
    if (config.consumption) {
        Object.entries(config.consumption).forEach(([res, amount]) => {
            const value = (amount || 0) * efficiency;
            consumption[res] = Number.isInteger(value) ? value : Math.round(value * 10) / 10;
        });
    }

    return { workerCount, maxSlots, efficiency, production, consumption };
}

function formatCycleValue(value) {
    if (Number.isInteger(value)) return value;
    return value.toFixed(1);
}

function CloudButton({ icon, onClick, label }) {
    return (
        <motion.button
            className="bg-slate-700/50 hover:bg-cyan-600/50 p-1.5 rounded-lg border border-slate-600 hover:border-cyan-400 transition-colors"
            onClick={onClick}
            whileTap={{ scale: 0.9 }}
            title={label}
        >
            <span className="text-sm">{icon}{label}</span>
        </motion.button>
    );
}
