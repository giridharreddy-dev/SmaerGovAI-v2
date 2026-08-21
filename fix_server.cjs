const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

code = code.replace(/const timeoutPromise = new Promise\(\(_, reject\) => setTimeout\(\(\) => reject\(new Error\('TIMEOUT'\)\), \d+\)\);\n/g, '');
code = code.replace(/const timeoutPromiseFallback = new Promise\(\(_, reject\) => setTimeout\(\(\) => reject\(new Error\('TIMEOUT'\)\), \d+\)\);\n/g, '');

code = code.replace(/response = await Promise\.race\(\[\s*apiCall,\s*timeoutPromise\s*\]\);/g, 'response = await apiCall;');
code = code.replace(/const result = await Promise\.race\(\[\s*chat\.sendMessage\(\{ message: userText \}\),\s*timeoutPromise\s*\]\);/g, 'const result = await chat.sendMessage({ message: userText });');
code = code.replace(/const fbResult = await Promise\.race\(\[\s*fallbackChat\.sendMessage\(\{ message: userText \}\),\s*timeoutPromiseFallback\s*\]\);/g, 'const fbResult = await fallbackChat.sendMessage({ message: userText });');

fs.writeFileSync('server.js', code);
