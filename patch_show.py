import re

with open('public/js/app-client.js', 'r') as f:
    content = f.read()

old_show = """function showFloatingAudioPlayer() {
    const player = document.getElementById('floatingAudioPlayer');
    if (player) player.classList.remove('hidden');
}"""

new_show = """function showFloatingAudioPlayer(btn) {
    const player = document.getElementById('floatingAudioPlayer');
    if (player) {
        if (btn && btn.parentElement) {
            btn.parentElement.appendChild(player);
        }
        player.classList.remove('hidden');
    }
}"""

content = content.replace(old_show, new_show)

old_setup = "function setupFloatingAudioUI(audioElement) {"
new_setup = "function setupFloatingAudioUI(audioElement, btn) {"
content = content.replace(old_setup, new_setup)

content = content.replace("showFloatingAudioPlayer();", "showFloatingAudioPlayer(btn);")

old_speak1 = "setupFloatingAudioUI(audio);"
new_speak1 = "setupFloatingAudioUI(audio, btn);"
content = content.replace(old_speak1, new_speak1)

# In speakText, btn is not passed. But we can pass it if we change generateAndPlayDetailSpeech to accept btn, and speakText to accept btn.
# Let's check generateAndPlayDetailSpeech
with open('public/js/app-client.js', 'w') as f:
    f.write(content)
