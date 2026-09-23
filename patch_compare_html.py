import re

with open('views/portal.ejs', 'r', encoding='utf-8') as f:
    content = f.read()

# Add button
grid_header = """                <div class="grid-header">
                    <div style="display:flex; align-items:center; gap: 8px;">
                        <h2 data-i18n="availableSchemesTitle">అందుబాటులో ఉన్న ఆరోగ్య పథకాలు</h2>
                        <span id="schemeCountBadge" class="count-badge">0</span>
                    </div>
                    <button type="button" class="secondary-btn compare-schemes-btn" data-action="open-compare" style="display:flex; align-items:center; gap:6px; font-size: 0.9rem; padding: 6px 12px; margin-left: auto;">
                        <span aria-hidden="true">⚖️</span> <span data-i18n="compareSchemes">Compare</span>
                    </button>
                </div>"""

pattern_header = re.compile(r'                <div class="grid-header">.*?<span id="schemeCountBadge" class="count-badge">0</span>\n                </div>', re.DOTALL)
content = pattern_header.sub(grid_header, content)

# Add modal
modal_html = """
<!-- Compare Schemes Modal -->
<dialog id="compareModal" class="app-dialog compare-dialog" aria-labelledby="compareTitle">
    <div class="dialog-header">
        <h2 id="compareTitle">⚖️ <span data-i18n="compareModalTitle">పథకాల పోలిక (Compare Schemes)</span></h2>
        <button type="button" class="dialog-close-btn" data-action="close-compare" aria-label="Close">✕</button>
    </div>
    <div class="dialog-body" style="display:flex; flex-direction:column; overflow:hidden; padding: 0;">
        <div class="compare-selectors" style="display: flex; gap: 16px; padding: 16px 20px; background: var(--surface-soft); border-bottom: 1px solid var(--border);">
            <div class="field" style="flex:1; display:flex; flex-direction:column; gap:6px;">
                <label for="compareSelect1" data-i18n="compareSelect1" style="font-size:0.85rem; font-weight:600; color:var(--ink);">మొదటి పథకం (Scheme 1)</label>
                <select id="compareSelect1" class="compare-select" style="padding:10px; border-radius:6px; border:1px solid var(--border); font-size:0.95rem;">
                    <option value="">-- ఎంచుకోండి --</option>
                </select>
            </div>
            <div class="field" style="flex:1; display:flex; flex-direction:column; gap:6px;">
                <label for="compareSelect2" data-i18n="compareSelect2" style="font-size:0.85rem; font-weight:600; color:var(--ink);">రెండవ పథకం (Scheme 2)</label>
                <select id="compareSelect2" class="compare-select" style="padding:10px; border-radius:6px; border:1px solid var(--border); font-size:0.95rem;">
                    <option value="">-- ఎంచుకోండి --</option>
                </select>
            </div>
        </div>
        <div id="compareResults" class="compare-results" style="padding: 20px; overflow-y: auto; flex:1;">
            <div class="empty-state" style="text-align:center; padding:40px 20px; color:var(--muted); font-size:1.05rem;">
                దయచేసి పై జాబితా నుండి రెండు పథకాలను ఎంచుకోండి.<br><span style="font-size:0.9rem;">(Please select two schemes to compare)</span>
            </div>
        </div>
    </div>
</dialog>

<!-- Feedback & Issue Report Modal -->"""

content = content.replace("<!-- Feedback & Issue Report Modal -->", modal_html)

with open('views/portal.ejs', 'w', encoding='utf-8') as f:
    f.write(content)

print("HTML patched.")
