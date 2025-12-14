import { nanoid } from 'nanoid';

// Social helpers isolated for reuse across slices
export const createInitialSocialState = () => ({
    strikeDaysRemaining: 0,
    activeFestivalDays: 0,
    festivalCooldown: 0,
    lastFestivalAt: null,
    lastCrisis: null
});

export const ensureSocialState = (island) => {
    if (!island.social) island.social = createInitialSocialState();
    if (!Array.isArray(island.vips)) island.vips = [];
    if (!Array.isArray(island.unlockedUniqueBuildings)) island.unlockedUniqueBuildings = [];
    return island.social;
};

export const getSocialSnapshot = (island) => ({
    social: island?.social || createInitialSocialState(),
    vips: Array.isArray(island?.vips) ? island.vips : []
});

export const pushEventLog = (state, payload) => {
    const event = {
        id: nanoid(),
        timestamp: Date.now(),
        ...payload
    };
    if (!state.island.eventLog) state.island.eventLog = [];
    state.island.eventLog.unshift(event);
    if (state.island.eventLog.length > 10) {
        state.island.eventLog.pop();
    }
};

export const aggregateVipModifiers = (vips = [], definitions = {}) =>
    vips.reduce((acc, vip) => {
        const cfg = definitions[vip.id] || {};
        acc.moodBonus += cfg.moodBonus || 0;
        acc.productionMult += cfg.productionMult || 0;
        acc.strikeResist += cfg.strikeResist || 0;
        acc.sabotageMitigation += cfg.sabotageMitigation || 0;
        acc.festivalDiscount = Math.max(acc.festivalDiscount, cfg.festivalDiscount || 0);
        acc.festivalMoodBonus += cfg.festivalMoodBonus || 0;
        if (cfg.unlockBuilding && !acc.unlocks.includes(cfg.unlockBuilding)) {
            acc.unlocks.push(cfg.unlockBuilding);
        }
        return acc;
    }, {
        moodBonus: 0,
        productionMult: 0,
        strikeResist: 0,
        sabotageMitigation: 0,
        festivalDiscount: 0,
        festivalMoodBonus: 0,
        unlocks: []
    });
