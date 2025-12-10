import { motion } from 'framer-motion';
import useGameStore from '../../../stores/useGameStore';
import useUIStore from '../../../stores/useUIStore';

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
            className="bg-cyan-600 text-white px-3 py-1.5 rounded-lg border-2 border-cyan-800 hover:bg-cyan-500 active:scale-95 transition-all shadow-lg text-sm font-bold"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
        >
            {mode === 'expedition' ? '🏝️ Острів' : '⛵ Море'}
        </motion.button>
    );
}
