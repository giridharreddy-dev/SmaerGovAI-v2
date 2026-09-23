import re

with open('public/js/app-client.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace specific error alerts
content = content.replace("alert(window.t ? window.t('selectSchemeError') : 'దయచేసి ముందుగా పథకం ఎంచుకోండి.');", "window.showToast(window.t ? window.t('selectSchemeError') : 'దయచేసి ముందుగా పథకం ఎంచుకోండి.', 'error');")
content = content.replace("alert(isEn ? 'Popup blocked. Please allow popups to print.' : 'పాప్‌అప్ బ్లాక్ చేయబడింది. దయచేసి పాప్‌అప్‌లను అనుమతించండి.');", "window.showToast(isEn ? 'Popup blocked. Please allow popups to print.' : 'పాప్‌అప్ బ్లాక్ చేయబడింది. దయచేసి పాప్‌అప్‌లను అనుమతించండి.', 'error');")
content = content.replace("alert(isEn ? 'QR code not available.' : 'QR కోడ్ అందుబాటులో లేదు.');", "window.showToast(isEn ? 'QR code not available.' : 'QR కోడ్ అందుబాటులో లేదు.', 'error');")
content = content.replace("alert(isEn ? 'No network connection. Internet is required for WhatsApp sharing.' : 'నెట్‌వర్క్ కనెక్షన్ లేదు. WhatsApp షేర్ కొరకు ఇంటర్నెట్ అవసరం.');", "window.showToast(isEn ? 'No network connection. Internet is required for WhatsApp sharing.' : 'నెట్‌వర్క్ కనెక్షన్ లేదు. WhatsApp షేర్ కొరకు ఇంటర్నెట్ అవసరం.', 'error');")
content = content.replace("alert(isEn ? `Error: ${error.message}` : `లోపం: ${error.message}`);", "window.showToast(isEn ? `Error: ${error.message}` : `లోపం: ${error.message}`, 'error');")
content = content.replace("alert(window.t ? window.t('selectSchemeError') : 'దయచేసి పథకం ఎంచుకోండి.');", "window.showToast(window.t ? window.t('selectSchemeError') : 'దయచేసి పథకం ఎంచుకోండి.', 'error');")

# Replace success alert
content = content.replace("alert(window.t ? window.t('shareSuccess') : '✅ ఫలితం కాపీ చేయబడింది!');", "window.showToast(window.t ? window.t('shareSuccess') : '✅ ఫలితం కాపీ చేయబడింది!', 'success');")

with open('public/js/app-client.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("All alerts patched to toasts.")
