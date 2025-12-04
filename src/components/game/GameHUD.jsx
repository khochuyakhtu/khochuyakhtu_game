import { motion } from 'framer-motion';
import useGameStore from '../../stores/useGameStore';
import useUIStore from '../../stores/useUIStore';

export default function GameHUD() {
    const { player } = useGameStore();
    const toggleGarage = useUIStore((state) => state.toggleGarage);

    // Armor percentage: 0 for no yacht or level 0, then scales up to 7
    // Level 0 = 0%, Level 1 = ~14%, Level 7 = 100%
    const hpPercent = player.isYacht && player.armorLvl > 0
        ? Math.max(0, (player.armorLvl / 7) * 100)
        : 0;

    const tempPercent = Math.max(0, Math.min(100, ((player.bodyTemp - 28) / (36.6 - 28)) * 100));
    const tempColor = tempPercent > 50 ? 'bg-orange-500' : 'bg-red-500';

    return (
        <>
            {/* Money (Top Left) */}
            <motion.div
                className="absolute top-3 left-3 bg-slate-900/90 border border-slate-700 px-3 py-2 rounded-lg flex items-center gap-3 min-w-[120px] z-10"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <span className="text-2xl">💵</span>
                <div>
                    <div className="text-[10px] text-slate-400 uppercase font-bold">
                        Бюджет
                    </div>
                    <div className="font-mono text-lg text-green-400">
                        {player.money}
                    </div>
                </div>
            </motion.div>

            {/* Stats (Top Left, below money) */}
            <motion.div
                className="absolute top-20 left-3 bg-slate-900/90 border border-slate-700 p-2 rounded-lg w-48 z-10"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                {/* HP/Armor */}
                <div className="mb-2">
                    <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-slate-400">🛡️ Броня</span>
                        <span className="text-white font-bold">Lvl {player.armorLvl}</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                            className="bg-green-500 h-full transition-all duration-300"
                            style={{ width: `${hpPercent}%` }}
                        />
                    </div>
                </div>

                {/* Temperature */}
                <div>
                    <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-slate-400">🌡️ Температура</span>
                        <span className="text-white font-bold">
                            {player.bodyTemp.toFixed(1)}°C
                        </span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                            className={`${tempColor} h-full transition-all duration-300`}
                            style={{ width: `${tempPercent}%` }}
                        />
                    </div>
                </div>
            </motion.div>

            {/* Biome (Top Right) */}
            <motion.div
                className="absolute top-3 right-3 bg-slate-900/90 border border-slate-700 px-3 py-2 rounded-lg text-right min-w-[100px] z-10"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <div className="text-sm font-bold text-cyan-400">
                    🏝️ Тропіки
                </div>
                <div className="text-[9px] text-slate-500 mt-1">
                    День: <span id="day-count">1</span>
                </div>
            </motion.div>

            {/* Workshop Button (Top Right, below biome) */}
            <motion.button
                onClick={() => toggleGarage(true)}
                className="absolute top-16 right-3 bg-indigo-600 text-white font-bold px-4 py-2 rounded-lg border-b-4 border-indigo-800 z-10 hover:bg-indigo-500 active:border-b-0 active:translate-y-1 transition-all"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <span>🛠️</span> <span className="text-sm">Майстерня</span>
            </motion.button>
        </>
    );
}
