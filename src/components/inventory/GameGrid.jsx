import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { motion } from 'framer-motion';
import Slot from './Slot';
import useGameStore from '../../stores/useGameStore';
import useSettingsStore from '../../stores/useSettingsStore';
import { Haptics } from '../../game/config';

export default function GameGrid({ standalone = true }) {
    const { inventory, mergeItems, moveItem } = useGameStore();
    const vibration = useSettingsStore((state) => state.vibration);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (!over) return;

        const fromIdx = parseInt(active.id.split('-')[1]);
        const toIdx = parseInt(over.id.split('-')[1]);

        if (fromIdx === toIdx) return;

        const item1 = inventory[fromIdx];
        const item2 = inventory[toIdx];

        // Check for merge
        if (item1 && item2 &&
            item1.type === item2.type &&
            item1.tier === item2.tier &&
            item1.tier < 20) {
            // Merge!
            mergeItems(fromIdx, toIdx);

            // Haptic feedback
            if (vibration) {
                Haptics.impact('medium');
            }
        } else {
            // Simple swap
            moveItem(fromIdx, toIdx);

            if (vibration) {
                Haptics.selection();
            }
        }
    };

    const content = (
        <motion.div
            className="grid grid-cols-5 gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            {inventory.map((item, idx) => (
                <Slot key={idx} index={idx} item={item} />
            ))}
        </motion.div>
    );

    // If standalone, wrap in our own DndContext
    // If not standalone (used inside GarageModal), parent provides DndContext
    if (standalone) {
        return (
            <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
                {content}
            </DndContext>
        );
    }

    return content;
}
