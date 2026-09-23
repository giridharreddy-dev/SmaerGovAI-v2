import re

with open('public/js/app-client.js', 'r', encoding='utf-8') as f:
    content = f.read()

new_logic = """async function submitFeedback(e) {
    if (e) e.preventDefault();
    
    const messageInput = document.getElementById('feedbackMessage');
    const typeInput = document.getElementById('feedbackType');
    const errorDiv = document.getElementById('feedbackFormError');
    const submitBtn = document.querySelector('#feedbackForm button[type="submit"]');
    
    const message = messageInput ? messageInput.value.trim() : '';
    const type = typeInput ? typeInput.value : 'general';
    
    const showError = (msg) => {
        if (errorDiv) {
            errorDiv.style.display = 'block';
            errorDiv.textContent = msg;
        } else {
            alert(msg);
        }
    };

    if (errorDiv) errorDiv.style.display = 'none';

    // Client-Side Validation
    if (!message) {
        showError(window.t ? window.t('pleaseEnterFeedback') : 'దయచేసి మీ అభిప్రాయాన్ని నమోదు చేయండి.');
        if (messageInput) messageInput.focus();
        return;
    }
    
    if (message.length < 5) {
        showError(window.t ? window.t('feedbackTooShort') : 'మీ అభిప్రాయం మరీ చిన్నదిగా ఉంది. దయచేసి మరికొన్ని వివరాలు ఇవ్వండి.');
        if (messageInput) messageInput.focus();
        return;
    }

    const payload = {
        scheme_name: window.currentSchemeName || 'General Feedback',
        issue_type: type,
        village: 'Self-reported',
        feedback_text: message
    };

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'పంపుతున్నాం (Submitting)...';
    }

    try {
        const response = await fetch('/staff-report', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(typeof getCsrfHeader === 'function' ? getCsrfHeader() : {})
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (response.ok) {
            alert(window.t ? window.t('feedbackSuccess') : '✅ ధన్యవాదాలు! మీ అభిప్రాయం నమోదు చేయబడింది.');
            closeFeedbackModal();
        } else {
            throw new Error(data.error || 'Server error');
        }
    } catch (error) {
        showError(window.t ? window.t('feedbackError') : '❌ అభిప్రాయం పంపలేకపోయాము. దయచేసి మళ్లీ ప్రయత్నించండి.');
        console.error('Feedback submission error:', error);
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'సమర్పించండి (Submit)';
        }
    }
}"""

pattern = re.compile(r'async function submitFeedback\(e\) \{.*?\}\n\}', re.DOTALL)
content = pattern.sub(new_logic, content)

with open('public/js/app-client.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("submitFeedback patched.")
