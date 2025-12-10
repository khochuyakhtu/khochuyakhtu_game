export default function ArmorBadge({ armorLevel }) {
    return (
        <div className="flex items-center gap-1">
            <span className="text-[11px] text-slate-300">🛡️</span>
            <span className="text-[11px] text-white font-bold">Lvl {armorLevel}</span>
        </div>
    );
}
