import YachtHpBar from './YachtHpBar';
import ArmorBadge from './ArmorBadge';
import TemperatureBar from './TemperatureBar';
import StatPill from '../../ui/StatPill';

export default function ExpeditionStats({ player, yacht, money, formatNumber }) {
    const tempPercent = Math.max(0, Math.min(100, ((player.bodyTemp - 28) / (36.6 - 28)) * 100));

    return (
        <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap items-center gap-2">
                <StatPill
                    icon="💵"
                    value={money}
                    formatValue={formatNumber}
                    tooltip="Баланс"
                    valueClassName="text-green-400"
                />
                <StatPill
                    icon="🌡️"
                    value={`${player.bodyTemp.toFixed(1)}°`}
                    tooltip="Температура тіла"
                />
            </div>

            <div className="bg-slate-900/90 backdrop-blur-sm border border-slate-700 rounded-lg px-3 py-1.5 flex items-center gap-3 min-w-[200px]">
                <YachtHpBar visible={player.isYacht && yacht.maxHp > 0} hp={yacht.hp} maxHp={yacht.maxHp} />
                <ArmorBadge armorLevel={player.armorLvl} />
                <TemperatureBar tempPercent={tempPercent} />
            </div>
        </div>
    );
}
