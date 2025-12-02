// Додайте цей код в конструктор Game class в game.js

// Settings and Leaderboard buttons
document.getElementById('settings-btn')?.addEventListener('click', () => {
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('settings-screen').style.display = 'flex';
    // Load current settings
    const nickname = localStorage.getItem('playerNickname') || '';
    document.getElementById('player-nickname').value = nickname;

    const soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
    const vibrationEnabled = localStorage.getItem('vibrationEnabled') !== 'false';
    document.getElementById('sound-toggle').checked = soundEnabled;
    document.getElementById('vibration-toggle').checked = vibrationEnabled;
});

document.getElementById('leaderboard-btn')?.addEventListener('click', () => {
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('leaderboard-screen').style.display = 'flex';
    this.loadLeaderboard();
});

// Back buttons
document.getElementById('back-from-settings-btn')?.addEventListener('click', () => {
    document.getElementById('settings-screen').style.display = 'none';
    document.getElementById('main-menu').style.display = 'flex';
});

document.getElementById('back-from-leaderboard-btn')?.addEventListener('click', () => {
    document.getElementById('leaderboard-screen').style.display = 'none';
    document.getElementById('main-menu').style.display = 'flex';
});

// Save nickname
document.getElementById('save-nickname-btn')?.addEventListener('click', () => {
    const nickname = document.getElementById('player-nickname').value.trim();
    if (nickname) {
        localStorage.setItem('playerNickname', nickname);
        const msg = document.getElementById('nickname-saved-msg');
        msg.style.display = 'block';
        setTimeout(() => msg.style.display = 'none', 2000);
    }
});

// Sound toggle
document.getElementById('sound-toggle')?.addEventListener('change', (e) => {
    const enabled = e.target.checked;
    localStorage.setItem('soundEnabled', enabled);
    this.soundEnabled = enabled;
});

// Vibration toggle
document.getElementById('vibration-toggle')?.addEventListener('change', (e) => {
    const enabled = e.target.checked;
    localStorage.setItem('vibrationEnabled', enabled);
    this.vibrationEnabled = enabled;

    // Test vibration
    if (enabled && this.tg?.HapticFeedback) {
        this.tg.HapticFeedback.impactOccurred('light');
    }
});

// Reset all progress
document.getElementById('reset-all-btn')?.addEventListener('click', () => {
    if (confirm('Ви впевнені? Це видалить весь ваш прогрес!')) {
        this.hardReset();
    }
});

// Add these properties to constructor initialization:
this.soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
this.vibrationEnabled = localStorage.getItem('vibrationEnabled') !== 'false';

// Add these methods to Game class:

getPlayerNickname() {
    return localStorage.getItem('playerNickname') || 'Гравець';
}

saveScore(score) {
    const nickname = this.getPlayerNickname();
    let leaderboard = JSON.parse(localStorage.getItem('leaderboard') || '[]');

    leaderboard.push({
        nickname: nickname,
        score: score,
        date: new Date().toISOString()
    });

    // Sort by score descending and keep top 10
    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard = leaderboard.slice(0, 10);

    localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
}

loadLeaderboard() {
    const leaderboard = JSON.parse(localStorage.getItem('leaderboard') || '[]');
    const container = document.getElementById('leaderboard-list');
    const noScoresMsg = document.getElementById('no-scores-msg');

    if (leaderboard.length === 0) {
        container.innerHTML = '';
        noScoresMsg.style.display = 'block';
        return;
    }

    noScoresMsg.style.display = 'none';
    container.innerHTML = leaderboard.map((entry, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
        return `
            <div style="background: rgba(15, 23, 42, 0.8); border: 1px solid #334155; border-radius: 12px; padding: 16px; display: flex; align-items: center; gap: 16px;">
                <div style="font-size: 24px; min-width: 40px; text-align: center;">${medal}</div>
                <div style="flex: 1;">
                    <div style="font-size: 16px; font-weight: bold; color: white;">${entry.nickname}</div>
                    <div style="font-size: 12px; color: #64748b;">${new Date(entry.date).toLocaleDateString('uk-UA')}</div>
                </div>
                <div style="font-size: 20px; font-weight: bold; color: #4ade80; font-family: monospace;">$${entry.score}</div>
            </div>
        `;
    }).join('');
}

// Update AudioManager to check soundEnabled:
// In AudioManager.js, modify the play method:
play(name) {
    if (!this.game.soundEnabled) return; // Add this check
    // ... rest of the code
}

// Update vibration calls throughout the code:
// Replace all instances of:
// this.tg?.HapticFeedback?.impactOccurred('light');
// With:
// if (this.vibrationEnabled && this.tg?.HapticFeedback) {
//     this.tg.HapticFeedback.impactOccurred('light');
// }

// Update die() method to save score:
// Add this line in die() method before localStorage.removeItem():
this.saveScore(this.player.money);
