import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { CONFIG, RESOURCES, getBuildingUpgradeCost, getBuildingLimit } from '../../game/config';

export default function BuildingDetailsModal({ isOpen, onClose, building, residents, allBuildings = [], weather, onUnassign, onAssign, onUpgrade, resources }) {
    const [isSelecting, setIsSelecting] = useState(false);

    // Reset selection mode when modal opens/closes
    useEffect(() => {
        if (isOpen) setIsSelecting(false);
    }, [isOpen]);

    if (!isOpen || !building) return null;

    const buildingConfig = CONFIG.buildings[building.configId] || {};
    const assignedWorkers = residents.filter(r => r.assignedBuildingId === building.id);
    const availableWorkers = residents.filter(r => !r.assignedBuildingId);
    const freeSlots = (buildingConfig.slots || 0) - assignedWorkers.length;
    const cycle = calculateBuildingCycle(building, buildingConfig, residents, weather);
    const limit = getBuildingLimit(buildingConfig);
    const currentCount = (allBuildings || []).filter(b => b.configId === building.configId).length;
    const limitLabel = limit === Infinity ? '∞' : limit;
    const productionEntries = Object.entries(cycle.production);
    const consumptionEntries = Object.entries(cycle.consumption);

    const handleAssign = (workerId) => {
        onAssign(workerId);
        setIsSelecting(false);
    };

    // Upgrade Logic
    const upgradeCost = getBuildingUpgradeCost(buildingConfig.cost, building.level);
    const canAffordUpgrade = resources && Object.entries(upgradeCost).every(([res, amt]) => (resources[res] || 0) >= amt);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Modal Content */}
                    <motion.div
                        className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    >
                        {/* Header */}
                        <div className="p-4 bg-slate-800/50 flex items-center justify-between border-b border-slate-700/50">
                            <div className="flex items-center gap-3">
                                {isSelecting && (
                                    <button
                                        onClick={() => setIsSelecting(false)}
                                        className="text-slate-400 hover:text-white mr-2"
                                    >
                                        ←
                                    </button>
                                )}
                                <span className="text-4xl">{buildingConfig.icon}</span>
                                <div>
                                    <h2 className="text-xl font-bold text-white">
                                        {isSelecting ? 'Виберіть працівника' : buildingConfig.name}
                                    </h2>
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm text-cyan-400">Рівень {building.level}</p>
                                        {!isSelecting && onUpgrade && (
                                            <button
                                                className={`text-xs px-2 py-0.5 rounded border transition-colors ${canAffordUpgrade
                                                    ? 'bg-green-600/20 text-green-400 border-green-500/30 hover:bg-green-600/30'
                                                    : 'bg-slate-700 text-slate-500 border-slate-600 cursor-not-allowed'}`}
                                                onClick={canAffordUpgrade ? onUpgrade : undefined}
                                                disabled={!canAffordUpgrade}
                                            >
                                                ⬆️ Покращити
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-slate-400 hover:text-white p-2"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Upgrade Cost Preview (Only in detail mode) */}
                        {!isSelecting && (
                            <div className="bg-slate-900/50 py-1 px-4 border-b border-slate-800 flex items-center gap-2 overflow-x-auto custom-scrollbar">
                                <span className="text-xs text-slate-500 uppercase font-bold shrink-0">Вартість покращення:</span>
                                {Object.entries(upgradeCost).map(([res, amount]) => (
                                    <span
                                        key={res}
                                        className={`text-xs px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0 ${(resources && (resources[res] || 0) >= amount)
                                            ? 'text-slate-300 bg-slate-800'
                                            : 'text-red-300 bg-red-900/30'
                                            }`}
                                    >
                                        {RESOURCES[res]?.icon} {amount}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Body */}
                        <div className="p-4 space-y-6 max-h-[60vh] overflow-y-auto">
                            {isSelecting ? (
                                /* WORKER SELECTION MODE */
                                <div className="space-y-2">
                                    {availableWorkers.length === 0 ? (
                                        <div className="text-center py-8 text-slate-500">
                                            <p>Немає вільних працівників</p>
                                        </div>
                                    ) : (
                                        availableWorkers.map(worker => (
                                            <div key={worker.id} className="flex items-center justify-between bg-slate-800/50 p-3 rounded-xl border border-slate-700/50 hover:border-cyan-500/50 transition-colors cursor-pointer" onClick={() => handleAssign(worker.id)}>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-2xl">
                                                        {{
                                                            worker: '👷', fisher: '🎣', scientist: '👨‍🔬',
                                                            pilot: '👨‍✈️', engineer: '👨‍🔧', doctor: '👨‍⚕️'
                                                        }[worker.profession] || '🙋'}
                                                    </span>
                                                    <div>
                                                        <p className="text-white font-bold text-sm">{worker.name}</p>
                                                        <p className="text-slate-500 text-xs capitalize">{worker.profession}</p>
                                                    </div>
                                                </div>
                                                <button className="bg-cyan-600/20 text-cyan-400 text-xs px-3 py-1.5 rounded-lg border border-cyan-500/30">
                                                    Найняти
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            ) : (
                                /* DETAILS MODE */
                                <>
                                    {/* Description */}
                                    <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/30">
                                        <p className="text-slate-300 text-sm leading-relaxed">
                                            {buildingConfig.description}
                                        </p>
                                    </div>

                                    {/* Stats */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-slate-800/30 p-3 rounded-lg border border-slate-700/30">
                                            <p className="text-xs text-slate-500 mb-1">Поточне виробництво</p>
                                            <div className="space-y-1">
                                                {productionEntries.length > 0 ? productionEntries.map(([res, amount]) => (
                                                    <div key={res} className="text-green-400 font-bold flex items-center gap-2">
                                                        <span>{RESOURCES[res]?.icon || '📦'}</span>
                                                        <span>{formatCycleValue(amount)}/цикл</span>
                                                    </div>
                                                )) : (
                                                    <p className="text-slate-500 text-sm">Немає виробництва</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="bg-slate-800/30 p-3 rounded-lg border border-slate-700/30">
                                            <p className="text-xs text-slate-500 mb-1">Споживання</p>
                                            <div className="space-y-1">
                                                {consumptionEntries.length > 0 ? consumptionEntries.map(([res, amount]) => (
                                                    <div key={res} className="text-red-400 font-bold flex items-center gap-2">
                                                        <span>{RESOURCES[res]?.icon || '📦'}</span>
                                                        <span>-{formatCycleValue(amount)}/цикл</span>
                                                    </div>
                                                )) : (
                                                    <p className="text-slate-500 text-sm">Немає споживання</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="bg-slate-800/30 p-3 rounded-lg border border-slate-700/30">
                                            <p className="text-xs text-slate-500 mb-1">Ліміт будівлі</p>
                                            <p className="text-white font-bold">
                                                {currentCount}/{limitLabel}
                                            </p>
                                        </div>
                                        <div className="bg-slate-800/30 p-3 rounded-lg border border-slate-700/30 col-span-2">
                                            <p className="text-xs text-slate-500 mb-1">Працівники</p>
                                            <p className="text-white font-bold">
                                                {assignedWorkers.length} / {buildingConfig.slots || 0} · ефективність {Math.round(cycle.efficiency * 100)}%
                                            </p>
                                        </div>
                                    </div>

                                    {/* UPGRADE PREVIEW - Only when not selecting workers */}
                                    {!isSelecting && onUpgrade && (
                                        <div className="bg-gradient-to-r from-cyan-900/30 to-blue-900/30 p-3 rounded-xl border border-cyan-500/20">
                                            <p className="text-xs text-cyan-400 font-bold mb-2 uppercase tracking-wide">
                                                Бонуси наступного рівня ({building.level + 1}):
                                            </p>

                                            <div className="space-y-1">
                                                {/* Production Bonus Preview */}
                                                {buildingConfig.base_output && (
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-slate-400">Виробництво:</span>
                                                        <div className="flex gap-2 items-center">
                                                            <span className="text-slate-300">
                                                                {Math.floor(buildingConfig.base_output * (1 + (building.level - 1) * 0.15))}
                                                            </span>
                                                            <span className="text-cyan-500">→</span>
                                                            <span className="text-green-400 font-bold">
                                                                {Math.floor(buildingConfig.base_output * (1 + (building.level) * 0.15))}
                                                            </span>
                                                            <span className="text-slate-500 text-[10px]">({RESOURCES[buildingConfig.output]?.icon})</span>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Population Bonus Preview */}
                                                {buildingConfig.populationBonus && (
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-slate-400">Місця для жителів:</span>
                                                        <div className="flex gap-2 items-center">
                                                            <span className="text-slate-300">
                                                                {buildingConfig.populationBonus * building.level}
                                                            </span>
                                                            <span className="text-cyan-500">→</span>
                                                            <span className="text-green-400 font-bold">
                                                                {buildingConfig.populationBonus * (building.level + 1)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Storage Bonus Preview */}
                                                {buildingConfig.effect?.type === 'storage' && buildingConfig.effect.bonus && (
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-slate-400">Місткість складу:</span>
                                                        <div className="flex gap-2 items-center">
                                                            <span className="text-slate-300">
                                                                +{buildingConfig.effect.bonus * building.level}
                                                            </span>
                                                            <span className="text-cyan-500">→</span>
                                                            <span className="text-green-400 font-bold">
                                                                +{buildingConfig.effect.bonus * (building.level + 1)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Effect Bonus Preview (Mood/Health) */}
                                                {buildingConfig.effect && buildingConfig.effect.value && (
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-slate-400">
                                                            {{
                                                                mood: 'Бонус до настрою',
                                                                health: 'Бонус до здоров\'я',
                                                                repair_per_sec: 'Ремонт'
                                                            }[buildingConfig.effect.type] || 'Ефективність'}:
                                                        </span>
                                                        <div className="flex gap-2 items-center">
                                                            <span className="text-slate-300">
                                                                {Math.round(buildingConfig.effect.value * (1 + (building.level - 1) * 0.1))}
                                                            </span>
                                                            <span className="text-cyan-500">→</span>
                                                            <span className="text-green-400 font-bold">
                                                                {Math.round(buildingConfig.effect.value * (1 + building.level * 0.1))}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Workers List */}
                                    <div>
                                        <div className="flex justify-between items-center mb-3">
                                            <h3 className="text-white font-bold flex items-center gap-2">
                                                👷 Працівники ({assignedWorkers.length})
                                            </h3>
                                            {freeSlots > 0 && availableWorkers.length > 0 && (
                                                <button
                                                    className="bg-cyan-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow hover:bg-cyan-500 transition-colors"
                                                    onClick={() => setIsSelecting(true)}
                                                >
                                                    + Найняти
                                                </button>
                                            )}
                                        </div>

                                        {assignedWorkers.length === 0 ? (
                                            <div className="text-center py-6 bg-slate-800/20 rounded-xl border border-dashed border-slate-700">
                                                <p className="text-slate-500 text-sm">Ніхто тут не працює</p>
                                                {freeSlots > 0 && (
                                                    <p className="text-slate-600 text-xs mt-1">
                                                        Натисніть "Найняти" щоб додати працівника
                                                    </p>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {assignedWorkers.map(worker => (
                                                    <div key={worker.id} className="flex items-center justify-between bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-2xl">
                                                                {{
                                                                    worker: '👷', fisher: '🎣', scientist: '👨‍🔬',
                                                                    pilot: '👨‍✈️', engineer: '👨‍🔧', doctor: '👨‍⚕️'
                                                                }[worker.profession] || '🙋'}
                                                            </span>
                                                            <div>
                                                                <p className="text-white font-bold text-sm">{worker.name}</p>
                                                                <p className="text-slate-500 text-xs capitalize">{worker.profession}</p>
                                                            </div>
                                                        </div>
                                                        <motion.button
                                                            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs px-3 py-1.5 rounded-lg border border-red-500/30"
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={() => onUnassign(worker.id)}
                                                        >
                                                            Звільнити
                                                        </motion.button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>

                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

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
