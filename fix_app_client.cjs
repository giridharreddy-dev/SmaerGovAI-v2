const fs = require('fs');
let code = fs.readFileSync('public/js/app-client.js', 'utf8');

// Remove formatAiResponse
code = code.replace(/\/\*\*[\s\S]*?window\.formatAiResponse = function\(text\) \{[\s\S]*?\n\};\n/, '');

// Remove appendChatMessage and sendChatQuestion
code = code.replace(/function appendChatMessage\(text, role\) \{[\s\S]*?\}\s*async function sendChatQuestion\(question\) \{[\s\S]*?console\.error\('Chat request failed:', error\);\s*\}/, '');

// Update chat-suggestion to trigger form submit instead of sendChatQuestion
code = code.replace(/if \(action === 'chat-suggestion'\) \{[\s\S]*?return;\s*\}/, `if (action === 'chat-suggestion') {
                    const input = document.getElementById('chatInput');
                    if (input) input.value = actionTarget.dataset.question;
                    document.getElementById('chatForm')?.dispatchEvent(new Event('submit', { cancelable: true }));
                    return;
                }`);

// Update send-chat
code = code.replace(/if \(action === 'send-chat'\) \{[\s\S]*?return;\s*\}/, `if (action === 'send-chat') {
                    // Let the form's native submit handle it.
                    return;
                }`);

fs.writeFileSync('public/js/app-client.js', code);
