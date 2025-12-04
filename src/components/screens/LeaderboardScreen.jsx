import { motion } from 'framer-motion';
import useUIStore from '../../stores/useUIStore';
import useSettingsStore from '../../stores/useSettingsStore';

export default function LeaderboardScreen() {
    const setScreen = useUIStore((state) => state.setScreen);
    const leaderboard = useSettingsStore((state) => state.leaderboard);

    const getMedal = (index) => {
        if (index === 0) return '🥇';
        if (index === 1) return '🥈';
        if (index === 2) return '🥉';
        return `#${index + 1}`;
    };

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 overflow-y-auto">
            <div className="max-w-2xl mx-auto p-5">
                {/* Header */}
                <div className="flex items-center mb-8">
                    <button
                        onClick={() => setScreen('menu')}
                        className="bg-slate-800/50 text-white px-4 py-2 rounded-lg mr-4 hover:bg-slate-700"
                    >
                        ←
                    </button>
                    <h2 className="text-3xl font-bold text-white">🏆 Топ 10 Капітанів</h2>
                </div>

                {/* Leaderboard List */}
                <div className="space-y-3">
                    {leaderboard.length === 0 ? (
                        <motion.div
                            className="text-center py-20"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            <div className="text-6xl mb-4">🏆</div>
                            <p className="text-slate-400 text-lg mb-2">Поки що немає рекордів</p>
                            <p className="text-slate-500">Станьте першим!</p>
                        </motion.div>
                    ) : (
                        leaderboard.map((entry, index) => (
                            <motion.div
                                key={index}
                                className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 flex items-center justify-between"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <div className="flex items-center gap-4">
                                    <span className="text-3xl w-12 text-center">
                                        {getMedal(index)}
                                    </span>
                                    <div>
                                        <div className="text-white font-bold text-lg">
                                            {entry.name}
                                        </div>
                                        <div className="text-slate-500 text-sm">
                                            {entry.date}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-green-400 font-bold text-xl font-mono">
                                    ${entry.score}
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
