import useGameStore from './useGameStore';

// Convenience selector hook for expedition gameplay
export const useExpeditionStore = (selector) => useGameStore((state) => selector({
    expedition: state.expedition,
    player: state.player,
    yacht: state.yacht,
    gameState: state.gameState,
    setMode: state.setMode,
    startMission: state.startMission,
    completeMission: state.completeMission,
    resetAfterGameOver: state.resetAfterGameOver,
    ensureExpeditionBaseline: state.ensureExpeditionBaseline,
    updateGameState: state.updateGameState,
    updatePlayer: state.updatePlayer,
    updateCrewAbilities: state.updateCrewAbilities,
    saveToCloud: state.saveToCloud
}));

export default useExpeditionStore;
