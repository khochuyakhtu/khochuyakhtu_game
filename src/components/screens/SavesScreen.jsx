import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import useUIStore from '../../stores/useUIStore';
import useGameStore from '../../stores/useGameStore';

const SAVE_SLOTS_KEY = 'yacht-game-saves';

export default function SavesScreen() {
    const setScreen = useUIStore((state) => state.setScreen);
    const [slots, setSlots] = useState(Array(5).fill(null));

    useEffect(() => {
        // Завантажуємо існуючі збереження
        const savedData = localStorage.getItem(SAVE_SLOTS_KEY);
        if (savedData) {
            setSlots(JSON.parse(savedData));
        }
    }, []);

    const handleLoad = (slotIndex) => {
        const saveData = slots[slotIndex];
        if (!saveData) return;

        console.log('Loading save data:', saveData);
        console.log('Player money in save:', saveData.player?.money);

        // Використовуємо setState напряму для оновлення store
        useGameStore.setState({
            player: { ...useGameStore.getState().player, ...saveData.player },
            inventory: saveData.inventory,
            equip: saveData.equip,
            gameState: saveData.gameState
        });

        // Перераховуємо статистики
        useGameStore.getState().recalcStats();

        console.log('After load, player money:', useGameStore.getState().player.money);

        // Встановлюємо timestamp завантаження
        // Використовуємо час замість одноразового прапорця, щоб уникнути проблем з React Strict Mode (подвійний виклик)
        localStorage.setItem('yacht-load-timestamp', Date.now().toString());

        // Переходимо до гри
        setScreen('game');
    };

    const handleDelete = (slotIndex) => {
        const newSlots = [...slots];
        newSlots[slotIndex] = null;
        setSlots(newSlots);
        localStorage.setItem(SAVE_SLOTS_KEY, JSON.stringify(newSlots));
    };

    const formatDate = (isoString) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        return date.toLocaleString('uk-UA', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 overflow-y-auto">
            <div className="max-w-2xl mx-auto p-5">
                {/* Заголовок */}
                <div className="flex items-center mb-8">
                    <button
                        onClick={() => setScreen('menu')}
                        className="bg-slate-800/50 text-white px-4 py-2 rounded-lg mr-4 hover:bg-slate-700"
                    >
                        ←
                    </button>
                    <h2 className="text-3xl font-bold text-white">💾 Збережені ігри</h2>
                </div>

                {/* Список збережень - 5 слотів */}
                <div className="space-y-3">
                    {slots.map((slot, index) => (
                        <motion.div
                            key={index}
                            className={`p-4 rounded-xl border ${slot ? 'bg-slate-800/70 border-slate-600' : 'bg-slate-800/30 border-slate-700 border-dashed'}`}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="font-bold text-white text-lg">
                                        Слот {index + 1}
                                    </div>
                                    {slot ? (
                                        <div className="text-sm text-slate-400 mt-1 space-y-1">
                                            <div className="flex gap-4">
                                                <span>💰 ${slot.player?.money || 0}</span>
                                                <span>🛡️ Броня: Lvl {slot.player?.armorLvl || 0}</span>
                                            </div>
                                            <div>📅 {formatDate(slot.savedAt)}</div>
                                        </div>
                                    ) : (
                                        <div className="text-sm text-slate-500 mt-1">
                                            Порожній слот
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    {slot && (
                                        <>
                                            <button
                                                onClick={() => handleLoad(index)}
                                                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold transition-all active:scale-95"
                                            >
                                                Завантажити
                                            </button>
                                            <button
                                                onClick={() => handleDelete(index)}
                                                className="bg-red-600/50 hover:bg-red-600 text-white px-3 py-2 rounded-lg transition-all"
                                                title="Видалити"
                                            >
                                                🗑️
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Інформація */}
                <div className="mt-6 p-4 bg-slate-800/30 rounded-xl border border-slate-700 text-center">
                    <p className="text-slate-400 text-sm">
                        💡 Зберігайте гру через кнопку "Зберегти" в Майстерні під час гри
                    </p>
                </div>
            </div>
        </div>
    );
}
