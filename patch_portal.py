import re

with open('views/portal.ejs', 'r') as f:
    content = f.read()

old_html = """        const audioHtml = data.voice_url && !isEn
            ? `<div class="audio-wrap">
                <strong>${audioTitle}</strong>
                <audio controls src="${window.escapeHtml(data.voice_url)}" style="width: 100%;" onerror="this.parentElement.innerHTML = '<button type=\\'button\\' class=\\'speak-page-btn primary-btn\\' style=\\'width:100%;margin-top:8px;padding:8px;\\'>🔊 Read Aloud (Browser Voice)</button>';"></audio>
            </div>`
            : (isEn
                ? `<div class="audio-wrap">
                    <strong>${audioTitle}</strong>
                    <button type="button" class="speak-page-btn primary-btn" style="width:100%;margin-top:8px;padding:8px;">${window.t ? window.t('speakPageBtn') : '🔊 Read Aloud (Browser Voice)'}</button>
                </div>`
                : `<div class="audio-wrap">
                    <strong>${audioNotAvail}</strong>
                    <button type="button" class="speak-page-btn primary-btn" style="width:100%;margin-top:8px;padding:8px;background:var(--secondary);color:#000;">⚠️ ${window.t ? window.t('speakPageBtn') : '🔊 ఈ పేజీ చదవండి (Browser Fallback)'}</button>
                   </div>`);"""

new_html = """        const audioHtml = data.voice_url && !isEn
            ? `<div class="audio-wrap">
                <strong>${audioTitle}</strong>
                <button type="button" class="speak-page-btn primary-btn" data-audio-src="${window.escapeHtml(data.voice_url)}" style="width:100%;margin-top:8px;padding:8px;display:flex;justify-content:center;align-items:center;gap:8px;">
                    ▶️ ప్లే ఆడియో (Play Native Audio)
                </button>
            </div>`
            : `<div class="audio-wrap">
                <strong>${isEn ? audioTitle : audioNotAvail}</strong>
                <button type="button" class="speak-page-btn primary-btn" style="width:100%;margin-top:8px;padding:8px;background:var(--secondary);color:#000;">
                    ${isEn ? '🔊 Read Aloud (Browser Voice)' : '⚠️ 🔊 ఈ పేజీ చదవండి (Browser Fallback)'}
                </button>
               </div>`;"""

content = content.replace(old_html, new_html)

with open('views/portal.ejs', 'w') as f:
    f.write(content)
