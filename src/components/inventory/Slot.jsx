import { useDroppable } from '@dnd-kit/core';
import Item from './Item';
import styles from './Slot.module.css';

export default function Slot({ index, item }) {
    const { setNodeRef, isOver } = useDroppable({
        id: `slot-${index}`,
        data: { index }
    });

    return (
        <div
            ref={setNodeRef}
            className={`${styles.slot} ${isOver ? styles.dropActive : ''}`}
        >
            {item && <Item item={item} index={index} />}
        </div>
    );
}
