import { motion } from 'framer-motion';
import useUIStore from '../../../stores/useUIStore';

export default function WorkshopButton() {
    const toggleGarage = useUIStore((state) => state.toggleGarage);

    return (
        <motion.button
            onClick={() => toggleGarage(true)}
            className="bg-indigo-600 text-white p-2 rounded-lg border-2 border-indigo-800 hover:bg-indigo-500 active:scale-95 transition-all shadow-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
        >
            <span className="text-xl">🛠️</span>
        </motion.button>
    );
}
