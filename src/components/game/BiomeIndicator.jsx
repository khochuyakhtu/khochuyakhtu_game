import { motion } from 'framer-motion';
import useGameStore from '../../stores/useGameStore';
import { CONFIG } from '../../game/config';
import styles from './BiomeIndicator.module.css';

export default function BiomeIndicator() {
    const gameState = useGameStore((state) => state.gameState);
    const player = useGameStore((state) => state.player);

    if (!gameState || !player) return null;

    // Find the deepest biome that satisfies the condition (last one in the list that matches)
    const currentBiome = [...CONFIG.biomes].reverse().find(b => player.y <= b.startY) || CONFIG.biomes[0];
    const currentIndex = CONFIG.biomes.indexOf(currentBiome);
    const nextBiome = CONFIG.biomes[currentIndex + 1];

    if (!nextBiome) {
        // Last biome
        return (
            <motion.div
                className={styles.wrapper}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className={styles.row}>
                    <span className={styles.icon}>{getBiomeIcon(currentBiome.name)}</span>
                    <span className={styles.name}>{currentBiome.name}</span>
                    <span className={styles.depth}>Макс. глибина</span>
                </div>
            </motion.div>
        );
    }

    const distanceToNext = Math.abs(player.y - nextBiome.startY);
    const totalDistance = Math.abs(currentBiome.startY - nextBiome.startY);
    const progress = Math.max(0, Math.min(1, 1 - (distanceToNext / totalDistance)));

    return (
        <motion.div
            className={styles.wrapper}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <div className={styles.row}>
                <span className={styles.icon}>{getBiomeIcon(currentBiome.name)}</span>
                <span className={styles.name}>{currentBiome.name}</span>
            </div>

            <div className={styles.meta}>
                <span className={styles.distance}>{(distanceToNext / 1000).toFixed(0)} км</span>
                <span className={styles.arrow}>→</span>
                <span className={styles.next}>{nextBiome.name}</span>
            </div>

            <div className={styles.progressTrack}>
                <motion.div
                    className={styles.progressFill}
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
