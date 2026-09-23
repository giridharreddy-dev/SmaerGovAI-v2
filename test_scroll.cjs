const fs = require('fs');
let code = fs.readFileSync('views/portal.ejs', 'utf8');

// Add preventScroll to displayResult
code = code.replace(
    'function displayResult(data) {',
    'function displayResult(data, preventScroll = false) {'
);

code = code.replace(
    "restoreDocumentChecks();\n        document.getElementById('resultArea').scrollIntoView({\n            behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',\n            block: 'start'\n        });\n    }",
    "restoreDocumentChecks();\n        if (!preventScroll) {\n            document.getElementById('resultArea').scrollIntoView({\n                behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',\n                block: 'start'\n            });\n        }\n    }"
);

// Update set-lang to preventScroll
code = code.replace(
    "if (currentSchemeData) {\n                displayResult(currentSchemeData);\n            }",
    "if (currentSchemeData) {\n                displayResult(currentSchemeData, true);\n            }"
);

fs.writeFileSync('views/portal.ejs', code);
