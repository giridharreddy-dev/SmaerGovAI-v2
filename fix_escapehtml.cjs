const fs = require('fs');
let code = fs.readFileSync('public/js/app-client.js', 'utf8');

const injectCode = `
window.escapeHtml = function(value) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    };
    return String(value || '').replace(/[&<>"']/g, char => map[char]);
};
`;

code = code.replace('// CSRF Header Helper', injectCode + '\n// CSRF Header Helper');
fs.writeFileSync('public/js/app-client.js', code);
