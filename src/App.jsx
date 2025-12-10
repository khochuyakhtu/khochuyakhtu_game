import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useUIStore from './stores/useUIStore';
import useGameStore from './stores/useGameStore';
import LoadingScreen from './components/screens/LoadingScreen';
import MainMenu from './components/screens/MainMenu';
import SettingsScreen from './components/screens/SettingsScreen';
import LeaderboardScreen from './components/screens/LeaderboardScreen';
import TasksScreen from './components/screens/TasksScreen';
import SavesScreen from './components/screens/SavesScreen';
import GameScreen from './components/screens/GameScreen';
import IslandScreen from './components/screens/IslandScreen';
import { initGameConfig, FRAMES_PER_SECOND } from './game/config';

import NotificationSystem from './components/ui/NotificationSystem';

function App() {
    const currentScreen = useUIStore((state) => state.currentScreen);
    const setScreen = useUIStore((state) => state.setScreen);
    const updateGameState = useGameStore((state) => state.updateGameState);

    // Initialize Telegram WebApp
    useEffect(() => {
        if (window.Telegram?.WebApp) {
            const tg = window.Telegram.WebApp;
            tg.ready();
            tg.expand();

            // Disable vertical swipes (requires version 7.7+)
            if (tg.version && parseFloat(tg.version) >= 7.7) {
                tg.disableVerticalSwipes();
            }

            // Enable closing confirmation (requires version 6.2+)
            if (tg.version && parseFloat(tg.version) >= 6.2) {
                tg.enableClosingConfirmation();
            }
        }
    }, []);

    // Load Game Config
    const configLoadedRef = useRef(false);

    useEffect(() => {
        if (configLoadedRef.current) return;
        configLoadedRef.current = true;

        const init = async () => {
            // Load configuration from DB
            await initGameConfig();

            // Check if we need to auto-start game (after loading save)
            const startGame = localStorage.getItem('yacht-start-game');
            if (startGame === 'true') {
                localStorage.removeItem('yacht-start-game');
                setScreen('game');
            } else {
                setScreen('menu');
            }
        };

        init();
    }, [setScreen]);

    // Global calendar/time updater while not in expedition (1 real second = 1 in-game minute)
    useEffect(() => {
        const id = setInterval(() => {
            const store = useGameStore.getState();
            if (store.mode === 'expedition') return; // Game loop handles expedition time
            const currentTime = store.gameState.gameTime || 0;
            const newTime = currentTime + FRAMES_PER_SECOND; // 60 frames = 1 in-game minute
            store.updateGameState({ gameTime: newTime });
        }, 1000);
        return () => clearInterval(id);
    }, [updateGameState]);

    return (
        <div className="w-full h-full overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
            <AnimatePresence mode="wait">
                {currentScreen === 'loading' && (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <LoadingScreen />
                    </motion.div>
                )}

                {currentScreen === 'menu' && (
                    <motion.div
                        key="menu"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                    >
                        <MainMenu />
                    </motion.div>
                )}

                {currentScreen === 'game' && (
                    <motion.div
                        key="game"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="w-full h-full"
                    >
                        <GameScreen />
                    </motion.div>
                )}

                {currentScreen === 'settings' && (
                    <motion.div
                        key="settings"
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.3 }}
                    >
                        <SettingsScreen />
                    </motion.div>
                )}

                {currentScreen === 'leaderboard' && (
                    <motion.div
                        key="leaderboard"
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.3 }}
                    >
                        <LeaderboardScreen />
                    </motion.div>
                )}

                {currentScreen === 'tasks' && (
                    <motion.div
                        key="tasks"
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.3 }}
                    >
                        <TasksScreen />
                    </motion.div>
                )}



                {currentScreen === 'saves' && (
                    <motion.div
                        key="saves"
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.3 }}
                    >
                        <SavesScreen />
                    </motion.div>
                )}

                {currentScreen === 'island' && (
                    <motion.div
                        key="island"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="w-full h-full"
                    >
                        <IslandScreen />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Global Notifications */}
            <NotificationSystem />
        </div>
    );
}

export default App;
