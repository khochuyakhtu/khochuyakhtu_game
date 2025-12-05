import { motion } from 'framer-motion';
import useUIStore from '../../stores/useUIStore';
import useSettingsStore from '../../stores/useSettingsStore';
import { cloudService } from '../../services/CloudService';
import { Haptics } from '../../game/config';

export default function SettingsScreen() {
    const setScreen = useUIStore((state) => state.setScreen);
    const { nickname, sound, vibration, setNickname, setSound, setVibration } = useSettingsStore();

    const handleNicknameSave = async () => {
        const input = document.getElementById('nickname-input');
        if (input.value.trim()) {
            const newNickname = input.value.trim();
            setNickname(newNickname);

            // Sync nickname directly with cloud
            const success = await cloudService.saveNickname(newNickname);

            if (success) {
                Haptics.notify('success');
            } else {
                Haptics.notify('error');
            }
        }
    };

    const handleSoundToggle = () => {
        setSound(!sound);
        Haptics.selection();
    };

    const handleVibrationToggle = () => {
        const newValue = !vibration;
        setVibration(newValue);
        if (newValue) {
            Haptics.impact('light');
        }
    };

    const handleReset = () => {
        if (confirm('Ви впевнені? Це видалить весь ваш прогрес!')) {
            localStorage.clear();
            window.location.reload();
        }
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
                    <h2 className="text-3xl font-bold text-white">Налаштування</h2>
                </div>

                {/* Profile Section */}
                <motion.div
                    className="bg-slate-800/80 border border-slate-700 rounded-xl p-6 mb-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h3 className="text-xl font-bold text-white mb-4">👤 Профіль</h3>
                    <div className="mb-4">
                        <label className="block text-sm text-slate-400 mb-2">Ваш Нікнейм</label>
                        <input
                            type="text"
                            id="nickname-input"
                            defaultValue={nickname}
                            maxLength={15}
                            placeholder="Введіть нікнейм"
                            className="w-full bg-slate-900/60 border border-slate-600 text-white px-4 py-3 rounded-lg outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                        />
                    </div>
                    <button
                        onClick={handleNicknameSave}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-lg transition-all active:scale-95"
                    >
                        Зберегти
                    </button>
                </motion.div>

                {/* Gameplay Section */}
                <motion.div
                    className="bg-slate-800/80 border border-slate-700 rounded-xl p-6 mb-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <h3 className="text-xl font-bold text-white mb-4">🎮 Геймплей</h3>

                    {/* Sound Toggle */}
                    <div className="flex justify-between items-center mb-6 pb-6 border-b border-slate-700">
                        <div>
                            <div className="text-white font-medium mb-1">Звук</div>
                            <div className="text-sm text-slate-400">Звукові ефекти в грі</div>
                        </div>
                        <button
                            onClick={handleSoundToggle}
                            className={`relative w-14 h-7 rounded-full transition-colors ${sound ? 'bg-indigo-600' : 'bg-slate-600'
                                }`}
                        >
                            <span
                                className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${sound ? 'translate-x-7' : ''
                                    }`}
                            />
                        </button>
                    </div>

                    {/* Vibration Toggle */}
                    <div className="flex justify-between items-center">
                        <div>
                            <div className="text-white font-medium mb-1">Вібрація</div>
                            <div className="text-sm text-slate-400">Тактильний відгук</div>
                        </div>
                        <button
                            onClick={handleVibrationToggle}
                            className={`relative w-14 h-7 rounded-full transition-colors ${vibration ? 'bg-indigo-600' : 'bg-slate-600'
                                }`}
                        >
                            <span
                                className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${vibration ? 'translate-x-7' : ''
                                    }`}
                            />
                        </button>
                    </div>
                </motion.div>

                {/* Danger Zone */}
                <motion.div
                    className="bg-slate-800/80 border border-red-900/50 rounded-xl p-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <h3 className="text-xl font-bold text-red-400 mb-4">⚠️ Небезпечна зона</h3>
                    <button
                        onClick={handleReset}
                        className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-lg transition-all active:scale-95"
                    >
                        Скинути весь прогрес
                    </button>
                </motion.div>
            </div>
        </div>
    );
}
