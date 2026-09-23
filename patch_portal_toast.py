import re

with open('views/portal.ejs', 'r', encoding='utf-8') as f:
    content = f.read()

new_send_feedback = """    async function sendFeedback(rating) {
        const reqId = currentRequestId || (currentSchemeName ? 'scheme_' + encodeURIComponent(currentSchemeName) : 'anon_' + Date.now());
        const status = document.getElementById('feedbackStatus');
        if (status) status.textContent = window.t ? window.t('feedbackSaving') : 'సేవ్ చేస్తున్నాం...';
        try {
            const data = await safeFetch("/feedback", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                },
                body: JSON.stringify({ request_id: reqId, rating: Number(rating) })
            });
            if (status) {
                status.textContent = data.status === 'success' ? (window.t ? window.t('feedbackSuccess') : '✅ ధన్యవాదాలు! మీ స్పందన సేవ్ అయింది.') : (window.t ? window.t('feedbackError') : `లోపం: ${data.error}`);
            }
            if (data.status === 'success' && typeof window.showToast === 'function') {
                window.showToast(window.t ? window.t('feedbackSuccess') : '✅ ధన్యవాదాలు! మీ స్పందన సేవ్ అయింది.', 'success');
            } else if (typeof window.showToast === 'function') {
                window.showToast(data.error || 'Error', 'error');
            }
        } catch (error) {
            if (status) {
                status.textContent = window.t ? window.t('networkError', { error: error.message }) : `లోపం: ${error.message}`;
            }
            if (typeof window.showToast === 'function') {
                window.showToast(`లోపం: ${error.message}`, 'error');
            }
        }
    }"""

pattern = re.compile(r'    async function sendFeedback\(rating\) \{.*?\n    \}', re.DOTALL)
content = pattern.sub(new_send_feedback, content)

with open('views/portal.ejs', 'w', encoding='utf-8') as f:
    f.write(content)

print("Portal sendFeedback updated.")
