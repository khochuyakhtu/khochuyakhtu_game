export default function StatPill({ icon, value, formatValue, tooltip, className = '', valueClassName = '' }) {
    const displayValue = formatValue ? formatValue(value) : value;

    return (
        <div
            className={`bg-slate-900/90 backdrop-blur-sm border border-slate-700 rounded-lg px-3 py-1.5 flex items-center gap-1 min-w-[90px] group relative ${className}`}
            title={tooltip}
        >
            <span className="text-sm">{icon}</span>
            <span className={`text-xs text-white font-bold ${valueClassName}`}>{displayValue}</span>
            {tooltip && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                    {tooltip}
                </div>
            )}
        </div>
    );
}
