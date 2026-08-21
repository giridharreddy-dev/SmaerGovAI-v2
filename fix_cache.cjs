const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

code = code.replace(/const cachedResult = await getCache\(cacheKey\);/g, 'const cachedResult = null; // await getCache(cacheKey);');
code = code.replace(/const cachedResponse = await getCache\(cacheKey\);/g, 'const cachedResponse = null; // await getCache(cacheKey);');

fs.writeFileSync('server.js', code);
