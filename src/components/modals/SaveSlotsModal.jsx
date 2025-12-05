import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import useGameStore from '../../stores/useGameStore';
import { Haptics } from '../../game/config';

const SAVE_SLOTS_KEY = 'yacht-game-saves';

export default function SaveSlotsModal({ onClose, mode = 'save' }) { // mode: 'save' | 'load'
    const [activeTab, setActiveTab] = useState('local'); // 'local' | 'cloud'
    const [slots, setSlots] = useState([]);
    const [cloudSaveData, setCloudSaveData] = useState(null);
    const [isLoadingCloud, setIsLoadingCloud] = useState(false);

    const {
        player, inventory, equip, gameState,
        loadSave, recalcStats,
        saveToCloud, loadFromCloud
    } = useGameStore();

    // Load Local Saves
    useEffect(() => {
        if (activeTab === 'local') {
            const savedData = localStorage.getItem(SAVE_SLOTS_KEY);
            if (savedData) {
                setSlots(JSON.parse(savedData));
            } else {
                setSlots(Array(5).fill(null));
            }
        }
    }, [activeTab]);

    // Check Cloud Save
    useEffect(() => {
        if (activeTab === 'cloud') {
            fetchCloudData();
        }
    }, [activeTab]);

    const fetchCloudData = async () => {
        setIsLoadingCloud(true);
        // We need a way to peek at the cloud save without loading it immediately into the game state
        // Since loadFromCloud currently loads directly, we might need to adjust logic or just trust the user
        // For UI purposes, let's assume we can fetch metadata or just try to load to check existence
        // For now, we'll assume we can try to "sync" to check if there is data, 
        // but `loadFromCloud` returns the state object if successful in our modified store? 
        // Actually `loadFromCloud` in useGameStore returns boolean.

        // Let's modify logic: We'll implement a "Check" or just use the button to trigger load.
        // For visual feedback, we can try to fetch.
        // But to keep it simple and safe: We just show a "Load from Cloud" button.
        setIsLoadingCloud(false);
    };

    const handleLocalSave = (slotIndex) => {
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
        alert(`Гру збережено в Слот ${slotIndex + 1}!`);
    };

    const handleLocalLoad = (slotIndex) => {
        const saveData = slots[slotIndex];
        if (!saveData) return;
        loadSave(saveData);
        recalcStats();
        onClose();
    };

    const handleLocalDelete = (slotIndex) => {
        const newSlots = [...slots];
        newSlots[slotIndex] = null;
        setSlots(newSlots);
        localStorage.setItem(SAVE_SLOTS_KEY, JSON.stringify(newSlots));
    };

    const handleCloudAction = async () => {
        if (mode === 'save') {
            const success = await saveToCloud();
            Haptics.notify(success ? 'success' : 'error');
            if (success) alert('Збережено в хмару!');
        } else {
            if (confirm('Завантажити гру з хмари? Незбережений локальний прогрес буде втрачено.')) {
                setIsLoadingCloud(true);
                const success = await loadFromCloud();
                setIsLoadingCloud(false);
                Haptics.notify(success ? 'success' : 'error');
                if (success) {
                    onClose();
                } else {
                    alert('Не вдалося завантажити або хмарне збереження відсутнє.');
                }
            }
        }
    };

    const formatDate = (isoString) => {
        if (!isoString) return '---';
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
                        {mode === 'save' ? 'Збереження' : 'Завантаження'}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl">×</button>
                </div>

                {/* Tabs */}
                <div className="flex p-1 bg-slate-800 rounded-lg mb-4">
                    <button
                        onClick={() => setActiveTab('local')}
                        className={`flex-1 py-1 text-sm font-bold rounded ${activeTab === 'local' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        Локально
                    </button>
                    <button
                        onClick={() => setActiveTab('cloud')}
                        className={`flex-1 py-1 text-sm font-bold rounded ${activeTab === 'cloud' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        Сервер
                    </button>
                </div>

                {/* Content */}
                <div className="space-y-2 min-h-[200px]">
                    {activeTab === 'local' ? (
                        <>
                            {slots.map((slot, index) => (
                                <div key={index} className={`p-3 rounded-lg border ${slot ? 'bg-slate-800 border-slate-600' : 'bg-slate-800/50 border-slate-700 border-dashed'}`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="font-bold text-white text-sm">Слот {index + 1}</div>
                                            {slot ? (
                                                <div className="text-[10px] text-slate-400 mt-1">
                                                    <div>💰 ${slot.player?.money || 0}</div>
                                                    <div>📅 {formatDate(slot.savedAt)}</div>
                                                </div>
                                            ) : (
                                                <div className="text-[10px] text-slate-500 mt-1">Порожньо</div>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            {mode === 'save' && (
                                                <button
                                                    onClick={() => handleLocalSave(index)}
                                                    className="bg-green-600 hover:bg-green-500 text-white text-xs px-3 py-1.5 rounded font-bold"
                                                >
                                                    {slot ? 'Замінити' : 'Зберегти'}
                                                </button>
                                            )}
                                            {mode === 'load' && slot && (
                                                <button
                                                    onClick={() => handleLocalLoad(index)}
                                                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1.5 rounded font-bold"
                                                >
                                                    Завантажити
                                                </button>
                                            )}
                                            {slot && <button onClick={() => handleLocalDelete(index)} className="bg-red-600/50 hover:bg-red-600 text-white text-xs px-2 py-1.5 rounded">🗑️</button>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full py-8 text-center bg-slate-800/20 rounded-xl border border-dashed border-slate-700">
                            <div className="text-4xl mb-3">☁️</div>
                            <h3 className="text-white font-bold mb-2">Хмарне сховище</h3>
                            <p className="text-sm text-slate-400 mb-6 max-w-[200px]">
                                {mode === 'save'
                                    ? 'Зберігайте прогрес на сервері, щоб грати на будь-якому пристрої.'
                                    : 'Завантажте збереження з сервера. Поточний незбережений прогрес буде втрачено.'}
                            </p>

                            <button
                                onClick={handleCloudAction}
                                disabled={isLoadingCloud}
                                className={`${mode === 'save' ? 'bg-sky-600 hover:bg-sky-500' : 'bg-green-600 hover:bg-green-500'} text-white px-6 py-3 rounded-lg font-bold transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2`}
                            >
                                {isLoadingCloud && <span className="animate-spin">⏳</span>}
                                {mode === 'save' ? 'Зберегти на Сервер' : 'Завантажити з Сервера'}
                            </button>

                            {gameState.lastSyncTime && (
                                <div className="mt-4 text-[10px] text-slate-500">
                                    Остання синхронізація: <br />
                                    {formatDate(new Date(gameState.lastSyncTime).toISOString())}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-700">
                    <p className="text-[10px] text-slate-500 text-center">
                        {activeTab === 'local' ? 'Зберігаються лише в цьому браузері' : 'Прив’язано до вашого Telegram акаунту'}
                    </p>
                </div>
            </motion.div>
        </motion.div>
    );
}
