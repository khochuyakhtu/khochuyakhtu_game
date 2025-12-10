import { CONFIG, calculateCalendar } from '../../game/config';
import useGameStore from '../../stores/useGameStore';
import MoodIndicator from './status/MoodIndicator';
import HealthIndicator from './status/HealthIndicator';
import WeatherIndicator from './status/WeatherIndicator';
import styles from './StatusIndicators.module.css';

export default function StatusIndicators({ calendar: calendarProp }) {
    const island = useGameStore((state) => state.island);
    const gameState = useGameStore((state) => state.gameState);

    const { averageMood, averageHealth, weather } = island;
    const weatherConfig = CONFIG.weatherTypes[weather.type] || CONFIG.weatherTypes.sunny;
    const currentFrame = gameState?.gameTime || 0;
    const calendar = calendarProp || calculateCalendar(currentFrame);
    const dayDuration = CONFIG.dayDuration || 3600;
    const dayFraction = (currentFrame % dayDuration) / dayDuration;
    const hour = Math.floor(dayFraction * 24);

    return (
        <div className={styles.wrapper}>
            <MoodIndicator level={averageMood} />
            <HealthIndicator level={averageHealth} />
            <WeatherIndicator type={weather.type} config={weatherConfig} calendar={calendar} hour={hour} />
            <div className={styles.clock}>
                <span>Година: {hour.toString().padStart(2, '0')}:00</span>
                <span>День: {calendar.day}</span>
                <span>Тиж: {calendar.week} · Міс: {calendar.month} · Рік: {calendar.year}</span>
            </div>
        </div>
    );
}
