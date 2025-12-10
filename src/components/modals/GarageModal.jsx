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
import styles from './GarageModal.module.css';


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
                className={styles.backdrop}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <motion.div
                    className={styles.modal}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    // Ensure touches propagate for scrolling
                    onPointerDown={(e) => e.stopPropagation()}
                >
                    <div className={styles.header}>
                        <div>
                            <h2 className={styles.title}>
                                Док (Пауза){' '}
                                <span className={styles.money}>
                                    ${player.money}
                                </span>
                            </h2>
                            <div className={styles.tabs}>
                                <button
                                    onClick={() => setActiveTab('parts')}
                                    className={`${styles.tab} ${activeTab === 'parts' ? styles.tabActive : ''}`}
                                >
                                    Запчастини
                                </button>
                                <span className={styles.tabDivider}>|</span>
                                <button
                                    onClick={() => setActiveTab('crew')}
                                    className={`${styles.tab} ${activeTab === 'crew' ? styles.tabActive : ''}`}
                                >
                                    Екіпаж
                                </button>
                            </div>
                        </div>
                        <div className={styles.headerActions}>
                            <button
                                onClick={handleClose}
                                className={styles.close}
                            >
                                ×
                            </button>
                        </div>
                    </div>

                    {activeTab === 'parts' && (
                        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
                            <div className={styles.section}>
                                <EquipSlots />

                                <div>
                                    <h3 className={styles.sectionLabel}>
                                        Ринок (${(() => {
                                            let cost = 10;
                                            if (player.crew?.merchant?.hired) {
                                                const discount = (player.crew.merchant.level || 0) * 0.025;
                                                cost = Math.floor(cost * (1 - discount));
                                            }
                                            return cost;
                                        })()})
                                    </h3>
                                    <div className={styles.marketGrid}>
                                        {Object.keys(CONFIG.partTypes).map((type) => (
                                            <button
                                                key={type}
                                                onPointerDown={(e) => e.stopPropagation()}
                                                onClick={() => handleBuyItem(type)}
                                                className={styles.marketButton}
                                            >
                                                {CONFIG.partTypes[type].icon}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <div className={styles.inventoryHeader}>
                                        <h3 className={styles.sectionLabel}>
                                            Склад
                                        </h3>
                                        <button
                                            onClick={handleAutoMerge}
                                            className={styles.autoMerge}
                                        >
                                            Auto-Merge
                                        </button>
                                    </div>
                                    <div className={styles.inventoryGrid}>
                                        <GameGrid standalone={false} />
                                    </div>
                                </div>
                            </div>
                        </DndContext>
                    )}

                    {activeTab === 'crew' && (
                        <div className={styles.sectionCrew}>
                            <h3 className={styles.crewHeading}>
                                Найняти Екіпаж
                            </h3>

                            <div className={styles.crewGrid}>
                                <div className={styles.crewList}>
                                    {crewList.map((crew) => {
                                        const memberLevel = crew.member?.level || 0;
                                        const bonusText = getBonusText(crew, memberLevel);
                                        const isSelected = selectedCrew?.key === crew.key;

                                        return (
                                            <button
                                                key={crew.key}
                                                onClick={() => setSelectedCrewKey(crew.key)}
                                                className={`${styles.crewCard} ${isSelected ? styles.crewCardActive : ''}`}
                                            >
                                                <div className={styles.crewRow}>
                                                    <div className={styles.crewIcon}>{crew.icon}</div>
                                                    <div className={styles.crewInfo}>
                                                        <div className={styles.crewName}>{crew.name}</div>
                                                        <div className={styles.crewDesc}>{crew.desc}</div>
                                                        {crew.member.hired && (
                                                            <div className={styles.crewStats}>
                                                                <div className={styles.crewLevel}>
                                                                    Рівень: {crew.member.level}
                                                                </div>
                                                                {bonusText && (
                                                                    <div className={styles.crewBonus}>
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
                                    <div className={styles.crewDetails}>
                                        <div className={styles.crewDetailsHeader}>
                                            <div className={styles.crewAvatar}>
                                                {selectedCrew.photo || selectedCrew.icon || '👤'}
                                            </div>
                                            <div>
                                                <div className={styles.crewDetailsName}>{selectedCrew.name}</div>
                                                <div className={styles.crewDetailsDesc}>{selectedCrew.desc}</div>
                                            </div>
                                        </div>

                                        <div className={styles.crewLevels}>
                                            <div className={styles.levelLabel}>Поточний рівень</div>
                                            <div className={styles.levelRow}>
                                                <span className={styles.levelText}>Рівень: {getBonusComparison(selectedCrew).currentLevel}</span>
                                                <span className={styles.levelCurrent}>{getBonusComparison(selectedCrew).current}</span>
                                            </div>
                                            <div className={styles.levelLabel}>Наступний рівень</div>
                                            <div className={styles.levelRow}>
                                                <span className={styles.levelText}>Рівень: {getBonusComparison(selectedCrew).nextLevel}</span>
                                                <span className={styles.levelNext}>
                                                    {getBonusComparison(selectedCrew).next}
                                                </span>
                                            </div>
                                        </div>

                                        <div className={styles.crewActions}>
                                            <div className={styles.cost}>
                                                Вартість: ${getCrewUpgradeCost(selectedCrew.member?.hired ? selectedCrew.member.level + 1 : 1)}
                                            </div>
                                            <button
                                                onClick={() => handleHireCrew(selectedCrew.key)}
                                                className={styles.hireButton}
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
