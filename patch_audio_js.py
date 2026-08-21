import re

with open('public/js/app-client.js', 'r') as f:
    content = f.read()

old_setup = """function setupFloatingAudioUI(audioElement) {
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
}"""

new_setup = """function setupFloatingAudioUI(audioElement) {
    const playPauseBtn = document.getElementById('audioPlayPauseBtn');
    const stopBtn = document.getElementById('audioStopBtn');
    const rewindBtn = document.getElementById('audioRewindBtn');
    const forwardBtn = document.getElementById('audioForwardBtn');
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
    
    if (rewindBtn) {
        rewindBtn.onclick = () => {
            audioElement.currentTime = Math.max(0, audioElement.currentTime - 10);
        };
    }
    
    if (forwardBtn) {
        forwardBtn.onclick = () => {
            if (audioElement.duration) {
                audioElement.currentTime = Math.min(audioElement.duration, audioElement.currentTime + 10);
            }
        };
    }

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
}"""

content = content.replace(old_setup, new_setup)

with open('public/js/app-client.js', 'w') as f:
    f.write(content)

