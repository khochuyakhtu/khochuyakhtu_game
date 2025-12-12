import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useMemo, useRef } from 'react';
import {
    Sun,
    CloudRain,
    Smile,
    Heart,
    Hammer,
    Users as UsersIcon,
    Home,
    Ship,
    Package,
    Map,
    Zap,
    Droplets,
    ScrollText,
    AlertCircle,
    Trees,
    Fish,
    Save,
    ChevronDown
} from 'lucide-react';
import useGameStore from '../../stores/useGameStore';
import useUIStore from '../../stores/useUIStore';
import GarageModal from '../modals/GarageModal';
import SaveSlotModal from '../modals/SaveSlotsModal';
import BuildingDetailsModal from '../modals/BuildingDetailsModal';
import WorkerAssignmentModal from '../modals/WorkerAssignmentModal';
import MissionsModal from '../modals/MissionsModal';
import { CONFIG, RESOURCES, getBuildingUpgradeCost, calculateCalendar, FRAMES_PER_DAY, FRAMES_PER_SECOND, getBuildingLimit } from '../../game/config';

/**
 * IslandScreen - Main island management interface
 * Shows buildings, residents, resources, and actions
 */
export default function IslandScreen() {
    const [activeTab, setActiveTab] = useState('overview');

    const island = useGameStore((state) => state.island);
    const resources = useGameStore((state) => state.resources);
    const gameState = useGameStore((state) => state.gameState);

    const { buildings, residents, populationCap, weather } = island;
    const weatherConfig = CONFIG.weatherTypes[weather.type] || CONFIG.weatherTypes.sunny;
    const currentFrame = gameState?.gameTime || 0;
    const calendar = calculateCalendar(currentFrame);
    const dayFraction = (currentFrame % FRAMES_PER_DAY) / FRAMES_PER_DAY;
    const hour = Math.floor(dayFraction * 24).toString().padStart(2, '0');

    const saveToCloud = useGameStore((state) => state.saveToCloud);
    const tickIsland = useGameStore((state) => state.tickIsland);
    const updateGameState = useGameStore((state) => state.updateGameState);
    const lastDayRef = useRef(calendar.day);

    useEffect(() => {
        const interval = setInterval(() => {
            const store = useGameStore.getState();
            const currentTime = store.gameState?.gameTime || 0;
            const newTime = currentTime + FRAMES_PER_SECOND;
            updateGameState({ gameTime: newTime });

            const cal = calculateCalendar(newTime);
            if (cal.day > (lastDayRef.current || 0)) {
                const diff = cal.day - lastDayRef.current;
                for (let i = 0; i < diff; i++) {
                    tickIsland();
                }
                lastDayRef.current = cal.day;
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [updateGameState, tickIsland]);

    const handleCloudSave = async () => {
        const success = await saveToCloud();
        if (success) alert('✅ Гра збережена в хмару!');
        else alert('❌ Помилка збереження');
    };



    const setScreen = useUIStore((state) => state.setScreen);

    return (
        <div className="h-screen w-screen bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600 font-sans text-slate-800 flex justify-center overflow-hidden relative selection:bg-pink-300">
            <MissionsModal />

            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-400/30 blur-[100px] rounded-full mix-blend-overlay pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-teal-300/20 blur-[100px] rounded-full mix-blend-overlay pointer-events-none"></div>

            <div className="w-full max-w-md h-screen relative flex flex-col bg-white/5 backdrop-blur-sm shadow-2xl overflow-hidden">
                <div className="flex-1 overflow-y-auto pb-40">
                    <main className="px-4 space-y-4 z-10 pt-2">
                        <AnimatePresence mode="wait">
                            {activeTab === 'overview' && (
                                <OverviewTab
                                    key="overview"
                                    island={island}
                                    resources={resources}
                                    weatherConfig={weatherConfig}
                                    onSave={handleCloudSave}
                                />
                            )}
                            {activeTab === 'buildings' && (
                                <CardWrapper key="buildings">
                                    <BuildingsTab buildings={buildings} residents={residents} />
                                </CardWrapper>
                            )}
                            {activeTab === 'residents' && (
                                <CardWrapper key="residents">
                                    <ResidentsTab residents={residents} buildings={buildings} />
                                </CardWrapper>
                            )}
                            {activeTab === 'inventory' && (
                                <CardWrapper key="inventory">
                                    <InventoryTab resources={resources} />
                                </CardWrapper>
                            )}
                        </AnimatePresence>
                    </main>
                </div>
            </div>

            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-[380px] z-50">
                <nav className="flex justify-between items-end bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-2 px-3 shadow-2xl">
                    <NavButton icon={<Map size={18} />} label="Огляд" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
                    <NavButton icon={<Home size={18} />} label="Будівлі" active={activeTab === 'buildings'} onClick={() => setActiveTab('buildings')} />
                    <NavButton icon={<Ship size={18} />} label="В море!" active={false} highlight onClick={() => setScreen('game')} />
                    <NavButton icon={<UsersIcon size={18} />} label="Люди" active={activeTab === 'residents'} onClick={() => setActiveTab('residents')} />
                    <NavButton icon={<Package size={18} />} label="Склад" active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} />
                </nav>
            </div>
        </div>
    );
}

/**
 * Overview tab - stats and summary
 */
function OverviewTab({ island, resources, weatherConfig, onSave }) {
    const { residents, buildings, averageMood, averageHealth } = island;
    const getProductionSummary = useGameStore((state) => state.getProductionSummary);
    const updateGameState = useGameStore((state) => state.updateGameState);
    const startFestival = useGameStore((state) => state.startFestival);
    const getSocialRisk = useGameStore((state) => state.getSocialRisk);
    const gameState = useGameStore((state) => state.gameState);

    const [isCycleRunning, setIsCycleRunning] = useState(false);

    const currentFrame = gameState?.gameTime || 0;
    const calendar = calculateCalendar(currentFrame);
    const dayFraction = (currentFrame % FRAMES_PER_DAY) / FRAMES_PER_DAY;
    const hour = Math.floor(dayFraction * 24).toString().padStart(2, '0');
    const cycleDay = ((calendar.day - 1) % 7) + 1;
    const cycleProgress = Math.min(100, ((cycleDay - 1 + dayFraction) / 7) * 100);

    const workerCount = residents.filter(r => r.assignedBuildingId).length;

    const { production, consumption } = getProductionSummary ? getProductionSummary() : { production: {}, consumption: {} };
    const productionChips = Object.entries(production || {}).map(([res, amt]) => ({
        label: `${RESOURCES[res]?.name || res}: +${amt}`,
        color: 'bg-emerald-400'
    })).slice(0, 4);
    const consumptionChips = Object.entries(consumption || {}).filter(([_, amt]) => amt > 0).map(([res, amt]) => ({
        label: `${RESOURCES[res]?.name || res}: -${amt}`,
        color: 'bg-orange-400'
    })).slice(0, 4);

    const startCycle = () => {
        if (isCycleRunning) return;
        setIsCycleRunning(true);

        const store = useGameStore.getState();
        const currentTime = store.gameState?.gameTime || 0;
        const currentCal = calculateCalendar(currentTime);
        const currentDayFraction = (currentTime % FRAMES_PER_DAY) / FRAMES_PER_DAY;
        const currentCycleDay = ((currentCal.day - 1) % 7) + 1;
        const completedDays = (currentCycleDay - 1) + currentDayFraction;
        const remainingDays = Math.max(0, 7 - completedDays);

        const newTime = currentTime + remainingDays * FRAMES_PER_DAY;
        updateGameState({ gameTime: newTime });

        setTimeout(() => setIsCycleRunning(false), 400);
    };

    const socialRisk = useMemo(() => getSocialRisk ? getSocialRisk() : null, [getSocialRisk, island.averageMood, island.social]);
    const vips = island.vips || [];
    const festivalConfig = CONFIG.festivalConfig || {};
    const vipDiscount = vips.reduce((acc, vip) => {
        const info = CONFIG.vips?.[vip.id];
        return Math.max(acc, info?.festivalDiscount || 0);
    }, 0);
    const festivalCost = useMemo(() => {
        const rawCost = festivalConfig.cost || { money: 100, food: 20, water: 15 };
        const discounted = {};
        Object.entries(rawCost).forEach(([res, amount]) => {
            discounted[res] = Math.ceil(amount * (1 - vipDiscount));
        });
        return discounted;
    }, [festivalConfig.cost, vipDiscount]);

    const handleFestival = () => {
        if (!startFestival) return;
        startFestival();
    };

    return (
        <motion.div
            className="space-y-4 pb-28"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
        >
            <div className="relative w-full max-w-md mx-auto bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600 rounded-3xl p-4 text-white shadow-2xl overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-white/10 blur-3xl rounded-full" />
                <div className="absolute bottom-[-30%] right-[-20%] w-[70%] h-[70%] bg-cyan-400/20 blur-3xl rounded-full" />
                <div className="relative z-10 space-y-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-2">
                                <div className="bg-gradient-to-tr from-yellow-300 to-orange-500 p-2 rounded-lg shadow-lg rotate-3">
                                    🏠
                                </div>
                                <div>
                                    <h1 className="text-xl font-extrabold tracking-tight drop-shadow-md">Острів <span className="text-sky-100">Притулок</span></h1>
                                    <div className="flex items-center gap-2 text-blue-100 text-xs font-semibold">
                                        <UsersIcon size={14} />
                                        <span>Населення: {residents.length}/{island.populationCap}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center gap-2 bg-black/20 backdrop-blur-md rounded-full px-3 py-1 text-white border border-white/10 shadow-sm">
                                {weatherConfig.type === 'rain' || weatherConfig.type === 'storm' ? (
                                    <CloudRain size={14} className="text-blue-200" />
                                ) : (
                                    <Sun size={14} className="text-yellow-200" />
                                )}
                                <span className="text-[10px] font-bold">{calendar.day <= 3 ? 'Ранок' : 'День'}, {hour}:00</span>
                            </div>
                            <CloudButton icon={<Save size={12} />} onClick={onSave} label="Зберегти" />
                        </div>
                    </div>

                    <IslandVisual />

                    <div className="grid grid-cols-2 gap-3">
                            <StatCardNew icon={<Smile size={20} />} value={`${Math.round(averageMood)}%`} label="Настрій" accent="from-yellow-300 to-amber-400" />
                            <StatCardNew icon={<Heart size={20} />} value={`${Math.round(averageHealth)}%`} label="Здоров'я" accent="from-rose-300 to-pink-400" />
                            <StatCardNew icon={<Hammer size={20} />} value={`${workerCount}/${residents.length || 0}`} label="Працюють" accent="from-sky-300 to-blue-400" sub="Всі при ділі" />
                            <StatCardNew icon={<Home size={20} />} value={buildings.length} label="Будівлі" accent="from-emerald-300 to-teal-400" />
                    </div>

                    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 shadow-xl space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <Zap size={18} className="text-yellow-200" />
                                Виробничий цикл
                            </h3>
                            <span className="text-xs bg-white/10 px-2 py-1 rounded-lg border border-white/10">День {cycleDay}/7</span>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            {productionChips.map((chip, idx) => (
                                <ProductionChip key={`prod-${idx}`} color={chip.color} label={chip.label} />
                            ))}
                            {consumptionChips.map((chip, idx) => (
                                <ProductionChip key={`cons-${idx}`} color={chip.color} label={chip.label} />
                            ))}
                            {productionChips.length === 0 && consumptionChips.length === 0 && (
                                <span className="text-xs text-blue-100">Немає активних виробництв</span>
                            )}
                        </div>
                        <div className="relative">
                            <div className="h-3 w-full bg-black/20 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-emerald-300 to-cyan-400 transition-all duration-100"
                                    style={{ width: `${cycleProgress}%` }}
                                />
                            </div>
                            <span className={`absolute -top-6 right-0 text-xs font-bold ${isCycleRunning ? 'text-emerald-200 animate-pulse' : 'text-white/80'}`}>
                                {Math.round(cycleProgress)}%
                            </span>
                        </div>
                        <ActionButtonNew onClick={startCycle} disabled={isCycleRunning}>
                            {isCycleRunning ? 'Цикл йде...' : 'Запустити цикл'} {!isCycleRunning && '▶'}
                        </ActionButtonNew>
                    </div>

                    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 shadow-xl space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold flex items-center gap-2">🤝 Соціальний стан</h3>
                            <span className="text-xs bg-white/10 px-2 py-1 rounded-lg border border-white/10">
                                {socialRisk?.strikeDaysRemaining > 0 ? `Страйк ${socialRisk.strikeDaysRemaining}д` : 'Стабільно'}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <StatCardNew icon="✊" value={socialRisk ? `${socialRisk.strike}%` : '—'} label="Ризик страйку" accent="from-orange-300 to-red-400" />
                            <StatCardNew icon="🧨" value={socialRisk ? `${socialRisk.sabotage}%` : '—'} label="Ризик саботажу" accent="from-amber-300 to-orange-400" />
                        </div>
                        <div className="flex flex-wrap gap-2 items-center">
                            {Object.entries(festivalCost).map(([res, amt]) => (
                                <span key={res} className="bg-white/5 px-2 py-1 rounded-lg border border-white/10 text-xs text-white">
                                    {RESOURCES[res]?.icon || '📦'} {amt}
                                </span>
                            ))}
                            <button
                                className="ml-auto text-xs font-bold bg-indigo-500/80 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg shadow"
                                onClick={handleFestival}
                                disabled={island.social?.activeFestivalDays > 0}
                            >
                                🎉 Свято
                            </button>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[11px] text-blue-50 uppercase font-semibold">VIP бафи</p>
                            {vips.length > 0 ? (
                                <div className="grid grid-cols-2 gap-2">
                                    {vips.map(vip => {
                                        const info = CONFIG.vips?.[vip.id] || {};
                                        return (
                                            <div key={vip.id} className="bg-white/5 rounded-lg p-2 border border-white/10 flex items-center gap-2">
                                                <span className="text-xl">{info.icon || '⭐'}</span>
                                                <div className="text-white">
                                                    <p className="text-sm font-semibold leading-tight">{info.name || vip.id}</p>
                                                    <p className="text-[11px] text-blue-100">{info.desc || 'Пасивний бонус'}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-xs text-blue-100">Врятуйте VIP у морі, щоб отримати унікальні бафи.</p>
                            )}
                        </div>
                    </div>

                    <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-2xl p-4 space-y-3 shadow-xl">
                        <h3 className="text-sm font-bold text-blue-100 flex items-center gap-2 uppercase tracking-wide">
                            📜 Останні події
                        </h3>
                        <div className="space-y-2">
                            {island.eventLog && island.eventLog.length > 0 ? (
                                island.eventLog.slice(0, 3).map(event => (
                                    <EventItem key={event.id} event={event} />
                                ))
                            ) : (
                                <p className="text-slate-200 text-sm">Спокійно... Поки що...</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

const Villager = ({ type, x, y, delay = 0 }) => {
    const animationClass = type === 'worker' ? 'animate-bounce' : 'animate-pulse';
    const colorClass = type === 'worker' ? 'bg-orange-500' : 'bg-blue-500';
    return (
        <div
            className="absolute transition-all duration-1000 ease-in-out z-10 flex flex-col items-center"
            style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${delay}s` }}
        >
            <div className={`w-3 h-3 ${colorClass} rounded-full shadow-sm ${animationClass} relative`}>
                <div className="absolute -top-1 left-0.5 w-2 h-2 bg-orange-100 rounded-full" />
            </div>
            <div className="w-4 h-1 bg-black/20 rounded-full blur-[1px] mt-0.5" />
        </div>
    );
};

// Visual mini-island (matching temp.jsx)
const IslandVisual = () => (
    <div className="relative w-full h-64 mb-2 perspective-1000 group">
        <div className="absolute inset-0 bg-blue-500/20 rounded-3xl backdrop-blur-sm overflow-hidden border border-white/15 shadow-inner">
            <div className="absolute bottom-4 left-10 text-white/20 animate-pulse"><Fish size={16} /></div>
            <div className="absolute top-10 right-10 text-white/20 animate-bounce delay-700"><Fish size={14} /></div>
        </div>

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[70%] transition-transform duration-700 group-hover:scale-105">
            <div className="absolute inset-0 bg-[#e2c799] rounded-[40%_60%_70%_30%/40%_50%_60%_50%] shadow-[0_10px_30px_rgba(0,0,0,0.2)] border-b-8 border-[#c5a878]">
                <div className="absolute inset-2 bg-gradient-to-br from-emerald-400 to-green-600 rounded-[40%_60%_70%_30%/40%_50%_60%_50%] opacity-90 overflow-hidden">
                    <div className="absolute top-[20%] left-[20%] text-green-800 drop-shadow-md"><Trees size={24} fill="#166534" /></div>
                    <div className="absolute top-[15%] right-[30%] text-green-900 drop-shadow-md"><Trees size={20} fill="#14532d" /></div>
                    <div className="absolute bottom-[30%] left-[15%] text-green-800 drop-shadow-md"><Trees size={28} fill="#166534" /></div>

                    <div className="absolute bottom-[40%] right-[25%]">
                        <div className="w-8 h-6 bg-amber-700 rounded-sm shadow-lg relative">
                            <div className="absolute -top-4 -left-1 w-10 h-6 bg-amber-800 rounded-t-full flex items-center justify-center">
                                <div className="w-2 h-2 bg-black/40 rounded-full" />
                            </div>
                        </div>
                    </div>

                    <Villager type="worker" x={25} y={30} delay={0} />
                    <div className="absolute animate-[walk_10s_infinite_linear]" style={{ top: '60%', left: '40%' }}>
                        <Villager type="citizen" x={0} y={0} delay={1} />
                    </div>
                    <Villager type="citizen" x={70} y={55} delay={2} />
                </div>
            </div>
        </div>

        <style>{`
            @keyframes walk {
                0% { transform: translateX(0) translateY(0); }
                25% { transform: translateX(20px) translateY(10px); }
                50% { transform: translateX(0) translateY(20px); }
                75% { transform: translateX(-20px) translateY(10px); }
                100% { transform: translateX(0) translateY(0); }
            }
        `}</style>
    </div>
);

const StatCardNew = ({ icon, value, label, accent, sub }) => (
    <div className="relative overflow-hidden bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3 flex flex-col items-center justify-center shadow-lg">
        <div className={`absolute top-0 right-0 p-3 opacity-10 text-white bg-gradient-to-br ${accent} blur-xl`} />
        <div className={`p-2 rounded-full mb-2 text-white bg-gradient-to-br ${accent} shadow-inner`}>
            {icon}
        </div>
        <span className="text-2xl font-bold text-white drop-shadow-md">{value}</span>
        <span className="text-[11px] text-blue-50 font-semibold uppercase tracking-wider">{label}</span>
        {sub && <span className="text-[10px] text-blue-100 mt-1">{sub}</span>}
    </div>
);

const ProductionChip = ({ color, label }) => (
    <div className="flex items-center gap-1.5 text-white/90 bg-white/5 px-2 py-1 rounded-lg border border-white/10">
        <div className={`w-2 h-2 rounded-full ${color}`}></div>
        <span className="text-xs font-medium whitespace-nowrap">{label}</span>
    </div>
);

const ActionButtonNew = ({ onClick, disabled, children }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className="relative w-full py-3 px-4 rounded-xl font-bold text-white shadow-xl bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 disabled:opacity-70 disabled:cursor-not-allowed border-b-4 border-teal-700 active:border-b-0 active:translate-y-1 transition-all duration-200 flex items-center justify-center gap-2 uppercase"
    >
        {children}
    </button>
);

const EventItem = ({ event }) => (
    <div className="bg-white/5 rounded-lg p-2.5 flex gap-3 items-center border border-white/5">
        <div className="bg-blue-500/20 p-1.5 rounded-full text-blue-100 shrink-0">
            {event.icon ? <span className="text-sm">{event.icon}</span> : <AlertCircle size={14} />}
        </div>
        <div>
            <p className="text-sm text-white font-semibold">{event.name || 'Подія'}</p>
            <p className="text-xs text-blue-100 opacity-90">{event.message}</p>
        </div>
    </div>
);

const NavButton = ({ icon, label, active, onClick, highlight }) => (
    <button
        onClick={onClick}
        className={`
            flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all duration-300 w-16
            ${active ? 'bg-white text-blue-600 shadow-lg -translate-y-2' : 'text-blue-100 hover:bg-white/10 hover:text-white'}
            ${highlight ? 'bg-gradient-to-tr from-blue-500 to-cyan-400 text-white shadow-lg shadow-cyan-500/30 -translate-y-4 scale-110 border-2 border-white/20' : ''}
        `}
    >
        {icon}
        <span className={`text-[10px] font-bold ${active ? 'opacity-100' : 'opacity-80'}`}>{label}</span>
    </button>
);

const CardWrapper = ({ children }) => (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 shadow-xl text-white">
        {children}
    </div>
);

function StatusCard({ icon, label, value, color }) {
    const colors = {
        green: 'from-green-600/30 to-green-700/20 border-green-500/30',
        yellow: 'from-yellow-600/30 to-yellow-700/20 border-yellow-500/30',
        red: 'from-red-600/30 to-red-700/20 border-red-500/30',
        blue: 'from-blue-600/30 to-blue-700/20 border-blue-500/30',
        purple: 'from-purple-600/30 to-purple-700/20 border-purple-500/30'
    };

    return (
        <div className={`bg-gradient-to-br ${colors[color]} border rounded-xl p-3`}>
            <div className="flex items-center gap-2">
                <span className="text-xl">{icon}</span>
                <div>
                    <p className="text-white font-bold text-lg">{value}</p>
                    <p className="text-slate-400 text-xs">{label}</p>
                </div>
            </div>
        </div>
    );
}

function ProductionStat({ icon, label, value, positive = true }) {
    return (
        <div className="bg-slate-700/50 rounded-lg p-2">
            <span className="text-lg">{icon}</span>
            <p className={`font-bold text-sm ${positive ? 'text-green-400' : 'text-red-400'}`}>{value}</p>
            <p className="text-slate-400 text-[10px] line-clamp-1">{label}</p>
        </div>
    );
}



/**
 * Buildings tab
 */
function BuildingsTab({ buildings, residents }) {
    const [subTab, setSubTab] = useState('shop'); // 'shop' | 'owned'
    const [selectedCategory, setSelectedCategory] = useState('all'); // Shop category
    const [selectedOwnedCategory, setSelectedOwnedCategory] = useState('all'); // Owned category
    const [selectedTier, setSelectedTier] = useState(1);
    const [selectedBuildingId, setSelectedBuildingId] = useState(null); // Changed to ID for live updates
    const [selectedShopConfig, setSelectedShopConfig] = useState(null);

    const weather = useGameStore((state) => state.island.weather);
    const resources = useGameStore((state) => state.resources);
    const spendResources = useGameStore((state) => state.spendResources);
    const addBuilding = useGameStore((state) => state.addBuilding);
    const unassignWorker = useGameStore((state) => state.unassignWorker);
    const assignWorker = useGameStore((state) => state.assignWorker);
    const upgradeBuilding = useGameStore((state) => state.upgradeBuilding);

    // Derive selected building from store data to ensure it's always fresh
    const selectedBuilding = buildings.find(b => b.id === selectedBuildingId) || null;

    // Get buildings from config
    const allBuildings = CONFIG.buildings || {};
    const categories = CONFIG.buildingCategories || {};

    const buildingCounts = buildings.reduce((acc, b) => {
        acc[b.configId] = (acc[b.configId] || 0) + 1;
        return acc;
    }, {});

    // PROCESSED DATA FOR SHOP
    const filteredShopBuildings = Object.values(allBuildings).filter(b => {
        const tierMatch = b.tier <= selectedTier;
        const categoryMatch = selectedCategory === 'all' || b.category === selectedCategory;
        return tierMatch && categoryMatch;
    });

    // PROCESSED DATA FOR OWNED
    const filteredOwnedBuildings = buildings.filter(b => {
        const config = allBuildings[b.configId] || {};
        return selectedOwnedCategory === 'all' || config.category === selectedOwnedCategory;
    });

    // Check if can afford
    const canAfford = (cost) => {
        if (!cost) return true;
        return Object.entries(cost).every(([res, amt]) => (resources[res] || 0) >= amt);
    };

    const handleBuild = (buildingConfig) => {
        const limit = getBuildingLimit(buildingConfig);
        const currentCount = buildingCounts[buildingConfig.id] || 0;
        if (currentCount >= limit) return;

        if (canAfford(buildingConfig.cost) && spendResources(buildingConfig.cost)) {
            addBuilding(buildingConfig.id, { x: 0, y: 0 });
            // Optional: Switch to owned tab or show success
        }
    };

    const handleUpgrade = (building) => {
        const config = allBuildings[building.configId];
        if (!config) return;

        // Calculate upgrade cost
        // Use base cost from config. Note: config.cost is the base cost in our current structure logic
        const upgradeCost = getBuildingUpgradeCost(config.cost, building.level);

        if (canAfford(upgradeCost) && spendResources(upgradeCost)) {
            upgradeBuilding(building.id);
        }
    };

    const tabs = [
        { key: 'shop', label: 'Магазин' },
        { key: 'owned', label: 'Мої будівлі' }
    ];

    const tierOptions = [1, 2, 3, 4].map((tier) => ({
        value: String(tier),
        label: `Епоха ${['І', 'ІІ', 'ІІІ', 'IV'][tier - 1]}`
    }));

    const categoryOptions = [{ id: 'all', name: 'Всі', icon: '🔄' }, ...Object.entries(categories).map(([id, cat]) => ({ id, name: cat.name, icon: cat.icon }))]
        .map(opt => ({ value: opt.id, label: `${opt.icon} ${opt.name}` }));

    const renderCost = (cost) => (
        <div className="flex flex-wrap gap-1.5">
            {Object.entries(cost || {}).map(([res, amount]) => {
                const enough = (resources[res] || 0) >= amount;
                return (
                    <span
                        key={res}
                        className={`text-[11px] rounded-lg px-2 py-1 border ${enough ? 'border-white/20 bg-white/10 text-white' : 'border-red-500/40 bg-red-500/10 text-red-100'}`}
                    >
                        {RESOURCES[res]?.icon} {amount}
                    </span>
                );
            })}
        </div>
    );

    const ShopCard = ({ cfg }) => {
        const limit = getBuildingLimit(cfg);
        const currentCount = buildingCounts[cfg.id] || 0;
        const atLimit = currentCount >= limit;
        const tierLabel = ['І', 'ІІ', 'ІІІ', 'IV', 'V'][cfg.tier - 1] || cfg.tier;
        const limitLabel = Number.isFinite(limit) ? `${currentCount}/${limit}` : `${currentCount}/∞`;
        const progress = Number.isFinite(limit) ? Math.min(100, (currentCount / limit) * 100) : 0;

        return (
            <motion.div
                className="relative overflow-hidden rounded-[22px] p-4 text-left bg-gradient-to-br from-blue-700/70 via-sky-600/70 to-blue-700/60 border border-white/10 shadow-lg min-h-[220px] cursor-pointer"
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setSelectedShopConfig(cfg)}
            >
                <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">{cfg.icon}</span>
                        <div>
                            <p className="text-white font-bold text-sm leading-tight">{cfg.name}</p>
                            <p className="text-cyan-100 text-[11px]">Епоха {tierLabel}</p>
                        </div>
                    </div>
                    {atLimit && <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/30 text-red-100 border border-red-400/40 shadow-sm">Максимум</span>}
                </div>

                <p className="text-blue-50/90 text-sm mb-4 min-h-[42px] leading-snug">{cfg.description}</p>

                <div className="flex items-center gap-2 mb-3">
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-black/25 border border-white/10 text-white font-semibold">Ліміт {limitLabel}</span>
                    <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                        <div className={`h-full ${atLimit ? 'bg-red-400' : 'bg-emerald-400'}`} style={{ width: `${progress}%` }} />
                    </div>
                </div>

                {renderCost(cfg.cost)}
            </motion.div>
        );
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex bg-white/10 p-1 rounded-2xl mb-4 shrink-0 border border-white/15 shadow">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${subTab === tab.key ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-white shadow-lg' : 'text-blue-100 hover:text-white'}`}
                        onClick={() => setSubTab(tab.key)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <motion.div
                className="space-y-4 flex-1 overflow-y-auto min-h-0 pb-32 custom-scroll"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
            >
                {subTab === 'shop' && (
                    <>
                        <div className="grid grid-cols-2 gap-3 pb-3">
                            <Dropdown
                                label="Епоха"
                                value={String(selectedTier)}
                                options={tierOptions}
                                onChange={(v) => setSelectedTier(Number(v))}
                            />
                            <Dropdown
                                label="Тип"
                                value={selectedCategory}
                                options={categoryOptions}
                                onChange={(v) => setSelectedCategory(v)}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3 pb-12">
                            {filteredShopBuildings.map(cfg => (
                                <ShopCard key={cfg.id} cfg={cfg} />
                            ))}
                        </div>
                    </>
                )}

                {subTab === 'owned' && (
                    <>
                        <div className="pb-2">
                            <Dropdown
                                label="Тип"
                                value={selectedOwnedCategory}
                                options={categoryOptions}
                                onChange={(v) => setSelectedOwnedCategory(v)}
                            />
                        </div>

                        <div className="space-y-2 pb-6">
                            {filteredOwnedBuildings.length === 0 ? (
                                <div className="text-center py-10 bg-white/5 rounded-xl border border-white/10">
                                    <span className="text-4xl opacity-60">🏝️</span>
                                    <p className="text-blue-100 mt-2">
                                        {buildings.length === 0 ? 'Ви ще нічого не побудували' : 'У цій категорії немає будівель'}
                                    </p>
                                    {buildings.length === 0 && (
                                        <button
                                            className="mt-4 text-emerald-200 font-bold hover:underline"
                                            onClick={() => setSubTab('shop')}
                                        >
                                            Перейти в магазин
                                        </button>
                                    )}
                                </div>
                            ) : (
                                filteredOwnedBuildings.map((building) => (
                                    <BuildingCard
                                        key={building.id}
                                        building={building}
                                        residents={residents}
                                        onClick={() => setSelectedBuildingId(building.id)}
                                    />
                                ))
                            )}
                        </div>
                    </>
                )}
            </motion.div>

            <BuildingDetailsModal
                isOpen={!!selectedBuilding}
                onClose={() => setSelectedBuildingId(null)}
                building={selectedBuilding}
                residents={residents}
                allBuildings={buildings}
                weather={weather}
                onUnassign={unassignWorker}
                onAssign={(residentId) => assignWorker(residentId, selectedBuilding.id)}
                onUpgrade={() => handleUpgrade(selectedBuilding)}
                resources={resources}
            />
            <ShopDetailsModal
                isOpen={!!selectedShopConfig}
                onClose={() => setSelectedShopConfig(null)}
                config={selectedShopConfig}
                canAfford={canAfford}
                onBuild={() => { if (selectedShopConfig) { handleBuild(selectedShopConfig); setSelectedShopConfig(null); } }}
            />
        </div>
    );
}

function ShopDetailsModal({ isOpen, onClose, config, canAfford, onBuild }) {
    const resources = useGameStore((state) => state.resources);
    const buildings = useGameStore((state) => state.island.buildings || []);

    if (!isOpen || !config) return null;

    const tierLabel = ['І', 'ІІ', 'ІІІ', 'IV', 'V'][config.tier - 1] || config.tier || '-';
    const limit = getBuildingLimit(config);
    const currentCount = buildings.filter(b => b.configId === config.id).length;
    const limitLabel = Number.isFinite(limit) ? `${currentCount}/${limit}` : `${currentCount}/∞`;
    const atLimit = Number.isFinite(limit) ? currentCount >= limit : false;

    const rawConsumption = config.consumption ?? config.consumption_json;
    let consumption = {};
    if (rawConsumption) {
        consumption = typeof rawConsumption === 'string' ? (() => { try { return JSON.parse(rawConsumption); } catch { return {}; } })() : rawConsumption;
    }

    const outputEntries = [];
    const baseOutput = config.baseOutput ?? config.base_output;
    if (config.output) {
        if (typeof config.output === 'string') {
            outputEntries.push([config.output, baseOutput ?? 0]);
        } else if (typeof config.output === 'object') {
            Object.entries(config.output).forEach(([res, amount]) => outputEntries.push([res, amount]));
        }
    }

    const effectText = () => {
        if (!config.effect) return null;
        const { type, value, bonus } = config.effect;
        if (type === 'storage') return `Склад: +${bonus || value || 0}`;
        if (type === 'mood') return `Настрій: +${value || 0}%`;
        if (type === 'health') return `Здоров'я: +${value || 0}%`;
        if (type === 'repair_per_sec') return `Ремонт: +${value || 0}/с`;
        return `${type}: +${value || bonus || 0}`;
    };

    const populationBonus = config.populationBonus ?? config.population_bonus;
    const canBuild = !atLimit && (canAfford ? canAfford(config.cost || {}) : true);

    const renderCost = (cost) => (
        <div className="flex flex-wrap gap-2">
            {Object.entries(cost || {}).map(([res, amt]) => {
                const enough = (resources[res] || 0) >= amt;
                return (
                    <span
                        key={res}
                        className={`text-xs px-2 py-1 rounded-lg border ${enough ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-100' : 'border-red-400/40 bg-red-500/10 text-red-100'}`}
                    >
                        {RESOURCES[res]?.icon || '📦'} {amt}
                    </span>
                );
            })}
        </div>
    );

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    <motion.div
                        className="relative w-full max-w-md bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
                        initial={{ scale: 0.95, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 10 }}
                    >
                        <div className="p-4 bg-white/5 border-b border-white/10 flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="text-4xl">{config.icon || '🏗️'}</div>
                                <div>
                                    <p className="text-white font-bold text-lg leading-tight">{config.name}</p>
                                    <div className="flex gap-2 mt-1 text-[11px] text-slate-200">
                                        <span className="px-2 py-0.5 rounded-full bg-sky-500/20 border border-sky-400/30">Епоха {tierLabel}</span>
                                        {config.category && (
                                            <span className="px-2 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-400/30 capitalize">
                                                {CONFIG.buildingCategories?.[config.category]?.name || config.category}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <button className="text-slate-300 hover:text-white" onClick={onClose}>✕</button>
                        </div>

                        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto custom-scroll">
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-slate-100 text-sm leading-relaxed">
                                {config.description || 'Деталі будівлі незабаром.'}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                                    <p className="text-[11px] text-slate-400 uppercase font-semibold">Ліміт</p>
                                    <p className="text-white font-bold text-lg">{limitLabel}</p>
                                </div>
                                <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                                    <p className="text-[11px] text-slate-400 uppercase font-semibold">Працівники</p>
                                    <p className="text-white font-bold text-lg">{config.slots || 0}</p>
                                </div>
                                {populationBonus && (
                                    <div className="bg-white/5 border border-white/10 rounded-xl p-3 col-span-2">
                                        <p className="text-[11px] text-slate-400 uppercase font-semibold">Місця для жителів</p>
                                        <p className="text-white font-bold text-lg">+{populationBonus}</p>
                                    </div>
                                )}
                                {config.effect && (
                                    <div className="bg-white/5 border border-white/10 rounded-xl p-3 col-span-2">
                                        <p className="text-[11px] text-slate-400 uppercase font-semibold">Ефект</p>
                                        <p className="text-white font-bold text-base">{effectText()}</p>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-green-500/10 border border-green-400/20 rounded-xl p-3">
                                    <p className="text-[11px] text-green-200 uppercase font-semibold mb-1">Виробництво</p>
                                    <div className="space-y-1">
                                        {outputEntries.length > 0 ? outputEntries.map(([res, amt]) => (
                                            <div key={res} className="flex items-center justify-between text-sm text-green-100">
                                                <span className="flex items-center gap-2">
                                                    <span>{RESOURCES[res]?.icon || '📦'}</span>
                                                    <span>{RESOURCES[res]?.name || res}</span>
                                                </span>
                                                <span className="font-bold">+{formatCycleValue(amt)}/цикл</span>
                                            </div>
                                        )) : (
                                            <p className="text-green-200/80 text-sm">Немає виробництва</p>
                                        )}
                                    </div>
                                </div>
                                <div className="bg-red-500/10 border border-red-400/20 rounded-xl p-3">
                                    <p className="text-[11px] text-red-200 uppercase font-semibold mb-1">Споживання</p>
                                    <div className="space-y-1">
                                        {Object.keys(consumption || {}).length > 0 ? Object.entries(consumption).map(([res, amt]) => (
                                            <div key={res} className="flex items-center justify-between text-sm text-red-100">
                                                <span className="flex items-center gap-2">
                                                    <span>{RESOURCES[res]?.icon || '📦'}</span>
                                                    <span>{RESOURCES[res]?.name || res}</span>
                                                </span>
                                                <span className="font-bold">-{formatCycleValue(amt)}/цикл</span>
                                            </div>
                                        )) : (
                                            <p className="text-red-200/80 text-sm">Немає споживання</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                                <p className="text-[11px] text-slate-400 uppercase font-semibold mb-2">Вартість</p>
                                {renderCost(config.cost || {})}
                            </div>

                            <button
                                className={`w-full py-3 rounded-xl font-bold text-sm shadow-lg border ${canBuild ? 'bg-emerald-500 hover:bg-emerald-400 text-white border-emerald-400/50' : 'bg-slate-700 text-slate-300 border-slate-600 cursor-not-allowed'}`}
                                disabled={!canBuild}
                                onClick={onBuild}
                            >
                                {atLimit ? 'Досягнуто ліміту' : canBuild ? 'Будувати' : 'Немає ресурсів'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

const Dropdown = ({ label, value, options, onChange }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const selected = options.find(o => o.value === value) || options[0];

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div className="flex flex-col gap-1 text-xs text-blue-100 font-semibold" ref={ref}>
            <span>{label}</span>
            <div className="relative">
                <motion.button
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white flex items-center justify-between gap-2 shadow-md hover:border-cyan-300/60 transition-colors"
                    onClick={() => setOpen((v) => !v)}
                    whileTap={{ scale: 0.98 }}
                >
                    <span className="truncate text-left">{selected?.label}</span>
                    <ChevronDown size={16} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
                </motion.button>

                <AnimatePresence>
                    {open && (
                        <motion.div
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            className="absolute z-20 mt-2 w-full bg-slate-900/95 border border-white/10 rounded-xl shadow-2xl overflow-hidden backdrop-blur-md"
                        >
                            <div className="max-h-60 overflow-y-auto custom-scroll">
                                {options.map(opt => (
                                    <button
                                        key={opt.value}
                                        className={`w-full text-left px-3 py-2 text-sm text-white hover:bg-cyan-500/20 transition-colors ${opt.value === value ? 'bg-white/10' : ''}`}
                                        onClick={() => { onChange(opt.value); setOpen(false); }}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

function BuildingCard({ building, residents, weather, onClick }) {
    const assignedWorkers = residents.filter(r => r.assignedBuildingId === building.id);
    const config = CONFIG.buildings[building.configId] || {};
    const cycle = calculateBuildingCycle(building, config, residents, weather);
    const productionEntries = Object.entries(cycle.production);
    const consumptionEntries = Object.entries(cycle.consumption);

    return (
        <motion.div
            className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50 cursor-pointer active:scale-[0.99] transition-transform"
            onClick={onClick}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="text-3xl">{config.icon || '🏠'}</span>
                    <div>
                        <p className="text-white font-bold">{config.name || building.configId}</p>
                        <p className="text-slate-400 text-xs">Рівень {building.level} · {config.category}</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="bg-slate-700/50 px-2 py-1 rounded-lg">
                        <p className="text-cyan-400 font-bold text-sm">{assignedWorkers.length} / {config.slots || 0} 👷</p>
                        <p className="text-slate-500 text-[10px]">Ефективність {Math.round(cycle.efficiency * 100)}%</p>
                    </div>
                </div>
            </div>

            <div className="mt-2 flex flex-wrap gap-2 text-xs">
                {productionEntries.length > 0 ? productionEntries.map(([res, amount]) => (
                    <span key={res} className="flex items-center gap-1 text-green-400 bg-green-500/10 px-2 py-1 rounded-lg">
                        +{formatCycleValue(amount)} {RESOURCES[res]?.icon || '📦'}/цикл
                    </span>
                )) : (
                    <span className="text-slate-500">Немає виробництва</span>
                )}

                {consumptionEntries.map(([res, amount]) => (
                    <span key={res} className="flex items-center gap-1 text-red-400 bg-red-500/10 px-2 py-1 rounded-lg">
                        -{formatCycleValue(amount)} {RESOURCES[res]?.icon || '📦'}/цикл
                    </span>
                ))}
            </div>
        </motion.div>
    );
}

/**
 * Residents tab
 */


function ResidentsTab({ residents, buildings }) {
    const assignWorker = useGameStore((state) => state.assignWorker);
    const unassignWorker = useGameStore((state) => state.unassignWorker);
    const [selectedWorker, setSelectedWorker] = useState(null);

    return (
        <motion.div
            className="space-y-4 pb-28"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
        >
            {residents.length === 0 ? (
                <div className="bg-slate-800/60 rounded-xl p-6 text-center">
                    <span className="text-4xl">🚣</span>
                    <p className="text-white font-bold mt-2">Ще немає жителів</p>
                    <p className="text-slate-400 text-sm">Вирушайте в море та рятуйте людей!</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {residents.map((resident) => (
                        <ResidentCard
                            key={resident.id}
                            resident={resident}
                            buildings={buildings}
                            onAssignClick={() => setSelectedWorker(resident)}
                            onUnassign={() => unassignWorker(resident.id)}
                        />
                    ))}
                </div>
            )}

            <WorkerAssignmentModal
                isOpen={!!selectedWorker}
                onClose={() => setSelectedWorker(null)}
                worker={selectedWorker}
                buildings={buildings}
                residents={residents}
                onAssign={(buildingId) => assignWorker(selectedWorker.id, buildingId)}
            />
        </motion.div>
    );
}

function ResidentCard({ resident, buildings, onAssignClick, onUnassign }) {
    const professionEmojis = {
        worker: '👷',
        fisher: '🎣',
        scientist: '👨‍🔬',
        pilot: '👨‍✈️',
        engineer: '👨‍🔧',
        doctor: '👨‍⚕️',
        vip: '👑',
        strongman: '💪'
    };

    const isWorking = !!resident.assignedBuildingId;

    return (
        <div className={`bg-slate-800/60 rounded-xl p-3 border ${isWorking ? 'border-green-500/30' : 'border-slate-700/50'
            }`}>
            <div className="flex items-center gap-3">
                <span className="text-3xl">{professionEmojis[resident.profession] || '🙋'}</span>
                <div className="flex-1">
                    <p className="text-white font-bold">{resident.name}</p>
                    <p className="text-slate-400 text-xs capitalize">{resident.profession} · Рівень {resident.level || 1}</p>
                    <div className="flex gap-2 mt-1">
                        <span className="text-xs text-green-400">❤️ {resident.health}%</span>
                        <span className="text-xs text-yellow-400">😊 {resident.mood}%</span>
                    </div>
                </div>
                <div>
                    {isWorking ? (
                        <motion.button
                            className="bg-red-600/20 text-red-400 px-2 py-1 rounded text-xs border border-red-500/30"
                            onClick={onUnassign}
                            whileTap={{ scale: 0.95 }}
                        >
                            Звільнити
                        </motion.button>
                    ) : (
                        <motion.button
                            className="bg-cyan-600/20 text-cyan-400 px-2 py-1 rounded text-xs border border-cyan-500/30"
                            onClick={onAssignClick}
                            whileTap={{ scale: 0.95 }}
                            disabled={buildings.length === 0}
                        >
                            Призначити
                        </motion.button>
                    )}
                </div>
            </div>
        </div>
    );
}

/**
 * Inventory tab - resource storage overview
 */
function InventoryTab({ resources }) {
    const resourceLimits = useGameStore((state) => state.resourceLimits);

    // Group resources by category
    const resourceCategories = {
        building: { name: 'Будівельні', icon: '🏗️', items: ['wood', 'stone', 'metal', 'plastic'] },
        consumable: { name: 'Споживання', icon: '🍖', items: ['food', 'water'] },
        energy: { name: 'Енергія', icon: '⚡', items: ['energy', 'coal'] },
        special: { name: 'Особливі', icon: '🌟', items: ['science', 'money'] }
    };

    return (
        <motion.div
            className="space-y-4 h-full overflow-y-auto pr-1 pb-28 custom-scrollbar"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
        >
            {Object.entries(resourceCategories).map(([catKey, category]) => (
                <div key={catKey} className="bg-slate-800/60 rounded-xl p-4">
                    <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                        <span>{category.icon}</span> {category.name}
                    </h3>
                    <div className="flex flex-col gap-3">
                        {category.items.map((resKey) => {
                            const config = RESOURCES[resKey];
                            if (!config) return null;
                            const value = resources[resKey] || 0;
                            const limit = resourceLimits[resKey];
                            const percent = limit ? Math.min(100, (value / limit) * 100) : 0;

                            return (
                                <div key={resKey} className="bg-slate-700/50 rounded-lg p-3">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            <span className="text-xl shrink-0">{config.icon}</span>
                                            <span className="text-white font-bold text-sm truncate">{config.name}</span>
                                        </div>
                                        <span className="text-cyan-400 font-bold text-sm text-right whitespace-nowrap">
                                            {formatNumber(value)}{limit && <span className="text-slate-500 text-xs">/{formatNumber(limit)}</span>}
                                        </span>
                                    </div>
                                    {limit && (
                                        <div className="h-1.5 bg-slate-600 rounded-full overflow-hidden">
                                            <motion.div
                                                className={`h-full rounded-full ${percent > 80 ? 'bg-green-500' :
                                                    percent > 30 ? 'bg-cyan-500' : 'bg-red-500'
                                                    }`}
                                                initial={{ width: 0 }}
                                                animate={{ width: `${percent}%` }}
                                                transition={{ duration: 0.5 }}
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </motion.div>
    );
}

function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return Math.floor(num).toString();
}

// Helpers to show real per-cycle production/consumption based on workers
function calculateBuildingCycle(building, config, residents, weather) {
    const workerCount = residents.filter(r => r.assignedBuildingId === building.id).length;
    const maxSlots = config.slots || 0;
    const efficiency = maxSlots > 0 ? Math.min(1, workerCount / maxSlots) : 1;
    const levelBonus = 1 + (building.level - 1) * 0.15;
    const weatherBonus = (config.output === 'water' && weather?.effects?.waterBonus)
        ? 1 + weather.effects.waterBonus / 100
        : 1;

    const production = {};
    const baseOutput = config.baseOutput ?? config.base_output ?? 0;
    if (typeof config.output === 'string' && baseOutput) {
        production[config.output] = Math.floor(baseOutput * efficiency * levelBonus * weatherBonus);
    } else if (config.output && typeof config.output === 'object') {
        Object.entries(config.output).forEach(([res, amount]) => {
            production[res] = Math.floor((amount || 0) * efficiency * levelBonus * weatherBonus);
        });
    }

    const consumption = {};
    if (config.consumption) {
        Object.entries(config.consumption).forEach(([res, amount]) => {
            const value = (amount || 0) * efficiency;
            consumption[res] = Number.isInteger(value) ? value : Math.round(value * 10) / 10;
        });
    }

    return { workerCount, maxSlots, efficiency, production, consumption };
}

function formatCycleValue(value) {
    if (Number.isInteger(value)) return value;
    return value.toFixed(1);
}

function CloudButton({ icon, onClick, label }) {
    return (
        <motion.button
            className="bg-slate-700/50 hover:bg-cyan-600/50 p-1.5 rounded-lg border border-slate-600 hover:border-cyan-400 transition-colors"
            onClick={onClick}
            whileTap={{ scale: 0.9 }}
            title={label}
        >
            <span className="text-sm flex items-center gap-1 text-white">{icon}{label}</span>
        </motion.button>
    );
}
