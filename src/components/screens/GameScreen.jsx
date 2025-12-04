import { useState } from 'react';
import GameCanvas from '../game/GameCanvas';
import GameHUD from '../game/GameHUD';
import SkillButtons from '../game/SkillButtons';
import MissionPanel from '../game/MissionPanel';
import GarageModal from '../modals/GarageModal';
import GameOverModal from '../modals/GameOverModal';
import useUIStore from '../../stores/useUIStore';

export default function GameScreen() {
    const garageOpen = useUIStore((state) => state.garageOpen);
    const gameOverOpen = useUIStore((state) => state.gameOverOpen);

    return (
        <div className="relative w-full h-full overflow-hidden bg-black">
            {/* Game Canvas (Game logic will be rendered here) */}
            <GameCanvas />

            {/* HUD Overlay */}
            <GameHUD />

            {/* Mission Panel */}
            <MissionPanel />

            {/* Skill Buttons */}
            <SkillButtons />

            {/* Damage Overlay */}
            <div
                id="damage-overlay"
                className="absolute inset-0 pointer-events-none"
            />

            {/* Cold Vignette */}
            <div id="cold-vignette" />

            {/* Modals */}
            {garageOpen && <GarageModal />}
            {gameOverOpen && <GameOverModal />}
        </div>
    );
}
