import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { CONFIG } from '../../game/config';
import styles from './Item.module.css';

export default function Item({ item, index }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: `item-${index}`,
        data: { item, index }
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.5 : 1,
    };

    if (!item) return null;

    const partConfig = CONFIG.partTypes[item.type];
    const tierClass = styles[`tier${item.tier}`] || '';

    return (
        <motion.div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={`${styles.slot} ${styles.draggable} ${tierClass}`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
        >
            <span className={styles.icon}>{partConfig.icon}</span>
            {item.tier > 0 && (
                <span className={styles.tierBadge}>
                    {item.tier}/20
                </span>
            )}
        </motion.div>
    );
}
