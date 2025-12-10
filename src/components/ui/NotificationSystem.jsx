import { motion, AnimatePresence } from 'framer-motion';
import useNotificationStore from '../../stores/useNotificationStore';
import styles from './NotificationSystem.module.css';

export default function NotificationSystem() {
    const notifications = useNotificationStore((state) => state.notifications);

    return (
        <div className={styles.container}>
            <div className={styles.stack}>
                <AnimatePresence>
                    {notifications.map((notification) => (
                        <motion.div
                            key={notification.id}
                            initial={{ opacity: 0, y: 20, scale: 0.8 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                            className={`${styles.toast} ${styles[notification.type] || ''}`}
                        >
                            {notification.message}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
