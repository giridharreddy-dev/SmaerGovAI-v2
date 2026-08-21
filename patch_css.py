import re

with open('public/css/theme.css', 'r') as f:
    content = f.read()

old_css = """.floating-audio-player {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 30px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.15);
    padding: 8px 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    z-index: 9999;
    transition: all 0.3s ease;
}

.floating-audio-player.hidden {
    opacity: 0;
    pointer-events: none;
    transform: translate(-50%, 20px);
}"""

new_css = """.floating-audio-player {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.05);
    padding: 8px 16px;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    gap: 12px;
    margin-top: 12px;
    width: 100%;
    transition: all 0.3s ease;
}

.floating-audio-player.hidden {
    display: none;
}"""

content = content.replace(old_css, new_css)

with open('public/css/theme.css', 'w') as f:
    f.write(content)
