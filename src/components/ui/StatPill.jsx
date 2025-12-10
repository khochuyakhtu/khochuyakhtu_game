import styles from './StatPill.module.css';

export default function StatPill({ icon, value, formatValue, tooltip, tone }) {
    const displayValue = formatValue ? formatValue(value) : value;
    const pillTone = tone === 'success' ? styles.success : tone === 'warning' ? styles.warning : '';

    return (
        <div
            className={`${styles.pill} ${pillTone}`}
            title={tooltip}
        >
            <span className={styles.icon}>{icon}</span>
            <span className={styles.value}>{displayValue}</span>
            {tooltip && (
                <div className={styles.tooltip}>
                    {tooltip}
                </div>
            )}
        </div>
    );
}
