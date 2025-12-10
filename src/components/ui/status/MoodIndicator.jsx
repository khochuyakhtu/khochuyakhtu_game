import styles from './MoodIndicator.module.css';

export default function MoodIndicator({ level }) {
    const emoji = level >= 70 ? '😊' : level >= 40 ? '😐' : '😢';
    const tone = level >= 70 ? 'good' : level >= 40 ? 'neutral' : 'bad';

    return (
        <div className={`${styles.indicator} ${styles[tone]}`} title="Настрій населення">
            <span className={styles.emoji}>{emoji}</span>
            <span className={styles.value}>
                {Math.round(level)}%
            </span>
            <div className={styles.tooltip}>
                Настрій: {level >= 70 ? 'Добрий' : level >= 40 ? 'Нормальний' : 'Поганий'}
            </div>
        </div>
    );
}
