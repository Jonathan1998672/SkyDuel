export function showSettingsSection(sectionId) {
    document.querySelectorAll('.settings-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(sectionId).classList.add('active');
    if(event) event.currentTarget.classList.add('active');
}

export function updateVolume() {
    const music = document.getElementById("bgMusic");
    const vol = document.getElementById("musicVol").value;
    music.volume = vol;
}

export function backFromSettings() {
    window.showScreen('mainMenu');
}

window.showSettingsSection = showSettingsSection;
window.updateVolume = updateVolume;
window.backFromSettings = backFromSettings;
