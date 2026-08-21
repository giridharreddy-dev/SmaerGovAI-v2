import re

with open('public/js/app-client.js', 'r') as f:
    content = f.read()

content = content.replace("generateAndPlayDetailSpeech(isEn);", "generateAndPlayDetailSpeech(isEn, btn);")

content = content.replace("function generateAndPlayDetailSpeech(isEn) {", "function generateAndPlayDetailSpeech(isEn, btn) {")

content = content.replace("speakText(fullText, isEn ? 'en' : 'te');", "speakText(fullText, isEn ? 'en' : 'te', btn);")

content = content.replace("function speakText(text, lang) {", "function speakText(text, lang, btn) {")

content = content.replace("setupFloatingAudioUI(audio);", "setupFloatingAudioUI(audio, btn);")

with open('public/js/app-client.js', 'w') as f:
    f.write(content)
