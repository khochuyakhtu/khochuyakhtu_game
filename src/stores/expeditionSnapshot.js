// Helpers for expedition snapshotting (resources + island state)
// Keep ASCII-only and minimal logic.

export const snapshotExpeditionState = (state) => {
    state.gameState.expeditionBaselineResources = { ...state.resources };
    state.gameState.expeditionBaselineIsland = JSON.parse(JSON.stringify(state.island));
    state.gameState.lastMissionSuccess = false;
};

export const clearExpeditionSnapshot = (state) => {
    state.gameState.expeditionBaselineResources = null;
    state.gameState.expeditionBaselineIsland = null;
    state.gameState.lastMissionSuccess = false;
};

export const restoreExpeditionSnapshot = (state) => {
    if (!state.gameState.expeditionBaselineResources) return false;

    state.resources = { ...state.gameState.expeditionBaselineResources };
    if (state.gameState.expeditionBaselineIsland) {
        state.island = JSON.parse(JSON.stringify(state.gameState.expeditionBaselineIsland));
    }
    clearExpeditionSnapshot(state);
    state.expedition.currentMission = null;
    state.gameState.mission = null;
    return true;
};

export const ensureExpeditionBaseline = (state) => {
    if (!state.gameState.expeditionBaselineResources) {
        snapshotExpeditionState(state);
    }
};
