import { Suspense, lazy } from 'react';
import GameCanvas from '../game/GameCanvas';
import GameHUD from '../game/GameHUD';
import OnboardingOverlay from '../onboarding/OnboardingOverlay';
import useUIStore from '../../stores/useUIStore';
import styles from './GameScreen.module.css';

const SkillButtons = lazy(() => import('../game/SkillButtons'));
const MissionPanel = lazy(() => import('../game/MissionPanel'));
const GarageModal = lazy(() => import('../modals/GarageModal'));
const GameOverModal = lazy(() => import('../modals/GameOverModal'));
const MissionResultModal = lazy(() => import('../modals/MissionResultModal'));

export default function GameScreen() {
    const garageOpen = useUIStore((state) => state.garageOpen);
    const gameOverOpen = useUIStore((state) => state.gameOverOpen);
    const missionResultOpen = useUIStore((state) => state.missionResultModalOpen);

    return (
        <div className={styles.screen}>
            <GameCanvas />
            <GameHUD />
            <Suspense fallback={null}>
                <MissionPanel />
                <SkillButtons />
            </Suspense>

            <div id="damage-overlay" className={styles.overlay} />
            <div id="cold-vignette" className={styles.overlay} />

            <Suspense fallback={null}>
                {garageOpen && <GarageModal />}
                {gameOverOpen && <GameOverModal />}
                {missionResultOpen && <MissionResultModal />}
            </Suspense>

            {/* Onboarding for sea gameplay */}
            <OnboardingOverlay activeTab="sea" />
        </div>
    );
}
