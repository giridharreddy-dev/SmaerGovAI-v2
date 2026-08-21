import re

with open('public/js/app-client.js', 'r') as f:
    content = f.read()

# Add audio control initialization
audio_init = """let globalAudioPlayer = null;

// --- Floating Audio UI Controller ---
function showFloatingAudioPlayer() {
    const player = document.getElementById('floatingAudioPlayer');
    if (player) player.classList.remove('hidden');
}
function hideFloatingAudioPlayer() {
    const player = document.getElementById('floatingAudioPlayer');
    if (player) player.classList.add('hidden');
}
function setupFloatingAudioUI(audioElement) {
    const playPauseBtn = document.getElementById('audioPlayPauseBtn');
    const stopBtn = document.getElementById('audioStopBtn');
    const timeDisplay = document.getElementById('audioTime');
    const scrubber = document.getElementById('audioScrubber');
    if (!playPauseBtn || !audioElement) return;

    showFloatingAudioPlayer();

    // Reset
    playPauseBtn.textContent = '⏸️';
    scrubber.value = 0;
    timeDisplay.textContent = '0:00';

    const updateTime = () => {
        if (!audioElement.duration) return;
        const current = audioElement.currentTime;
        const mins = Math.floor(current / 60);
        const secs = Math.floor(current % 60).toString().padStart(2, '0');
        timeDisplay.textContent = `${mins}:${secs}`;
        scrubber.value = (current / audioElement.duration) * 100;
    };

    audioElement.addEventListener('timeupdate', updateTime);
    audioElement.addEventListener('ended', hideFloatingAudioPlayer);

    playPauseBtn.onclick = () => {
        if (audioElement.paused) {
            audioElement.play();
            playPauseBtn.textContent = '⏸️';
        } else {
            audioElement.pause();
            playPauseBtn.textContent = '▶️';
        }
    };

    stopBtn.onclick = () => {
        audioElement.pause();
        audioElement.currentTime = 0;
        hideFloatingAudioPlayer();
    };

    scrubber.oninput = () => {
        if (audioElement.duration) {
            audioElement.currentTime = (scrubber.value / 100) * audioElement.duration;
        }
    };
}
"""

content = content.replace("let globalAudioPlayer = null;", audio_init)

# Update speakText
old_speak = """function speakText(text, lang) {
    if (!text || !text.trim()) return;

    const currentLang = lang || (window.getLang ? window.getLang() : 'te');

    // Stop any existing audio
    if (globalAudioPlayer) {
        globalAudioPlayer.pause();
        globalAudioPlayer = null;
    }
    if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
    }

    const ttsUrl = `/api/tts?text=${encodeURIComponent(text.trim())}&lang=${encodeURIComponent(currentLang)}`;
    const audio = new Audio(ttsUrl);
    globalAudioPlayer = audio;
    audio.play().catch(err => {
        console.warn('Direct audio stream failed, attempting Web Speech fallback:', err);
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = currentLang === 'en' ? 'en-IN' : 'te-IN';
            utterance.rate = 0.85;
            speechSynthesis.speak(utterance);
        }
    });
}"""

new_speak = """function speakText(text, lang) {
    if (!text || !text.trim()) return;

    const currentLang = lang || (window.getLang ? window.getLang() : 'te');

    // Stop any existing audio
    if (globalAudioPlayer) {
        globalAudioPlayer.pause();
        globalAudioPlayer = null;
    }
    if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
    }
    hideFloatingAudioPlayer();

    const ttsUrl = `/api/tts?text=${encodeURIComponent(text.trim())}&lang=${encodeURIComponent(currentLang)}`;
    const audio = new Audio(ttsUrl);
    globalAudioPlayer = audio;
    
    audio.play().then(() => {
        setupFloatingAudioUI(audio);
    }).catch(err => {
        console.warn('Direct audio stream failed, attempting Web Speech fallback:', err);
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = currentLang === 'en' ? 'en-IN' : 'te-IN';
            utterance.rate = 0.85;
            speechSynthesis.speak(utterance);
        }
    });
}"""

content = content.replace(old_speak, new_speak)

with open('public/js/app-client.js', 'w') as f:
    f.write(content)

