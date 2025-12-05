import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { CONFIG } from '../../game/config';

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
    const tierClass = `tier-${item.tier}`;

    return (
        <motion.div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={`item-slot ${tierClass} cursor-grab active:cursor-grabbing`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
        >
            <span className="select-none">{partConfig.icon}</span>
            {item.tier > 0 && (
                <span className="absolute top-0 right-0 text-[8px] font-bold bg-black/50 px-1 rounded">
                    {item.tier}/20
                </span>
            )}
        </motion.div>
    );
}
