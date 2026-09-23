const fs = require('fs');
let content = fs.readFileSync('views/analytics.ejs', 'utf8');

content = content.replace(
    '<div class="metric-card">\n                        <div class="metric-title">💬 పౌరుల స్పందనలు</div>\n                        <div class="metric-value"><%= metrics.total_feedback %></div>\n                        <div class="metric-subtitle">Total Citizen Feedback</div>\n                    </div>',
    '<div class="metric-card">\n                        <div class="metric-title">💬 పౌరుల స్పందనలు</div>\n                        <div class="metric-value"><%= metrics.total_feedback %></div>\n                        <div class="metric-subtitle">Total Citizen Feedback</div>\n                    </div>\n                    <div class="metric-card">\n                        <div class="metric-title">📝 నివేదించబడిన సమస్యలు</div>\n                        <div class="metric-value"><%= metrics.total_grievances || 0 %></div>\n                        <div class="metric-subtitle">Reported Issues</div>\n                    </div>'
);

fs.writeFileSync('views/analytics.ejs', content, 'utf8');
console.log('patched');
