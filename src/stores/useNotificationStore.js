import { create } from 'zustand';
import { nanoid } from 'nanoid';

const useNotificationStore = create((set) => ({
    notifications: [],

    addNotification: (type, message, duration = 2000) => {
        const id = nanoid();
        set((state) => ({
            notifications: [...state.notifications, { id, type, message }]
        }));

        setTimeout(() => {
            set((state) => ({
                notifications: state.notifications.filter((n) => n.id !== id)
            }));
        }, duration);
    },

    removeNotification: (id) => {
        set((state) => ({
            notifications: state.notifications.filter((n) => n.id !== id)
        }));
    }
}));

export default useNotificationStore;
