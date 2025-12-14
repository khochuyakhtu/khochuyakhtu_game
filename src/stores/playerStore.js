import useGameStore from './useGameStore';

// Convenience selector hook for player-specific data/actions
export const usePlayerStore = (selector) => useGameStore((state) => selector({
    player: state.player,
    inventory: state.inventory,
    equip: state.equip,
    resources: state.resources,
    updatePlayer: state.updatePlayer,
    resetPlayer: state.resetPlayer,
    addMoney: state.addMoney,
    addResource: state.addResource,
    spendResources: state.spendResources,
    recalcStats: state.recalcStats,
    moveItem: state.moveItem,
    mergeItems: state.mergeItems,
    equipItem: state.equipItem,
    unequipItem: state.unequipItem
}));

export default usePlayerStore;
