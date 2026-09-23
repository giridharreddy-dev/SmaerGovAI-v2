const fs = require('fs');

const path = 'public/js/app-client.js';
let content = fs.readFileSync(path, 'utf8');

content = content.replace("modal.showModal();", "if (!modal.open) modal.showModal();");

fs.writeFileSync(path, content, 'utf8');
console.log('modal patched');
