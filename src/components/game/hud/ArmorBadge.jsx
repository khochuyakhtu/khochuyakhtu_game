import styles from './ArmorBadge.module.css';

export default function ArmorBadge({ armorLevel }) {
    return (
        <div className={styles.badge}>
            <span className={styles.icon}>🛡️</span>
            <span className={styles.value}>Lvl {armorLevel}</span>
        </div>
    );
}
