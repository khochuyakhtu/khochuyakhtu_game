import useGameStore from './useGameStore';

// Convenience selector hook for island-related state/actions
export const useIslandStore = (selector) => useGameStore((state) => selector({
    island: state.island,
    resources: state.resources,
    resourceLimits: state.resourceLimits,
    addBuilding: state.addBuilding,
    upgradeBuilding: state.upgradeBuilding,
    addResident: state.addResident,
    assignWorker: state.assignWorker,
    unassignWorker: state.unassignWorker,
    tickIsland: state.tickIsland,
    startFestival: state.startFestival,
    getSocialRisk: state.getSocialRisk
}));

export default useIslandStore;
