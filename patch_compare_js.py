import re

with open('public/js/app-client.js', 'r', encoding='utf-8') as f:
    content = f.read()

compare_logic = """
// ==========================================
// SCHEME COMPARISON LOGIC
// ==========================================
function openCompareModal() {
    const modal = document.getElementById('compareModal');
    if (!modal) return;
    
    populateCompareDropdowns();
    
    // Clear previous results
    const resultsContainer = document.getElementById('compareResults');
    if (resultsContainer) {
        resultsContainer.innerHTML = `
            <div class="empty-state" style="text-align:center; padding:40px 20px; color:var(--muted); font-size:1.05rem;">
                దయచేసి పై జాబితా నుండి రెండు పథకాలను ఎంచుకోండి.<br><span style="font-size:0.9rem;">(Please select two schemes to compare)</span>
            </div>
        `;
    }

    if (typeof modal.showModal === 'function') {
        modal.showModal();
    } else {
        modal.classList.remove('hidden');
    }
}

function closeCompareModal() {
    const modal = document.getElementById('compareModal');
    if (modal) {
        if (typeof modal.close === 'function') {
            modal.close();
        } else {
            modal.classList.add('hidden');
        }
    }
}

function populateCompareDropdowns() {
    const s1 = document.getElementById('compareSelect1');
    const s2 = document.getElementById('compareSelect2');
    if (!s1 || !s2 || !window.schemesCatalog) return;

    const schemes = Object.keys(window.schemesCatalog).sort();
    const isEn = window.getLang && window.getLang() === 'en';
    
    const optionsHtml = `<option value="">-- ఎంచుకోండి --</option>` + schemes.map(s => {
        const data = window.schemesCatalog[s];
        const label = isEn ? s : `${data.telugu_name || s} | ${s}`;
        return `<option value="${s}">${window.escapeHtml(label)}</option>`;
    }).join('');

    // Only set if empty to preserve selections, unless languages changed
    s1.innerHTML = optionsHtml;
    s2.innerHTML = optionsHtml;
}

function renderComparison() {
    const s1Name = document.getElementById('compareSelect1')?.value;
    const s2Name = document.getElementById('compareSelect2')?.value;
    const resultsContainer = document.getElementById('compareResults');
    if (!resultsContainer) return;

    if (!s1Name || !s2Name) {
        resultsContainer.innerHTML = `
            <div class="empty-state" style="text-align:center; padding:40px 20px; color:var(--muted); font-size:1.05rem;">
                దయచేసి పై జాబితా నుండి రెండు పథకాలను ఎంచుకోండి.<br><span style="font-size:0.9rem;">(Please select two schemes to compare)</span>
            </div>
        `;
        return;
    }

    const s1 = window.schemesCatalog[s1Name];
    const s2 = window.schemesCatalog[s2Name];
    const isEn = window.getLang && window.getLang() === 'en';

    const getListHtml = (arr) => {
        if (!arr || arr.length === 0) return '-';
        return `<ul>${arr.map(item => `<li>${window.escapeHtml(item)}</li>`).join('')}</ul>`;
    };

    const s1Display = isEn ? s1Name : s1.telugu_name || s1Name;
    const s2Display = isEn ? s2Name : s2.telugu_name || s2Name;

    const html = `
        <table class="compare-table">
            <thead>
                <tr>
                    <th class="attribute-col" style="border:none; background:transparent;"></th>
                    <th class="compare-header">${window.escapeHtml(s1Display)}</th>
                    <th class="compare-header">${window.escapeHtml(s2Display)}</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td class="attribute-col">వర్గం (Category)</td>
                    <td class="value-col" data-scheme-name="${window.escapeHtml(s1Display)}">${window.escapeHtml(s1.category || '-')}</td>
                    <td class="value-col" data-scheme-name="${window.escapeHtml(s2Display)}">${window.escapeHtml(s2.category || '-')}</td>
                </tr>
                <tr>
                    <td class="attribute-col">లబ్ధిదారులు (Target Audience)</td>
                    <td class="value-col" data-scheme-name="${window.escapeHtml(s1Display)}">${window.escapeHtml(s1.target_audience || '-')}</td>
                    <td class="value-col" data-scheme-name="${window.escapeHtml(s2Display)}">${window.escapeHtml(s2.target_audience || '-')}</td>
                </tr>
                <tr>
                    <td class="attribute-col">ప్రయోజనాలు (Benefits)</td>
                    <td class="value-col" data-scheme-name="${window.escapeHtml(s1Display)}">${getListHtml(s1.benefits)}</td>
                    <td class="value-col" data-scheme-name="${window.escapeHtml(s2Display)}">${getListHtml(s2.benefits)}</td>
                </tr>
                <tr>
                    <td class="attribute-col">అర్హతలు (Eligibility)</td>
                    <td class="value-col" data-scheme-name="${window.escapeHtml(s1Display)}">${getListHtml(s1.eligibility_criteria)}</td>
                    <td class="value-col" data-scheme-name="${window.escapeHtml(s2Display)}">${getListHtml(s2.eligibility_criteria)}</td>
                </tr>
                <tr>
                    <td class="attribute-col">అవసరమైన పత్రాలు (Required Docs)</td>
                    <td class="value-col" data-scheme-name="${window.escapeHtml(s1Display)}">${getListHtml(s1.required_documents)}</td>
                    <td class="value-col" data-scheme-name="${window.escapeHtml(s2Display)}">${getListHtml(s2.required_documents)}</td>
                </tr>
            </tbody>
        </table>
    `;

    resultsContainer.innerHTML = html;
}

// Attach listeners for compare
document.addEventListener('DOMContentLoaded', () => {
    // Dropdown change listeners
    const s1 = document.getElementById('compareSelect1');
    const s2 = document.getElementById('compareSelect2');
    if (s1) s1.addEventListener('change', renderComparison);
    if (s2) s2.addEventListener('change', renderComparison);
});
"""

content = content.replace("// ==========================================\n// INIT & EVENTS", compare_logic + "\n// ==========================================\n// INIT & EVENTS")

# Also need to intercept 'open-compare' and 'close-compare' buttons
# They can be handled in the main click delegator.

click_handler_inject = """
            if (action === 'open-compare') {
                openCompareModal();
                return;
            }
            if (action === 'close-compare') {
                closeCompareModal();
                return;
            }
"""

content = content.replace("if (action === 'show-symptom-categories') {", click_handler_inject + "            if (action === 'show-symptom-categories') {")

with open('public/js/app-client.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("JS patched.")
