export default function TemperatureBar({ tempPercent }) {
    const tempColor = tempPercent > 50 ? 'bg-orange-500' : 'bg-red-500';

    return (
        <div className="flex items-center gap-1 w-[80px]">
            <span className="text-[11px] text-slate-300">🌡️</span>
            <div className="flex-1 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                    className={`${tempColor} h-full transition-all duration-300`}
                    style={{ width: `${tempPercent}%` }}
                />
            </div>
        </div>
    );
}
