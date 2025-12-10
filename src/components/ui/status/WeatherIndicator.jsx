import styles from './WeatherIndicator.module.css';

export default function WeatherIndicator({ type, config, calendar, hour }) {
    const canSail = config.effects.canSail;
    const cal = calendar || { day: 1, week: 1, month: 1, year: 1 };
    const hr = hour !== undefined ? hour.toString().padStart(2, '0') : '00';
    const tone = canSail ? 'ok' : 'blocked';

    return (
        <div className={`${styles.indicator} ${styles[tone]}`} title="Погода">
            <span className={styles.icon}>{config.icon}</span>
            <div className={styles.meta}>
                <span className={styles.name}>
                    {config.name}
                </span>
                <span className={styles.subtitle}>{hr}:00 · Д{cal.day} Т{cal.week} М{cal.month} Р{cal.year}</span>
            </div>
            <div className={styles.tooltip}>
                <div className={styles.title}>{config.name}</div>
                {config.effects.waterBonus > 0 && (
                    <div className={styles.water}>💧 +{config.effects.waterBonus}% води</div>
                )}
                {config.effects.moodBonus > 0 && (
                    <div className={styles.moodGood}>😊 +{config.effects.moodBonus}% настрою</div>
                )}
                {config.effects.moodPenalty > 0 && (
                    <div className={styles.moodBad}>😢 -{config.effects.moodPenalty}% настрою</div>
                )}
                {!canSail && (
                    <div className={styles.blockedText}>⛔ Неможливо виходити в море</div>
                )}
            </div>
        </div>
    );
}
