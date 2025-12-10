import { motion, AnimatePresence } from 'framer-motion';
import useUIStore from '../../stores/useUIStore';
import useGameStore from '../../stores/useGameStore';
import { CONFIG } from '../../game/config';
import styles from './MissionResultModal.module.css';

export default function MissionResultModal() {
    const isOpen = useUIStore((state) => state.missionResultModalOpen);
    const setModal = useUIStore((state) => state.setModal);
    const setScreen = useUIStore((state) => state.setScreen);
    const result = useGameStore((state) => state.lastMissionResult);
    const setMode = useGameStore((state) => state.setMode);

    const close = () => {
        setModal('missionResult', false);
        setMode('island');
        setScreen('island');
    };

    const mapName = result?.mapId ? (CONFIG.biomes?.find(b => b.id === result.mapId)?.name || result.mapId) : 'Мапа';
    const moneyReward = typeof result?.reward === 'number' ? result.reward : (result?.reward?.money || 0);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className={styles.backdrop}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <div
                        className={styles.scrim}
                        onClick={close}
                    />

                    <motion.div
                        className={styles.modal}
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    >
                        <div className={styles.header}>
                            <h3 className={styles.title}>
                                <span>✅</span> Місію виконано
                            </h3>
                            <button
                                onClick={close}
                                className={styles.closeButton}
                            >
                                ✕
                            </button>
                        </div>

                        <div className={styles.body}>
                            <div className={styles.row}>
                                <span className={styles.label}>Карта</span>
                                <span className={styles.value}>{mapName}</span>
                            </div>
                            <div className={styles.row}>
                                <span className={styles.label}>Місія</span>
                                <span className={styles.value}>#{result?.missionNumber || '?'}</span>
                            </div>
                            <div className={styles.row}>
                                <span className={styles.label}>Нагорода</span>
                                <span className={`${styles.value} ${styles.success}`}>{moneyReward}💰</span>
                            </div>
                            <div className={styles.row}>
                                <span className={styles.label}>Дистанція</span>
                                <span className={styles.value}>{result?.distance ?? 0} м</span>
                            </div>
                            <div className={styles.row}>
                                <span className={styles.label}>Час</span>
                                <span className={styles.value}>{result?.timeSeconds ?? 0} с</span>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
