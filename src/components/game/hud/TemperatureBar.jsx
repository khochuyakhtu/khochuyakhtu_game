import styles from './TemperatureBar.module.css';

export default function TemperatureBar({ tempPercent }) {
    const tempColorClass = tempPercent > 50 ? styles.warm : styles.cold;

    return (
        <div className={styles.bar}>
            <span className={styles.icon}>🌡️</span>
            <div className={styles.track}>
                <div
                    className={`${styles.fill} ${tempColorClass}`}
                    style={{ width: `${tempPercent}%` }}
                />
            </div>
        </div>
    );
}
