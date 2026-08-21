import re

with open('public/js/app-client.js', 'r') as f:
    content = f.read()

old_speak = """    // Check if there is an official pre-cached audio element
    const existingAudio = document.querySelector('.audio-wrap audio');
    if (existingAudio && existingAudio.src && !isEn) {
        existingAudio.currentTime = 0;
        existingAudio.play().catch(err => {
            console.warn('Cached audio playback failed, generating on-the-fly:', err);
            generateAndPlayDetailSpeech(isEn);
        });
        return;
    }"""

new_speak = """    // Check if there is an official pre-cached audio element
    const existingAudio = document.querySelector('.audio-wrap audio');
    if (existingAudio && existingAudio.src && !isEn) {
        if (globalAudioPlayer) {
            globalAudioPlayer.pause();
            hideFloatingAudioPlayer();
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
    }"""

content = content.replace(old_speak, new_speak)

with open('public/js/app-client.js', 'w') as f:
    f.write(content)
