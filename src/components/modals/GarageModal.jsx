import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DndContext, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import useUIStore from '../../stores/useUIStore';
import useGameStore from '../../stores/useGameStore';
import useNotificationStore from '../../stores/useNotificationStore';
import GameGrid from '../inventory/GameGrid';
import EquipSlots from '../inventory/EquipSlots';
import { CONFIG, Haptics, getCrewUpgradeCost, getEngineerIntervalFrames, getSupplierIntervalFrames } from '../../game/config';
import useSettingsStore from '../../stores/useSettingsStore';


export default function GarageModal() {
    const { toggleGarage, garageTab, setGarageTab } = useUIStore();
    const { player, yacht, buyItem, hireCrew, autoMerge, recalcStats, inventory, mergeItems, moveItem, equipItem, unequipItem, saveToCloud, loadFromCloud, gameState } = useGameStore();
    const addNotification = useNotificationStore((state) => state.addNotification);
    const vibration = useSettingsStore((state) => state.vibration);
    const [activeTab, setActiveTab] = useState('parts');
    const [selectedCrewKey, setSelectedCrewKey] = useState(null);

    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: {
                distance: 10,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 150,
                tolerance: 5,
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
        // Prevent event propagation if needed, though usually not for simple buttons
        const result = buyItem(type);
        if (result === 'success') {
            recalcStats();
            Haptics.selection();
            //addNotification('success', 'Успішно куплено!');
        } else if (result === 'no_money') {
            Haptics.notify('error');
            addNotification('error', 'Недостатньо грошей!');
        } else if (result === 'full') {
            Haptics.notify('warning');
            addNotification('warning', 'Склад переповнений!', 3000);
        }
    };

    const handleHireCrew = (type) => {
        const result = hireCrew(type);
        if (result === 'success') {
            recalcStats();
            Haptics.selection();
            addNotification('success', 'Екіпаж покращено!');
        } else if (result === 'no_money') {
            Haptics.notify('error');
            addNotification('error', 'Недостатньо грошей!');
        } else if (result === 'max_level') {
            addNotification('info', 'Максимальний рівень!');
        }
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





    // Safety check for crew members (migration compatibility)
    const crewList = Object.keys(CONFIG.crewTypes).map((key) => ({
        ...CONFIG.crewTypes[key],
        key,
        member: (yacht.crew && yacht.crew[key]) || { hired: false, level: 0 }
    }));

    const getBonusText = (crew, level) => {
        const lvl = Math.max(0, level);
        switch (crew.key) {
            case 'merchant':
                return `Знижка: ${(lvl * 2.5).toFixed(1)}%`;
            case 'engineer':
                return `Авто-злиття: раз в ${(getEngineerIntervalFrames(Math.max(1, lvl)) / 60).toFixed(1)}с`;
            case 'supplier':
                return `Постачання: раз в ${(getSupplierIntervalFrames(Math.max(1, lvl)) / 60).toFixed(1)}с`;
            case 'quartermaster':
                return `Слотів: +${lvl}`;
            case 'gunner':
                return lvl > 0 ? `Шкода + швидкостріл: рівень ${lvl}` : '';
            case 'mechanic':
                return `Відновлення корпусу й тепла: рівень ${lvl}`;
            case 'doctor':
                return lvl > 0 ? `Опір холоду та шанс врятувати: рівень ${lvl}` : 'Опір холоду та шанс врятувати: рівень 0';
            case 'navigator':
                return `Швидкість/маневреність: рівень ${lvl}`;
            default:
                return '';
        }
    };

    const getBonusComparison = (crew) => {
        const current = crew.member?.level || 0;
        const next = crew.member?.hired ? current + 1 : 1;
        return {
            current: getBonusText(crew, current) || '—',
            next: getBonusText(crew, next) || '—',
            currentLevel: current,
            nextLevel: next
        };
    };

    const selectedCrew = crewList.find(c => c.key === selectedCrewKey) || crewList[0];

    return (
        <>
            <motion.div
                className="modal-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 50
                }}
            >
                <motion.div
                    className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto custom-scroll"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    style={{
                        WebkitOverflowScrolling: 'touch',
                        overscrollBehavior: 'contain',
                        touchAction: 'pan-y'
                    }}
                    // Ensure touches propagate for scrolling
                    onPointerDown={(e) => e.stopPropagation()}
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
                                        Ринок (${(() => {
                                            let cost = 10;
                                            if (player.crew?.merchant?.hired) {
                                                const discount = (player.crew.merchant.level || 0) * 0.025;
                                                cost = Math.floor(cost * (1 - discount));
                                            }
                                            return cost;
                                        })()})
                                    </h3>
                                    <div className="grid grid-cols-5 gap-2">
                                        {Object.keys(CONFIG.partTypes).map((type) => (
                                            <button
                                                key={type}
                                                onPointerDown={(e) => e.stopPropagation()}
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
                        <div className="space-y-3 pr-2 pb-10">
                            <h3 className="text-slate-300 text-sm uppercase tracking-wider font-bold sticky top-0 bg-slate-900 pb-2 z-10">
                                Найняти Екіпаж
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                                <div className="md:col-span-2 space-y-2">
                                    {crewList.map((crew) => {
                                        const memberLevel = crew.member?.level || 0;
                                        const bonusText = getBonusText(crew, memberLevel);
                                        const isSelected = selectedCrew?.key === crew.key;

                                        return (
                                            <button
                                                key={crew.key}
                                                onClick={() => setSelectedCrewKey(crew.key)}
                                                className={`w-full text-left bg-slate-800 p-3 rounded-lg border transition-all ${isSelected ? 'border-cyan-500 shadow-cyan-500/20 shadow-lg' : 'border-slate-700 hover:border-slate-500'}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="text-3xl">{crew.icon}</div>
                                                    <div className="flex-1">
                                                        <div className="font-bold text-white">{crew.name}</div>
                                                        <div className="text-[10px] text-slate-400">{crew.desc}</div>
                                                        {crew.member.hired && (
                                                            <div className="flex flex-col gap-0.5 mt-1">
                                                                <div className="text-[9px] text-green-400 font-bold">
                                                                    Рівень: {crew.member.level}
                                                                </div>
                                                                {bonusText && (
                                                                    <div className="text-[9px] text-yellow-400">
                                                                        💎 {bonusText}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>

                                {selectedCrew && (
                                    <div className="md:col-span-3 bg-slate-800 rounded-xl border border-slate-700 p-4 space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-16 h-16 rounded-xl bg-slate-700 flex items-center justify-center text-4xl">
                                                {selectedCrew.photo || selectedCrew.icon || '👤'}
                                            </div>
                                            <div>
                                                <div className="text-white font-bold text-lg">{selectedCrew.name}</div>
                                                <div className="text-slate-400 text-sm">{selectedCrew.desc}</div>
                                            </div>
                                        </div>

                                        <div className="bg-slate-900/60 rounded-lg p-3 space-y-2 border border-slate-700/50">
                                            <div className="text-slate-300 text-xs uppercase font-bold">Поточний рівень</div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-slate-400">Рівень: {getBonusComparison(selectedCrew).currentLevel}</span>
                                                <span className="text-yellow-400 text-xs">{getBonusComparison(selectedCrew).current}</span>
                                            </div>
                                            <div className="text-slate-300 text-xs uppercase font-bold">Наступний рівень</div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-slate-400">Рівень: {getBonusComparison(selectedCrew).nextLevel}</span>
                                                <span className="text-emerald-400 text-xs">
                                                    {getBonusComparison(selectedCrew).next}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="text-sm text-slate-300">
                                                Вартість: ${getCrewUpgradeCost(selectedCrew.member?.hired ? selectedCrew.member.level + 1 : 1)}
                                            </div>
                                            <button
                                                onClick={() => handleHireCrew(selectedCrew.key)}
                                                className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-bold border border-green-700 active:scale-95 transition-all"
                                            >
                                                {selectedCrew.member?.hired ? 'Покращити' : 'Найняти'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </motion.div>
            </motion.div>


        </>
    );
}
