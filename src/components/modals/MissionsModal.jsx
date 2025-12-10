import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useUIStore from '../../stores/useUIStore';
import useGameStore from '../../stores/useGameStore';
import { CONFIG } from '../../game/config';
import styles from './MissionsModal.module.css';

export default function MissionsModal() {
    const isOpen = useUIStore((state) => state.missionsModalOpen);
    const setModal = useUIStore((state) => state.setModal);
    const setScreen = useUIStore((state) => state.setScreen);
    const setMode = useGameStore((state) => state.setMode);
    const missionProgress = useGameStore((state) => state.expedition.missionProgress || {});
    const startMission = useGameStore((state) => state.startMission);
    const completeMission = useGameStore((state) => state.completeMission);

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
    }, [isOpen, missionProgress]); // Re-calc when opened or progress changes

    const mapOrder = useMemo(() => {
        if (CONFIG.biomes && CONFIG.biomes.length > 0) return CONFIG.biomes.map(b => b.id);
        return Object.keys(missionsByBiome);
    }, [missionsByBiome]);

    const isMapUnlocked = (mapId, index) => {
        if (index === 0) return true;
        const prevMapId = mapOrder[index - 1];
        const prevTotal = missionsByBiome[prevMapId]?.missions.length || 0;
        const prevProgress = missionProgress[prevMapId] || 0;
        return prevProgress >= prevTotal && prevTotal > 0;
    };

    const missionState = (mission, mapUnlocked) => {
        const progress = missionProgress[mission.mapId] || 0;
        const unlocked = mapUnlocked && mission.missionNumber <= progress + 1;
        const completed = mission.missionNumber <= progress;
        return { unlocked, completed };
    };

    const handleClose = () => setModal('missions', false);

    const handleStartMission = (mission) => {
        // TODO: potential logic to check requirements or unlock status
        console.log('Starting mission:', mission);
        startMission(mission);

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
                <div className={styles.backdrop}>
                    <motion.div
                        className={styles.scrim}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                    />

                    <motion.div
                        className={styles.modal}
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    >
                        <div className={styles.header}>
                            <h2 className={styles.title}>
                                <span>🗺️</span> Вибір Місії
                            </h2>
                            <button
                                onClick={handleClose}
                                className={styles.close}
                            >
                                ✕
                            </button>
                        </div>

                        <div className={styles.content}>
                            {mapOrder.map((mapId, idx) => {
                                const group = missionsByBiome[mapId];
                                if (!group || group.missions.length === 0) return null;

                                const mapUnlocked = isMapUnlocked(mapId, idx);
                                const progress = missionProgress[mapId] || 0;
                                const total = group.missions.length;
                                const progressText = `${Math.min(progress, total)} / ${total}`;

                                return (
                                    <div key={mapId} className={styles.biomeBlock}>
                                        {!mapUnlocked && (
                                            <div className={styles.lockOverlay}>
                                                Пройдіть усі місії на попередній карті, щоб розблокувати
                                            </div>
                                        )}

                                        <h3
                                            className={styles.biomeTitle}
                                            style={{ color: group.color || '#fff' }}
                                        >
                                            {group.name}
                                            <span className={styles.progress}>({progressText})</span>
                                        </h3>

                                        <div className={styles.missionGrid}>
                                            {group.missions.map(mission => {
                                                const { unlocked, completed } = missionState(mission, mapUnlocked);
                                                return (
                                                    <motion.button
                                                        key={mission.id}
                                                        onClick={() => unlocked && handleStartMission(mission)}
                                                        className={`${styles.missionCard} ${unlocked ? styles.missionCardActive : styles.missionCardLocked}`}
                                                        whileHover={unlocked ? { y: -2 } : undefined}
                                                    >
                                                        {completed && (
                                                            <span className={styles.completed}>✔</span>
                                                        )}
                                                        {!unlocked && !completed && (
                                                            <span className={styles.locked}>🔒</span>
                                                        )}

                                                        <div className={styles.missionHeader}>
                                                            <span className={styles.missionTitle}>
                                                                Місія {mission.missionNumber}
                                                            </span>
                                                            {mission.difficulty > 5 && (
                                                                <span className={styles.difficulty}>Hard</span>
                                                            )}
                                                        </div>

                                                        <div className={styles.rewardLine}>
                                                            Нагорода:
                                                            <span className={styles.rewardMoney}>
                                                                {mission.reward?.money || 0}💰
                                                            </span>
                                                            {Object.entries(mission.reward || {})
                                                                .filter(([k]) => k !== 'money' && k !== 'event')
                                                                .map(([k, v]) => (
                                                                    <span key={k} className={styles.rewardExtra}>
                                                                        +{v} {k === 'wood' ? '🪵' : k}
                                                                    </span>
                                                                ))
                                                            }
                                                        </div>

                                                        {mission.requirements && Object.keys(mission.requirements).length > 0 && (
                                                            <div className={styles.requirements}>
                                                                🔒 Вимоги: {Object.keys(mission.requirements).join(', ')}
                                                            </div>
                                                        )}
                                                    </motion.button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}

                            {Object.keys(missionsByBiome).length === 0 && (
                                <div className={styles.empty}>
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
