import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import useGameStore from '../../stores/useGameStore';
import ResourceBar from '../ui/ResourceBar';
import StatusIndicators from '../ui/StatusIndicators';
import ExpeditionStats from './hud/ExpeditionStats';
import ModeSwitchButton from './hud/ModeSwitchButton';
import WorkshopButton from './hud/WorkshopButton';
import CollapseToggle from './hud/CollapseToggle';
import { formatNumber } from '../../utils/formatNumber';

export default function GameHUD() {
    const { player, resources, yacht, mode, gameState } = useGameStore();
    const missionActive = !!gameState?.mission;
    const [topCollapsed, setTopCollapsed] = useState(false);
    const calendar = useMemo(() => gameState?.calendar || { day: 1, week: 1, month: 1, year: 1 }, [gameState?.calendar]);

    return (
        <>
            <motion.div
                className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-start gap-2"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="flex items-center gap-2">
                    {!topCollapsed && <ResourceBar />}
                    <CollapseToggle collapsed={topCollapsed} onToggle={() => setTopCollapsed((v) => !v)} />
                </div>

                {mode === 'expedition' && (
                    <ExpeditionStats
                        player={player}
                        yacht={yacht}
                        money={resources.money}
                        formatNumber={formatNumber}
                    />
                )}
            </motion.div>

            <motion.div
                className="absolute top-3 right-3 z-30 flex flex-col gap-2 items-end"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
            >
                {mode === 'island' && <StatusIndicators calendar={calendar} />}
                <WorkshopButton />
                {!(mode === 'expedition' && missionActive) && (
                    <ModeSwitchButton mode={mode} />
                )}
            </motion.div>
        </>
    );
}
