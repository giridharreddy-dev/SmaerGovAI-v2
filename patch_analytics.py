import re

with open('views/analytics.ejs', 'r', encoding='utf-8') as f:
    content = f.read()

new_block = """            <% } %>

            <% if (typeof grievances !== 'undefined' && grievances && grievances.length > 0) { %>
            <section class="dashboard-section">
                <h2>📝 నివేదించబడిన సమస్యలు మరియు అభిప్రాయాలు (Reported Issues & Feedback)</h2>
                <div class="feedback-table-wrap">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>సమయం (Timestamp)</th>
                                <th>రకం (Type)</th>
                                <th>పథకం (Scheme Name)</th>
                                <th>వివరణ (Description)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <% grievances.forEach(function(fb) { %>
                            <tr>
                                <td><%= new Date(fb.timestamp).toLocaleString('te-IN') %></td>
                                <td>
                                    <span class="stat-pill" style="background: var(--surface-soft); color: var(--primary);">
                                        <%= fb.issue_type === 'wrong_info' ? 'తప్పుడు సమాచారం' : 
                                            fb.issue_type === 'audio_issue' ? 'ఆడియో సమస్య' : 
                                            fb.issue_type === 'missing_scheme' ? 'పథకం దొరకలేదు' : 
                                            fb.issue_type === 'suggestion' ? 'సలహా' : 
                                            fb.issue_type === 'general' ? 'సాధారణ' : fb.issue_type %>
                                    </span>
                                </td>
                                <td>
                                    <% if (fb.scheme_name === 'General Portal Feedback') { %>
                                        <span style="color: var(--muted); font-weight: 500;">అప్లికేషన్ అభిప్రాయం (Entire App)</span>
                                    <% } else { %>
                                        <strong><%= fb.scheme_name %></strong>
                                    <% } %>
                                </td>
                                <td><%= fb.feedback_text %></td>
                            </tr>
                            <% }); %>
                        </tbody>
                    </table>
                </div>
            </section>
            <% } %>

            <section class="dashboard-section">"""

# Replace `<% } %>\n\n            <section class="dashboard-section">\n                <h2>➕ పథకం జోడించండి`
pattern = re.compile(r'<% \} %>\s*<section class="dashboard-section">\s*<h2>➕ పథకం జోడించండి', re.DOTALL)
content = pattern.sub(new_block + '\n                <h2>➕ పథకం జోడించండి', content)

with open('views/analytics.ejs', 'w', encoding='utf-8') as f:
    f.write(content)

print("analytics patched.")
