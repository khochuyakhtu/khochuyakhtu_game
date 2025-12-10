import { motion } from 'framer-motion';
import { useState } from 'react';
import useGameStore from '../../stores/useGameStore';
import styles from './MissionPanel.module.css';

export default function MissionPanel() {
    const { gameState, player } = useGameStore();
    const [expanded, setExpanded] = useState(true);
    const mission = gameState.mission;

    if (!mission) return null;

    const distance = Math.round(Math.hypot(mission.tx - player.x, mission.ty - player.y));
    const distanceText = distance >= 1000
        ? `${(distance / 1000).toFixed(1)}km`
        : `${distance}m`;

    const rewardMoney = typeof mission.reward === 'number'
        ? mission.reward
        : (mission.reward?.money || 0);

    const missionTitle = mission.description || `Доставте вантаж (Місія ${mission.missionNumber || '?'})`;

    return (
        <motion.div
            className={styles.wrapper}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <div className={styles.header}>
                <div className={styles.label}>
                    Активна Місія
                </div>
                <button
                    onClick={() => setExpanded((prev) => !prev)}
                    className={styles.toggle}
                >
                    {expanded ? '−' : '+'}
                </button>
            </div>

            {expanded && (
                <div className={styles.body}>
                    <div className={styles.title}>
                        {missionTitle}
                    </div>
                    <div className={styles.meta}>
                        <span id="mission-dist">{distanceText}</span>
                        <span className={styles.reward} id="mission-reward">
                            ${rewardMoney}
                        </span>
                    </div>
                </div>
            )}
        </motion.div>
    );
}

