import re

with open('public/js/app-client.js', 'r') as f:
    content = f.read()

# Pass button to speakPageAloud
content = content.replace("speakPageAloud();", "speakPageAloud(speakPageBtn);")

old_speak = """function speakPageAloud() {
    if (!window.currentSchemeName) {
        alert(window.t ? window.t('selectSchemeError') : 'దయచేసి ముందుగా పథకం ఎంచుకోండి.');
        return;
    }

    const currentLang = window.getLang ? window.getLang() : 'te';
    const isEn = currentLang === 'en';

    // Check if there is an official pre-cached audio element
    const existingAudio = document.querySelector('.audio-wrap audio');
    if (existingAudio && existingAudio.src && !isEn) {
        if (globalAudioPlayer) {
            globalAudioPlayer.pause();
            hideFloatingAudioPlayer();
        }
        if ('speechSynthesis' in window) {
            speechSynthesis.cancel();
        }
        globalAudioPlayer = existingAudio;
        existingAudio.currentTime = 0;
        existingAudio.play().then(() => {
            setupFloatingAudioUI(existingAudio);
        }).catch(err => {
            console.warn('Cached audio playback failed, generating on-the-fly:', err);
            generateAndPlayDetailSpeech(isEn);
        });
        return;
    }

    generateAndPlayDetailSpeech(isEn);
}"""

new_speak = """function speakPageAloud(btn) {
    if (!window.currentSchemeName) {
        alert(window.t ? window.t('selectSchemeError') : 'దయచేసి ముందుగా పథకం ఎంచుకోండి.');
        return;
    }

    const currentLang = window.getLang ? window.getLang() : 'te';
    const isEn = currentLang === 'en';

    if (globalAudioPlayer) {
        globalAudioPlayer.pause();
        hideFloatingAudioPlayer();
    }
    if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
    }

    // If the button has a specific data-audio-src (native pre-recorded) and not in English
    if (btn && btn.dataset && btn.dataset.audioSrc && !isEn) {
        const audioSrc = btn.dataset.audioSrc;
        const audio = new Audio(audioSrc);
        globalAudioPlayer = audio;
        audio.play().then(() => {
            setupFloatingAudioUI(audio);
        }).catch(err => {
            console.warn('Cached audio playback failed, generating on-the-fly:', err);
            generateAndPlayDetailSpeech(isEn);
        });
        return;
    }

    // Otherwise, generate and play dynamic browser speech
    generateAndPlayDetailSpeech(isEn);
}"""

content = content.replace(old_speak, new_speak)

with open('public/js/app-client.js', 'w') as f:
    f.write(content)
