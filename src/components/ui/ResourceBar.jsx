import { RESOURCES } from '../../game/config';
import useGameStore from '../../stores/useGameStore';
import styles from './ResourceBar.module.css';
import { formatNumber } from '../../utils/formatNumber';

/**
 * ResourceBar - Displays main resources in header
 * Shows: Water, Food, Money, Population
 */
export default function ResourceBar() {
    const resources = useGameStore((state) => state.resources);
    const island = useGameStore((state) => state.island);
    const resourceLimits = useGameStore((state) => state.resourceLimits);

    // Key resources to display
    const displayResources = [
        {
            type: 'water',
            config: RESOURCES.water,
            value: resources.water,
            limit: resourceLimits.water
        },
        {
            type: 'food',
            config: RESOURCES.food,
            value: resources.food,
            limit: resourceLimits.food
        },
        {
            type: 'money',
            config: RESOURCES.money,
            value: resources.money,
            limit: null // No limit
        }
    ];

    const populationCurrent = island.residents.length;
    const populationMax = island.populationCap;

    return (
        <div className={styles.wrapper}>
            {displayResources.map((res) => (
                <ResourceIcon
                    key={res.type}
                    icon={res.config.icon}
                    value={res.value}
                    limit={res.limit}
                    name={res.config.name}
                />
            ))}

            <div className={styles.population}>
                <span className={styles.popIcon}>👥</span>
                <span className={styles.popValue}>
                    {populationCurrent}
                    <span className={styles.popLimit}>/{populationMax}</span>
                </span>
            </div>
        </div>
    );
}

/**
 * Single resource icon with value
 */
function ResourceIcon({ icon, value, limit, name }) {
    const displayValue = formatNumber(value);
    const isLow = limit && value < limit * 0.2;
    const isFull = limit && value >= limit;
    const tone = isLow ? styles.low : isFull ? styles.full : '';

    return (
        <div className={styles.resource} title={name}>
            <span className={styles.icon}>{icon}</span>
            <span className={`${styles.value} ${tone}`}>
                {displayValue}
                {limit && (
                    <span className={styles.limit}>
                        /{formatNumber(limit)}
                    </span>
                )}
            </span>
            <div className={styles.tooltip}>
                {name}
            </div>
        </div>
    );
}
