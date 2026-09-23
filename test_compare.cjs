const fs = require('fs');
let code = fs.readFileSync('public/js/app-client.js', 'utf8');
code = code.replace(
"            if (action === 'open-compare') {\n                openCompareModal();\n                return;\n            }",
"            if (action === 'open-compare') {\n                e.stopPropagation();\n                openCompareModal();\n                return;\n            }"
);
code = code.replace(
"            if (action === 'close-compare') {\n                closeCompareModal();\n                return;\n            }",
"            if (action === 'close-compare') {\n                e.stopPropagation();\n                closeCompareModal();\n                return;\n            }"
);
fs.writeFileSync('public/js/app-client.js', code);
