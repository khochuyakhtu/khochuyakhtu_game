import { motion } from 'framer-motion';
import useUIStore from '../../stores/useUIStore';
import useSettingsStore from '../../stores/useSettingsStore';
import { cloudService } from '../../services/CloudService';
import { Haptics } from '../../game/config';
import styles from './SettingsScreen.module.css';

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
        <div className={styles.screen}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <button
                        onClick={() => setScreen('menu')}
                        className={styles.back}
                    >
                        ←
                    </button>
                    <h2 className={styles.heading}>Налаштування</h2>
                </div>

                <motion.div
                    className={styles.card}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h3 className={styles.cardTitle}>👤 Профіль</h3>
                    <div className={styles.field}>
                        <label className={styles.label}>Ваш Нікнейм</label>
                        <input
                            type="text"
                            id="nickname-input"
                            defaultValue={nickname}
                            maxLength={15}
                            placeholder="Введіть нікнейм"
                            className={styles.input}
                        />
                    </div>
                    <button
                        onClick={handleNicknameSave}
                        className={styles.primary}
                    >
                        Зберегти
                    </button>
                </motion.div>

                <motion.div
                    className={styles.card}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <h3 className={styles.cardTitle}>🎮 Геймплей</h3>

                    <div className={styles.toggleRow}>
                        <div>
                            <div className={styles.toggleTitle}>Звук</div>
                            <div className={styles.toggleSubtitle}>Звукові ефекти в грі</div>
                        </div>
                        <button
                            onClick={handleSoundToggle}
                            className={`${styles.switch} ${sound ? styles.switchOn : styles.switchOff}`}
                        >
                            <span
                                className={`${styles.knob} ${sound ? styles.knobOn : ''}`}
                            />
                        </button>
                    </div>

                    <div className={styles.toggleRow}>
                        <div>
                            <div className={styles.toggleTitle}>Вібрація</div>
                            <div className={styles.toggleSubtitle}>Тактильний відгук</div>
                        </div>
                        <button
                            onClick={handleVibrationToggle}
                            className={`${styles.switch} ${vibration ? styles.switchOn : styles.switchOff}`}
                        >
                            <span
                                className={`${styles.knob} ${vibration ? styles.knobOn : ''}`}
                            />
                        </button>
                    </div>
                </motion.div>

                <motion.div
                    className={styles.danger}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <h3 className={styles.dangerTitle}>⚠️ Небезпечна зона</h3>
                    <button
                        onClick={handleReset}
                        className={styles.dangerButton}
                    >
                        Скинути весь прогрес
                    </button>
                </motion.div>
            </div>
        </div>
    );
}
