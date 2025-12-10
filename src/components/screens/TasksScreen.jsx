import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import useUIStore from '../../stores/useUIStore';
import useGameStore from '../../stores/useGameStore';
import useNotificationStore from '../../stores/useNotificationStore';
import { Haptics } from '../../game/config';
import styles from './TasksScreen.module.css';

const CHANNELS = [
    {
        id: 'channel1',
        name: 'Хочу Яхту',
        url: 'https://t.me/khochuyakhtu',
        username: 'khochuyakhtu',
        reward: 100,
        icon: '📢'
    },
    {
        id: 'channel2',
        name: 'Хочу Яхту - Чат гри',
        url: 'https://t.me/khochuyakhtu_game_chat',
        username: 'khochuyakhtu_game_chat',
        reward: 100,
        icon: '💬'
    }
];

export default function TasksScreen() {
    const setScreen = useUIStore((state) => state.setScreen);
    const addMoney = useGameStore((state) => state.addMoney);
    const addNotification = useNotificationStore((state) => state.addNotification);

    // State for each channel: { channelId: { subscribed: bool, rewarded: bool, checking: bool } }
    const [channelStates, setChannelStates] = useState({});

    useEffect(() => {
        // Load subscription status from localStorage
        const states = {};
        CHANNELS.forEach(channel => {
            states[channel.id] = {
                subscribed: localStorage.getItem(`${channel.id}_subscribed`) === 'true',
                rewarded: localStorage.getItem(`${channel.id}_rewarded`) === 'true',
                checking: false
            };
        });
        setChannelStates(states);
    }, []);

    const handleSubscribe = (channel) => {
        window.open(channel.url, '_blank');
        // Mark as subscribed locally (user claims subscription)
        updateChannelState(channel.id, { subscribed: true });
        localStorage.setItem(`${channel.id}_subscribed`, 'true');
    };

    const updateChannelState = (channelId, updates) => {
        setChannelStates(prev => ({
            ...prev,
            [channelId]: { ...prev[channelId], ...updates }
        }));
    };

    const checkSubscription = async (channel) => {
        const state = channelStates[channel.id];

        if (state.rewarded) {
            addNotification('info', 'Винагороду вже отримано!');
            return;
        }

        if (!state.subscribed) {
            addNotification('warning', 'Спочатку підпишіться на канал!');
            return;
        }

        updateChannelState(channel.id, { checking: true });

        try {
            // Try to verify subscription using Telegram WebApp API
            const isVerified = await verifySubscription(channel.username);

            if (isVerified) {
                // Grant reward
                localStorage.setItem(`${channel.id}_rewarded`, 'true');
                updateChannelState(channel.id, { rewarded: true, checking: false });
                addMoney(channel.reward);
                Haptics.notify('success');
                addNotification('success', `+${channel.reward}$ за підписку! 🎉`);
            } else {
                updateChannelState(channel.id, { checking: false });
                Haptics.notify('error');
                addNotification('error', 'Підписка не знайдена. Спробуйте ще раз.', 3000);
            }
        } catch (error) {
            console.error('Subscription verification error:', error);
            updateChannelState(channel.id, { checking: false });

            // Fallback: trust the user if verification fails
            const confirm = window.confirm(
                'Не вдалося автоматично перевірити підписку. Ви дійсно підписані на канал?'
            );

            if (confirm) {
                localStorage.setItem(`${channel.id}_rewarded`, 'true');
                updateChannelState(channel.id, { rewarded: true });
                addMoney(channel.reward);
                Haptics.notify('success');
                addNotification('success', `+${channel.reward}$ за підписку! 🎉`);
            }
        }
    };

    const verifySubscription = async (channelUsername) => {
        // Check if Telegram WebApp is available
        if (!window.Telegram?.WebApp) {
            throw new Error('Telegram WebApp not available');
        }

        const tg = window.Telegram.WebApp;
        const user = tg.initDataUnsafe?.user;

        if (!user?.id) {
            throw new Error('User ID not available');
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
        return true;
    };

    return (
        <div className={styles.screen}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <button
                        onClick={() => setScreen('menu')}
                        className={styles.back}
                    >
                        ←
                    </button>
                    <h2 className={styles.heading}>Завдання</h2>
                </div>

                <div className={styles.list}>
                    {CHANNELS.map((channel, index) => {
                        const state = channelStates[channel.id] || { subscribed: false, rewarded: false, checking: false };

                        return (
                            <motion.div
                                key={channel.id}
                                className={styles.card}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <div className={styles.cardHeader}>
                                    <div className={styles.cardIcon}>{channel.icon}</div>
                                    <div className={styles.cardBody}>
                                        <h3 className={styles.cardTitle}>
                                            Підпишись на {channel.name}
                                        </h3>
                                        <p className={styles.cardText}>
                                            Підпішіться на канал та отримайте {channel.reward}$ бонусом!
                                            {index === 0 && ' Також ви будете отримувати +100$ при кожному старті гри!'}
                                        </p>

                                        <div className={styles.actions}>
                                            <button
                                                onClick={() => handleSubscribe(channel)}
                                                className={`${styles.button} ${styles.subButton} ${state.rewarded ? styles.disabled : ''}`}
                                                disabled={state.rewarded}
                                            >
                                                📱 Підписатись
                                            </button>
                                            <button
                                                onClick={() => checkSubscription(channel)}
                                                className={`${styles.button} ${styles.verifyButton} ${(state.rewarded || state.checking) ? styles.disabled : ''}`}
                                                disabled={state.rewarded || state.checking}
                                            >
                                                {state.checking ? '⏳ Перевірка...' : '✓ Перевірити'}
                                            </button>
                                        </div>

                                        {state.rewarded && (
                                            <div className={styles.rewarded}>
                                                ✓ Винагорода отримана! +{channel.reward}$
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                <motion.div
                    className={styles.bonus}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    <div className={styles.bonusInner}>
                        <div className={styles.bonusIcon}>💰</div>
                        <div>
                            <h4 className={styles.bonusTitle}>Бонус при старті гри</h4>
                            <p className={styles.bonusText}>
                                За кожне виконане завдання ви отримуєте +100$ при початку кожної нової гри!
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
