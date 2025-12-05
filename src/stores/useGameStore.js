import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { nanoid } from 'nanoid';
import { cloudService } from '../services/CloudService';

const useGameStore = create(
    persist(
        immer((set, get) => ({
            // ... (keep existing state)

            // Game state (add lastSyncTime)
            gameState: {
                paused: true,
                gameTime: 0,
                dayPhase: 0,
                distanceTraveled: 0,
                currentBiome: null,
                mission: null,
                crewTimers: { supplier: 0, engineer: 0 },
                lastSyncTime: null
            },

            // ... (keep existing actions)

            // Cloud Actions
            saveToCloud: async () => {
                const state = get();
                // Strip unnecessary data if needed, or send full persistent state
                const saveData = {
                    player: state.player,
                    inventory: state.inventory,
                    equip: state.equip,
                    gameState: state.gameState
                };

                const success = await cloudService.saveGame(saveData);
                if (success) {
                    set((state) => {
                        state.gameState.lastSyncTime = Date.now();
                    });
                }
                return success;
            },

            loadFromCloud: async () => {
                const cloudState = await cloudService.loadGame();
                if (cloudState) {
                    // Safe merge or overwrite
                    get().loadSave(cloudState);
                    set((state) => {
                        state.gameState.lastSyncTime = Date.now();
                    });
                    return true;
                }
                return false;
            },

            // ... (keep existing actions)

            // Player state
            player: {
                x: 0,
                y: 0,
                angle: -Math.PI / 2,
                vel: { x: 0, y: 0 },
                money: 0,
                bodyTemp: 36.6,
                armorLvl: 0,
                heatResist: 0,
                pickupRange: 1,
                radarRange: 0,
                speedMult: 1,
                isYacht: false,
                isDead: false,
                invulnerable: 0,
                crew: {
                    mechanic: { hired: false, level: 0 },
                    navigator: { hired: false, level: 0 },
                    doctor: { hired: false, level: 0 },
                    merchant: { hired: false, level: 0 },
                    gunner: { hired: false, level: 0 },
                    quartermaster: { hired: false, level: 0 },
                    supplier: { hired: false, level: 0 },
                    engineer: { hired: false, level: 0 }
                },
                skills: {
                    nitro: { active: false, cd: 0, max: 600, timer: 0 },
                    flare: { cd: 0, max: 1800 },
                    repair: { cd: 0, max: 3600 }
                }
            },

            // Inventory (5x2 grid = 10 slots)
            inventory: Array(10).fill(null),

            // Equipped items
            equip: {
                hull: null,
                engine: null,
                cabin: null,
                magnet: null,
                radar: null
            },

            // Game state
            gameState: {
                paused: true,
                gameTime: 0,
                dayPhase: 0,
                distanceTraveled: 0,
                currentBiome: null,
                mission: null,
                crewTimers: { supplier: 0, engineer: 0 }
            },

            // Actions
            updatePlayer: (updates) => set((state) => {
                Object.assign(state.player, updates);
            }),

            addMoney: (amount) => set((state) => {
                state.player.money += amount;
            }),

            activateSkill: (skillId) => set((state) => {
                const skill = state.player.skills[skillId];
                if (!skill || skill.cd > 0) return;

                switch (skillId) {
                    case 'nitro':
                        // Speed boost for 3 seconds (180 frames)
                        skill.active = true;
                        skill.timer = 180;
                        skill.cd = skill.max;
                        break;
                    case 'flare':
                        // Scare away enemies (handled in Game.js)
                        skill.cd = skill.max;
                        // Set a flag for Game.js to detect
                        state.player.flareActive = true;
                        break;
                    case 'repair':
                        // Restore temperature to max
                        state.player.bodyTemp = 36.6;
                        skill.cd = skill.max;
                        break;
                }
            }),

            buyItem: (type) => {
                let result = 'error';
                set((state) => {
                    const { player, inventory } = state;
                    let cost = 10; // BASE

                    // Merchant discount - rebalanced for 10 levels
                    if (player.crew?.merchant?.hired) {
                        const discount = (player.crew.merchant.level || 0) * 0.025;
                        cost = Math.floor(cost * (1 - discount));
                    }

                    if (player.money >= cost) {
                        const emptyIdx = inventory.findIndex(item => item === null);
                        if (emptyIdx !== -1) {
                            state.player.money -= cost;
                            state.inventory[emptyIdx] = {
                                type,
                                tier: 0,
                                id: nanoid()
                            };
                            result = 'success';
                        } else {
                            result = 'full';
                        }
                    } else {
                        result = 'no_money';
                    }
                });
                return result;
            },

            moveItem: (fromIdx, toIdx) => set((state) => {
                const temp = state.inventory[fromIdx];
                state.inventory[fromIdx] = state.inventory[toIdx];
                state.inventory[toIdx] = temp;
            }),

            mergeItems: (idx1, idx2) => set((state) => {
                const item1 = state.inventory[idx1];
                const item2 = state.inventory[idx2];

                if (item1 && item2 &&
                    item1.type === item2.type &&
                    item1.tier === item2.tier &&
                    item1.tier < 20) {
                    // Merge: upgrade tier
                    state.inventory[idx1].tier += 1;
                    state.inventory[idx2] = null;
                }
            }),

            equipItem: (slotType, itemIdx) => set((state) => {
                const item = state.inventory[itemIdx];
                if (item && item.type === slotType) {
                    // Swap
                    const prevEquipped = state.equip[slotType];
                    state.equip[slotType] = item;
                    state.inventory[itemIdx] = prevEquipped;
                }
            }),

            unequipItem: (slotType) => set((state) => {
                const item = state.equip[slotType];
                if (item) {
                    const emptyIdx = state.inventory.findIndex(i => i === null);
                    if (emptyIdx !== -1) {
                        state.inventory[emptyIdx] = item;
                        state.equip[slotType] = null;
                    }
                }
            }),

            damageEquip: (slotType) => set((state) => {
                const item = state.equip[slotType];
                if (item) {
                    if (item.tier > 0) {
                        item.tier--;
                    } else {
                        state.equip[slotType] = null;
                    }
                }
            }),

            hireCrew: (type) => {
                let result = 'error';
                set((state) => {
                    const crewMember = state.player.crew[type];
                    let cost = 500;

                    if (!crewMember.hired) {
                        // Initial hire
                        if (state.player.money >= cost) {
                            state.player.money -= cost;
                            crewMember.hired = true;
                            crewMember.level = 1;

                            // Quartermaster adds inventory slot
                            if (type === 'quartermaster') {
                                state.inventory.push(null);
                            }
                            result = 'success';
                        } else {
                            result = 'no_money';
                        }
                    } else if (crewMember.level < 10) {
                        // Upgrade (levels 1-10)
                        const upgradeCosts = [500, 750, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 5000];
                        cost = upgradeCosts[crewMember.level];

                        if (state.player.money >= cost) {
                            state.player.money -= cost;
                            crewMember.level += 1;

                            // Quartermaster adds inventory slot on level up
                            if (type === 'quartermaster') {
                                state.inventory.push(null);
                            }
                            result = 'success';
                        } else {
                            result = 'no_money';
                        }
                    } else {
                        result = 'max_level';
                    }
                });
                return result;
            },

            updateCrewAbilities: () => set((state) => {
                const { player, inventory, gameState } = state;

                // --- Supplier Logic (Auto-buy) ---
                if (player.crew.supplier.hired) {
                    gameState.crewTimers.supplier -= 1;
                    if (gameState.crewTimers.supplier <= 0) {
                        const level = player.crew.supplier.level;
                        // Level 1: 3600 frames (60s), Level 10: 600 frames (10s)
                        const interval = Math.max(600, 3600 - (level - 1) * 330);

                        const cost = 10;
                        if (player.money >= cost) {
                            const emptyIdx = inventory.findIndex(i => i === null);
                            if (emptyIdx !== -1) {
                                player.money -= cost;
                                const types = ['hull', 'engine', 'cabin', 'magnet', 'radar'];
                                const type = types[Math.floor(Math.random() * types.length)];
                                inventory[emptyIdx] = {
                                    type,
                                    tier: 0,
                                    id: nanoid()
                                };
                                gameState.crewTimers.supplier = interval;
                            } else {
                                // Inventory full, retry in 5s
                                gameState.crewTimers.supplier = 300;
                            }
                        } else {
                            // No money, retry in 3s
                            gameState.crewTimers.supplier = 180;
                        }
                    }
                }

                // --- Engineer Logic (Auto-merge) ---
                if (player.crew.engineer.hired) {
                    gameState.crewTimers.engineer -= 1;
                    if (gameState.crewTimers.engineer <= 0) {
                        const level = player.crew.engineer.level;
                        // Level 1: 1800 frames (30s), Level 10: 300 frames (5s)
                        const interval = Math.max(300, 1800 - (level - 1) * 165);

                        // Auto merge logic (one merge per trigger)
                        let merged = false;
                        for (let i = 0; i < inventory.length; i++) {
                            if (!inventory[i]) continue;
                            for (let j = i + 1; j < inventory.length; j++) {
                                if (!inventory[j]) continue;
                                if (inventory[i].type === inventory[j].type &&
                                    inventory[i].tier === inventory[j].tier &&
                                    inventory[i].tier < 20) {
                                    inventory[i].tier += 1;
                                    inventory[j] = null;
                                    merged = true;
                                    break;
                                }
                            }
                            if (merged) break;
                        }

                        gameState.crewTimers.engineer = interval;
                    }
                }
            }),

            recalcStats: () => set((state) => {
                const { player, equip } = state;

                // Reset stats
                player.isYacht = false;
                player.speedMult = 1;
                player.armorLvl = 0;
                player.heatResist = 0;
                player.pickupRange = 1;
                player.radarRange = 0;

                // Check if all equip slots filled
                const equipped = Object.values(equip).filter(e => e !== null);
                player.isYacht = equipped.length === 5;

                // Apply bonuses - rebalanced for 20 tiers
                // Engine: Tier 1 = +10% speed, Tier 20 = +200% speed
                if (equip.engine) player.speedMult += (equip.engine.tier || 0) * 0.1;
                // Hull: Tier = Armor level (1:1 ratio)
                if (equip.hull) player.armorLvl = (equip.hull.tier || 0);
                // Cabin: Tier = Heat resist level +1
                if (equip.cabin) player.heatResist = (equip.cabin.tier || 0) + 1;
                // Magnet: Tier 1 = +25%, Tier 20 = +500%
                if (equip.magnet) player.pickupRange += (equip.magnet.tier || 0) * 0.25;
                // Radar: Tier 1 = 1.25x, Tier 20 = 6x
                if (equip.radar) player.radarRange = 1 + ((equip.radar.tier || 0) * 0.25);
            }),

            autoMerge: () => {
                let merged = false;

                set((state) => {
                    const { inventory } = state;

                    for (let i = 0; i < inventory.length; i++) {
                        if (!inventory[i]) continue;

                        for (let j = i + 1; j < inventory.length; j++) {
                            if (!inventory[j]) continue;

                            if (inventory[i].type === inventory[j].type &&
                                inventory[i].tier === inventory[j].tier &&
                                inventory[i].tier < 20) {
                                inventory[i].tier += 1;
                                inventory[j] = null;
                                merged = true;
                                break; // Continue outer loop
                            }
                        }
                    }
                });

                return merged;
            },

            resetPlayer: () => set((state) => {
                state.player = {
                    x: 0,
                    y: 0,
                    angle: -Math.PI / 2,
                    vel: { x: 0, y: 0 },
                    money: 0,
                    bodyTemp: 36.6,
                    armorLvl: 0,
                    heatResist: 0,
                    pickupRange: 1,
                    radarRange: 0,
                    speedMult: 1,
                    isYacht: false,
                    isDead: false,
                    invulnerable: 0,
                    crew: {
                        mechanic: { hired: false, level: 0 },
                        navigator: { hired: false, level: 0 },
                        doctor: { hired: false, level: 0 },
                        gunner: { hired: false, level: 0 },
                        quartermaster: { hired: false, level: 0 },
                        supplier: { hired: false, level: 0 },
                        engineer: { hired: false, level: 0 }
                    },
                    skills: {
                        nitro: { active: false, cd: 0, max: 600, timer: 0 },
                        flare: { cd: 0, max: 1800 },
                        repair: { cd: 0, max: 3600 }
                    }
                };
                state.inventory = Array(10).fill(null);
                state.equip = {
                    hull: null,
                    engine: null,
                    cabin: null,
                    magnet: null,
                    radar: null
                };
            }),

            updateGameState: (updates) => set((state) => {
                Object.assign(state.gameState, updates);
            }),

            loadSave: (saveData) => set((state) => {
                if (saveData.player) {
                    Object.assign(state.player, saveData.player);
                }
                if (saveData.inventory) {
                    state.inventory = saveData.inventory;
                }
                if (saveData.equip) {
                    Object.assign(state.equip, saveData.equip);
                }
                if (saveData.gameState) {
                    Object.assign(state.gameState, saveData.gameState);
                }
            })
        })),
        {
            name: 'yacht-game-storage',
            partialize: (state) => ({
                player: state.player,
                inventory: state.inventory,
                equip: state.equip,
                gameState: state.gameState
            }),
            merge: (persistedState, currentState) => {
                // Deep merge saved state with current state
                if (!persistedState) return currentState;

                console.log('Merging persisted state:', persistedState);

                // Migrate old saves
                const migratedPlayer = { ...currentState.player, ...persistedState.player };

                // Ensure crew has all members (add missing ones)
                if (migratedPlayer.crew) {
                    // Start with default crew to ensure all keys exist
                    const defaultCrew = currentState.player.crew;
                    migratedPlayer.crew = {
                        ...defaultCrew,
                        ...migratedPlayer.crew,
                    };

                    // Deep merge specifically for objects if needed, but simple replacement is usually fine for crew structs
                    // actually we need to make sure we don't have partial objects if that ever happened
                    // Let's just ensure specific critical ones if they were missing in old saves
                    ['quartermaster', 'supplier', 'engineer', 'merchant', 'doctor', 'navigator', 'mechanic', 'gunner'].forEach(role => {
                        if (!migratedPlayer.crew[role]) {
                            migratedPlayer.crew[role] = { ...defaultCrew[role] };
                        }
                    });
                }

                // Fix inventory size based on quartermaster level
                let migratedInventory = persistedState.inventory || currentState.inventory;
                const quartermasterLevel = migratedPlayer.crew?.quartermaster?.level || 0;
                const expectedInventorySize = 10 + quartermasterLevel;

                if (migratedInventory.length !== expectedInventorySize) {
                    console.log(`Migrating inventory from ${migratedInventory.length} to ${expectedInventorySize} slots`);
                    const newInventory = Array(expectedInventorySize).fill(null);
                    migratedInventory.forEach((item, index) => {
                        if (index < expectedInventorySize) {
                            newInventory[index] = item;
                        }
                    });
                    migratedInventory = newInventory;
                }

                return {
                    ...currentState,
                    player: migratedPlayer,
                    inventory: migratedInventory,
                    equip: { ...currentState.equip, ...persistedState.equip },
                    gameState: { ...currentState.gameState, ...persistedState.gameState }
                };
            }
        }
    )
);

export default useGameStore;
