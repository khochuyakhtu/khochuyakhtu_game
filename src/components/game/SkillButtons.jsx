import { motion } from 'framer-motion';
import useGameStore from '../../stores/useGameStore';

export default function SkillButtons() {
    const { player, activateSkill } = useGameStore();

    const skills = [
        { id: 'nitro', icon: '⚡', color: 'bg-yellow-600', border: 'border-yellow-400', name: 'Прискорення' },
        { id: 'flare', icon: '🧨', color: 'bg-red-600', border: 'border-red-400', name: 'Ракетниця' },
        { id: 'repair', icon: '🔧', color: 'bg-green-600', border: 'border-green-400', name: 'Ремонт' }
    ];

    const handleSkill = (skillId) => {
        const skill = player.skills[skillId];
        if (skill && skill.cd <= 0) {
            activateSkill(skillId);
        }
    };

    return (
        <motion.div
            className="absolute bottom-6 right-4 flex flex-col gap-3 z-10"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
        >
            {skills.map((skill, index) => {
                const skillData = player.skills[skill.id];
                const cdPercent = skillData ? (skillData.cd / skillData.max) * 100 : 0;
                const isOnCooldown = cdPercent > 0;
                const isActive = skillData?.active;

                return (
                    <button
                        key={skill.id}
                        onClick={() => handleSkill(skill.id)}
                        disabled={isOnCooldown}
                        className={`relative overflow-hidden w-14 h-14 ${skill.color} rounded-full border-2 ${skill.border} flex items-center justify-center text-2xl transition-all ${isOnCooldown ? 'opacity-50 cursor-not-allowed' : 'active:scale-90'} ${isActive ? 'ring-4 ring-white animate-pulse' : ''}`}
                        title={skill.name}
                    >
                        {skill.icon}

                        {/* Cooldown Indicator */}
                        {cdPercent > 0 && (
                            <div
                                className="absolute bottom-0 left-0 w-full bg-black/60 transition-all duration-100"
                                style={{ height: `${cdPercent}%` }}
                            />
                        )}
                    </button>
                );
            })}
        </motion.div>
    );
}

