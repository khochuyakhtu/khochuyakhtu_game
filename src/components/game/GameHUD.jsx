import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import useGameStore from '../../stores/useGameStore';
import ResourceBar from '../ui/ResourceBar';
import StatusIndicators from '../ui/StatusIndicators';
import ExpeditionStats from './hud/ExpeditionStats';
import WorkshopButton from './hud/WorkshopButton';
import CollapseToggle from './hud/CollapseToggle';
import { formatNumber } from '../../utils/formatNumber';
import styles from './GameHUD.module.css';

export default function GameHUD() {
    const { player, resources, yacht, mode, gameState } = useGameStore();
    const isExpeditionUI = mode === 'expedition' || !!gameState?.mission;
    const [topCollapsed, setTopCollapsed] = useState(false);
    const calendar = useMemo(() => gameState?.calendar || { day: 1, week: 1, month: 1, year: 1 }, [gameState?.calendar]);

    return (
        <>
            <motion.div
                className={styles.topBar}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className={styles.topBarLeft}>
                    {!isExpeditionUI ? (
                        <>
                            {!topCollapsed && <ResourceBar />}
                            <CollapseToggle collapsed={topCollapsed} onToggle={() => setTopCollapsed((v) => !v)} />
                        </>
                    ) : (
                        <ExpeditionStats
                            player={player}
                            yacht={yacht}
                            money={resources.money}
                            formatNumber={formatNumber}
                        />
                    )}
                </div>
            </motion.div>

            <motion.div
                className={styles.rightColumn}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
            >
                {!isExpeditionUI && <StatusIndicators calendar={calendar} />}
                <WorkshopButton />
            </motion.div>
        </>
    );
}
