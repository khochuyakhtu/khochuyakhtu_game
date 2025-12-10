import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useUIStore from '../../stores/useUIStore';
import { cloudService } from '../../services/CloudService';
import { Haptics } from '../../game/config';
import styles from './LeaderboardScreen.module.css';

export default function LeaderboardScreen() {
    const setScreen = useUIStore((state) => state.setScreen);
    const [activeTab, setActiveTab] = useState('distance'); // distance, money, time
    const [leaderboard, setLeaderboard] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const tabs = [
        { id: 'distance', label: '🏴‍☠️ Туристи', icon: '🗺️' },
        { id: 'money', label: '💰 Олігархи', icon: '💵' },
        { id: 'time', label: '⏳ Виживальники', icon: '⏰' }
    ];

    const fetchLeaderboard = async () => {
        setIsLoading(true);
        const data = await cloudService.getLeaderboard(activeTab);
        setLeaderboard(data);
        setIsLoading(false);
        Haptics.selection();
    };

    useEffect(() => {
        fetchLeaderboard();
    }, [activeTab]);

    const formatValue = (item) => {
        switch (activeTab) {
            case 'money':
                return `$${item.money?.toLocaleString() || 0}`;
            case 'time':
                const hours = Math.floor((item.play_time || 0) / 3600);
                const minutes = Math.floor(((item.play_time || 0) % 3600) / 60);
                return `${hours}год ${minutes}хв`;
            case 'distance':
            default:
                return `${item.distance_record?.toLocaleString() || 0}м`;
        }
    };

    return (
        <div className={styles.screen}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <div className={styles.headerLeft}>
                        <button
                            onClick={() => setScreen('menu')}
                            className={styles.back}
                        >
                            ←
                        </button>
                        <h2 className={styles.title}>Рейтинг Гравців</h2>
                    </div>
                    <button
                        onClick={fetchLeaderboard}
                        className={`${styles.refresh} ${isLoading ? styles.spin : ''}`}
                    >
                        🔄
                    </button>
                </div>

                <div className={styles.tabs}>
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
                        >
                            <span className={styles.tabContent}>
                                <span>{tab.icon}</span>
                                <span className={styles.tabLabel}>{tab.label.split(' ')[1]}</span>
                            </span>
                            {activeTab === tab.id && (
                                <motion.div
                                    layoutId="activeTab"
                                    className={styles.tabHighlight}
                                    initial={false}
                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                />
                            )}
                        </button>
                    ))}
                </div>

                <div className={styles.listWrapper}>
                    {isLoading && leaderboard.length === 0 ? (
                        <div className={styles.loading}>
                            Завантаження...
                        </div>
                    ) : (
                        <div className={styles.list}>
                            <AnimatePresence mode="popLayout">
                                {leaderboard.map((item, index) => {
                                    const tone = index === 0 ? styles.rowGold : index === 1 ? styles.rowSilver : index === 2 ? styles.rowBronze : styles.rowDefault;
                                    const rankTone = index < 3 ? styles.rankTop : styles.rankDefault;
                                    return (
                                        <motion.div
                                            key={`${item.nickname}-${index}`}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className={`${styles.row} ${tone}`}
                                        >
                                            <div className={`${styles.rank} ${rankTone}`}>
                                                {index + 1}
                                            </div>
                                            <div className={styles.user}>
                                                <div className={styles.nickname}>
                                                    {item.nickname || 'Невідомий'}
                                                </div>
                                            </div>
                                            <div className={styles.value}>
                                                {formatValue(item)}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>

                            {leaderboard.length === 0 && !isLoading && (
                                <div className={styles.empty}>
                                    Список порожній
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
