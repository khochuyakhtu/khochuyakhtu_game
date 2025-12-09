import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useUIStore from '../../stores/useUIStore';
import useGameStore from '../../stores/useGameStore';
import { CONFIG } from '../../game/config';

export default function MissionsModal() {
    const isOpen = useUIStore((state) => state.missionsModalOpen);
    const setModal = useUIStore((state) => state.setModal);
    const setScreen = useUIStore((state) => state.setScreen);
    const setMode = useGameStore((state) => state.setMode);

    // Group missions by biome (map)
    const missionsByBiome = useMemo(() => {
        if (!CONFIG.missions) return {};
        const groups = {};

        // Ensure biomes are initialized even if no missions
        if (CONFIG.biomes) {
            CONFIG.biomes.forEach(biome => {
                groups[biome.id] = {
                    name: biome.name,
                    color: biome.color,
                    missions: []
                };
            });
        }

        Object.values(CONFIG.missions).forEach(mission => {
            if (!groups[mission.mapId]) {
                groups[mission.mapId] = { name: 'Unknown', color: '#888', missions: [] };
            }
            groups[mission.mapId].missions.push(mission);
        });

        // Sort missions by number
        Object.values(groups).forEach(group => {
            group.missions.sort((a, b) => a.missionNumber - b.missionNumber);
        });

        return groups;
    }, [isOpen]); // Re-calc when opened

    const handleClose = () => setModal('missions', false);

    const handleStartMission = (mission) => {
        // TODO: potential logic to check requirements or unlock status
        console.log('Starting mission:', mission);

        // Prepare game state for mission
        // setMission(mission.id) // If we had such action

        // Close modal and switch screen
        handleClose();
        setMode('expedition');
        setScreen('game');
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                    />

                    <motion.div
                        className="relative w-full max-w-4xl bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                <span>🗺️</span> Вибір Місії
                            </h2>
                            <button
                                onClick={handleClose}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-700 hover:bg-slate-600 transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                            {Object.entries(missionsByBiome).map(([mapId, group]) => (
                                group.missions.length > 0 && (
                                    <div key={mapId} className="space-y-3">
                                        <h3
                                            className="text-lg font-bold sticky top-0 bg-slate-900/95 py-2 px-1 border-b border-slate-800 z-10"
                                            style={{ color: group.color || '#fff' }}
                                        >
                                            {group.name}
                                        </h3>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {group.missions.map(mission => (
                                                <motion.button
                                                    key={mission.id}
                                                    onClick={() => handleStartMission(mission)}
                                                    className="flex flex-col gap-2 p-3 bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-700 hover:border-cyan-500/50 rounded-xl transition-all text-left group relative overflow-hidden"
                                                    whileHover={{ y: -2 }}
                                                >
                                                    {/* Background progress bar or status could go here */}

                                                    <div className="flex justify-between items-start">
                                                        <span className="font-bold text-slate-200">
                                                            Місія {mission.missionNumber}
                                                        </span>
                                                        {mission.difficulty > 5 && (
                                                            <span className="text-xs bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">
                                                                Hard
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="text-xs text-slate-400">
                                                        Нагорода:
                                                        <span className="text-emerald-400 font-mono ml-1">
                                                            {mission.reward?.money || 0}💰
                                                        </span>
                                                        {Object.entries(mission.reward || {})
                                                            .filter(([k]) => k !== 'money' && k !== 'event')
                                                            .map(([k, v]) => (
                                                                <span key={k} className="ml-2 text-slate-300">
                                                                    +{v} {k === 'wood' ? '🪵' : k}
                                                                </span>
                                                            ))
                                                        }
                                                    </div>

                                                    {mission.requirements && Object.keys(mission.requirements).length > 0 && (
                                                        <div className="text-[10px] text-amber-500/80 mt-1">
                                                            🔒 Вимоги: {Object.keys(mission.requirements).join(', ')}
                                                        </div>
                                                    )}
                                                </motion.button>
                                            ))}
                                        </div>
                                    </div>
                                )
                            ))}

                            {Object.keys(missionsByBiome).length === 0 && (
                                <div className="text-center text-slate-500 py-10">
                                    Місії не знайдено. Перевірте з'єднання з сервером.
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
