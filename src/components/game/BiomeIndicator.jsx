import { motion } from 'framer-motion';
import useGameStore from '../../stores/useGameStore';
import { CONFIG } from '../../game/config';

export default function BiomeIndicator() {
    const gameState = useGameStore((state) => state.gameState);
    const player = useGameStore((state) => state.player);

    if (!gameState || !player) return null;

    const currentBiome = CONFIG.biomes.find(b => player.y <= b.startY) || CONFIG.biomes[0];
    const currentIndex = CONFIG.biomes.indexOf(currentBiome);
    const nextBiome = CONFIG.biomes[currentIndex + 1];

    if (!nextBiome) {
        // Last biome
        return (
            <motion.div
                className="absolute top-3 left-1/2 transform -translate-x-1/2 bg-slate-900/85 backdrop-blur-sm rounded-lg px-3 py-1.5 max-w-[90vw]"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="flex items-center gap-2 text-white">
                    <span className="text-base">{getBiomeIcon(currentBiome.name)}</span>
                    <span className="font-bold text-[11px] whitespace-nowrap">{currentBiome.name}</span>
                    <span className="text-green-400 text-[10px] whitespace-nowrap">Макс. глибина</span>
                </div>
            </motion.div>
        );
    }

    const distanceToNext = Math.abs(player.y - nextBiome.startY);
    const totalDistance = Math.abs(currentBiome.startY - nextBiome.startY);
    const progress = Math.max(0, Math.min(1, 1 - (distanceToNext / totalDistance)));

    return (
        <motion.div
            className="absolute top-3 left-1/2 transform -translate-x-1/2 bg-slate-900/85 backdrop-blur-sm rounded-lg px-2.5 py-1 max-w-[92vw]"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            {/* Current biome */}
            <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-sm">{getBiomeIcon(currentBiome.name)}</span>
                <span className="font-bold text-white text-[11px] whitespace-nowrap">{currentBiome.name}</span>
            </div>

            {/* Distance and next biome */}
            <div className="flex items-center gap-1.5 text-[10px]">
                <span className="text-slate-300 font-bold whitespace-nowrap">{(distanceToNext / 1000).toFixed(0)} км</span>
                <span className="text-slate-400">→</span>
                <span className="text-cyan-400 font-semibold whitespace-nowrap">{nextBiome.name}</span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-0.5 bg-slate-700 rounded-full overflow-hidden mt-1">
                <motion.div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress * 100}%` }}
                    transition={{ duration: 0.3 }}
                />
            </div>
        </motion.div>
    );
}

function getBiomeIcon(biomeName) {
    switch (biomeName) {
        case 'Тропіки': return '🌴';
        case 'Атлантика': return '🌊';
        case 'Північне море': return '❄️';
        case 'Арктика': return '🧊';
        default: return '🌊';
    }
}
