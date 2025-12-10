import GameCanvas from '../game/GameCanvas';
import GameHUD from '../game/GameHUD';
import SkillButtons from '../game/SkillButtons';
import MissionPanel from '../game/MissionPanel';
import GarageModal from '../modals/GarageModal';
import GameOverModal from '../modals/GameOverModal';
import MissionResultModal from '../modals/MissionResultModal';
import useUIStore from '../../stores/useUIStore';
import styles from './GameScreen.module.css';

export default function GameScreen() {
    const garageOpen = useUIStore((state) => state.garageOpen);
    const gameOverOpen = useUIStore((state) => state.gameOverOpen);
    const missionResultOpen = useUIStore((state) => state.missionResultModalOpen);

    return (
        <div className={styles.screen}>
            <GameCanvas />
            <GameHUD />
            <MissionPanel />
            <SkillButtons />

            <div id="damage-overlay" className={styles.overlay} />
            <div id="cold-vignette" className={styles.overlay} />

            {garageOpen && <GarageModal />}
            {gameOverOpen && <GameOverModal />}
            {missionResultOpen && <MissionResultModal />}
        </div>
    );
}
