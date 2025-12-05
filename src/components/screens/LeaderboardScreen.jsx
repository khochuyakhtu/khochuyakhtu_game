import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useUIStore from '../../stores/useUIStore';
import { cloudService } from '../../services/CloudService';
import { Haptics } from '../../game/config';

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
        <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-y-auto">
            <div className="max-w-2xl mx-auto p-4 flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setScreen('menu')}
                            className="bg-slate-800/50 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors"
                        >
                            ←
                        </button>
                        <h2 className="text-2xl font-bold text-white">Рейтинг Гравців</h2>
                    </div>
                    <button
                        onClick={fetchLeaderboard}
                        className={`bg-slate-800/50 text-white p-2 rounded-lg hover:bg-slate-700 transition-all ${isLoading ? 'animate-spin' : ''}`}
                    >
                        🔄
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 bg-slate-800/40 p-1 rounded-xl">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all relative overflow-hidden ${activeTab === tab.id
                                ? 'text-white bg-slate-700 shadow-lg'
                                : 'text-slate-400 hover:text-slate-200'
                                }`}
                        >
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                <span>{tab.icon}</span>
                                <span className="hidden sm:inline">{tab.label.split(' ')[1]}</span>
                            </span>
                            {activeTab === tab.id && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 bg-gradient-to-br from-purple-600 to-blue-600"
                                    initial={false}
                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                />
                            )}
                        </button>
                    ))}
                </div>

                {/* List */}
                <div className="flex-1 bg-slate-800/30 rounded-2xl border border-slate-700/50 overflow-hidden flex flex-col">
                    {isLoading && leaderboard.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center text-slate-400">
                            Завантаження...
                        </div>
                    ) : (
                        <div className="overflow-y-auto custom-scroll p-2 space-y-2">
                            <AnimatePresence mode="popLayout">
                                {leaderboard.map((item, index) => (
                                    <motion.div
                                        key={item.username + index}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className={`flex items-center gap-4 p-4 rounded-xl border ${index === 0 ? 'bg-yellow-500/20 border-yellow-500/50' :
                                            index === 1 ? 'bg-slate-400/20 border-slate-400/50' :
                                                index === 2 ? 'bg-orange-700/20 border-orange-700/50' :
                                                    'bg-slate-800/50 border-slate-700/30'
                                            }`}
                                    >
                                        <div className={`w-8 h-8 flex items-center justify-center font-bold rounded-full ${index < 3 ? 'bg-white text-slate-900' : 'text-slate-500 bg-slate-900'
                                            }`}>
                                            {index + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-white truncate">
                                                {item.nickname || item.username || 'Невідомий'}
                                            </div>
                                        </div>
                                        <div className="font-mono font-bold text-yellow-400 text-lg">
                                            {formatValue(item)}
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {leaderboard.length === 0 && !isLoading && (
                                <div className="text-center text-slate-500 py-10">
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
