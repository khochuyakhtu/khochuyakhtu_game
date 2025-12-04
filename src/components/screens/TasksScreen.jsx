import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import useUIStore from '../../stores/useUIStore';
import useGameStore from '../../stores/useGameStore';

export default function TasksScreen() {
    const setScreen = useUIStore((state) => state.setScreen);
    const addMoney = useGameStore((state) => state.addMoney);
    const [subscribed, setSubscribed] = useState(false);
    const [rewarded, setRewarded] = useState(false);

    useEffect(() => {
        // Check subscription status
        const isSubscribed = localStorage.getItem('channelSubscribed') === 'true';
        const isRewarded = localStorage.getItem('subscriptionRewarded') === 'true';
        setSubscribed(isSubscribed);
        setRewarded(isRewarded);
    }, []);

    const handleSubscribe = () => {
        window.open('https://t.me/khochuyakhtu', '_blank');
        localStorage.setItem('channelSubscribed', 'true');
        setSubscribed(true);
    };

    const handleCheck = () => {
        if (subscribed && !rewarded) {
            localStorage.setItem('subscriptionRewarded', 'true');
            setRewarded(true);
            addMoney(500);
            alert('Вітаємо! Ви отримали 500$ за підписку на канал! 🎉');
        } else if (!subscribed) {
            alert('Будь ласка, спочатку підпішіться на канал!');
        } else {
            alert('Винагороду вже отримано!');
        }
    };

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 overflow-y-auto">
            <div className="max-w-2xl mx-auto p-5">
                {/* Header */}
                <div className="flex items-center mb-8">
                    <button
                        onClick={() => setScreen('menu')}
                        className="bg-slate-800/50 text-white px-4 py-2 rounded-lg mr-4 hover:bg-slate-700"
                    >
                        ←
                    </button>
                    <h2 className="text-3xl font-bold text-white">Завдання</h2>
                </div>

                {/* Channel Subscription Task */}
                <motion.div
                    className="bg-slate-800/80 border border-slate-700 rounded-xl p-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="flex items-start gap-4">
                        <div className="text-4xl">📢</div>
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-white mb-2">
                                Підпишись на канал
                            </h3>
                            <p className="text-sm text-slate-400 mb-4">
                                Підпішіться на наш Telegram канал "Хочу Яхту" та отримайте 500$ бонусом!
                            </p>

                            <div className="flex gap-3 flex-wrap">
                                <button
                                    onClick={handleSubscribe}
                                    className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-5 py-2 rounded-lg transition-all active:scale-95"
                                    disabled={rewarded}
                                >
                                    📱 Підписатись
                                </button>
                                <button
                                    onClick={handleCheck}
                                    className="bg-green-600 hover:bg-green-500 text-white font-bold px-5 py-2 rounded-lg transition-all active:scale-95"
                                    disabled={rewarded}
                                >
                                    ✓ Перевірити
                                </button>
                            </div>

                            {rewarded && (
                                <div className="mt-4 text-sm text-green-400">
                                    ✓ Винагорода отримана! +500$
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
