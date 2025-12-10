import { motion } from 'framer-motion';
import useGameStore from '../../stores/useGameStore';
import styles from './SkillButtons.module.css';

const SKILLS = [
    { id: 'nitro', icon: '⚡', tone: 'yellow', name: 'Прискорення' },
    { id: 'flare', icon: '🧨', tone: 'red', name: 'Ракетниця' },
    { id: 'repair', icon: '🔧', tone: 'green', name: 'Ремонт' }
];

export default function SkillButtons() {
    const { player, activateSkill } = useGameStore();

    const handleSkill = (skillId) => {
        const skill = player.skills[skillId];
        if (skill && skill.cd <= 0) {
            activateSkill(skillId);
        }
    };

    return (
        <motion.div
            className={styles.container}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
        >
            {SKILLS.map((skill) => {
                const skillData = player.skills[skill.id];
                const cdPercent = skillData ? (skillData.cd / skillData.max) * 100 : 0;
                const isOnCooldown = cdPercent > 0;
                const isActive = skillData?.active;

                const toneClass = styles[skill.tone] || '';
                const activeClass = isActive ? styles.active : '';
                const disabledClass = isOnCooldown ? styles.disabled : '';

                return (
                    <button
                        key={skill.id}
                        onClick={() => handleSkill(skill.id)}
                        disabled={isOnCooldown}
                        className={`${styles.button} ${toneClass} ${activeClass} ${disabledClass}`}
                        title={skill.name}
                    >
                        {skill.icon}
                        {cdPercent > 0 && (
                            <div
                                className={styles.cooldown}
                                style={{ height: `${cdPercent}%` }}
                            />
                        )}
                    </button>
                );
            })}
        </motion.div>
    );
}

