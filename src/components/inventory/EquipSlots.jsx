import { useDroppable, useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import useGameStore from '../../stores/useGameStore';
import { CONFIG } from '../../game/config';

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
    const tierClass = `tier-${item.tier}`;

    return (
        <motion.div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={`item-slot ${tierClass} cursor-grab active:cursor-grabbing w-full h-full`}
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

function EquipSlot({ type, label, item }) {
    const { setNodeRef, isOver } = useDroppable({
        id: `equip-${type}`,
        data: { type, isEquipSlot: true }
    });

    return (
        <div className="flex flex-col items-center gap-1">
            <div
                ref={setNodeRef}
                className={`item-slot w-full aspect-square ${isOver ? 'ring-2 ring-yellow-400 bg-yellow-400/10' : ''} ${!item ? 'border-dashed' : ''}`}
            >
                {item && <EquippedItem type={type} item={item} />}
            </div>
            <div className="text-[9px] text-slate-400 text-center">
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
        <div className="bg-slate-800/50 p-3 rounded-xl mb-3 border border-slate-700/50">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-slate-300 text-[10px] uppercase tracking-wider font-bold">
                    Оснащення
                </h3>
                <span className={`text-[10px] ${isYacht ? 'text-emerald-400 font-bold' : 'text-red-400'}`}>
                    {isYacht ? 'Системи активні' : `Зібрано ${equipped.length}/5`}
                </span>
            </div>

            <div className="grid grid-cols-5 gap-2">
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
