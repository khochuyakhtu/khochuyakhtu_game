export default function HealthIndicator({ level }) {
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
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                Здоров'я: {level >= 70 ? 'Добре' : level >= 40 ? 'Середнє' : 'Критичне'}
            </div>
        </div>
    );
}
