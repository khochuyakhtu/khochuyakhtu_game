import { useDroppable } from '@dnd-kit/core';
import Item from './Item';

export default function Slot({ index, item }) {
    const { setNodeRef, isOver } = useDroppable({
        id: `slot-${index}`,
        data: { index }
    });

    return (
        <div
            ref={setNodeRef}
            className={`item-slot ${isOver ? 'ring-2 ring-yellow-400 bg-yellow-400/10' : ''}`}
        >
            {item && <Item item={item} index={index} />}
        </div>
    );
}
