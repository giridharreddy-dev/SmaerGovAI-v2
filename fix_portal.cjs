const fs = require('fs');
let code = fs.readFileSync('views/portal.ejs', 'utf8');

// Fix the damaged section
code = code.replace(/const documentChecklist = Smar[\s\S]*?\}l\)\}<\/p>/, 
`const documentChecklist = SmartGovEnhanced.buildDocumentChecklist(scheme);
        const trustInfo = SmartGovEnhanced.buildTrustInfo(scheme);
        const privacyWarning = SmartGovEnhanced.buildPrivacyWarning();

        if (window.SmartGovUX) {
            window.SmartGovUX.addRecent(data.scheme_name);
        }

        const eligContent = isEn ? (data.simplified?.eligibility || '') : (data.telugu?.eligibility || '');
        const benContent = isEn ? (data.simplified?.benefits || '') : (data.telugu?.benefits || '');
        const docContent = isEn ? (data.simplified?.documents || '') : (data.telugu?.documents || '');
        const stepContent = isEn ? (data.simplified?.steps || '') : (data.telugu?.steps || '');

        const eligTitle = window.t ? window.t('eligibilityTitle') : 'అర్హత';
        const benTitle = window.t ? window.t('benefitsTitle') : 'ప్రయోజనాలు';
        const docTitle = window.t ? window.t('documentsTitle') : 'కావలసిన పత్రాలు';
        const stepTitle = window.t ? window.t('stepsTitle') : 'దరఖాస్తు విధానం';

        document.getElementById('resultArea').innerHTML = \`
            <div class="result-head">
                <h2 style="display:flex; align-items:center; flex-wrap:wrap; gap:4px;">\${window.escapeHtml(mainTitle)} \${aiBadge}</h2>
                \${subTitle ? \`<p style="font-size:0.95rem;color:var(--muted);">\${window.escapeHtml(subTitle)}</p>\` : ''}
                <p>\${window.escapeHtml(levelLabel)} • \${window.escapeHtml(categoryLabel)}</p>`);

// Fix safeFetch function
code = code.replace(/async function safeFetch\(url, options = \{\}, timeoutMs = 20000\) \{[\s\S]*?throw error;\s*\}/, 
`async function safeFetch(url, options = {}) {
        try {
            const response = await fetch(url, options);
            let data;
            const contentType = response.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
                data = await response.json();
            } else {
                const text = await response.text();
                data = {
                    status: 'error',
                    error: response.ok
                        ? 'Unexpected response format'
                        : (window.t ? window.t('serverError') : 'సర్వర్ లోపం. దయచేసి మళ్ళీ ప్రయత్నించండి.'),
                    error_code: 'NON_JSON_RESPONSE',
                    response_text: text
                };
            }
            if (!response.ok && !data.error) {
                data.error = window.t ? window.t('serverError') : 'సర్వర్ లోపం. దయచేసి మళ్ళీ ప్రయత్నించండి.';
            }
            return data;
        } catch (error) {
            throw error;
        }`);

fs.writeFileSync('views/portal.ejs', code);
