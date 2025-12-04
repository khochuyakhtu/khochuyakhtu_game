import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useSettingsStore = create(
    persist(
        (set, get) => ({
            nickname: 'Captain',
            sound: true,
            vibration: true,

            // Leaderboard
            leaderboard: [],

            // Actions
            setNickname: (nickname) => set({ nickname }),

            setSound: (sound) => set({ sound }),

            setVibration: (vibration) => set({ vibration }),

            saveScore: (score) => set((state) => {
                const newEntry = {
                    name: state.nickname,
                    score: score,
                    date: new Date().toLocaleDateString('uk-UA')
                };

                const updatedLeaderboard = [...state.leaderboard, newEntry]
                    .sort((a, b) => b.score - a.score)
                    .slice(0, 10);

                return { leaderboard: updatedLeaderboard };
            }),
        }),
        {
            name: 'yacht-settings-storage'
        }
    )
);

export default useSettingsStore;
