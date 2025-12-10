import { motion } from 'framer-motion';
import useUIStore from '../../stores/useUIStore';
import useGameStore from '../../stores/useGameStore';

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
        <div className="fixed inset-0 flex flex-col items-center justify-center p-5">
            <div className="text-center max-w-md w-full">
                {/* Logo */}
                <motion.div
                    className="text-7xl mb-6"
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
                    className="text-5xl font-bold text-cyan-400 mb-3 text-shadow"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    Хочу Яхту
                </motion.h1>

                <motion.p
                    className="text-lg text-slate-400 mb-12"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    Ultimate Survival
                </motion.p>

                {/* Menu Buttons */}
                <div className="space-y-4">
                    {menuItems.map((item, index) => (
                        <motion.button
                            key={item.id}
                            className={`w-full bg-gradient-to-br ${item.color} text-white text-lg font-bold py-4 px-6 rounded-xl border border-slate-700 shadow-lg ${item.shadow} transition-all duration-200 active:scale-95`}
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
                    ))}
                </div>
            </div>
        </div>
    );
}
