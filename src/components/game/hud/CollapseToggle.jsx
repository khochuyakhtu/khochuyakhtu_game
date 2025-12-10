export default function CollapseToggle({ collapsed, onToggle }) {
    return (
        <button
            className="bg-slate-900/80 text-slate-200 text-xs px-2 py-1 rounded-lg border border-slate-700"
            onClick={onToggle}
            aria-label={collapsed ? 'Expand panel' : 'Collapse panel'}
        >
            {collapsed ? '▼' : '▲'}
        </button>
    );
}
