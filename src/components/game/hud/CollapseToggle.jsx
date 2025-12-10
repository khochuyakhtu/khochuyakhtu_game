import styles from './CollapseToggle.module.css';

export default function CollapseToggle({ collapsed, onToggle }) {
    return (
        <button
            className={styles.toggle}
            onClick={onToggle}
            aria-label={collapsed ? 'Expand panel' : 'Collapse panel'}
        >
            {collapsed ? '▼' : '▲'}
        </button>
    );
}
