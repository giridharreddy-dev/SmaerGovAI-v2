import re

with open('public/js/app-client.js', 'r', encoding='utf-8') as f:
    content = f.read()

toast_logic = """
// Toast Notification System
window.showToast = function(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('hiding');
        toast.addEventListener('animationend', () => {
            toast.remove();
            if (container.children.length === 0) {
                container.remove();
            }
        });
    }, 4000);
};
"""

# Insert toast logic at the top of the file
content = toast_logic + content

# Replace alerts in submitFeedback with showToast
content = content.replace(
    "alert(window.t ? window.t('feedbackSuccess') : '✅ ధన్యవాదాలు! మీ అభిప్రాయం నమోదు చేయబడింది.');",
    "window.showToast(window.t ? window.t('feedbackSuccess') : '✅ ధన్యవాదాలు! మీ అభిప్రాయం నమోదు చేయబడింది.', 'success');"
)
content = content.replace(
    "showError(window.t ? window.t('feedbackError') : '❌ అభిప్రాయం పంపలేకపోయాము. దయచేసి మళ్లీ ప్రయత్నించండి.');",
    "window.showToast(window.t ? window.t('feedbackError') : '❌ అభిప్రాయం పంపలేకపోయాము. దయచేసి మళ్లీ ప్రయత్నించండి.', 'error');"
)

with open('public/js/app-client.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Toast added to app-client.js")
