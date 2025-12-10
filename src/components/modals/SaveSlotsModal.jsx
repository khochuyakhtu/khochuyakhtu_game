import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import useGameStore from '../../stores/useGameStore';
import { Haptics } from '../../game/config';
import styles from './SaveSlotsModal.module.css';

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
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className={styles.modal}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className={styles.header}>
                    <h2 className={styles.title}>
                        {mode === 'save' ? 'Збереження' : 'Завантаження'}
                    </h2>
                    <button onClick={onClose} className={styles.close}>×</button>
                </div>

                <div className={styles.tabs}>
                    <button
                        onClick={() => setActiveTab('local')}
                        className={`${styles.tab} ${activeTab === 'local' ? styles.tabActive : ''}`}
                    >
                        Локально
                    </button>
                    <button
                        onClick={() => setActiveTab('cloud')}
                        className={`${styles.tab} ${activeTab === 'cloud' ? styles.tabCloud : ''}`}
                    >
                        Сервер
                    </button>
                </div>

                <div className={styles.content}>
                    {activeTab === 'local' ? (
                        <>
                            {slots.map((slot, index) => (
                                <div key={index} className={`${styles.slotCard} ${slot ? styles.slotFilled : styles.slotEmpty}`}>
                                    <div className={styles.slotRow}>
                                        <div className={styles.slotInfo}>
                                            <div className={styles.slotTitle}>Слот {index + 1}</div>
                                            {slot ? (
                                                <div className={styles.slotMeta}>
                                                    <div>💰 ${slot.player?.money || 0}</div>
                                                    <div>📅 {formatDate(slot.savedAt)}</div>
                                                </div>
                                            ) : (
                                                <div className={styles.slotEmptyText}>Порожньо</div>
                                            )}
                                        </div>
                                        <div className={styles.slotActions}>
                                            {mode === 'save' && (
                                                <button
                                                    onClick={() => handleLocalSave(index)}
                                                    className={styles.saveButton}
                                                >
                                                    {slot ? 'Замінити' : 'Зберегти'}
                                                </button>
                                            )}
                                            {mode === 'load' && slot && (
                                                <button
                                                    onClick={() => handleLocalLoad(index)}
                                                    className={styles.loadButton}
                                                >
                                                    Завантажити
                                                </button>
                                            )}
                                            {slot && <button onClick={() => handleLocalDelete(index)} className={styles.deleteButton}>🗑️</button>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </>
                    ) : (
                        <div className={styles.cloudPanel}>
                            <div className={styles.cloudIcon}>☁️</div>
                            <h3 className={styles.cloudTitle}>Хмарне сховище</h3>
                            <p className={styles.cloudText}>
                                {mode === 'save'
                                    ? 'Зберігайте прогрес на сервері, щоб грати на будь-якому пристрої.'
                                    : 'Завантажте збереження з сервера. Поточний незбережений прогрес буде втрачено.'}
                            </p>

                            <button
                                onClick={handleCloudAction}
                                disabled={isLoadingCloud}
                                className={`${styles.cloudButton} ${mode === 'save' ? styles.cloudSave : styles.cloudLoad} ${isLoadingCloud ? styles.disabled : ''}`}
                            >
                                {isLoadingCloud && <span className={styles.spinner}>⏳</span>}
                                {mode === 'save' ? 'Зберегти на Сервер' : 'Завантажити з Сервера'}
                            </button>

                            {gameState.lastSyncTime && (
                                <div className={styles.cloudSync}>
                                    Остання синхронізація: <br />
                                    {formatDate(new Date(gameState.lastSyncTime).toISOString())}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className={styles.footer}>
                    <p className={styles.footerText}>
                        {activeTab === 'local' ? 'Зберігаються лише в цьому браузері' : 'Прив’язано до вашого Telegram акаунту'}
                    </p>
                </div>
            </motion.div>
        </motion.div>
    );
}
