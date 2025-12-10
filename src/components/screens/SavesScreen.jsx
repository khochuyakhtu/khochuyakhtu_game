import { useState, useEffect } from 'react';
import useUIStore from '../../stores/useUIStore';
import useGameStore from '../../stores/useGameStore';
import useNotificationStore from '../../stores/useNotificationStore';
import { Haptics } from '../../game/config';

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
        <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 overflow-y-auto">
            <div className="max-w-2xl mx-auto p-5 flex flex-col h-full">
                {/* Заголовок */}
                <div className="flex items-center mb-6">
                    <button
                        onClick={() => setScreen('menu')}
                        className="bg-slate-800/50 text-white px-4 py-2 rounded-lg mr-4 hover:bg-slate-700"
                    >
                        ←
                    </button>
                    <h2 className="text-3xl font-bold text-white">☁️ Хмарні Збереження</h2>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col items-center justify-center text-center bg-slate-800/20 rounded-xl border border-dashed border-slate-700 p-8">
                    <div className="text-7xl mb-6 text-sky-400">☁️</div>
                    <h3 className="text-3xl text-white font-bold mb-4">Синхронізація</h3>
                    <p className="text-slate-300 mb-8 max-w-md text-lg leading-relaxed">
                        Ваш прогрес прив'язаний до Telegram акаунту. <br />
                        Завантажте гру з сервера, щоб продовжити на цьому пристрої.
                    </p>

                    <button
                        onClick={handleCloudLoad}
                        disabled={isLoadingCloud}
                        className="bg-sky-600 hover:bg-sky-500 text-white px-10 py-5 rounded-2xl font-bold text-xl transition-all active:scale-95 disabled:opacity-50 flex items-center gap-4 shadow-xl shadow-sky-900/30 border border-sky-400/20"
                    >
                        {isLoadingCloud ? <span className="animate-spin">⏳</span> : '📥'}
                        <span>Завантажити Прогрес</span>
                    </button>

                    {gameState.lastSyncTime && (
                        <div className="mt-8 text-sm text-slate-400 bg-slate-900/60 px-6 py-3 rounded-full border border-slate-700">
                            🕒 Останнє збереження: <span className="text-white font-mono ml-2">{formatDate(new Date(gameState.lastSyncTime).toISOString())}</span>
                        </div>
                    )}
                </div>

                {/* Інформація */}
                <div className="mt-8 p-4 bg-slate-800/30 rounded-xl border border-slate-700 text-center">
                    <p className="text-slate-400 text-sm">
                        💡 Щоб зберегти гру, скористайтеся кнопками на екрані <b>"🏝️ Острів"</b>.
                    </p>
                </div>
            </div>
        </div>
    );
}
