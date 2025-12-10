import { motion } from 'framer-motion';
import useUIStore from '../../stores/useUIStore';
import useGameStore from '../../stores/useGameStore';
import useSettingsStore from '../../stores/useSettingsStore';
import styles from './GameOverModal.module.css';

export default function GameOverModal() {
    const { toggleGameOver, setScreen } = useUIStore();
    const { player, resetAfterGameOver } = useGameStore();

    const handleReturn = () => {
        toggleGameOver(false);
        resetAfterGameOver();
        setScreen('island');
    };

    return (
        <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <motion.div
                className={styles.modal}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
            >
                <div className={styles.emoji}>💀</div>
                <h2 className={styles.title}>Game Over</h2>
                <p className={styles.subtitle}>Ви загинули</p>

                <div className={styles.budgetCard}>
                    <div className={styles.budgetLabel}>
                        Збережений Бюджет
                    </div>
                    <div className={styles.budgetValue}>
                        ${player.money}
                    </div>
                </div>

                <button
                    onClick={handleReturn}
                    className={styles.primary}
                >
                    Повернутись на острів
                </button>

                <button
                    onClick={() => {
                        toggleGameOver(false);
                        setScreen('menu');
                    }}
                    className={styles.secondary}
                >
                    Головне меню
                </button>
            </motion.div>
        </motion.div>
    );
}
