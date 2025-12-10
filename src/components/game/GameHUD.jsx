import { motion } from 'framer-motion';
import { useState } from 'react';
import useGameStore from '../../stores/useGameStore';
import useUIStore from '../../stores/useUIStore';
import ResourceBar from '../ui/ResourceBar';
import StatusIndicators from '../ui/StatusIndicators';
import { RESOURCES } from '../../game/config';

export default function GameHUD() {
    const { player, resources, yacht, mode, gameState } = useGameStore();
    const toggleGarage = useUIStore((state) => state.toggleGarage);
    const missionActive = !!gameState?.mission;
    const [topCollapsed, setTopCollapsed] = useState(false);
    const [bottomCollapsed, setBottomCollapsed] = useState(false);
    const calendar = gameState?.calendar || { day: 1, week: 1, month: 1, year: 1 };

    // Armor percentage scaled to 50 tiers now
    const hpPercent = player.isYacht && player.armorLvl > 0
        ? Math.max(0, (player.armorLvl / 50) * 100)
        : 0;

    const tempPercent = Math.max(0, Math.min(100, ((player.bodyTemp - 28) / (36.6 - 28)) * 100));
    const tempColor = tempPercent > 50 ? 'bg-orange-500' : 'bg-red-500';

    // Yacht HP bar (new)
    const yachtHpPercent = yacht.maxHp > 0 ? (yacht.hp / yacht.maxHp) * 100 : 0;

    return (
        <>
            {/* Top Bar - Resources (Island Mode) or Expedition Stats */}
            <motion.div
                className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-start gap-2"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="flex items-center gap-2">
                    {!topCollapsed && <ResourceBar />}
                    <button
                        className="bg-slate-900/80 text-slate-200 text-xs px-2 py-1 rounded-lg border border-slate-700"
                        onClick={() => setTopCollapsed((v) => !v)}
                    >
                        {topCollapsed ? '▼' : '▲'}
                    </button>
                </div>

                {/* Expedition-specific stats */}
                {mode === 'expedition' && (
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="bg-slate-900/90 backdrop-blur-sm border border-slate-700 rounded-lg px-3 py-1.5 flex items-center gap-3 min-w-[160px]">
                            <div className="flex items-center gap-1">
                                <span className="text-lg">💵</span>
                                <span className="font-mono text-sm text-green-400 font-bold">
                                    {formatNumber(resources.money)}
                                </span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-slate-200">
                                🌡️ <span className="font-semibold">{player.bodyTemp.toFixed(1)}°</span>
                            </div>
                        </div>

                        <div className="bg-slate-900/90 backdrop-blur-sm border border-slate-700 rounded-lg px-3 py-1.5 flex items-center gap-3 min-w-[200px]">
                            {player.isYacht && yacht.maxHp > 0 && (
                                <div className="flex items-center gap-1 w-[90px]">
                                    <span className="text-[11px] text-slate-300">HP</span>
                                    <div className="flex-1 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                        <div
                                            className="bg-red-500 h-full transition-all duration-300"
                                            style={{ width: `${yachtHpPercent}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-1">
                                <span className="text-[11px] text-slate-300">🛡️</span>
                                <span className="text-[11px] text-white font-bold">Lvl {player.armorLvl}</span>
                            </div>

                            <div className="flex items-center gap-1 w-[80px]">
                                <span className="text-[11px] text-slate-300">🌡️</span>
                                <div className="flex-1 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                    <div
                                        className={`${tempColor} h-full transition-all duration-300`}
                                        style={{ width: `${tempPercent}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                    </div>
                )}
            </motion.div>

            {/* Top Right - Status Indicators (Island mode) or Workshop button */}
            <motion.div
                className="absolute top-3 right-3 z-30 flex flex-col gap-2 items-end"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
            >
                {/* Status Indicators (for island mode) */}
                {mode === 'island' && <StatusIndicators />}

                {/* Workshop Button */}
                <motion.button
                    onClick={() => toggleGarage(true)}
                    className="bg-indigo-600 text-white p-2 rounded-lg border-2 border-indigo-800 hover:bg-indigo-500 active:scale-95 transition-all shadow-lg"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <span className="text-xl">🛠️</span>
                </motion.button>

                {/* Mode Switch Button */}
                {!(mode === 'expedition' && missionActive) && (
                    <motion.button
                        onClick={() => {
                            const gameStore = useGameStore.getState();
                            const uiStore = useUIStore.getState();

                            if (mode === 'expedition') {
                                // Switch to island mode and navigate
                                gameStore.setMode('island');
                                uiStore.setScreen('island');
                            } else {
                                // Switch to expedition mode
                                gameStore.setMode('expedition');
                                uiStore.setScreen('game');
                            }
                        }}
                        className="bg-cyan-600 text-white px-3 py-1.5 rounded-lg border-2 border-cyan-800 hover:bg-cyan-500 active:scale-95 transition-all shadow-lg text-sm font-bold"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        {mode === 'expedition' ? '🏝️ Острів' : '⛵ Море'}
                    </motion.button>
                )}
            </motion.div>
        </>
    );
}

/**
 * Quick view resource pill for expedition mode
 */
function ResourceQuickView({ type, value }) {
    const config = RESOURCES[type];
    if (!config || value === 0) return null;

    return (
        <div className="bg-slate-800/80 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1 border border-slate-700/50">
            <span className="text-sm">{config.icon}</span>
            <span className="text-xs text-white font-bold">{formatNumber(value)}</span>
        </div>
    );
}

/**
 * Format large numbers
 */
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'k';
    }
    return Math.floor(num).toString();
}
