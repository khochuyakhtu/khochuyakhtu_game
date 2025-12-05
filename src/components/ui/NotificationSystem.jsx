import { motion, AnimatePresence } from 'framer-motion';
import useNotificationStore from '../../stores/useNotificationStore';

export default function NotificationSystem() {
    const notifications = useNotificationStore((state) => state.notifications);

    return (
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-[100]">
            <div className="flex flex-col items-center gap-2">
                <AnimatePresence>
                    {notifications.map((notification) => (
                        <motion.div
                            key={notification.id}
                            initial={{ opacity: 0, y: 20, scale: 0.8 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                            className={`
                                px-6 py-3 rounded-xl shadow-2xl font-bold text-white text-center min-w-[200px]
                                ${notification.type === 'error' ? 'bg-red-600/90 border border-red-400/50 shadow-red-900/50' : ''}
                                ${notification.type === 'success' ? 'bg-green-600/90 border border-green-400/50 shadow-green-900/50' : ''}
                                ${notification.type === 'warning' ? 'bg-orange-500/90 border border-orange-400/50 shadow-orange-900/50' : ''}
                                ${notification.type === 'info' ? 'bg-blue-600/90 border border-blue-400/50 shadow-blue-900/50' : ''}
                                backdrop-blur-sm
                            `}
                        >
                            {notification.message}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
