import { CONFIG, calculateCalendar } from '../../game/config';
import useGameStore from '../../stores/useGameStore';
import MoodIndicator from './status/MoodIndicator';
import HealthIndicator from './status/HealthIndicator';
import WeatherIndicator from './status/WeatherIndicator';

/**
 * StatusIndicators - Displays mood, health, and weather
 */
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
        <div className="flex items-center gap-2 bg-slate-800/80 backdrop-blur-sm rounded-xl px-3 py-2 border border-slate-700/50">
            <MoodIndicator level={averageMood} />
            <HealthIndicator level={averageHealth} />
            <WeatherIndicator type={weather.type} config={weatherConfig} calendar={calendar} hour={hour} />
            <div className="flex flex-col bg-slate-900/80 rounded-lg px-2 py-1 border border-slate-700 text-[10px] leading-tight text-white">
                <span>Година: {hour.toString().padStart(2, '0')}:00</span>
                <span>День: {calendar.day}</span>
                <span>Тиж: {calendar.week} · Міс: {calendar.month} · Рік: {calendar.year}</span>
            </div>
        </div>
    );
}
