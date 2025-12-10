import styles from './HealthIndicator.module.css';

export default function HealthIndicator({ level }) {
    const emoji = level >= 70 ? '❤️' : level >= 40 ? '💛' : '💔';
    const tone = level >= 70 ? 'good' : level >= 40 ? 'neutral' : 'bad';

    return (
        <div className={`${styles.indicator} ${styles[tone]}`} title="Здоров'я населення">
            <span className={styles.emoji}>{emoji}</span>
            <span className={styles.value}>
                {Math.round(level)}%
            </span>
            <div className={styles.tooltip}>
                Здоров'я: {level >= 70 ? 'Добре' : level >= 40 ? 'Середнє' : 'Критичне'}
            </div>
        </div>
    );
}
