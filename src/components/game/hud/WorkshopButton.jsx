import { motion } from 'framer-motion';
import useUIStore from '../../../stores/useUIStore';
import styles from './WorkshopButton.module.css';

export default function WorkshopButton() {
    const toggleGarage = useUIStore((state) => state.toggleGarage);

    return (
        <motion.button
            onClick={() => toggleGarage(true)}
            className={styles.button}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
        >
            <span className={styles.icon}>🛠️</span>
        </motion.button>
    );
}
