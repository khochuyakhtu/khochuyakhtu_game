import { motion } from 'framer-motion';
import useGameStore from '../../../stores/useGameStore';
import useUIStore from '../../../stores/useUIStore';
import styles from './ModeSwitchButton.module.css';

export default function ModeSwitchButton({ mode }) {
    const setMode = useGameStore((state) => state.setMode);
    const setScreen = useUIStore((state) => state.setScreen);

    const switchMode = () => {
        if (mode === 'expedition') {
            setMode('island');
            setScreen('island');
        } else {
            setMode('expedition');
            setScreen('game');
        }
    };

    return (
        <motion.button
            onClick={switchMode}
            className={styles.button}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
        >
            {mode === 'expedition' ? '🏝️ Острів' : '⛵ Море'}
        </motion.button>
    );
}
