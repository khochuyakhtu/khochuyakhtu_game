import { motion } from 'framer-motion';
import { useState } from 'react';
import useGameStore from '../../stores/useGameStore';

export default function MissionPanel() {
    const { gameState, player } = useGameStore();
    const [expanded, setExpanded] = useState(true);
    const mission = gameState.mission;

    if (!mission) return null;

    // Calculate distance to mission target
    const distance = Math.round(Math.hypot(mission.tx - player.x, mission.ty - player.y));
    const distanceText = distance >= 1000
        ? `${(distance / 1000).toFixed(1)}km`
        : `${distance}m`;

    const rewardMoney = typeof mission.reward === 'number'
        ? mission.reward
        : (mission.reward?.money || 0);

    const missionTitle = mission.description || `Доставте вантаж (Місія ${mission.missionNumber || '?'})`;

    return (
        <motion.div
            className="fixed left-2 right-2 top-[140px] md:top-40 px-3 py-2 rounded-lg max-w-[320px] bg-slate-900/90 border border-slate-800 shadow-lg z-20 mx-auto"
            style={{ insetInline: 'auto' }}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <div className="flex items-center justify-between">
                <div className="text-[10px] text-yellow-400 font-bold uppercase">
                    Активна Місія
                </div>
                <button
                    onClick={() => setExpanded((prev) => !prev)}
                    className="text-slate-400 text-xs px-2 py-1 rounded hover:text-white"
                >
                    {expanded ? '−' : '+'}
                </button>
            </div>

            {expanded && (
                <div className="space-y-1 mt-1">
                    <div className="text-sm text-white font-semibold leading-snug">
                        {missionTitle}
                    </div>
                    <div className="text-[10px] text-slate-400 flex justify-between gap-2">
                        <span id="mission-dist">{distanceText}</span>
                        <span className="text-green-400 whitespace-nowrap" id="mission-reward">
                            ${rewardMoney}
                        </span>
                    </div>
                </div>
            )}
        </motion.div>
    );
}

