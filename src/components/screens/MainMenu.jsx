import { motion } from 'framer-motion';
import useUIStore from '../../stores/useUIStore';
import useGameStore from '../../stores/useGameStore';
import styles from './MainMenu.module.css';

export default function MainMenu() {
    const setScreen = useUIStore((state) => state.setScreen);
    const startNewGame = useGameStore((state) => state.startNewGame);

    const menuItems = [
        {
            id: 'start',
            label: '▶️ Почати гру',
            screen: 'island',
            color: 'from-indigo-600 to-purple-600',
            shadow: 'shadow-indigo-500/40'
        },
        {
            id: 'tasks',
            label: '⭐ Завдання',
            screen: 'tasks',
            color: 'from-slate-700 to-slate-800',
            shadow: 'shadow-slate-700/20'
        },
        {
            id: 'settings',
            label: '⚙️ Налаштування',
            screen: 'settings',
            color: 'from-slate-700 to-slate-800',
            shadow: 'shadow-slate-700/20'
        },
        {
            id: 'saves',
            label: '💾 Збережені ігри',
            screen: 'saves',
            color: 'from-slate-700 to-slate-800',
            shadow: 'shadow-blue-500/20'
        },
        {
            id: 'leaderboard',
            label: '🏆 Рейтинг',
            screen: 'leaderboard',
            color: 'from-slate-700 to-slate-800',
            shadow: 'shadow-yellow-500/20'
        }
    ];

    return (
        <div className={styles.screen}>
            <div className={styles.card}>
                <motion.div
                    className={styles.emoji}
                    animate={{
                        y: [0, -10, 0],
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                >
                    🚤
                </motion.div>

                <motion.h1
                    className={styles.title}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    Хочу Яхту
                </motion.h1>

                <motion.p
                    className={styles.subtitle}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    Ultimate Survival
                </motion.p>

                <div className={styles.menu}>
                    {menuItems.map((item, index) => {
                        const toneClass = styles[item.id] || styles.defaultButton;
                        const shadowClass = styles[`${item.id}Shadow`] || '';
                        return (
                            <motion.button
                                key={item.id}
                                className={`${styles.button} ${toneClass} ${shadowClass}`}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                onClick={() => {
                                    if (item.id === 'start') {
                                        startNewGame();
                                    }
                                    setScreen(item.screen);
                                }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                {item.label}
                            </motion.button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
