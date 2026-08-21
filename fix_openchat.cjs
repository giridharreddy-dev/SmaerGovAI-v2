const fs = require('fs');
let code = fs.readFileSync('public/js/app-client.js', 'utf8');

code = code.replace(/let currentRating = 0;/, `
window.openChat = function openChat(trigger) {
    const dialog = document.getElementById('chatModal');
    if (dialog && typeof dialog.showModal === 'function') {
        if (!dialog.open) dialog.showModal();
    }
    const overlay = document.getElementById('chatOverlay');
    if (overlay) {
        overlay.classList.remove('hidden');
        overlay.setAttribute('aria-hidden', 'false');
    }
    if (window.updateChatUi) window.updateChatUi();
};

window.closeChat = function closeChat() {
    const dialog = document.getElementById('chatModal');
    if (dialog && typeof dialog.close === 'function') {
        dialog.close();
    }
    const overlay = document.getElementById('chatOverlay');
    if (overlay) {
        overlay.classList.add('hidden');
        overlay.setAttribute('aria-hidden', 'true');
    }
};

let currentRating = 0;`);

fs.writeFileSync('public/js/app-client.js', code);
