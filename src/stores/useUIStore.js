import { create } from 'zustand';

const useUIStore = create((set) => ({
    // Screen state
    currentScreen: 'loading', // 'loading' | 'menu' | 'game' | 'settings' | 'leaderboard' | 'tasks' | 'saves'

    // Modal state
    garageOpen: false,
    gameOverOpen: false,
    saveSlotModalOpen: false,
    missionsModalOpen: false,
    missionResultModalOpen: false,

    // Onboarding state
    onboardingStep: 0, // legacy
    onboardingSeen: false, // legacy
    onboardingTabsSeen: {},

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
            'saveSlot': 'saveSlotModalOpen',
            'missions': 'missionsModalOpen',
            'missionResult': 'missionResultModalOpen'
        };
        const stateKey = modalMap[modalName];
        if (stateKey) {
            set({ [stateKey]: isOpen });
        }
    },

    // Onboarding actions
    startOnboarding: () => set({ onboardingStep: 0, onboardingSeen: false }),
    nextOnboardingStep: () => set((state) => ({ onboardingStep: state.onboardingStep + 1 })),
    skipOnboarding: () => set({ onboardingSeen: true, onboardingStep: 0 }),
    completeOnboarding: () => set({ onboardingSeen: true, onboardingStep: 0 }),

    // Tab onboarding
    markTabOnboardingSeen: (tab) => set((state) => {
        if (!tab) return {};
        const current = state.onboardingTabsSeen || {};
        return { onboardingTabsSeen: { ...current, [tab]: true } };
    })
}));

export default useUIStore;
