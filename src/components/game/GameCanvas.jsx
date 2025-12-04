import { useRef, useEffect } from 'react';
import { Game } from '../../game/core/Game';
import useGameStore from '../../stores/useGameStore';
import useUIStore from '../../stores/useUIStore';
import useSettingsStore from '../../stores/useSettingsStore';

export default function GameCanvas() {
    const canvasRef = useRef(null);
    const gameRef = useRef(null);
    const garageOpen = useUIStore((state) => state.garageOpen);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Expose stores globally for Game.js to access
        window.__uiStore__ = useUIStore;
        window.__settingsStore__ = useSettingsStore;

        // Create game instance (only once)
        if (!gameRef.current) {
            const game = new Game(canvas, useGameStore);
            gameRef.current = game;
            // Expose game instance globally for respawn functionality
            window.__gameInstance__ = game;
            game.start();
        } else {
            // If game already exists, just restart it
            gameRef.current.start();
        }

        // Cleanup on unmount
        return () => {
            if (gameRef.current) {
                gameRef.current.stop();
            }
        };
    }, []);

    // Pause/resume game based on garage state
    useEffect(() => {
        if (gameRef.current) {
            gameRef.current.paused = garageOpen;
        }
    }, [garageOpen]);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
        />
    );
}

