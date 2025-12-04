import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import useGameStore from '../../stores/useGameStore';

const SAVE_SLOTS_KEY = 'yacht-game-saves';

export default function SaveSlotsModal({ onClose, mode = 'save' }) {
    const [slots, setSlots] = useState([]);
    const { player, inventory, equip, gameState, loadSave, recalcStats } = useGameStore();

    useEffect(() => {
        // Load existing saves
        const savedData = localStorage.getItem(SAVE_SLOTS_KEY);
        if (savedData) {
            setSlots(JSON.parse(savedData));
        } else {
            // Initialize empty slots
            setSlots(Array(5).fill(null));
        }
    }, []);

    const handleSave = (slotIndex) => {
        // Use JSON.parse/stringify for deep copy of all nested objects
        const saveData = {
            player: JSON.parse(JSON.stringify(player)),
            inventory: JSON.parse(JSON.stringify(inventory)),
            equip: JSON.parse(JSON.stringify(equip)),
            gameState: JSON.parse(JSON.stringify(gameState)),
            savedAt: new Date().toISOString(),
            slotName: `Слот ${slotIndex + 1}`
        };

        const newSlots = [...slots];
        newSlots[slotIndex] = saveData;
        setSlots(newSlots);
        localStorage.setItem(SAVE_SLOTS_KEY, JSON.stringify(newSlots));

        console.log('Saved data:', saveData); // Debug log
        alert(`Гру збережено в Слот ${slotIndex + 1}!`);
    };

    const handleLoad = (slotIndex) => {
        const saveData = slots[slotIndex];
        if (!saveData) return;

        // Load save data into store
        loadSave(saveData);
        recalcStats();
        onClose();
    };

    const handleDelete = (slotIndex) => {
        const newSlots = [...slots];
        newSlots[slotIndex] = null;
        setSlots(newSlots);
        localStorage.setItem(SAVE_SLOTS_KEY, JSON.stringify(newSlots));
    };

    const formatDate = (isoString) => {
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
        <motion.div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full mx-4"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-3">
                    <h2 className="text-xl font-bold text-white">
                        💾 {mode === 'save' ? 'Зберегти гру' : 'Завантажити гру'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white text-2xl px-2"
                    >
                        ×
                    </button>
                </div>

                {/* Slots */}
                <div className="space-y-2">
                    {slots.map((slot, index) => (
                        <div
                            key={index}
                            className={`p-3 rounded-lg border ${slot ? 'bg-slate-800 border-slate-600' : 'bg-slate-800/50 border-slate-700 border-dashed'}`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="font-bold text-white text-sm">
                                        Слот {index + 1}
                                    </div>
                                    {slot ? (
                                        <div className="text-[10px] text-slate-400 mt-1">
                                            <div>💰 ${slot.player?.money || 0}</div>
                                            <div>📅 {formatDate(slot.savedAt)}</div>
                                        </div>
                                    ) : (
                                        <div className="text-[10px] text-slate-500 mt-1">
                                            Порожній слот
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    {mode === 'save' && (
                                        <button
                                            onClick={() => handleSave(index)}
                                            className="bg-green-600 hover:bg-green-500 text-white text-xs px-3 py-1.5 rounded font-bold transition-all active:scale-95"
                                        >
                                            {slot ? 'Перезаписати' : 'Зберегти'}
                                        </button>
                                    )}

                                    {mode === 'load' && slot && (
                                        <button
                                            onClick={() => handleLoad(index)}
                                            className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1.5 rounded font-bold transition-all active:scale-95"
                                        >
                                            Завантажити
                                        </button>
                                    )}

                                    {slot && (
                                        <button
                                            onClick={() => handleDelete(index)}
                                            className="bg-red-600/50 hover:bg-red-600 text-white text-xs px-2 py-1.5 rounded transition-all"
                                            title="Видалити"
                                        >
                                            🗑️
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="mt-4 pt-3 border-t border-slate-700">
                    <p className="text-[10px] text-slate-500 text-center">
                        {mode === 'save'
                            ? 'Виберіть слот для збереження поточного прогресу'
                            : 'Виберіть збереження для завантаження'
                        }
                    </p>
                </div>
            </motion.div>
        </motion.div>
    );
}
