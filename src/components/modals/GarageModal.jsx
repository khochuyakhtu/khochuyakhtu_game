import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import useUIStore from '../../stores/useUIStore';
import useGameStore from '../../stores/useGameStore';
import GameGrid from '../inventory/GameGrid';
import EquipSlots from '../inventory/EquipSlots';
import { CONFIG, Haptics } from '../../game/config';
import useSettingsStore from '../../stores/useSettingsStore';
import SaveSlotsModal from './SaveSlotsModal';

export default function GarageModal() {
    const { toggleGarage, garageTab, setGarageTab } = useUIStore();
    const { player, buyItem, hireCrew, autoMerge, recalcStats, inventory, mergeItems, moveItem, equipItem, unequipItem } = useGameStore();
    const vibration = useSettingsStore((state) => state.vibration);
    const [activeTab, setActiveTab] = useState('parts');
    const [showSaveSlots, setShowSaveSlots] = useState(false);

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

        const activeId = active.id;
        const overId = over.id;

        // Check if dragging from inventory to equip slot
        if (activeId.startsWith('item-') && overId.startsWith('equip-')) {
            const itemIdx = parseInt(activeId.split('-')[1]);
            const slotType = overId.split('-')[1];
            const item = inventory[itemIdx];

            if (item && item.type === slotType) {
                equipItem(slotType, itemIdx);
                recalcStats();

                if (vibration) {
                    Haptics.impact('medium');
                }
            }
            return;
        }

        // Check if dragging from equip slot to inventory slot (unequip)
        if (activeId.startsWith('equipped-') && overId.startsWith('slot-')) {
            const slotType = activeId.split('-')[1];
            const toIdx = parseInt(overId.split('-')[1]);

            // Only unequip to empty slot
            if (inventory[toIdx] === null) {
                unequipItem(slotType);
                recalcStats();

                if (vibration) {
                    Haptics.impact('medium');
                }
            }
            return;
        }

        // Check if both are inventory slots
        if (activeId.startsWith('item-') && overId.startsWith('slot-')) {
            const fromIdx = parseInt(activeId.split('-')[1]);
            const toIdx = parseInt(overId.split('-')[1]);

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
                recalcStats();

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
        }
    };

    const handleBuyItem = (type) => {
        buyItem(type);
        recalcStats();
    };

    const handleHireCrew = (type) => {
        hireCrew(type);
    };

    const handleAutoMerge = () => {
        const merged = autoMerge();
        if (merged) {
            recalcStats();
        }
    };

    const handleClose = () => {
        toggleGarage(false);
    };

    const handleSave = () => {
        setShowSaveSlots(true);
    };

    // Safety check for crew members (migration compatibility)
    const crewList = Object.keys(CONFIG.crewTypes).map((key) => ({
        ...CONFIG.crewTypes[key],
        key,
        member: (player.crew && player.crew[key]) || { hired: false, level: 0 }
    }));

    return (
        <>
            <motion.div
                className="modal-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <motion.div
                    className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto custom-scroll"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                >
                    {/* Header */}
                    <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-3">
                        <div>
                            <h2 className="text-2xl font-bold text-white">
                                Док (Пауза){' '}
                                <span className="text-sm text-green-400 ml-2">
                                    ${player.money}
                                </span>
                            </h2>
                            <div className="flex gap-2 text-[10px] text-slate-400 mt-1">
                                <button
                                    onClick={() => setActiveTab('parts')}
                                    className={`hover:text-white underline ${activeTab === 'parts' ? 'text-white' : ''}`}
                                >
                                    Запчастини
                                </button>
                                <span>|</span>
                                <button
                                    onClick={() => setActiveTab('crew')}
                                    className={`hover:text-white underline ${activeTab === 'crew' ? 'text-white' : ''}`}
                                >
                                    Екіпаж
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleSave}
                                className="text-[10px] bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded text-white font-bold"
                            >
                                💾 Зберегти
                            </button>
                            <button
                                onClick={handleClose}
                                className="text-slate-400 hover:text-white text-3xl px-2"
                            >
                                ×
                            </button>
                        </div>
                    </div>

                    {/* Parts Tab */}
                    {activeTab === 'parts' && (
                        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
                            <div className="space-y-4">
                                <EquipSlots />

                                {/* Market */}
                                <div>
                                    <h3 className="text-slate-300 text-[10px] uppercase tracking-wider font-bold mb-2">
                                        Ринок ($10)
                                    </h3>
                                    <div className="grid grid-cols-5 gap-2">
                                        {Object.keys(CONFIG.partTypes).map((type) => (
                                            <button
                                                key={type}
                                                onClick={() => handleBuyItem(type)}
                                                className="bg-slate-700/80 hover:bg-slate-600 text-white p-2 rounded border border-slate-600 text-2xl active:scale-95 transition-all"
                                            >
                                                {CONFIG.partTypes[type].icon}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Inventory */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="text-slate-300 text-[10px] uppercase tracking-wider font-bold">
                                            Склад
                                        </h3>
                                        <button
                                            onClick={handleAutoMerge}
                                            className="text-[10px] bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded text-white"
                                        >
                                            Auto-Merge
                                        </button>
                                    </div>
                                    <div className="bg-slate-800/30 rounded-xl p-3 border border-slate-700/30">
                                        <GameGrid standalone={false} />
                                    </div>
                                </div>
                            </div>
                        </DndContext>
                    )}

                    {/* Crew Tab */}
                    {activeTab === 'crew' && (
                        <div
                            className="space-y-3 max-h-[60vh] overflow-y-scroll pr-2"
                            style={{
                                WebkitOverflowScrolling: 'touch',
                                touchAction: 'pan-y',
                                overscrollBehavior: 'contain'
                            }}
                        >
                            <h3 className="text-slate-300 text-sm uppercase tracking-wider font-bold sticky top-0 bg-slate-900 pb-2 z-10">
                                Найняти Екіпаж
                            </h3>

                            {crewList.map((crew) => {
                                // Safety checks
                                const memberLevel = crew.member?.level || 0;
                                const cost = crew.member?.hired
                                    ? (CONFIG.crewUpgradeCosts && CONFIG.crewUpgradeCosts[memberLevel]) || 5000
                                    : 500;
                                const maxLevel = memberLevel >= 10;
                                const buttonLabel = crew.member?.hired
                                    ? maxLevel ? 'MAX' : `$${cost}`
                                    : '$500';
                                const buttonDisabled = maxLevel;

                                return (
                                    <div
                                        key={crew.key}
                                        className="flex items-center gap-3 bg-slate-800 p-3 rounded-lg border border-slate-700"
                                    >
                                        <div className="text-3xl">{crew.icon}</div>
                                        <div className="flex-1">
                                            <div className="font-bold text-white">{crew.name}</div>
                                            <div className="text-[10px] text-slate-400">{crew.desc}</div>
                                            {crew.member.hired && (
                                                <div className="text-[9px] text-green-400">
                                                    Рівень: {crew.member.level}
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => handleHireCrew(crew.key)}
                                            disabled={buttonDisabled}
                                            className={`${buttonDisabled
                                                ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                                                : 'bg-green-600 hover:bg-green-500 text-white'
                                                } text-xs px-3 py-2 rounded font-bold transition-all active:scale-95`}
                                        >
                                            {buttonLabel}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </motion.div>
            </motion.div>

            <AnimatePresence>
                {showSaveSlots && (
                    <SaveSlotsModal
                        onClose={() => setShowSaveSlots(false)}
                        mode="save"
                    />
                )}
            </AnimatePresence>
        </>
    );
}
