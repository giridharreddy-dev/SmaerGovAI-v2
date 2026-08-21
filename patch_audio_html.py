import re

with open('views/portal.ejs', 'r') as f:
    content = f.read()

old_html = """        <div class="audio-controls">
            <button id="audioPlayPauseBtn" title="Play/Pause">⏸️</button>
            <button id="audioStopBtn" title="Stop">⏹️</button>
        </div>"""

new_html = """        <div class="audio-controls">
            <button id="audioRewindBtn" title="-10s">⏪</button>
            <button id="audioPlayPauseBtn" title="Play/Pause">⏸️</button>
            <button id="audioForwardBtn" title="+10s">⏩</button>
            <button id="audioStopBtn" title="Stop">⏹️</button>
        </div>"""

content = content.replace(old_html, new_html)

with open('views/portal.ejs', 'w') as f:
    f.write(content)
