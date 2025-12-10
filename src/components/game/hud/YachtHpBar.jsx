import styles from './YachtHpBar.module.css';

export default function YachtHpBar({ visible, hp, maxHp }) {
    if (!visible) return null;

    const percent = maxHp > 0 ? (hp / maxHp) * 100 : 0;

    return (
        <div className={styles.bar}>
            <span className={styles.label}>HP</span>
            <div className={styles.track}>
                <div
                    className={styles.fill}
                    style={{ width: `${percent}%` }}
                />
            </div>
        </div>
    );
}
