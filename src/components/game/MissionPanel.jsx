import { motion } from 'framer-motion';
import useGameStore from '../../stores/useGameStore';

export default function MissionPanel() {
    const { gameState, player } = useGameStore();
    const mission = gameState.mission;

    if (!mission) return null;

    // Calculate distance to mission target
    const distance = Math.round(Math.hypot(mission.tx - player.x, mission.ty - player.y));
    const distanceText = distance >= 1000
        ? `${(distance / 1000).toFixed(1)}km`
        : `${distance}m`;

    return (
        <motion.div
            className="absolute top-44 left-0 px-3 py-2 rounded-r-lg max-w-[200px] bg-gradient-to-r from-slate-900/90 to-transparent border-l-4 border-yellow-400 z-10"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
        >
            <div className="text-[10px] text-yellow-400 font-bold uppercase mb-1">
                Активна Місія
            </div>
            <div className="text-sm text-white font-semibold">
                Доставте вантаж
            </div>
            <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
                <span id="mission-dist">{distanceText}</span>
                <span className="text-green-400" id="mission-reward">
                    ${mission.reward || 100}
                </span>
            </div>
        </motion.div>
    );
}

