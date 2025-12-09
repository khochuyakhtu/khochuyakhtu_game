import { CONFIG } from '../../game/config';
import useGameStore from '../../stores/useGameStore';

/**
 * StatusIndicators - Displays mood, health, and weather
 */
export default function StatusIndicators() {
    const island = useGameStore((state) => state.island);

    const { averageMood, averageHealth, weather } = island;
    const weatherConfig = CONFIG.weatherTypes[weather.type] || CONFIG.weatherTypes.sunny;

    return (
        <div className="flex items-center gap-2 bg-slate-800/80 backdrop-blur-sm rounded-xl px-3 py-2 border border-slate-700/50">
            {/* Mood Indicator */}
            <MoodIndicator level={averageMood} />

            {/* Health Indicator */}
            <HealthIndicator level={averageHealth} />

            {/* Weather Indicator */}
            <WeatherIndicator type={weather.type} config={weatherConfig} />
        </div>
    );
}

/**
 * Mood indicator with emoji and color
 */
function MoodIndicator({ level }) {
    const emoji = level >= 70 ? '😊' : level >= 40 ? '😐' : '😢';
    const color = level >= 70 ? 'text-green-400' : level >= 40 ? 'text-yellow-400' : 'text-red-400';
    const bgColor = level >= 70 ? 'bg-green-500/20' : level >= 40 ? 'bg-yellow-500/20' : 'bg-red-500/20';

    return (
        <div
            className={`flex items-center gap-1 px-2 py-1 rounded-lg ${bgColor} group relative`}
            title="Настрій населення"
        >
            <span className="text-lg">{emoji}</span>
            <span className={`font-bold text-sm ${color}`}>
                {Math.round(level)}%
            </span>

            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                Настрій: {level >= 70 ? 'Добрий' : level >= 40 ? 'Нормальний' : 'Поганий'}
            </div>
        </div>
    );
}

/**
 * Health indicator with heart and color
 */
function HealthIndicator({ level }) {
    const emoji = level >= 70 ? '❤️' : level >= 40 ? '💛' : '💔';
    const color = level >= 70 ? 'text-green-400' : level >= 40 ? 'text-yellow-400' : 'text-red-400';

    return (
        <div
            className="flex items-center gap-1 group relative"
            title="Здоров'я населення"
        >
            <span className="text-lg">{emoji}</span>
            <span className={`font-bold text-sm ${color}`}>
                {Math.round(level)}%
            </span>

            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                Здоров'я: {level >= 70 ? 'Добре' : level >= 40 ? 'Середнє' : 'Критичне'}
            </div>
        </div>
    );
}

/**
 * Weather indicator with icon and effects
 */
function WeatherIndicator({ type, config }) {
    const canSail = config.effects.canSail;

    return (
        <div
            className={`flex items-center gap-1 px-2 py-1 rounded-lg group relative ${canSail ? 'bg-blue-500/20' : 'bg-red-500/20'
                }`}
            title="Погода"
        >
            <span className="text-lg">{config.icon}</span>
            <span className={`font-bold text-sm ${canSail ? 'text-blue-300' : 'text-red-400'}`}>
                {config.name}
            </span>

            {/* Tooltip with effects */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                <div className="font-bold mb-1">{config.name}</div>
                {config.effects.waterBonus > 0 && (
                    <div className="text-blue-300">💧 +{config.effects.waterBonus}% води</div>
                )}
                {config.effects.moodBonus > 0 && (
                    <div className="text-green-300">😊 +{config.effects.moodBonus}% настрою</div>
                )}
                {config.effects.moodPenalty > 0 && (
                    <div className="text-red-300">😢 -{config.effects.moodPenalty}% настрою</div>
                )}
                {!canSail && (
                    <div className="text-red-400 font-bold">⛔ Неможливо виходити в море</div>
                )}
            </div>
        </div>
    );
}
