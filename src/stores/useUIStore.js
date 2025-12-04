import { create } from 'zustand';

const useUIStore = create((set) => ({
    // Screen state
    currentScreen: 'loading', // 'loading' | 'menu' | 'game' | 'settings' | 'leaderboard' | 'tasks' | 'saves'

    // Modal state
    garageOpen: false,
    gameOverOpen: false,
    saveSlotModalOpen: false,

    // Tab state
    garageTab: 'parts', // 'parts' | 'crew'

    // Actions
    setScreen: (screen) => set({ currentScreen: screen }),

    toggleGarage: (open) => set({ garageOpen: open }),

    toggleGameOver: (open) => set({ gameOverOpen: open }),

    toggleSaveSlotModal: (open) => set({ saveSlotModalOpen: open }),

    setGarageTab: (tab) => set({ garageTab: tab }),

    // Generic modal setter
    setModal: (modalName, isOpen) => {
        const modalMap = {
            'garage': 'garageOpen',
            'gameOver': 'gameOverOpen',
            'saveSlot': 'saveSlotModalOpen'
        };
        const stateKey = modalMap[modalName];
        if (stateKey) {
            set({ [stateKey]: isOpen });
        }
    },
}));

export default useUIStore;
