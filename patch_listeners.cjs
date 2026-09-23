const fs = require('fs');

const path = 'public/js/app-client.js';
let content = fs.readFileSync(path, 'utf8');

// Fix resultArea listener:
content = content.replace(
    "const schemeName = reportIssueBtn.dataset.scheme;\n                openFeedbackModal(reportIssueBtn);",
    "const schemeName = reportIssueBtn.dataset.scheme;\n                event.stopPropagation();\n                openFeedbackModal(reportIssueBtn, schemeName);"
);

fs.writeFileSync(path, content, 'utf8');
console.log('listeners patched');
