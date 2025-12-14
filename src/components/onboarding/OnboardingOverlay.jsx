import { motion, AnimatePresence } from 'framer-motion';
import useUIStore from '../../stores/useUIStore';

const tabTips = {
    overview: {
        title: 'Огляд острова',
        body: 'Стежте за настроєм, здоров’ям і зайнятістю. Виробничий цикл триває 7 днів — кнопка “Запустити цикл” прискорює тиждень.'
    },
    buildings: {
        title: 'Будівлі та ліміти',
        body: 'У магазині купуйте будівлі через модальне вікно, слідкуйте за лімітами. Вкладка “Мої будівлі” — для керування й апгрейдів.'
    },
    sea: {
        title: 'Вихід у море',
        body: 'Виконуйте місії, уникайте мін і холоду. Якщо загинули, усе зібране в місії не зберігається.'
    },
    residents: {
        title: 'Люди та призначення',
        body: 'Призначайте жителів у будівлі. Настрій і здоров’я впливають на ефективність.'
    },
    inventory: {
        title: 'Склад і ліміти',
        body: 'Перевіряйте ресурси та їхні ліміти. Зелений прогрес показує заповненість.'
    }
};

export default function OnboardingOverlay({ activeTab }) {
    const { onboardingTabsSeen, markTabOnboardingSeen } = useUIStore();
    const seenMap = onboardingTabsSeen || {};
    const step = tabTips[activeTab];
    if (!step) return null;
    const storageKey = `onboarding_${activeTab}`;
    const alreadySeen = seenMap[activeTab] || localStorage.getItem(storageKey) === 'true';
    if (alreadySeen) return null;

    const handleClose = () => {
        markTabOnboardingSeen(activeTab);
        localStorage.setItem(storageKey, 'true');
    };

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm flex items-center justify-center px-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <motion.div
                    className="w-full max-w-md bg-slate-900/95 border border-slate-700 rounded-2xl shadow-2xl p-4 space-y-3 text-white"
                    initial={{ scale: 0.95, y: 20, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.95, y: 20, opacity: 0 }}
                >
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-xs text-slate-400">Підказка: {step.title}</p>
                            <h3 className="text-lg font-bold leading-tight">{step.title}</h3>
                        </div>
                        <button className="text-slate-400 hover:text-white text-sm" onClick={handleClose}>Закрити</button>
                    </div>
                    <p className="text-sm text-slate-200 leading-relaxed">{step.body}</p>
                    <div className="flex justify-end gap-2">
                        <button
                            className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-sm font-bold shadow-lg hover:opacity-90"
                            onClick={handleClose}
                        >
                            Готово
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
