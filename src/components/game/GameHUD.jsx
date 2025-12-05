import { motion } from 'framer-motion';
import useGameStore from '../../stores/useGameStore';
import useUIStore from '../../stores/useUIStore';

export default function GameHUD() {
    const { player } = useGameStore();
    const toggleGarage = useUIStore((state) => state.toggleGarage);

    // Armor percentage scaled to 20 tiers
    const hpPercent = player.isYacht && player.armorLvl > 0
        ? Math.max(0, (player.armorLvl / 20) * 100)
        : 0;

    const tempPercent = Math.max(0, Math.min(100, ((player.bodyTemp - 28) / (36.6 - 28)) * 100));
    const tempColor = tempPercent > 50 ? 'bg-orange-500' : 'bg-red-500';

    return (
        <>
            {/* Compact Top Bar - Money & Stats */}
            <motion.div
                className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-lg overflow-hidden z-10"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                {/* Money */}
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50">
                    <span className="text-lg">💵</span>
                    <span className="font-mono text-sm text-green-400 font-bold">
                        {player.money}
                    </span>
                </div>

                {/* Stats */}
                <div className="px-3 py-2 space-y-1.5">
                    {/* Armor */}
                    <div>
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                            <span className="text-[9px] text-slate-400">🛡️</span>
                            <span className="text-[9px] text-white font-bold">Lvl {player.armorLvl}</span>
                        </div>
                        <div className="w-24 bg-slate-800 h-1 rounded-full overflow-hidden">
                            <div
                                className="bg-green-500 h-full transition-all duration-300"
                                style={{ width: `${hpPercent}%` }}
                            />
                        </div>
                    </div>

                    {/* Temperature */}
                    <div>
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                            <span className="text-[9px] text-slate-400">🌡️</span>
                            <span className="text-[9px] text-white font-bold">
                                {player.bodyTemp.toFixed(1)}°
                            </span>
                        </div>
                        <div className="w-24 bg-slate-800 h-1 rounded-full overflow-hidden">
                            <div
                                className={`${tempColor} h-full transition-all duration-300`}
                                style={{ width: `${tempPercent}%` }}
                            />
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Workshop Button - Top Right */}
            <motion.button
                onClick={() => toggleGarage(true)}
                className="absolute top-3 right-3 bg-indigo-600 text-white p-2 rounded-lg border-2 border-indigo-800 z-10 hover:bg-indigo-500 active:scale-95 transition-all shadow-lg"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                <span className="text-xl">🛠️</span>
            </motion.button>
        </>
    );
}
