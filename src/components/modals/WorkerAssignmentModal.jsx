import { motion, AnimatePresence } from 'framer-motion';
import { CONFIG } from '../../game/config';

export default function WorkerAssignmentModal({ isOpen, onClose, worker, buildings, residents = [], onAssign }) {
    if (!isOpen || !worker) return null;

    // Define profession-building compatibility
    const getEfficiency = (buildingConfigId) => {
        const buildingConfig = CONFIG.buildings[buildingConfigId];
        if (!buildingConfig) return { score: 100, label: 'Standard' };

        // Logic for compatibility
        const profession = worker.profession;
        const category = buildingConfig.category;

        // Exact mappings
        const matches = {
            fisher: ['fishery', 'dock'],
            scientist: ['lab', 'library'],
            doctor: ['hospital', 'clinic'],
            engineer: ['workshop', 'generator', 'mine'],
            farmer: ['farm', 'garden'],
            worker: ['production', 'construction'] // Generic
        };

        if (matches[profession]?.some(tag => buildingConfigId.includes(tag) || category === tag)) {
            return { score: 150, label: 'High', color: 'text-green-400', bonus: '+50%' };
        }

        return { score: 100, label: 'Normal', color: 'text-slate-400', bonus: '' };
    };

    const availableBuildings = buildings.filter(b => {
        const config = CONFIG.buildings[b.configId];
        if (!config || (config.slots || 0) <= 0) return false;
        return true;
    });

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
                        className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    >
                        <div className="p-4 bg-slate-800/50 border-b border-slate-700/50 flex justify-between items-center">
                            <div>
                                <h2 className="text-white font-bold">Призначити {worker.name}</h2>
                                <p className="text-cyan-400 text-xs">{worker.profession}</p>
                            </div>
                            <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
                        </div>

                        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2">
                            {availableBuildings.length === 0 ? (
                                <p className="text-slate-500 text-center py-4">Немає доступних будівель</p>
                            ) : (
                                availableBuildings.map(building => {
                                    const config = CONFIG.buildings[building.configId];
                                    const efficiency = getEfficiency(building.configId);
                                    const assignedCount = residents.filter(r => r.assignedBuildingId === building.id).length;
                                    const slots = config.slots || 0;
                                    const isFull = slots > 0 && assignedCount >= slots;

                                    return (
                                        <motion.button
                                            key={building.id}
                                            className={`w-full text-left bg-slate-800/60 p-3 rounded-xl border ${isFull ? 'border-slate-700/50 opacity-50 cursor-not-allowed' : 'border-slate-700/50 hover:border-cyan-500/50'} transition-colors flex justify-between items-center group`}
                                            onClick={() => {
                                                if (isFull) return;
                                                onAssign(building.id);
                                                onClose();
                                            }}
                                            whileTap={isFull ? undefined : { scale: 0.98 }}
                                            disabled={isFull}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl">{config.icon}</span>
                                                <div>
                                                    <p className="text-white font-bold text-sm group-hover:text-cyan-400 transition-colors">
                                                        {config.name}
                                                    </p>
                                                    <p className="text-slate-500 text-xs">Рівень {building.level}</p>
                                                    {slots > 0 && (
                                                        <p className="text-slate-500 text-[10px]">👷 {assignedCount}/{slots}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className={`font-bold text-sm ${efficiency.color}`}>
                                                    {efficiency.label} {efficiency.bonus}
                                                </p>
                                                {isFull && <p className="text-amber-400 text-[10px]">Місць немає</p>}
                                            </div>
                                        </motion.button>
                                    );
                                })
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
