import YachtHpBar from './YachtHpBar';
import ArmorBadge from './ArmorBadge';
import TemperatureBar from './TemperatureBar';
import StatPill from '../../ui/StatPill';
import styles from './ExpeditionStats.module.css';

export default function ExpeditionStats({ player, yacht, money, formatNumber }) {
    const tempPercent = Math.max(0, Math.min(100, ((player.bodyTemp - 28) / (36.6 - 28)) * 100));

    return (
        <div className={styles.wrapper}>
            <div className={styles.pillsRow}>
                <StatPill
                    icon="💵"
                    value={money}
                    formatValue={formatNumber}
                    tooltip="Баланс"
                    tone="success"
                />
                <StatPill
                    icon="🌡️"
                    value={`${player.bodyTemp.toFixed(1)}°`}
                    tooltip="Температура тіла"
                />
            </div>

            <div className={styles.statsCard}>
                <YachtHpBar visible={player.isYacht && yacht.maxHp > 0} hp={yacht.hp} maxHp={yacht.maxHp} />
                <ArmorBadge armorLevel={player.armorLvl} />
                <TemperatureBar tempPercent={tempPercent} />
            </div>
        </div>
    );
}
