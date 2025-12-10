export default function MoodIndicator({ level }) {
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
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                Настрій: {level >= 70 ? 'Добрий' : level >= 40 ? 'Нормальний' : 'Поганий'}
            </div>
        </div>
    );
}
