import { useState, useEffect } from 'react';
import useUIStore from '../../stores/useUIStore';
import useGameStore from '../../stores/useGameStore';
import useNotificationStore from '../../stores/useNotificationStore';
import { Haptics } from '../../game/config';
import styles from './SavesScreen.module.css';

export default function SavesScreen() {
    const setScreen = useUIStore((state) => state.setScreen);
    const [isLoadingCloud, setIsLoadingCloud] = useState(false);

    // Get store actions
    const loadFromCloud = useGameStore((state) => state.loadFromCloud);
    const gameState = useGameStore((state) => state.gameState);
    const addNotification = useNotificationStore((state) => state.addNotification);

    const handleCloudLoad = async () => {
        if (confirm('Завантажити гру з хмари? Незбережений локальний прогрес буде втрачено.')) {
            setIsLoadingCloud(true);
            const success = await loadFromCloud();
            setIsLoadingCloud(false);

            Haptics.notify(success ? 'success' : 'error');

            if (success) {
                // Встановлюємо timestamp завантаження
                localStorage.setItem('yacht-load-timestamp', Date.now().toString());
                addNotification('success', 'Успішно завантажено!');
                setScreen('island');
            } else {
                addNotification('error', 'Не вдалося завантажити.', 3000);
            }
        }
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
        <div className={styles.screen}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <button
                        onClick={() => setScreen('menu')}
                        className={styles.back}
                    >
                        ←
                    </button>
                    <h2 className={styles.title}>☁️ Хмарні Збереження</h2>
                </div>

                <div className={styles.panel}>
                    <div className={styles.cloudIcon}>☁️</div>
                    <h3 className={styles.panelTitle}>Синхронізація</h3>
                    <p className={styles.panelText}>
                        Ваш прогрес прив'язаний до Telegram акаунту. <br />
                        Завантажте гру з сервера, щоб продовжити на цьому пристрої.
                    </p>

                    <button
                        onClick={handleCloudLoad}
                        disabled={isLoadingCloud}
                        className={`${styles.primary} ${isLoadingCloud ? styles.disabled : ''}`}
                    >
                        {isLoadingCloud ? <span className={styles.spinner}>⏳</span> : '📥'}
                        <span>Завантажити Прогрес</span>
                    </button>

                    {gameState.lastSyncTime && (
                        <div className={styles.lastSync}>
                            🕒 Останнє збереження: <span className={styles.lastSyncValue}>{formatDate(new Date(gameState.lastSyncTime).toISOString())}</span>
                        </div>
                    )}
                </div>

                <div className={styles.info}>
                    <p className={styles.infoText}>
                        💡 Щоб зберегти гру, скористайтеся кнопками на екрані <b>"🏝️ Острів"</b>.
                    </p>
                </div>
            </div>
        </div>
    );
}
