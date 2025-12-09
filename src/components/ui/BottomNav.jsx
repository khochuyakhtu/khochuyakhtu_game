import { motion } from 'framer-motion';
import useGameStore from '../../stores/useGameStore';
import useUIStore from '../../stores/useUIStore';

/**
 * BottomNav - Island mode bottom navigation bar
 * Provides quick access to main island functions
 */
export default function BottomNav({ activeTab, onTabChange }) {
    const setScreen = useUIStore((state) => state.setScreen);
    const setModal = useUIStore((state) => state.setModal);
    const setMode = useGameStore((state) => state.setMode);
    const weather = useGameStore((state) => state.island.weather);
    const canSail = weather?.effects?.canSail !== false;

    const tabs = [
        { id: 'overview', icon: '📊', label: 'Огляд' },
        { id: 'buildings', icon: '🏗️', label: 'Будівлі' },
        { id: 'residents', icon: '👥', label: 'Люди' },
        { id: 'inventory', icon: '📦', label: 'Склад' },
    ];

    const handleExpedition = () => {
        if (!canSail) {
            // Optional: show some feedback why (storm, etc)
            return;
        }
        // Open missions modal instead of direct start
        setModal('missions', true);
    };

    return (
        <motion.div
            className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-700/50 px-2 py-2 safe-area-inset-bottom"
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
            <div className="flex items-center justify-around max-w-lg mx-auto">
                {/* Navigation Tabs */}
                {tabs.map((tab) => (
                    <motion.button
                        key={tab.id}
                        className={`flex flex-col items-center px-3 py-1 rounded-lg transition-colors ${activeTab === tab.id
                            ? 'bg-cyan-600/30 text-cyan-400'
                            : 'text-slate-400 hover:text-white'
                            }`}
                        onClick={() => onTabChange(tab.id)}
                        whileTap={{ scale: 0.95 }}
                    >
                        <span className="text-xl">{tab.icon}</span>
                        <span className="text-[10px] font-medium mt-0.5">{tab.label}</span>
                    </motion.button>
                ))}

                {/* Expedition Button */}
                <motion.button
                    className={`flex flex-col items-center px-4 py-1 rounded-xl transition-colors ${canSail
                        ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/30'
                        : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                        }`}
                    onClick={handleExpedition}
                    whileTap={canSail ? { scale: 0.95 } : undefined}
                    disabled={!canSail}
                >
                    <span className="text-xl">{canSail ? '⛵' : '⛈️'}</span>
                    <span className="text-[10px] font-bold mt-0.5">
                        {canSail ? 'В море!' : 'Шторм'}
                    </span>
                </motion.button>
            </div>
        </motion.div>
    );
}
