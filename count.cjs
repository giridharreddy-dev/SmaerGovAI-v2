const fs = require('fs');
const path = require('path');
const DATA_DIR = path.resolve('data');
const schemes = {};
const files = fs.readdirSync(DATA_DIR).sort();
for (const file of files) {
  if (file.endsWith('.json') && file !== 'scheme_schema.json' && file !== 'facilities.json') {
    const content = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf8'));
    for (const [k, v] of Object.entries(content)) schemes[k] = true;
  }
}
console.log("Total unique schemes:", Object.keys(schemes).length);
