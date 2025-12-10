export default function YachtHpBar({ visible, hp, maxHp }) {
    if (!visible) return null;

    const percent = maxHp > 0 ? (hp / maxHp) * 100 : 0;

    return (
        <div className="flex items-center gap-1 w-[90px]">
            <span className="text-[11px] text-slate-300">HP</span>
            <div className="flex-1 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                    className="bg-red-500 h-full transition-all duration-300"
                    style={{ width: `${percent}%` }}
                />
            </div>
        </div>
    );
}
