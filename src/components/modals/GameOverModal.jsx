import { motion } from 'framer-motion';
import useUIStore from '../../stores/useUIStore';
import useGameStore from '../../stores/useGameStore';
import useSettingsStore from '../../stores/useSettingsStore';

export default function GameOverModal() {
    const { toggleGameOver, setScreen } = useUIStore();
    const { player, resetAfterGameOver } = useGameStore();
    const saveScore = useSettingsStore((state) => state.saveScore);

    const handleReturn = () => {
        toggleGameOver(false);
        resetAfterGameOver();
        setScreen('island');
    };



    return (
        <motion.div
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <motion.div
                className="bg-slate-900 border border-red-900/50 p-8 rounded-2xl shadow-2xl text-center max-w-sm w-full"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
            >
                <div className="text-6xl mb-4">💀</div>
                <h2 className="text-3xl font-bold text-white mb-3">Game Over</h2>
                <p className="text-sm text-slate-400 mb-6">Ви загинули</p>

                <div className="bg-black/40 p-4 rounded-lg mb-6">
                    <div className="text-[10px] text-slate-500 uppercase mb-1">
                        Збережений Бюджет
                    </div>
                    <div className="text-3xl font-mono text-green-400">
                        ${player.money}
                    </div>
                </div>

                <button
                    onClick={handleReturn}
                    className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-lg shadow-lg mb-3 transition-all active:scale-95"
                >
                    Повернутись на острів
                </button>

                <button
                    onClick={() => {
                        toggleGameOver(false);
                        setScreen('menu');
                    }}
                    className="text-xs text-slate-500 hover:text-white mt-4"
                >
                    Головне меню
                </button>
            </motion.div>
        </motion.div>
    );
}
