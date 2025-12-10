import { motion, AnimatePresence } from 'framer-motion';
import useUIStore from '../../stores/useUIStore';
import useGameStore from '../../stores/useGameStore';
import { CONFIG } from '../../game/config';

export default function MissionResultModal() {
    const isOpen = useUIStore((state) => state.missionResultModalOpen);
    const setModal = useUIStore((state) => state.setModal);
    const result = useGameStore((state) => state.lastMissionResult);

    const close = () => setModal('missionResult', false);

    const mapName = result?.mapId ? (CONFIG.biomes?.find(b => b.id === result.mapId)?.name || result.mapId) : 'Мапа';
    const moneyReward = typeof result?.reward === 'number' ? result.reward : (result?.reward?.money || 0);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <div
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                        onClick={close}
                    />

                    <motion.div
                        className="relative w-full max-w-md bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl p-6 space-y-4 text-white"
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    >
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <span>✅</span> Місію виконано
                            </h3>
                            <button
                                onClick={close}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 hover:bg-slate-700"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-2 text-sm text-slate-200">
                            <div className="flex justify-between">
                                <span className="text-slate-400">Карта</span>
                                <span className="font-semibold">{mapName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Місія</span>
                                <span className="font-semibold">#{result?.missionNumber || '?'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Нагорода</span>
                                <span className="font-semibold text-emerald-400">{moneyReward}💰</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Дистанція</span>
                                <span className="font-semibold">{result?.distance ?? 0} м</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Час</span>
                                <span className="font-semibold">{result?.timeSeconds ?? 0} с</span>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
