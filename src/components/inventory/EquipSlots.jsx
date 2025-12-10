import { useDroppable, useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import useGameStore from '../../stores/useGameStore';
import { CONFIG } from '../../game/config';
import styles from './EquipSlots.module.css';

// Draggable item inside equip slot
function EquippedItem({ type, item }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: `equipped-${type}`,
        data: { item, type, isEquipped: true }
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.5 : 1,
    };

    const partConfig = CONFIG.partTypes[type];
    const tierClass = styles[`tier${item.tier}`] || '';

    return (
        <motion.div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={`${styles.itemSlot} ${tierClass} ${styles.draggable}`}
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

function EquipSlot({ type, label, item }) {
    const { setNodeRef, isOver } = useDroppable({
        id: `equip-${type}`,
        data: { type, isEquipSlot: true }
    });

    return (
        <div className={styles.slotWrapper}>
            <div
                ref={setNodeRef}
                className={`${styles.itemSlot} ${styles.emptySlot} ${isOver ? styles.dropActive : ''} ${!item ? styles.dashed : ''}`}
            >
                {item && <EquippedItem type={type} item={item} />}
            </div>
            <div className={styles.slotLabel}>
                {label}
            </div>
        </div>
    );
}

export default function EquipSlots() {
    const { equip, recalcStats } = useGameStore();

    const equipSlots = [
        { type: 'hull', label: 'Броня' },
        { type: 'engine', label: 'Рушій' },
        { type: 'cabin', label: 'Рубка' },
        { type: 'magnet', label: 'Магніт' },
        { type: 'radar', label: 'Радар' }
    ];

    const equipped = Object.values(equip).filter(e => e !== null);
    const isYacht = equipped.length === 5;

    return (
        <div className={styles.wrapper}>
            <div className={styles.header}>
                <h3 className={styles.title}>
                    Оснащення
                </h3>
                <span className={`${styles.status} ${isYacht ? styles.statusReady : styles.statusMissing}`}>
                    {isYacht ? 'Системи активні' : `Зібрано ${equipped.length}/5`}
                </span>
            </div>

            <div className={styles.grid}>
                {equipSlots.map((slot) => (
                    <EquipSlot
                        key={slot.type}
                        type={slot.type}
                        label={slot.label}
                        item={equip[slot.type]}
                    />
                ))}
            </div>
        </div>
    );
}
