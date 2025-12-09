import { RESOURCES } from '../../game/config';
import useGameStore from '../../stores/useGameStore';

/**
 * ResourceBar - Displays main resources in header
 * Shows: Water, Food, Money, Population
 */
export default function ResourceBar() {
    const resources = useGameStore((state) => state.resources);
    const island = useGameStore((state) => state.island);
    const resourceLimits = useGameStore((state) => state.resourceLimits);

    // Key resources to display
    const displayResources = [
        {
            type: 'water',
            config: RESOURCES.water,
            value: resources.water,
            limit: resourceLimits.water
        },
        {
            type: 'food',
            config: RESOURCES.food,
            value: resources.food,
            limit: resourceLimits.food
        },
        {
            type: 'money',
            config: RESOURCES.money,
            value: resources.money,
            limit: null // No limit
        }
    ];

    const populationCurrent = island.residents.length;
    const populationMax = island.populationCap;

    return (
        <div className="flex items-center gap-3 bg-slate-800/80 backdrop-blur-sm rounded-xl px-3 py-2 border border-slate-700/50">
            {/* Resources */}
            {displayResources.map((res) => (
                <ResourceIcon
                    key={res.type}
                    icon={res.config.icon}
                    value={res.value}
                    limit={res.limit}
                    name={res.config.name}
                />
            ))}

            {/* Population */}
            <div className="flex items-center gap-1 pl-2 border-l border-slate-600/50">
                <span className="text-lg">👥</span>
                <span className="text-white font-bold text-sm">
                    {populationCurrent}
                    <span className="text-slate-400 font-normal">/{populationMax}</span>
                </span>
            </div>
        </div>
    );
}

/**
 * Single resource icon with value
 */
function ResourceIcon({ icon, value, limit, name }) {
    const displayValue = formatNumber(value);
    const isLow = limit && value < limit * 0.2;
    const isFull = limit && value >= limit;

    return (
        <div
            className="flex items-center gap-1 group relative"
            title={name}
        >
            <span className="text-lg">{icon}</span>
            <span className={`font-bold text-sm ${isLow ? 'text-red-400' :
                    isFull ? 'text-green-400' :
                        'text-white'
                }`}>
                {displayValue}
                {limit && (
                    <span className="text-slate-500 text-xs font-normal">
                        /{formatNumber(limit)}
                    </span>
                )}
            </span>

            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                {name}
            </div>
        </div>
    );
}

/**
 * Format large numbers (1000 -> 1k, 1000000 -> 1M)
 */
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'k';
    }
    return Math.floor(num).toString();
}
