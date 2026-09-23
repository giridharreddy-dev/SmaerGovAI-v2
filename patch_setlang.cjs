const fs = require('fs');
let code = fs.readFileSync('views/portal.ejs', 'utf8');

code = code.replace(
"            populateSchemeDropdown(lang);\n            renderSchemeCards(true);\n            updateChatUi();\n            if (currentSchemeData) {\n                displayResult(currentSchemeData, true);\n            }",
"            populateSchemeDropdown(lang);\n            renderSchemeCards(true);\n            updateChatUi();\n            if (currentSchemeData) {\n                displayResult(currentSchemeData, true);\n            }\n            if (typeof window.populateCompareDropdowns === 'function') {\n                window.populateCompareDropdowns();\n                window.renderComparison();\n            }"
);

fs.writeFileSync('views/portal.ejs', code);
