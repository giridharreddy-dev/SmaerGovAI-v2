import re

with open('public/js/app-client.js', 'r') as f:
    content = f.read()

old_block = """    const ttsUrl = `/api/tts?text=${encodeURIComponent(text.trim())}&lang=${encodeURIComponent(currentLang)}`;
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
    });"""

new_block = """    const ttsUrl = `/api/tts?text=${encodeURIComponent(text.trim())}&lang=${encodeURIComponent(currentLang)}`;
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
    });"""

content = content.replace(old_block, new_block)

with open('public/js/app-client.js', 'w') as f:
    f.write(content)
