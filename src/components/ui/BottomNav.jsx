import { motion } from 'framer-motion';
import useGameStore from '../../stores/useGameStore';
import useUIStore from '../../stores/useUIStore';
import styles from './BottomNav.module.css';

export default function BottomNav({ activeTab, onTabChange }) {
    const setModal = useUIStore((state) => state.setModal);
    const weather = useGameStore((state) => state.island.weather);
    const canSail = weather?.effects?.canSail !== false;

    const tabs = [
        { id: 'overview', icon: '📊', label: 'Огляд' },
        { id: 'buildings', icon: '🏗️', label: 'Будівлі' },
        { id: 'residents', icon: '👥', label: 'Люди' },
        { id: 'inventory', icon: '📦', label: 'Склад' },
    ];

    const handleExpedition = () => {
        if (!canSail) return;
        setModal('missions', true);
    };

    return (
        <motion.div
            className={styles.wrapper}
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
            <div className={styles.inner}>
                {tabs.map((tab) => {
                    const active = activeTab === tab.id;
                    const tone = active ? styles.tabActive : styles.tab;
                    return (
                        <motion.button
                            key={tab.id}
                            className={tone}
                            onClick={() => onTabChange(tab.id)}
                            whileTap={{ scale: 0.95 }}
                        >
                            <span className={styles.icon}>{tab.icon}</span>
                            <span className={styles.label}>{tab.label}</span>
                        </motion.button>
                    );
                })}

                <motion.button
                    className={`${styles.expedition} ${canSail ? styles.expeditionReady : styles.expeditionBlocked}`}
                    onClick={handleExpedition}
                    whileTap={canSail ? { scale: 0.95 } : undefined}
                    disabled={!canSail}
                >
                    <span className={styles.icon}>{canSail ? '⛵' : '⛈️'}</span>
                    <span className={styles.label}>
                        {canSail ? 'В море!' : 'Шторм'}
                    </span>
                </motion.button>
            </div>
        </motion.div>
    );
}
