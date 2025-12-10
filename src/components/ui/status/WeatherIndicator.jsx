export default function WeatherIndicator({ type, config, calendar, hour }) {
    const canSail = config.effects.canSail;
    const cal = calendar || { day: 1, week: 1, month: 1, year: 1 };
    const hr = hour !== undefined ? hour.toString().padStart(2, '0') : '00';

    return (
        <div
            className={`flex items-center gap-1 px-2 py-1 rounded-lg group relative ${canSail ? 'bg-blue-500/20' : 'bg-red-500/20'}`}
            title="Погода"
        >
            <span className="text-lg">{config.icon}</span>
            <div className="flex flex-col leading-tight">
                <span className={`font-bold text-sm ${canSail ? 'text-blue-300' : 'text-red-400'}`}>
                    {config.name}
                </span>
                <span className="text-[10px] text-slate-200">{hr}:00 · Д{cal.day} Т{cal.week} М{cal.month} Р{cal.year}</span>
            </div>
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
