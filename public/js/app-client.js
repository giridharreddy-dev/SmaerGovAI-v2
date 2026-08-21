

window.escapeHtml = function(value) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    };
    return String(value || '').replace(/[&<>"']/g, char => map[char]);
};

// CSRF Header Helper
function getCsrfHeader() {
    const meta = document.querySelector('meta[name="csrf-token"]');
    return meta ? { 'X-CSRFToken': meta.getAttribute('content') } : {};
}

// ==================== Voice/Speech Features (Edge Shruthi Neural) ====================

let globalAudioPlayer = null;

// --- Floating Audio UI Controller ---
function showFloatingAudioPlayer(btn) {
    const player = document.getElementById('floatingAudioPlayer');
    if (player) {
        if (btn && btn.parentElement) {
            btn.parentElement.appendChild(player);
        }
        player.classList.remove('hidden');
    }
}
function hideFloatingAudioPlayer() {
    const player = document.getElementById('floatingAudioPlayer');
    if (player) player.classList.add('hidden');
}
function setupFloatingAudioUI(audioElement, btn) {
    const playPauseBtn = document.getElementById('audioPlayPauseBtn');
    const stopBtn = document.getElementById('audioStopBtn');
    const rewindBtn = document.getElementById('audioRewindBtn');
    const forwardBtn = document.getElementById('audioForwardBtn');
    const timeDisplay = document.getElementById('audioTime');
    const scrubber = document.getElementById('audioScrubber');
    const volumeSlider = document.getElementById('audioVolume');
    if (!playPauseBtn || !audioElement) return;

    showFloatingAudioPlayer(btn);

    // Reset
    playPauseBtn.textContent = '⏸️';
    scrubber.value = 0;
    timeDisplay.textContent = '0:00';
    if (volumeSlider) {
        audioElement.volume = volumeSlider.value;
        volumeSlider.oninput = () => {
            audioElement.volume = volumeSlider.value;
        };
    }

    const updateTime = () => {
        if (!audioElement.duration) return;
        const current = audioElement.currentTime;
        const mins = Math.floor(current / 60);
        const secs = Math.floor(current % 60).toString().padStart(2, '0');
        timeDisplay.textContent = `${mins}:${secs}`;
        scrubber.value = (current / audioElement.duration) * 100;
    };

    audioElement.addEventListener('timeupdate', updateTime);
    audioElement.addEventListener('ended', hideFloatingAudioPlayer);

    playPauseBtn.onclick = () => {
        if (audioElement.paused) {
            audioElement.play();
            playPauseBtn.textContent = '⏸️';
        } else {
            audioElement.pause();
            playPauseBtn.textContent = '▶️';
        }
    };
    
    if (rewindBtn) {
        rewindBtn.onclick = () => {
            audioElement.currentTime = Math.max(0, audioElement.currentTime - 10);
        };
    }
    
    if (forwardBtn) {
        forwardBtn.onclick = () => {
            if (audioElement.duration) {
                audioElement.currentTime = Math.min(audioElement.duration, audioElement.currentTime + 10);
            }
        };
    }

    stopBtn.onclick = () => {
        audioElement.pause();
        audioElement.currentTime = 0;
        hideFloatingAudioPlayer();
    };

    scrubber.oninput = () => {
        if (audioElement.duration) {
            audioElement.currentTime = (scrubber.value / 100) * audioElement.duration;
        }
    };
}


/**
 * Speak text aloud using high-fidelity Microsoft Edge Neural TTS (te-IN-ShrutiNeural)
 */
function speakText(text, lang, btn) {
    if (!text || !text.trim()) return;
    const currentLang = lang || (window.getLang ? window.getLang() : 'te');

    // Stop any existing audio
    if (globalAudioPlayer) {
        globalAudioPlayer.pause();
        globalAudioPlayer = null;
    }
    if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
    }

    const ttsUrl = `/api/tts?text=${encodeURIComponent(text.trim())}&lang=${encodeURIComponent(currentLang)}`;
    const audio = new Audio(ttsUrl);
    globalAudioPlayer = audio;

    audio.play().then(() => {
        setupFloatingAudioUI(audio, btn);
    }).catch(err => {
        console.warn('Direct audio stream failed, attempting Web Speech fallback:', err);
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = currentLang === 'en' ? 'en-IN' : 'te-IN';
            utterance.rate = 0.85;
            speechSynthesis.speak(utterance);
        }
    });
}

/**
 * Speak page aloud using Microsoft Edge Shruthi Neural voice
 */
function speakPageAloud(btn) {
    if (!window.currentSchemeName) {
        alert(window.t ? window.t('selectSchemeError') : 'దయచేసి ముందుగా పథకం ఎంచుకోండి.');
        return;
    }

    const currentLang = window.getLang ? window.getLang() : 'te';
    const isEn = currentLang === 'en';

    if (globalAudioPlayer) {
        globalAudioPlayer.pause();
        hideFloatingAudioPlayer();
    }
    if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
    }

    // If the button has a specific data-audio-src (native pre-recorded) and not in English
    if (btn && btn.dataset && btn.dataset.audioSrc && !isEn) {
        const audioSrc = btn.dataset.audioSrc;
        const audio = new Audio(audioSrc);
        globalAudioPlayer = audio;
        audio.play().then(() => {
            setupFloatingAudioUI(audio, btn);
        }).catch(err => {
            console.warn('Cached audio playback failed, generating on-the-fly:', err);
            generateAndPlayDetailSpeech(isEn, btn);
        });
        return;
    }

    // Otherwise, generate and play dynamic browser speech
    generateAndPlayDetailSpeech(isEn, btn);
}

function generateAndPlayDetailSpeech(isEn, btn) {
    const schemeTitle = document.querySelector('.result-head h2')?.textContent || window.currentSchemeName || '';
    const infoCards = Array.from(document.querySelectorAll('.info-card')).map(card => {
        const title = card.querySelector('h3')?.textContent || '';
        const text = card.querySelector('p')?.textContent || '';
        return `${title}. ${text}`;
    }).join('. ');

    const fullText = `${schemeTitle}. ${infoCards}`.slice(0, 1000);
    speakText(fullText, isEn ? 'en' : 'te', btn);
}

/**
 * Stop any ongoing audio playback
 */
function stopSpeech() {
    if (globalAudioPlayer) {
        globalAudioPlayer.pause();
        globalAudioPlayer = null;
    }
    if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
    }
}

// ==================== Eligibility Checker ====================

function buildEligibilityChecker(scheme) {
    const questions = scheme.eligibility_questions || [];
    if (!questions.length) return '';

    const isEn = window.getLang && window.getLang() === 'en';
    const quizTitle = window.t ? window.t('quizTitle') : (isEn ? '🎯 Eligibility Check' : '🎯 అర్హత పరీక్ష');
    const btnYesLabel = window.t ? window.t('btnYes') : (isEn ? 'Yes' : 'అవును');
    const btnNoLabel = window.t ? window.t('btnNo') : (isEn ? 'No' : 'కాదు');

    let html = `<div class="eligibility-checker"><strong>${quizTitle}</strong>`;
    questions.forEach((q, idx) => {
        // Namespaced keys with fallback compatibility for existing users
        const saved = localStorage.getItem(`eligibility_${window.currentSchemeName}_q${idx}`) ||
                      localStorage.getItem(`eligibility_q${idx}`) || '';
        const yesClass = saved === 'yes' ? 'yes' : '';
        const noClass = saved === 'no' ? 'no' : '';
        const qText = isEn ? (q.question_en || q.question_te || q.question || '') : (q.question_te || q.question_en || q.question || '');

        html += `
            <div class="question-item">
                <p>${window.escapeHtml(qText)}</p>
                <div class="yes-no-buttons">
                    <button class="yes-no-btn ${yesClass}" type="button" data-idx="${idx}" data-answer="yes">✓ ${btnYesLabel}</button>
                    <button class="yes-no-btn ${noClass}" type="button" data-idx="${idx}" data-answer="no">✗ ${btnNoLabel}</button>
                </div>
            </div>
        `;
    });
    html += '</div>';
    return html;
}

function recordEligibilityAnswer(questionIdx, answer, event) {
    const target = event ? event.target : null;
    if (!target) return;
    const parentDiv = target.closest('.question-item');
    if (!parentDiv) return;

    const buttons = parentDiv.querySelectorAll('.yes-no-btn');
    buttons.forEach(btn => btn.classList.remove('yes', 'no'));
    target.classList.add(answer);

    // Save to namespaced key
    if (window.currentSchemeName) {
        localStorage.setItem(`eligibility_${window.currentSchemeName}_q${questionIdx}`, answer);
    } else {
        localStorage.setItem(`eligibility_q${questionIdx}`, answer);
    }

    // Provide haptic feedback if available
    if (navigator.vibrate) {
        navigator.vibrate(50);
    }
}

// ==================== Document Checklist ====================

function buildDocumentChecklist(scheme) {
    const docs = scheme.required_documents || [];
    if (!docs.length) return '';

    const isEn = window.getLang && window.getLang() === 'en';
    const checklistTitle = window.t ? window.t('docChecklistTitle') : (isEn ? '📋 Document Checklist' : '📋 డాక్యుమెంట్ చెక్‌లిస్ట్');
    const optLabel = window.t ? ` ${window.t('docOptional')}` : (isEn ? ' (Optional)' : ' (ఐచ్ఛికం)');
    const mandLabel = window.t ? ` ${window.t('docMandatory')}` : (isEn ? ' (Mandatory)' : ' (తప్పనిసరి)');

    let html = `<div class="document-checklist"><strong>${checklistTitle}</strong>`;
    docs.forEach((doc, idx) => {
        const optional = doc.optional ? optLabel : mandLabel;
        const docName = isEn ? (doc.name || doc.name_te || '') : (doc.name_te || doc.name || '');
        const schemeName = window.currentSchemeName || '';
        const saved = localStorage.getItem(`doc_check_${schemeName}_${idx}`) === 'true';
        const checkedAttr = saved ? 'checked' : '';

        html += `
            <div class="checklist-item">
                <input type="checkbox" id="doc_${idx}" ${checkedAttr} class="doc-check-box" data-idx="${idx}" data-scheme="${window.escapeHtml(schemeName)}">
                <label for="doc_${idx}">${window.escapeHtml(docName)}${optional}</label>
            </div>
        `;
    });
    html += '</div>';
    return html;
}

function saveDocumentCheck(schemeName, docIdx) {
    const checkbox = document.querySelector(`.checklist-item input[type="checkbox"][data-idx="${docIdx}"]`);
    if (!checkbox) return;

    const key = `doc_check_${schemeName}_${docIdx}`;
    localStorage.setItem(key, checkbox.checked);

    // Provide haptic feedback
    if (navigator.vibrate) {
        navigator.vibrate([50, 30]);
    }
}

function printFullScheme(schemeName) {
    const isEn = window.getLang && window.getLang() === 'en';
    const sName = schemeName || window.currentSchemeName || (window.schemesCatalog ? Object.keys(window.schemesCatalog)[0] : '');
    const scheme = window.schemesCatalog?.[sName] || {};
    
    const printWindow = window.open('', '', 'width=850,height=1050');
    if (!printWindow) {
        alert(isEn ? 'Popup blocked. Please allow popups to print.' : 'పాప్‌అప్ బ్లాక్ చేయబడింది. దయచేసి పాప్‌అప్‌లను అనుమతించండి.');
        return;
    }

    const teName = scheme.telugu_name || sName;
    const enName = sName;
    const category = scheme.category || (isEn ? 'Public Health & Citizen Welfare' : 'ప్రజా ఆరోగ్యం మరియు సంక్షేమం');
    
    const desc = isEn ? (scheme.english_description || scheme.simplified?.benefits || scheme.simplified?.description || '') : (scheme.telugu_description || scheme.telugu?.benefits || scheme.telugu?.description || '');
    const elig = isEn ? (scheme.simplified?.eligibility || 'All resident families with valid ration card or annual income under prescribed limits.') : (scheme.telugu?.eligibility || 'ఆంధ్రప్రదేశ్ నివాసితులు, చెల్లుబాటు అయ్యే రేషన్ కార్డు లేదా నిర్దేశిత పరిమితిలోపు ఆదాయం గల కుటుంబాలు.');
    const benefits = isEn ? (scheme.simplified?.benefits || scheme.english_description || '') : (scheme.telugu?.benefits || scheme.telugu_description || '');
    
    let docs = [];
    if (scheme.required_documents && scheme.required_documents.length > 0) {
        docs = scheme.required_documents.map(d => ({
            name: isEn ? (d.name || d.name_te) : (d.name_te || d.name),
            mandatory: d.mandatory !== false
        }));
    } else if (scheme.telugu?.documents) {
        docs = scheme.telugu.documents.split(',').map(d => ({ name: d.trim(), mandatory: true }));
    } else {
        docs = [
            { name: isEn ? 'Aadhaar Card of Patient / Beneficiary' : 'రోగి / లబ్ధిదారుని ఆధార్ కార్డు', mandatory: true },
            { name: isEn ? 'White Rice Card / Aarogyasri Card' : 'తెల్ల రేషన్ కార్డు / బియ్యం కార్డు / ఆరోగ్యశ్రీ కార్డు', mandatory: true },
            { name: isEn ? 'Doctor Prescription & Medical Referral Slip' : 'డాక్టర్ ప్రిస్క్రిప్షన్ & రిఫరల్ పత్రం', mandatory: true },
            { name: isEn ? 'Bank Passbook Copy (for direct aid transfer)' : 'బ్యాంకు పాస్‌బుక్ జిరాక్స్ (నగదు సాయం కొరకు)', mandatory: false }
        ];
    }

    const steps = isEn ? (scheme.simplified?.steps || '1. Visit nearest Village/Ward Secretariat or Network Hospital. 2. Present documents at Aarogya Mithra Help Desk. 3. Electronic pre-authorization & cashless admission within 24 hours.') : (scheme.telugu?.steps || '1. సమీప గ్రామ/వార్డు సచివాలయం లేదా ఆరోగ్యశ్రీ నెట్‌వర్క్ ఆసుపత్రిని సందర్శించండి. 2. ఆరోగ్య మిత్ర హెల్ప్ డెస్క్ వద్ద ఆధార్ మరియు రేషన్ కార్డు సమర్పించండి. 3. ఉచితంగా ఈ-ప్రీఆథరైజేషన్ పొంది నగదు రహిత చికిత్స ప్రారంభించండి.');
    
    const contact = scheme.telugu?.contact_office || scheme.contact_office || (isEn ? 'Grama/Ward Secretariat, Empanelled Network Hospitals, Toll-free 104 / 1902' : 'గ్రామ/వార్డు సచివాలయం, నెట్‌వర్క్ ఆసుపత్రులు, టోల్ ఫ్రీ 104 / 1902');
    const website = scheme.official_website || 'https://ysraarogyasri.ap.gov.in';
    const printDate = new Date().toLocaleDateString(isEn ? 'en-IN' : 'te-IN', { year: 'numeric', month: 'long', day: 'numeric' });

    const docLang = isEn ? 'en' : 'te';
    const pageTitle = isEn ? `${enName} - Official Scheme Details & Checklist` : `${teName} - పథకం పూర్తి వివరాలు మరియు చెక్‌లిస్ట్`;

    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="${docLang}">
        <head>
            <meta charset="UTF-8">
            <title>${window.escapeHtml(pageTitle)}</title>
            <style>
                @page { size: A4 portrait; margin: 12mm 15mm; }
                body {
                    font-family: ${isEn ? 'Arial, Helvetica, sans-serif' : '"Noto Sans Telugu", Arial, sans-serif'};
                    color: #111827;
                    background: #ffffff;
                    margin: 0;
                    padding: 16px;
                    line-height: 1.5;
                    font-size: 11pt;
                }
                .sheet-container {
                    max-width: 800px;
                    margin: 0 auto;
                    border: 2px solid #0d5c4d;
                    border-radius: 8px;
                    padding: 24px;
                }
                .gov-header {
                    text-align: center;
                    border-bottom: 2px solid #0d5c4d;
                    padding-bottom: 12px;
                    margin-bottom: 16px;
                }
                .gov-subtitle {
                    font-size: 9.5pt;
                    font-weight: bold;
                    letter-spacing: 0.05em;
                    color: #0d5c4d;
                    text-transform: uppercase;
                    margin-bottom: 3px;
                }
                .gov-title {
                    font-size: 15pt;
                    font-weight: 800;
                    color: #064e3b;
                    margin: 0;
                }
                .scheme-hero {
                    background: #f0fdf4;
                    border: 1px solid #86efac;
                    border-radius: 6px;
                    padding: 12px 16px;
                    margin-bottom: 16px;
                }
                .scheme-name {
                    font-size: 14pt;
                    font-weight: 800;
                    color: #14532d;
                    margin: 0 0 2px 0;
                }
                .scheme-en-sub {
                    font-size: 10.5pt;
                    color: #4b5563;
                    font-weight: 600;
                }
                .badge {
                    display: inline-block;
                    background: #0d5c4d;
                    color: #ffffff;
                    font-size: 8.5pt;
                    font-weight: 700;
                    padding: 2px 8px;
                    border-radius: 4px;
                    margin-top: 6px;
                }
                .sec-card {
                    margin-bottom: 14px;
                    page-break-inside: avoid;
                }
                .sec-card h3 {
                    font-size: 11.5pt;
                    font-weight: 750;
                    color: #0d5c4d;
                    margin: 0 0 4px 0;
                    border-bottom: 1px solid #e5e7eb;
                    padding-bottom: 3px;
                }
                .sec-card p {
                    margin: 0;
                    font-size: 10.5pt;
                    color: #374151;
                }
                .checklist-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 6px;
                    margin-top: 6px;
                }
                .check-box-item {
                    display: flex;
                    align-items: flex-start;
                    gap: 10px;
                    font-size: 10.5pt;
                    color: #1f2937;
                    background: #f9fafb;
                    border: 1px solid #e5e7eb;
                    border-radius: 4px;
                    padding: 6px 10px;
                }
                .check-square {
                    width: 15px;
                    height: 15px;
                    border: 2px solid #0d5c4d;
                    border-radius: 3px;
                    flex-shrink: 0;
                    margin-top: 2px;
                }
                .footer-meta {
                    text-align: center;
                    border-top: 1px dashed #9ca3af;
                    margin-top: 18px;
                    padding-top: 10px;
                    font-size: 8.5pt;
                    color: #6b7280;
                }
                @media print {
                    body { padding: 0; }
                    .sheet-container { border: 1.5px solid #0d5c4d; padding: 16px 20px; }
                }
            </style>
        </head>
        <body>
            <div class="sheet-container">
                <div class="gov-header">
                    <div class="gov-subtitle">Government of Andhra Pradesh • ఆంధ్రప్రదేశ్ ప్రభుత్వం</div>
                    <div class="gov-title">వైద్య, ఆరోగ్య మరియు కుటుంబ సంక్షేమ శాఖ (Health & Family Welfare)</div>
                </div>

                <div class="scheme-hero">
                    <div class="scheme-name">${window.escapeHtml(teName)}</div>
                    ${enName !== teName ? `<div class="scheme-en-sub">${window.escapeHtml(enName)}</div>` : ''}
                    <span class="badge">📂 ${window.escapeHtml(category)}</span>
                </div>

                <div class="sec-card">
                    <h3>🏛️ ${isEn ? 'Scheme Overview' : 'పథకం వివరణ & లక్ష్యం'}</h3>
                    <p>${window.escapeHtml(desc)}</p>
                </div>

                <div class="sec-card">
                    <h3>👤 ${isEn ? 'Eligibility Criteria' : 'అర్హత ప్రమాణాలు (Who is Eligible)'}</h3>
                    <p>${window.escapeHtml(elig)}</p>
                </div>

                <div class="sec-card">
                    <h3>🎁 ${isEn ? 'Key Entitlements & Benefits' : 'లబ్ధి మరియు ఉచిత చికిత్సలు (Benefits & Coverage)'}</h3>
                    <p>${window.escapeHtml(benefits)}</p>
                </div>

                <div class="sec-card">
                    <h3>📋 ${isEn ? 'Required Documents Checklist' : 'అవసరమైన పత్రాల చెక్‌లిస్ట్ (Required Documents)'}</h3>
                    <div class="checklist-grid">
                        ${docs.map(d => `
                            <div class="check-box-item">
                                <div class="check-square"></div>
                                <div><strong>${window.escapeHtml(d.name)}</strong> ${d.mandatory ? (isEn ? '(Mandatory)' : '(తప్పనిసరి)') : ''}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="sec-card">
                    <h3>📝 ${isEn ? 'How to Apply' : 'దరఖాస్తు & పొందే విధానం (How to Apply)'}</h3>
                    <p>${window.escapeHtml(steps)}</p>
                </div>

                <div class="sec-card">
                    <h3>📞 ${isEn ? 'Help Desks & Official Offices' : 'సహాయ కేంద్రాలు & సంప్రదించాల్సిన కార్యాలయాలు'}</h3>
                    <p><strong>${isEn ? 'Contact Office:' : 'కార్యాలయం:'}</strong> ${window.escapeHtml(contact)}</p>
                    <p style="margin-top:4px;"><strong>${isEn ? 'Helplines:' : 'టోల్ ఫ్రీ హెల్ప్‌లైన్:'}</strong> 104 (వైద్య సలహా), 108 (అత్యవసర అంబులెన్స్), 1902 (ప్రజా సమస్యల పరిష్కారం)</p>
                    <p style="margin-top:4px;"><strong>${isEn ? 'Official Portal:' : 'అధికారిక వెబ్‌సైట్:'}</strong> ${window.escapeHtml(website)}</p>
                </div>

                <div class="footer-meta">
                    SmartGovAI Health Platform • Andhra Pradesh Citizen Assistance • Printed on: ${printDate}
                </div>
            </div>
        </body>
        </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
        printWindow.print();
    }, 350);
}

function printDocumentChecklist(schemeName) {
    printFullScheme(schemeName);
}

function printSchemeQRCard(schemeName, slug, schemeData) {
    const isEn = window.getLang && window.getLang() === 'en';
    if (!slug) {
        alert(isEn ? 'QR code not available.' : 'QR కోడ్ అందుబాటులో లేదు.');
        return;
    }

    const printWindow = window.open('', '', 'width=700,height=900');
    if (!printWindow) {
        alert(isEn ? 'Popup blocked. Please allow popups to print.' : 'పాప్‌అప్ బ్లాక్ చేయబడింది. దయచేసి పాప్‌అప్‌లను అనుమతించండి.');
        return;
    }

    const qrUrl = `/qr/${slug}.png`;
    const docLang = isEn ? 'en' : 'te';
    const pageTitle = isEn ? `${window.escapeHtml(schemeName)} - Scheme Flyer` : `${window.escapeHtml(schemeName)} - QR కార్డు`;
    const headerTitle = isEn ? 'SMARTGOV HEALTH / GOVERNMENT SCHEME' : 'SMARTGOVAI ఆరోగ్య / ప్రభుత్వ పథకం';
    const primaryHeading = isEn ? schemeName : (schemeData?.telugu_name || schemeName);
    const secondaryHeading = isEn ? (schemeData?.category || '') : schemeName;

    const eligTitle = isEn ? '👤 Who is Eligible?' : '👤 ఎవరికి? (Eligibility)';
    const eligText = isEn ? (schemeData?.simplified?.eligibility || '') : (schemeData?.telugu?.eligibility || '');

    const benTitle = isEn ? '🎁 Key Benefits' : '🎁 ఏం లభిస్తుంది? (Benefits)';
    const benText = isEn ? (schemeData?.simplified?.benefits || '') : (schemeData?.telugu?.benefits || '');

    const docTitle = isEn ? '📋 Required Documents' : '📋 ఏ పత్రాలు? (Documents)';
    const docText = isEn ? (schemeData?.simplified?.documents || '') : (schemeData?.telugu?.documents || '');

    const stepTitle = isEn ? '📝 How to Apply' : '📝 ఎలా దరఖాస్తు చేసుకోవాలి? (Steps)';
    const stepText = isEn ? (schemeData?.simplified?.steps || '') : (schemeData?.telugu?.steps || '');

    const qrInstruction = isEn ? 'Scan this QR code to view<br>complete scheme details' : 'ఈ QR కోడ్ను స్కాన్ చేసి<br>పథకం పూర్తి వివరాలను చూడండి';
    const footerDate = new Date().toLocaleDateString(isEn ? 'en-IN' : 'te-IN');

    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="${docLang}">
        <head>
            <meta charset="UTF-8">
            <title>${pageTitle}</title>
            <style>
                @media print {
                    body { font-family: ${isEn ? 'Arial, sans-serif' : '"Noto Sans Telugu", Arial, sans-serif'}; margin: 0; padding: 20px; }
                    .card-container {
                        border: 2px solid #176b5b;
                        border-radius: 12px;
                        padding: 30px;
                        max-width: 600px;
                        margin: 0 auto;
                        page-break-inside: avoid;
                    }
                    .header { text-align: center; border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 20px; }
                    .header h1 { color: #176b5b; margin: 0; font-size: 24px; }
                    .header h2 { color: #555; margin: 10px 0 0 0; font-size: 16px; font-weight: normal; }
                    .section { margin-bottom: 15px; }
                    .section h3 { color: #0d4b40; margin: 0 0 5px 0; font-size: 18px; display: flex; align-items: center; gap: 8px; }
                    .section p { margin: 0; color: #333; line-height: 1.5; font-size: 14px; }
                    .qr-section { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px dashed #eee; }
                    .qr-section img { width: 180px; height: 180px; border: 4px solid #fff; outline: 1px solid #ccc; }
                    .qr-section p { margin-top: 10px; font-weight: bold; color: #176b5b; font-size: 16px; }
                    .footer { text-align: center; margin-top: 20px; color: #777; font-size: 12px; }
                    button, .no-print { display: none !important; }
                }
                body { font-family: ${isEn ? 'Arial, sans-serif' : '"Noto Sans Telugu", Arial, sans-serif'}; background: #f9f9f9; padding: 20px; }
                .card-container { background: #fff; border: 2px solid #176b5b; border-radius: 12px; padding: 30px; max-width: 600px; margin: 0 auto; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
                .header { text-align: center; border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 20px; }
                .header h1 { color: #176b5b; margin: 0; font-size: 24px; }
                .header h2 { color: #555; margin: 10px 0 0 0; font-size: 16px; font-weight: normal; }
                .section { margin-bottom: 15px; }
                .section h3 { color: #0d4b40; margin: 0 0 5px 0; font-size: 18px; }
                .section p { margin: 0; color: #333; line-height: 1.5; font-size: 14px; }
                .qr-section { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px dashed #eee; }
                .qr-section img { width: 180px; height: 180px; border: 4px solid #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
                .qr-section p { margin-top: 10px; font-weight: bold; color: #176b5b; font-size: 16px; }
                .footer { text-align: center; margin-top: 20px; color: #777; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="card-container">
                <div class="header">
                    <h2>${headerTitle}</h2>
                    <h1>${window.escapeHtml(primaryHeading)}</h1>
                    ${secondaryHeading ? `<h2>${window.escapeHtml(secondaryHeading)}</h2>` : ''}
                </div>

                <div class="section">
                    <h3>${eligTitle}</h3>
                    <p>${window.escapeHtml(eligText)}</p>
                </div>

                <div class="section">
                    <h3>${benTitle}</h3>
                    <p>${window.escapeHtml(benText)}</p>
                </div>

                <div class="section">
                    <h3>${docTitle}</h3>
                    <p>${window.escapeHtml(docText)}</p>
                </div>

                <div class="section">
                    <h3>${stepTitle}</h3>
                    <p>${window.escapeHtml(stepText)}</p>
                </div>

                <div class="qr-section">
                    <img src="${qrUrl}" alt="Scheme QR Code">
                    <p>${qrInstruction}</p>
                </div>

                <div class="footer">
                    SmartGovAI - ${footerDate}
                </div>
            </div>
        </body>
        </html>
    `);
    printWindow.document.close();

    // Delay print to ensure content loads
    setTimeout(() => {
        printWindow.print();
    }, 500);
}

// ==================== Rich Scheme Information ====================

function buildRichSchemeDetails(scheme) {
    if (!scheme) return '';
    const isEn = window.getLang && window.getLang() === 'en';

    const coverageType = isEn ? (scheme.coverage_type || scheme.coverage_type_te) : (scheme.coverage_type_te || scheme.coverage_type);
    const benefitAmount = isEn ? (scheme.benefit_amount || scheme.benefit_amount_te) : (scheme.benefit_amount_te || scheme.benefit_amount);
    const targetBeneficiary = isEn ? (scheme.target_beneficiary || scheme.target_beneficiary_te) : (scheme.target_beneficiary_te || scheme.target_beneficiary);
    const facilityType = isEn ? (scheme.facility_type || scheme.facility_type_te) : (scheme.facility_type_te || scheme.facility_type);
    const applicationMode = isEn ? (scheme.application_mode || scheme.application_mode_te) : (scheme.application_mode_te || scheme.application_mode);
    const processingTime = isEn ? (scheme.processing_time || scheme.processing_time_te) : (scheme.processing_time_te || scheme.processing_time);
    const validityPeriod = isEn ? (scheme.validity_period || scheme.validity_period_te) : (scheme.validity_period_te || scheme.validity_period);

    const keyTreatments = isEn ? (scheme.key_treatments || scheme.key_treatments_te) : (scheme.key_treatments_te || scheme.key_treatments);
    const helplineNumbers = scheme.helpline_numbers || [];
    const exclusions = isEn ? (scheme.exclusions || scheme.exclusions_te) : (scheme.exclusions_te || scheme.exclusions);

    const hasParams = coverageType || benefitAmount || targetBeneficiary || facilityType || applicationMode || processingTime || validityPeriod;
    const hasTreatments = Array.isArray(keyTreatments) && keyTreatments.length > 0;
    const hasHelplines = Array.isArray(helplineNumbers) && helplineNumbers.length > 0;
    const hasExclusions = Array.isArray(exclusions) && exclusions.length > 0;

    if (!hasParams && !hasTreatments && !hasHelplines && !hasExclusions) {
        return '';
    }

    const t = window.t || (k => k);
    let html = '<div class="rich-scheme-details-container">';

    // 1. Key Scheme Parameters Grid
    if (hasParams) {
        html += `
            <div class="rich-params-section">
                <h3 class="rich-section-title">⚡ ${window.escapeHtml(t('keyParametersTitle'))}</h3>
                <div class="rich-params-grid">
                    ${benefitAmount ? `
                        <div class="rich-param-card highlight-card">
                            <div class="rich-param-icon">💰</div>
                            <div class="rich-param-content">
                                <span class="rich-param-label">${window.escapeHtml(t('benefitAmountLabel'))}</span>
                                <strong class="rich-param-value highlight-val">${window.escapeHtml(benefitAmount)}</strong>
                            </div>
                        </div>
                    ` : ''}
                    ${coverageType ? `
                        <div class="rich-param-card">
                            <div class="rich-param-icon">🛡️</div>
                            <div class="rich-param-content">
                                <span class="rich-param-label">${window.escapeHtml(t('coverageTypeLabel'))}</span>
                                <strong class="rich-param-value">${window.escapeHtml(coverageType)}</strong>
                            </div>
                        </div>
                    ` : ''}
                    ${targetBeneficiary ? `
                        <div class="rich-param-card">
                            <div class="rich-param-icon">👥</div>
                            <div class="rich-param-content">
                                <span class="rich-param-label">${window.escapeHtml(t('targetBeneficiaryLabel'))}</span>
                                <strong class="rich-param-value">${window.escapeHtml(targetBeneficiary)}</strong>
                            </div>
                        </div>
                    ` : ''}
                    ${facilityType ? `
                        <div class="rich-param-card">
                            <div class="rich-param-icon">🏥</div>
                            <div class="rich-param-content">
                                <span class="rich-param-label">${window.escapeHtml(t('facilityTypeLabel'))}</span>
                                <strong class="rich-param-value">${window.escapeHtml(facilityType)}</strong>
                            </div>
                        </div>
                    ` : ''}
                    ${applicationMode ? `
                        <div class="rich-param-card">
                            <div class="rich-param-icon">📝</div>
                            <div class="rich-param-content">
                                <span class="rich-param-label">${window.escapeHtml(t('applicationModeLabel'))}</span>
                                <strong class="rich-param-value">${window.escapeHtml(applicationMode)}</strong>
                            </div>
                        </div>
                    ` : ''}
                    ${processingTime ? `
                        <div class="rich-param-card">
                            <div class="rich-param-icon">⏱️</div>
                            <div class="rich-param-content">
                                <span class="rich-param-label">${window.escapeHtml(t('processingTimeLabel'))}</span>
                                <strong class="rich-param-value">${window.escapeHtml(processingTime)}</strong>
                            </div>
                        </div>
                    ` : ''}
                    ${validityPeriod ? `
                        <div class="rich-param-card">
                            <div class="rich-param-icon">⏳</div>
                            <div class="rich-param-content">
                                <span class="rich-param-label">${window.escapeHtml(t('validityPeriodLabel'))}</span>
                                <strong class="rich-param-value">${window.escapeHtml(validityPeriod)}</strong>
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    // 2. Key Covered Treatments & Procedures
    if (hasTreatments) {
        html += `
            <div class="rich-treatments-section">
                <h3 class="rich-section-title">🩺 ${window.escapeHtml(t('keyTreatmentsTitle'))}</h3>
                <div class="rich-treatments-grid">
                    ${keyTreatments.map(treatment => `
                        <div class="treatment-pill">
                            <span class="treatment-check">✓</span>
                            <span class="treatment-text">${window.escapeHtml(treatment)}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // 3. Official Helpline Contacts
    if (hasHelplines) {
        html += `
            <div class="rich-helplines-section">
                <h3 class="rich-section-title">📞 ${window.escapeHtml(t('helplineNumbersTitle'))}</h3>
                <div class="rich-helplines-grid">
                    ${helplineNumbers.map(num => `
                        <a href="tel:${window.escapeHtml(num.replace(/[^0-9+]/g, ''))}" class="helpline-badge-btn" title="${window.escapeHtml(t('directDial'))}: ${window.escapeHtml(num)}">
                            <span class="helpline-icon">📞</span>
                            <span class="helpline-number">${window.escapeHtml(num)}</span>
                            <span class="helpline-action">${window.escapeHtml(t('directDial'))}</span>
                        </a>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // 4. Exclusions / Coverage Boundaries
    if (hasExclusions) {
        html += `
            <div class="rich-exclusions-section">
                <h3 class="rich-section-title-excl">🚫 ${window.escapeHtml(t('exclusionsTitle'))}</h3>
                <ul class="rich-exclusions-list">
                    ${exclusions.map(item => `
                        <li>
                            <span class="excl-cross">✕</span>
                            <span>${window.escapeHtml(item)}</span>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    }

    html += '</div>';
    return html;
}

// ==================== Trust & Transparency ====================

function buildTrustInfo(scheme) {
    const isEn = window.getLang && window.getLang() === 'en';
    const lastUpdated = scheme.last_updated || (isEn ? 'Not specified' : 'తెలియదు');
    const confirmationSource = scheme.eligibility_confirmation || (isEn ? 'Government office / Empanelled hospital' : 'ప్రభుత్వ కార్యాలయం / ఆసుపత్రి');
    const officialWebsite = scheme.official_website || '#';

    const title = isEn ? '🔒 Trust & Transparency' : '🔒 విశ్వాస సమాచారం';
    const updatedLabel = isEn ? '📅 Last Updated:' : '📅 చివరిగా నవీకరించిన:';
    const verifyLabel = isEn ? '✔️ Verifying Authority:' : '✔️ సరిచేస్తారు:';
    const siteLabel = isEn ? '🌐 Official Portal:' : '🌐 అధికారిక సంచిక:';
    const visitText = isEn ? 'Visit Website' : 'సందర్శించండి';

    return `
        <div class="trust-info">
            <strong>${title}</strong><br>
            ${updatedLabel} ${window.escapeHtml(lastUpdated)}<br>
            ${verifyLabel} ${window.escapeHtml(confirmationSource)}<br>
            ${siteLabel} <a class="source-link" href="${window.escapeHtml(officialWebsite)}" target="_blank" rel="noopener noreferrer">${visitText}</a>
        </div>
    `;
}

function buildPrivacyWarning() {
    const isEn = window.getLang && window.getLang() === 'en';
    if (isEn) {
        return `
            <div class="privacy-warning">
                ⚠️ <strong>Privacy Notice:</strong><br>
                Do not upload Aadhaar numbers, private prescriptions, or personal medical records to this application.
            </div>
        `;
    }
    return `
        <div class="privacy-warning">
            ⚠️ <strong>గోప్యతా హెచ్చరిక:</strong><br>
            ఆధార్, ప్రెస్క్రిప్షన్లు లేదా వ్యక్తిగత ఆరోగ్య ఫైలులను ఈ యాప్‌కు అప్‌లోడ్ చేయవద్దు.
        </div>
    `;
}

// ==================== Sharing Features ====================

/**
 * Generate a canonical plain-text share message for a scheme
 */
function generateShareText(schemeName) {
    const scheme = window.schemesCatalog?.[schemeName] || {};
    const teName = scheme.telugu_name || schemeName;
    const enName = schemeName;
    
    const teBenefits = scheme.telugu?.benefits || scheme.telugu_description || scheme.simplified?.benefits || '';
    const enBenefits = scheme.simplified?.benefits || scheme.english_description || '';
    
    const teElig = scheme.telugu?.eligibility || scheme.simplified?.eligibility || 'సమీప PHC లేదా గ్రామ సచివాలయంలో సంప్రదించండి.';
    const enElig = scheme.simplified?.eligibility || 'Check with nearby PHC or Grama/Ward Secretariat.';

    const benAmount = scheme.benefit_amount_te || scheme.benefit_amount || '';
    const coverage = scheme.coverage_type_te || scheme.coverage_type || '';
    const helplines = (scheme.helpline_numbers || []).join(', ');
    
    let docs = [];
    if (scheme.required_documents && scheme.required_documents.length > 0) {
        docs = scheme.required_documents.map(d => (d.name_te ? `${d.name_te} (${d.name || ''})` : d.name));
    } else if (scheme.telugu?.documents) {
        docs = [scheme.telugu.documents];
    } else {
        docs = ['ఆధార్ కార్డు (Aadhaar Card)', 'రేషన్ కార్డు / బియ్యం కార్డు (Ration Card)', 'వైద్య నివేదికలు (Medical Reports)'];
    }
    const docsText = docs.join(', ');

    const contact = scheme.telugu?.contact_office || scheme.contact_office || 'గ్రామ/వార్డు సచివాలయం, ప్రభుత్వ ఆసుపత్రి, లేదా 104 కాల్ సెంటర్';
    const website = scheme.official_website || 'https://smartgov.ai';

    let text = `🏥 *${teName}*\n(${enName})\n\n`;
    if (benAmount) {
        text += `💰 *ఆర్థిక పరిమితి / Benefit Amount:*\n• ${benAmount}\n\n`;
    }
    if (coverage) {
        text += `🛡️ *కవరేజ్ రకం / Coverage Nature:*\n• ${coverage}\n\n`;
    }
    text += `📋 *లబ్ధి / Benefits:*\n`;
    if (teBenefits) text += `• ${teBenefits}\n`;
    if (enBenefits && enBenefits !== teBenefits) text += `• ${enBenefits}\n`;
    text += `\n`;
    text += `👤 *అర్హత / Eligibility:*\n• ${teElig}\n\n`;
    text += `📄 *అవసరమైన పత్రాలు / Documents:*\n• ${docsText}\n\n`;
    if (helplines) {
        text += `📞 *హెల్ప్‌లైన్ / Helplines:* ${helplines}\n\n`;
    }
    text += `📍 *సంప్రదించండి / Contact:*\n• ${contact}\n\n`;
    text += `🌐 *మరిన్ని వివరాలు / More Details:*\n${website}`;

    return text;
}

/**
 * Share on WhatsApp with CSRF header protection
 */
async function shareOnWhatsApp(schemeName) {
    const isEn = window.getLang && window.getLang() === 'en';
    if (!navigator.onLine && !window.offlineMode) {
        alert(isEn ? 'No network connection. Internet is required for WhatsApp sharing.' : 'నెట్‌వర్క్ కనెక్షన్ లేదు. WhatsApp షేర్ కొరకు ఇంటర్నెట్ అవసరం.');
        return;
    }

    try {
        const text = generateShareText(schemeName);
        const encodedMessage = encodeURIComponent(text);

        // Log asynchronously without blocking
        fetch('/whatsapp-share', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getCsrfHeader()
            },
            body: JSON.stringify({ scheme_name: schemeName })
        }).catch(() => {});

        window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
    } catch (error) {
        console.error('WhatsApp share error:', error);
        alert(isEn ? `Error: ${error.message}` : `లోపం: ${error.message}`);
    }
}

/**
 * Share on SMS using sms: protocol
 */
async function shareOnSMS(schemeName) {
    const isEn = window.getLang && window.getLang() === 'en';
    try {
        const text = generateShareText(schemeName);
        const encodedMessage = encodeURIComponent(text);
        window.location.href = `sms:?body=${encodedMessage}`;
    } catch (error) {
        console.error('SMS share error:', error);
        alert(isEn ? `Error: ${error.message}` : `లోపం: ${error.message}`);
    }
}

/**
 * Report an issue with the scheme information
 */
async function reportIssue(schemeName) {
    if (!schemeName && typeof window.currentSchemeName === 'undefined') {
        alert(window.t ? window.t('selectSchemeError') : 'దయచేసి పథకం ఎంచుకోండి.');
        return;
    }
    openFeedbackModal(document.activeElement);
}

/**
 * Open detailed report form
 */
function openReportForm() {
    openFeedbackModal(document.activeElement);
}

let previousFocusChat = null;
/**
 * Send report to server with CSRF header protection
 */
// ==================== Enhanced Feedback (Tier 2C) ====================


function openChat(trigger) {
    const dialog = document.getElementById('chatModal');
    if (dialog && typeof dialog.showModal === 'function') {
        if (!dialog.open) dialog.showModal();
    }
    const overlay = document.getElementById('chatOverlay');
    if (overlay) {
        overlay.classList.remove('hidden');
        overlay.setAttribute('aria-hidden', 'false');
    }
    if (window.updateChatUi) window.updateChatUi();
};

function closeChat() {
    const dialog = document.getElementById('chatModal');
    if (dialog && typeof dialog.close === 'function') {
        dialog.close();
    }
    const overlay = document.getElementById('chatOverlay');
    if (overlay) {
        overlay.classList.add('hidden');
        overlay.setAttribute('aria-hidden', 'true');
    }
};

let currentRating = 0;
let previousFocusFeedback = null;

function openFeedbackModal(triggerBtn) {
    if (!window.currentRequestId && typeof window.currentSchemeName === 'undefined') {
        const statusEl = document.getElementById('feedbackStatus');
        if (statusEl) {
            statusEl.textContent = 'దయచేసి ముందుగా పథకం ఎంచుకోండి.';
            statusEl.className = 'feedback-status error';
        }
    }
    previousFocusFeedback = triggerBtn || document.activeElement;
    const modal = document.getElementById('feedbackOverlay');
    if (!modal) return;

    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');

    // Reset state
    currentRating = 0;
    document.querySelectorAll('.star-rating button').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
    });
    document.querySelectorAll('.feedback-chips .chip').forEach(c => {
        c.classList.remove('selected');
        c.setAttribute('aria-pressed', 'false');
    });
    const commentBox = document.getElementById('feedbackComment');
    if (commentBox) commentBox.value = '';

    const status = document.getElementById('feedbackStatus');
    if (status) {
        status.textContent = '';
        status.className = 'feedback-status';
    }

    const title = document.getElementById('feedbackTitle');
    if (title) title.focus();
}

function closeFeedbackModal() {
    const modal = document.getElementById('feedbackOverlay');
    if (modal) {
        modal.classList.add('hidden');
        modal.setAttribute('aria-hidden', 'true');
    }
    if (previousFocusFeedback) {
        previousFocusFeedback.focus();
    }
}

function setRating(val) {
    currentRating = parseInt(val, 10);
    document.querySelectorAll('.star-rating button').forEach(b => {
        const bVal = parseInt(b.dataset.value, 10);
        const isActive = bVal <= currentRating;
        b.classList.toggle('active', isActive);
        b.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
}

function setFeedbackChip(btn) {
    const isSelected = btn.classList.toggle('selected');
    btn.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
}

async function submitFeedback() {
    const statusEl = document.getElementById('feedbackStatus');
    if (!statusEl) return;

    if (!window.currentRequestId && typeof window.currentSchemeName === 'undefined') {
        statusEl.textContent = 'దయచేసి ముందుగా పథకం ఎంచుకోండి.';
        statusEl.className = 'feedback-status error';
        return;
    }
    if (currentRating === 0) {
        statusEl.textContent = 'దయచేసి రేటింగ్ ఎంచుకోండి (Please select a rating).';
        statusEl.className = 'feedback-status error';
        return;
    }

    statusEl.textContent = 'పంపుతున్నాం (Submitting)...';
    statusEl.className = 'feedback-status';

    const selectedChips = Array.from(document.querySelectorAll('.feedback-chips .chip.selected')).map(c => c.dataset.value);
    const commentBox = document.getElementById('feedbackComment');
    const comment = commentBox ? commentBox.value.trim() : '';

    const combinedComment = [...selectedChips, comment].filter(Boolean).join(' | ');

    try {
        const payload = window.currentRequestId ? {
            request_id: window.currentRequestId,
            rating: currentRating,
            was_clear: combinedComment.includes('సమాచారం') ? 'yes' : 'N/A',
            got_benefit: 'unknown',
            village: 'Unknown',
            problem: combinedComment
        } : {
            scheme_name: window.currentSchemeName || 'Unknown',
            feedback_type: 'user_reported_issue',
            village: 'Self-reported',
            feedback_text: `Rating: ${currentRating}. Comments: ${combinedComment}`
        };

        const endpoint = window.currentRequestId ? '/enhanced-feedback' : '/staff-report';

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(typeof getCsrfHeader === 'function' ? getCsrfHeader() : {})
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
            statusEl.textContent = window.t ? window.t('feedbackSuccess') : '✅ ధన్యవాదాలు! మీ అభిప్రాయం నమోదు చేయబడింది.';
            statusEl.className = 'feedback-status success';
            setTimeout(closeFeedbackModal, 2000);
        } else {
            throw new Error(data.error || 'Server error');
        }
    } catch (error) {
        statusEl.textContent = window.t ? window.t('feedbackError') : '❌ అభిప్రాయం పంపలేకపోయాము. దయచేసి మళ్లీ ప్రయత్నించండి.';
        statusEl.className = 'feedback-status error';
        console.error('Feedback submission error:', error);
    }
}

// ==================== Offline Support ====================

/**
 * Cache all essential data for offline access
 */
async function cacheForOffline() {
    try {
        const response = await fetch('/offline-cache');
        const data = await response.json();
        localStorage.setItem('smartgov_offline_data', JSON.stringify(data));
        localStorage.setItem('smartgov_offline_timestamp', new Date().toISOString());
        console.log('✅ ऑफलाइन संचयन अद्यतन: ' + data.schemes + ' పథక');
    } catch (error) {
        console.warn('Offline caching failed:', error);
    }
}

/**
 * Load offline data when no internet connection
 */
function loadOfflineData() {
    const offlineData = localStorage.getItem('smartgov_offline_data');
    if (offlineData) {
        console.log('📱 ఆఫ్‌లైన్ సమాచారం ఉపయోగం చేస్తున్నాం');
        window.offlineMode = true;
        return JSON.parse(offlineData);
    }
    return null;
}

// ==================== Initialization ====================

document.addEventListener('DOMContentLoaded', () => {
    // Auto-open scheme if provided by backend routing
    const autoOpenScheme = document.body.dataset.autoOpen;
    if (autoOpenScheme && window.fetchScheme) {
        setTimeout(() => window.fetchScheme(autoOpenScheme), 50);
    }

    // Cache data for offline access
    cacheForOffline();

    // Check if offline
    if (!navigator.onLine) {
        loadOfflineData();
        console.log('📡 ఆఫ్‌లైన్ మోడ్ చేతనం');
    }

    // Listen for connection changes
    window.addEventListener('offline', () => {
        console.log('📡 ఇంటర్నెట్ కనెక్షన్ కోల్పోయారు');
        const indicator = document.getElementById('offlineIndicator');
        if (indicator) {
            indicator.style.display = 'block';
        }
    });

    window.addEventListener('online', () => {
        console.log('📡 ఇంటర్నెట్ కనెక్షన్ పునరుద్ధరించారు');
        const indicator = document.getElementById('offlineIndicator');
        if (indicator) {
            indicator.style.display = 'none';
        }
        // Re-cache when online
        cacheForOffline();
    });

    // Event delegation on resultArea to handle click events of dynamic elements securely
    const resultArea = document.getElementById('resultArea');
    if (resultArea) {
        resultArea.addEventListener('click', event => {
            const target = event.target;

            // Speak custom text (slowly)
            const speakTextBtn = target.closest('.speak-text-btn');
            if (speakTextBtn) {
                const text = speakTextBtn.dataset.text;
                speakText(text, undefined, speakTextBtn);
                return;
            }

            // Speak page aloud
            const speakPageBtn = target.closest('.speak-page-btn');
            if (speakPageBtn) {
                speakPageAloud(speakPageBtn);
                return;
            }

            // Share on WhatsApp
            const shareWhatsappBtn = target.closest('.share-whatsapp-btn');
            if (shareWhatsappBtn) {
                const schemeName = shareWhatsappBtn.dataset.scheme;
                shareOnWhatsApp(schemeName);
                return;
            }

            // Share on SMS
            const shareSmsBtn = target.closest('.share-sms-btn');
            if (shareSmsBtn) {
                const schemeName = shareSmsBtn.dataset.scheme;
                shareOnSMS(schemeName);
                return;
            }

            // Print Document Checklist
            const printChecklistBtn = target.closest('.print-checklist-btn');
            if (printChecklistBtn) {
                const schemeName = printChecklistBtn.dataset.scheme;
                printDocumentChecklist(schemeName);
                return;
            }

            // Print QR Card
            const printQrBtn = target.closest('[data-action="print-qr-card"]');
            if (printQrBtn) {
                const schemeName = printQrBtn.dataset.scheme;
                const slug = printQrBtn.dataset.slug;
                const schemeData = window.schemesCatalog ? window.schemesCatalog[schemeName] : null;
                printSchemeQRCard(schemeName, slug, schemeData || {});
                return;
            }

            // Report Issue (scheme details)
            const reportIssueBtn = target.closest('.report-issue-btn');
            if (reportIssueBtn) {
                const schemeName = reportIssueBtn.dataset.scheme;
                openFeedbackModal(reportIssueBtn);
                return;
            }

            // Open Detailed Feedback Form
            const openFeedbackBtn = target.closest('.open-feedback-btn');
            if (openFeedbackBtn) {
                openFeedbackModal(openFeedbackBtn);
                return;
            }

            // Yes/No Eligibility Buttons
            const yesNoBtn = target.closest('.yes-no-btn');
            if (yesNoBtn) {
                const idx = parseInt(yesNoBtn.dataset.idx, 10);
                const answer = yesNoBtn.dataset.answer;
                recordEligibilityAnswer(idx, answer, event);
                return;
            }
        });

        // Event delegation on resultArea for input change events (checkboxes)
        resultArea.addEventListener('change', event => {
            const target = event.target;
            // Document Checklist Checkboxes
            if (target.matches('.checklist-item input[type="checkbox"]')) {
                const idx = parseInt(target.dataset.idx, 10);
                const schemeName = target.dataset.scheme;
                saveDocumentCheck(schemeName, idx);
            }
        });
    }
});

// ==================== Export for global use ====================
window.SmartGovEnhanced = {
    buildRichSchemeDetails,
    buildRichDetails: buildRichSchemeDetails,
    buildEligibilityChecker,
    buildDocumentChecklist,
    buildTrustInfo,
    buildPrivacyWarning,
    recordEligibilityAnswer,
    saveDocumentCheck,
    printDocumentChecklist,
    printSchemeQRCard,
    shareOnWhatsApp,
    shareOnSMS,
    speakText,
    speakPageAloud,
    reportIssue,
    openReportForm,
    openFeedbackModal,
    closeFeedbackModal,
    cacheForOffline,
    loadOfflineData,
    initMap: function() {
        if (typeof window.expandMap === 'function') {
            window.expandMap();
        } else if (typeof window.initInlineMap === 'function') {
            window.initInlineMap();
        }
    },
    startGuidedMode: function(schemeData) {
        if (window.SmartGovUX && typeof window.SmartGovUX.startGuidedMode === 'function') {
            window.SmartGovUX.startGuidedMode(schemeData);
        }
    }
};

// ==================== UX Enhancements (Tier 1) ====================

const SmartGovUX = (function() {
    // Keys
    const KEYS = {
        FONT_SIZE: 'app_font_size',
        THEME: 'app_theme',
        FAVORITES: 'app_favorites',
        RECENT: 'app_recently_viewed',
        RECENT_SEARCHES: 'app_recent_searches'
    };

    // Safe Storage Wrapper
    const Storage = {
        get: (key, def) => {
            try {
                const val = localStorage.getItem(key);
                return val ? JSON.parse(val) : def;
            } catch(e) {
                return def;
            }
        },
        set: (key, val) => {
            try {
                localStorage.setItem(key, JSON.stringify(val));
            } catch(e) {}
        }
    };

    // --- Font Size ---
    const fontSizes = ['font-small', 'font-default', 'font-large', 'font-extra-large'];
    let currentFontIndex = 1;

    function applyFontSize(index) {
        document.body.classList.remove(...fontSizes);
        if (index >= 0 && index < fontSizes.length) {
            document.body.classList.add(fontSizes[index]);
            currentFontIndex = index;
            Storage.set(KEYS.FONT_SIZE, index);
        }
    }

    const setFontSize = applyFontSize;
    window.setFontSize = applyFontSize;
    window.applyFontSize = applyFontSize;

    function initFontSize() {
        let savedIndex = Storage.get(KEYS.FONT_SIZE, 1);
        if (savedIndex < 0 || savedIndex >= fontSizes.length) savedIndex = 1;
        applyFontSize(savedIndex);

        document.getElementById('fontDecBtn')?.addEventListener('click', () => {
            if (currentFontIndex > 0) applyFontSize(currentFontIndex - 1);
        });
        document.getElementById('fontIncBtn')?.addEventListener('click', () => {
            if (currentFontIndex < fontSizes.length - 1) applyFontSize(currentFontIndex + 1);
        });
        document.getElementById('fontResetBtn')?.addEventListener('click', () => {
            applyFontSize(1); // default
        });
    }

    // --- Theme & Contrast Controller (Light, Dark, High-Contrast) ---
    const themes = ['light', 'dark-mode', 'high-contrast'];
    let currentThemeIndex = 0;

    function applyTheme(index) {
        document.body.classList.remove('dark-mode', 'high-contrast');
        if (index === 1) document.body.classList.add('dark-mode');
        else if (index === 2) document.body.classList.add('high-contrast');
        currentThemeIndex = index;
        Storage.set(KEYS.THEME, index);

        // Update contrast and theme buttons in the UI
        const isEn = window.getLang && window.getLang() === 'en';
        const modeConfigs = [
            { icon: '☀️', text: isEn ? 'Light' : 'లైట్', label: isEn ? 'Theme: Light (Click for Dark Mode)' : 'థీమ్: లైట్ (డార్క్ మోడ్ కోసం నొక్కండి)' },
            { icon: '🌙', text: isEn ? 'Dark' : 'డార్క్', label: isEn ? 'Theme: Dark (Click for High Contrast)' : 'థీమ్: డార్క్ (హై కాంట్రాస్ట్ కోసం నొక్కండి)' },
            { icon: '🌓', text: isEn ? 'Contrast' : 'కాంట్రాస్ట్', label: isEn ? 'Theme: High Contrast (Click for Light Mode)' : 'థీమ్: హై కాంట్రాస్ట్ (లైట్ మోడ్ కోసం నొక్కండి)' }
        ];
        const curr = modeConfigs[currentThemeIndex] || modeConfigs[0];

        document.querySelectorAll('#contrastBtn, .contrast-btn, #themeToggleBtn').forEach(btn => {
            const iconEl = btn.querySelector('.contrast-icon, .theme-icon');
            const textEl = btn.querySelector('.contrast-text, .theme-text, [data-i18n="contrastBtn"]');
            if (iconEl) iconEl.textContent = curr.icon;
            if (textEl) textEl.textContent = curr.text;
            btn.setAttribute('title', curr.label);
            btn.setAttribute('aria-label', curr.label);
        });
    }

    function toggleContrast() {
        applyTheme((currentThemeIndex + 1) % themes.length);
    }

    function initTheme() {
        let savedIndex = Storage.get(KEYS.THEME, 0);
        if (savedIndex < 0 || savedIndex >= themes.length) savedIndex = 0;
        applyTheme(savedIndex);

        document.querySelectorAll('#contrastBtn, .contrast-btn, #themeToggleBtn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                toggleContrast();
            });
        });
    }

    // --- Favorites ---
    function getFavorites() {
        return Storage.get(KEYS.FAVORITES, []);
    }

    function isFavorite(schemeName) {
        return getFavorites().includes(schemeName);
    }

    function toggleFavorite(schemeName, buttonEl) {
        let favs = getFavorites();
        if (favs.includes(schemeName)) {
            favs = favs.filter(s => s !== schemeName);
            if (buttonEl) {
                buttonEl.classList.remove('active');
                buttonEl.textContent = '☆';
            }
        } else {
            favs.push(schemeName);
            if (buttonEl) {
                buttonEl.classList.add('active');
                buttonEl.textContent = '★';
            }
            if (navigator.vibrate) navigator.vibrate(50);
        }
        Storage.set(KEYS.FAVORITES, favs);
        renderFavoritesAndRecent();
    }

    // --- Recently Viewed ---
    function getRecent() {
        return Storage.get(KEYS.RECENT, []);
    }

    function addRecent(schemeName) {
        if (!schemeName) return;
        let recent = getRecent();
        recent = recent.filter(s => s !== schemeName);
        recent.unshift(schemeName);
        if (recent.length > 10) recent = recent.slice(0, 10);
        Storage.set(KEYS.RECENT, recent);
        renderFavoritesAndRecent();
    }

    // --- Render Favorites and Recent ---
    function renderFavoritesAndRecent() {
        const favs = getFavorites();
        const recents = getRecent();
        const favSec = document.getElementById('favoritesSection');
        const favList = document.getElementById('favoritesList');
        const recSec = document.getElementById('recentlyViewedSection');
        const recList = document.getElementById('recentlyViewedList');
        const currentLang = window.getLang ? window.getLang() : 'te';

        if (favSec && favList) {
            if (favs.length > 0) {
                favSec.style.display = 'block';
                favList.innerHTML = favs.map(name => {
                    const displayName = window.getLocalizedSchemeName ? window.getLocalizedSchemeName(name, currentLang) : (currentLang === 'en' ? name : (window.schemesCatalog?.[name]?.telugu_name || name));
                    return `<a href="javascript:void(0)" class="recent-chip" data-scheme="${window.escapeHtml(name)}">${window.escapeHtml(displayName)}</a>`;
                }).join('');
            } else {
                favSec.style.display = 'none';
            }
        }

        if (recSec && recList) {
            if (recents.length > 0) {
                recSec.style.display = 'block';
                recList.innerHTML = recents.map(name => {
                    const displayName = window.getLocalizedSchemeName ? window.getLocalizedSchemeName(name, currentLang) : (currentLang === 'en' ? name : (window.schemesCatalog?.[name]?.telugu_name || name));
                    return `<a href="javascript:void(0)" class="recent-chip" data-scheme="${window.escapeHtml(name)}">${window.escapeHtml(displayName)}</a>`;
                }).join('');
            } else {
                recSec.style.display = 'none';
            }
        }
    }

    // --- Recent Health Scheme Searches (Local State Tracker) ---
    function getRecentSearches() {
        return Storage.get(KEYS.RECENT_SEARCHES, []);
    }

    function addRecentSearch(query) {
        if (!query || typeof query !== 'string') return;
        const cleanQuery = query.trim();
        if (cleanQuery.length < 2) return;

        let searches = getRecentSearches();
        // Remove existing case-insensitive duplicate
        searches = searches.filter(q => q && typeof q === 'string' && q.trim().toLowerCase() !== cleanQuery.toLowerCase());
        // Insert at the beginning
        searches.unshift(cleanQuery);
        // Limit to 8 recent searches
        if (searches.length > 8) {
            searches = searches.slice(0, 8);
        }
        Storage.set(KEYS.RECENT_SEARCHES, searches);
        renderRecentSearches();
    }

    function removeRecentSearch(query) {
        if (!query) return;
        const cleanQuery = String(query).trim().toLowerCase();
        let searches = getRecentSearches();
        searches = searches.filter(q => q && typeof q === 'string' && q.trim().toLowerCase() !== cleanQuery);
        Storage.set(KEYS.RECENT_SEARCHES, searches);
        renderRecentSearches();
    }

    function clearRecentSearches() {
        Storage.set(KEYS.RECENT_SEARCHES, []);
        renderRecentSearches();
    }

    function renderRecentSearches() {
        const section = document.getElementById('recentSearchesSection');
        const list = document.getElementById('recentSearchesList');
        if (!section || !list) return;

        const searches = getRecentSearches();
        const currentLang = window.getLang ? window.getLang() : 'te';
        const isEn = currentLang === 'en';

        if (!searches || searches.length === 0) {
            section.style.display = 'none';
            list.innerHTML = '';
            return;
        }

        section.style.display = 'block';
        const removeTitle = window.t ? window.t('removeSearchItem') : (isEn ? 'Remove search' : 'ఈ శోధనను తీసివేయి');
        const searchTip = window.t ? window.t('quickSearchTip') : (isEn ? 'Click to search' : 'శోధించడానికి నొక్కండి');

        list.innerHTML = searches.map(q => {
            const escapedQ = window.escapeHtml(q);
            return `
                <div class="recent-search-chip" role="listitem">
                    <button type="button" class="recent-search-term-btn" data-action="apply-recent-search" data-query="${escapedQ}" title="${searchTip}: ${escapedQ}">
                        <span class="search-chip-icon" aria-hidden="true">🔍</span>
                        <span class="search-chip-text">${escapedQ}</span>
                    </button>
                    <button type="button" class="recent-search-remove-btn" data-action="remove-recent-search" data-query="${escapedQ}" title="${removeTitle}" aria-label="${removeTitle}: ${escapedQ}">
                        <span aria-hidden="true">✕</span>
                    </button>
                </div>
            `;
        }).join('');
    }

    // --- Share Result ---
    async function shareResult(schemeName) {
        if (!schemeName) return;

        const text = window.generateShareText ? window.generateShareText(schemeName) : generateShareText(schemeName);

        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'SmartGov Health Eligibility',
                    text: text,
                    url: window.location.origin
                });
                return;
            } catch (err) {
                if (err.name !== 'AbortError') console.error('Share error:', err);
            }
        }

        // Fallback: Clipboard
        try {
            await navigator.clipboard.writeText(text);
            alert(window.t ? window.t('shareSuccess') : '✅ ఫలితం కాపీ చేయబడింది!');
        } catch (err) {
            // Fallback 2: Manual copy prompt
            const promptText = window.getLang && window.getLang() === 'en' ? 'Copy the text below:' : 'కాపీ చేయడానికి కింద ఉన్న వచనాన్ని ఉపయోగించండి:';
            window.prompt(promptText, text);
        }
    }

    // --- Symptom Finder Logic (Tier 2A) ---
    const symptomMappings = {
        hospital: {
            title_te: 'ఆసుపత్రి / అత్యవసర చికిత్స',
            title_en: 'Hospital / Emergency Treatment',
            categories: ['Hospital treatment', 'Emergency ambulance'],
            keywords: []
        },
        pregnancy: {
            title_te: 'గర్భం / ప్రసవం',
            title_en: 'Pregnancy / Maternity Care',
            categories: ['Pregnancy and newborn', 'Pregnancy cash support'],
            keywords: ['గర్భిణి', 'pregnancy', 'maternal']
        },
        child: {
            title_te: 'పిల్లల ఆరోగ్యం',
            title_en: 'Child Health / Immunization',
            categories: ['Child health', 'Vaccination'],
            keywords: ['పిల్లలు', 'child', 'pediatric', 'neonatal']
        },
        medicines: {
            title_te: 'మందులు / పరీక్షలు',
            title_en: 'Medicines / Diagnostics',
            categories: ['PHC and village care', 'Affordable Medicines', 'Primary Care Clinics'],
            keywords: []
        },
        eye_hearing: {
            title_te: 'కన్ను మరియు వినికిడి',
            title_en: 'Eye & Hearing Care',
            categories: ['Eye Care Services', 'Hearing Care Services'],
            keywords: []
        },
        nutrition_blood: {
            title_te: 'పోషణ / రక్తం',
            title_en: 'Nutrition & Blood Bank',
            categories: ['Nutritional Services', 'Blood Bank Services'],
            keywords: []
        },
        chronic: {
            title_te: 'దీర్ఘకాలిక వ్యాధులు',
            title_en: 'Chronic Disease Care',
            categories: ['TB support', 'TB Elimination Services', 'HIV & AIDS Services', 'Kidney dialysis', 'Leprosy Services', 'Malaria & Dengue Services', 'Rabies Prevention'],
            keywords: []
        },
        phone_digital: {
            title_te: 'ఫోన్ ద్వారా వైద్య సేవలు',
            title_en: 'Telehealth & Digital Services',
            categories: ['Doctor by phone', 'Digital Health Services'],
            keywords: []
        }
    };

    function openSymptomFinder() {
        document.getElementById('homeViewContainer').style.display = 'none';
        document.getElementById('symptomResultsView').style.display = 'none';
        document.getElementById('symptomCategoryView').style.display = 'block';
        document.querySelector('.toolbar').style.display = 'none';
        const banner = document.getElementById('symptomEntryBanner');
        if (banner) banner.style.display = 'none';
    }

    function closeSymptomFinder() {
        document.getElementById('symptomCategoryView').style.display = 'none';
        document.getElementById('symptomResultsView').style.display = 'none';
        document.getElementById('homeViewContainer').style.display = 'block';
        document.querySelector('.toolbar').style.display = '';
        const banner = document.getElementById('symptomEntryBanner');
        if (banner) banner.style.display = '';
    }

    function showSymptomCategories() {
        document.getElementById('symptomResultsView').style.display = 'none';
        document.getElementById('symptomCategoryView').style.display = 'block';
    }

    let activeSymptomCategory = null;

    function renderSymptomResults(categoryId) {
        if (categoryId) activeSymptomCategory = categoryId;
        const targetCategory = categoryId || activeSymptomCategory;
        if (!targetCategory) return;

        const mapping = symptomMappings[targetCategory];
        if (!mapping) return;

        const isEn = window.getLang && window.getLang() === 'en';
        document.getElementById('symptomCategoryView').style.display = 'none';
        document.getElementById('symptomResultsView').style.display = 'block';
        document.getElementById('symptomResultTitle').textContent = isEn ? mapping.title_en : mapping.title_te;

        const catalog = window.schemesCatalog || {};
        const matchedSchemes = [];

        for (const [schemeId, data] of Object.entries(catalog)) {
            let matched = false;

            // Priority 1: Exact scheme category match
            if (mapping.categories.includes(data.category)) {
                matched = true;
            }

            // Priority 2: Keyword match
            if (!matched && mapping.keywords.length > 0) {
                const schemeKeywords = (data.keywords || []).map(k => k.toLowerCase());
                for (const kw of mapping.keywords) {
                    if (schemeKeywords.includes(kw.toLowerCase())) {
                        matched = true;
                        break;
                    }
                }
            }

            if (matched) {
                matchedSchemes.push({ id: schemeId, data });
            }
        }

        const grid = document.getElementById('symptomSchemeGrid');
        const emptyState = document.getElementById('symptomNoResults');
        const countHeader = document.getElementById('symptomResultCount');

        if (matchedSchemes.length === 0) {
            grid.innerHTML = '';
            grid.style.display = 'none';
            emptyState.style.display = 'block';
            countHeader.textContent = '';
        } else {
            emptyState.style.display = 'none';
            grid.style.display = 'grid';
            countHeader.textContent = isEn ? `${matchedSchemes.length} Schemes Found` : `${matchedSchemes.length} పథకాలు`;

            grid.innerHTML = matchedSchemes.map(item => {
                const s = item.data;
                const name = window.escapeHtml(item.id);
                const primaryTitle = window.escapeHtml(isEn ? item.id : (s.telugu_name || item.id));
                const subTitle = window.escapeHtml(isEn ? (window.translateCategory ? window.translateCategory(s.category) : (s.category || '')) : item.id);
                const desc = window.escapeHtml(isEn ? (s.english_description || s.simplified?.eligibility || '') : (s.telugu_description || s.telugu?.eligibility || ''));

                const iconMap = {
                    hospital: '🏥', ambulance: '🚑', 'mobile-clinic': '🩺', shield: '🛡',
                    clinic: '➕', 'phone-doctor': '📱', 'mother-child': '🤱', pregnancy: '🤰',
                    vaccine: '💉', child: '🧒', kidney: '🧬', nutrition: '🥣'
                };
                const icon = iconMap[s.icon] || '🏥';
                const favTitle = isEn ? 'Favorite' : 'ఇష్టమైనది';

                return `
                    <button type="button" class="scheme-card" data-action="open-scheme" data-scheme="${name}">
                        <div class="favorite-btn ${isFavorite(item.id) ? 'active' : ''}" data-scheme="${name}" title="${favTitle}" aria-label="Favorite">⭐</div>
                        <div class="card-icon">${icon}</div>
                        <h2>${primaryTitle}</h2>
                        <p>${subTitle}</p>
                    </button>
                `;
            }).join('');
        }
    }

    // --- Guided Mode (Tier 2B) ---
    let currentGuidedSchemeName = null;
    let currentGuidedStep = 1;
    let previousFocusElement = null;

    function startGuidedMode(schemeInput) {
        const catalog = window.schemesCatalog || {};
        let sName = typeof schemeInput === 'string' ? schemeInput : (schemeInput?.scheme_name || window.currentSchemeName);
        if (!sName || !catalog[sName]) {
            sName = Object.keys(catalog)[0];
        }
        if (!sName) return;

        currentGuidedSchemeName = sName;
        window.currentSchemeName = sName;
        currentGuidedStep = 1;
        previousFocusElement = document.activeElement;

        const overlay = document.getElementById('guidedModeOverlay');
        if (overlay) {
            overlay.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            renderGuidedStep(currentGuidedStep);
            setTimeout(() => {
                document.getElementById('guidedTitle')?.focus();
            }, 50);
        }
    }

    function exitGuidedMode() {
        const overlay = document.getElementById('guidedModeOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
        document.body.style.overflow = '';
        currentGuidedSchemeName = null;
        if (previousFocusElement && typeof previousFocusElement.focus === 'function') {
            previousFocusElement.focus();
        }
    }

    function nextGuidedStep() {
        if (currentGuidedStep < 6) {
            currentGuidedStep++;
            renderGuidedStep(currentGuidedStep);
            setTimeout(() => {
                const bodyEl = document.getElementById('guidedBody');
                if (bodyEl) bodyEl.scrollTop = 0;
            }, 30);
        } else {
            exitGuidedMode();
        }
    }

    function prevGuidedStep() {
        if (currentGuidedStep > 1) {
            currentGuidedStep--;
            renderGuidedStep(currentGuidedStep);
            setTimeout(() => {
                const bodyEl = document.getElementById('guidedBody');
                if (bodyEl) bodyEl.scrollTop = 0;
            }, 30);
        }
    }

    function goToGuidedStep(step) {
        const stepNum = parseInt(step, 10);
        if (stepNum >= 1 && stepNum <= 6) {
            currentGuidedStep = stepNum;
            renderGuidedStep(currentGuidedStep);
            setTimeout(() => {
                const bodyEl = document.getElementById('guidedBody');
                if (bodyEl) bodyEl.scrollTop = 0;
            }, 30);
        }
    }

    function renderStepPills(activeStep) {
        const pillsContainer = document.getElementById('guidedStepsPills');
        if (!pillsContainer) return;

        const isEn = window.getLang && window.getLang() === 'en';
        const stepsMeta = [
            { num: 1, label: isEn ? '1. Overview' : '1. వివరణ', icon: 'ℹ️' },
            { num: 2, label: isEn ? '2. Eligibility' : '2. అర్హత', icon: '👤' },
            { num: 3, label: isEn ? '3. Benefits' : '3. ప్రయోజనాలు', icon: '🎁' },
            { num: 4, label: isEn ? '4. Documents' : '4. పత్రాలు', icon: '📋' },
            { num: 5, label: isEn ? '5. How to Apply' : '5. దరఖాస్తు', icon: '📝' },
            { num: 6, label: isEn ? '6. Centers & Help' : '6. సహాయ కేంద్రాలు', icon: '📞' }
        ];

        pillsContainer.innerHTML = stepsMeta.map(s => {
            const isActive = s.num === activeStep;
            return `<button type="button" class="guided-step-pill ${isActive ? 'active' : ''}" data-action="guided-step-tab" data-step="${s.num}" aria-current="${isActive ? 'step' : 'false'}">
                <span>${s.icon}</span> <span>${window.escapeHtml(s.label)}</span>
            </button>`;
        }).join('');
    }

    function renderGuidedStep(step) {
        if (!currentGuidedSchemeName) return;
        const scheme = window.schemesCatalog?.[currentGuidedSchemeName] || {};
        const currentLang = window.getLang ? window.getLang() : 'te';
        const isEn = currentLang === 'en';

        const titleEl = document.getElementById('guidedTitle');
        const progressEl = document.getElementById('guidedProgressText');
        const bodyEl = document.getElementById('guidedBody');
        const prevBtn = document.getElementById('guidedPrevBtn');
        const nextBtn = document.getElementById('guidedNextBtn');
        const favContainer = document.getElementById('guidedFavoriteContainer');

        renderStepPills(step);

        // Render Favorite Button
        const schemeNameSafe = window.escapeHtml(currentGuidedSchemeName);
        const favTitle = isEn ? 'Favorite' : 'ఇష్టమైనది';
        if (favContainer) {
            favContainer.innerHTML = `<button type="button" class="favorite-btn ${isFavorite(currentGuidedSchemeName) ? 'active' : ''}" data-scheme="${schemeNameSafe}" title="${favTitle}" aria-label="Favorite">⭐</button>`;
        }

        const primaryTitle = isEn ? currentGuidedSchemeName : (scheme.telugu_name || currentGuidedSchemeName);
        const secondaryTitle = isEn ? (scheme.telugu_name || '') : currentGuidedSchemeName;
        if (titleEl) {
            titleEl.innerHTML = `<span>${window.escapeHtml(primaryTitle)}</span>` +
                (secondaryTitle && secondaryTitle !== primaryTitle ? `<span style="display:block; font-size:0.82rem; font-weight:600; opacity:0.85; margin-top:2px;">${window.escapeHtml(secondaryTitle)}</span>` : '');
        }
        if (progressEl) {
            progressEl.textContent = window.t ? window.t('guidedStep', { step: step }) : (isEn ? `Step ${step} of 6` : `దశ ${step} / 6`);
        }

        let stepHtml = '';

        if (step === 1) {
            // Slide 1: Overview & Scope
            const desc = isEn
                ? (scheme.english_description || scheme.simplified?.benefits || scheme.simplified?.description || 'Detailed information is being updated by the department.')
                : (scheme.telugu_description || scheme.telugu?.benefits || scheme.telugu?.description || 'ఈ పథకం గురించిన సమాచారం అందుబాటులో ఉంది.');
            const cat = scheme.category || (isEn ? 'Health & Family Welfare' : 'ఆరోగ్యం మరియు కుటుంబ సంక్షేమం');
            const level = scheme.level || (isEn ? 'Andhra Pradesh State Scheme' : 'ఆంధ్రప్రదేశ్ రాష్ట్ర ప్రభుత్వం');

            stepHtml = `
                <div class="guided-step-header" style="margin-bottom:14px;">
                    <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:8px;">
                        <span class="badge" style="background:#0d5c4d; color:#fff; padding:3px 10px; border-radius:4px; font-size:0.82rem; font-weight:700;">📂 ${window.escapeHtml(cat)}</span>
                        <span class="badge" style="background:#c2410c; color:#fff; padding:3px 10px; border-radius:4px; font-size:0.82rem; font-weight:700;">🏛️ ${window.escapeHtml(level)}</span>
                    </div>
                    <h3 class="guided-step-title" style="margin:6px 0; color:var(--primary-dark); font-size:1.25rem;">ℹ️ ${isEn ? 'About This Scheme & Mission' : 'ఈ పథకం ఉద్దేశం మరియు పూర్తి వివరాలు'}</h3>
                </div>
                <div class="guided-step-content">
                    <div style="background:var(--surface-soft); border-left:4px solid var(--primary); padding:14px 18px; border-radius:6px; margin-bottom:14px;">
                        <p style="font-size:1.05rem; line-height:1.7; margin:0; color:var(--ink);">${window.escapeHtml(desc)}</p>
                    </div>
                    <div style="background:rgba(13,92,77,0.06); border:1px solid rgba(13,92,77,0.2); border-radius:8px; padding:12px 16px;">
                        <h4 style="margin:0 0 6px 0; font-size:0.95rem; color:var(--primary-dark);">🎯 ${isEn ? 'Key Objective' : 'ముఖ్య లక్ష్యం'}</h4>
                        <p style="margin:0; font-size:0.92rem; color:var(--ink-light);">${isEn ? 'Ensuring quality healthcare, cashless medical procedures, and economic security for all eligible families in Andhra Pradesh.' : 'ఆంధ్రప్రదేశ్‌లోని అర్హులైన ప్రతి కుటుంబానికి నాణ్యమైన, ఉచిత వైద్య సేవలు మరియు ఆర్థిక భరోసా అందించడం.'}</p>
                    </div>
                </div>
            `;
        } else if (step === 2) {
            // Slide 2: Who is Eligible
            let elig = isEn ? (scheme.simplified?.eligibility || 'All resident families with valid ration card or income certificate.') : (scheme.telugu?.eligibility || 'ఆంధ్రప్రదేశ్ నివాసితులు, చెల్లుబాటు అయ్యే తెల్ల రేషన్ కార్డు / బియ్యం కార్డు ఉన్నవారు.');
            
            stepHtml = `
                <div class="guided-step-header" style="margin-bottom:14px;">
                    <h3 class="guided-step-title" style="margin:0 0 6px 0; color:var(--primary-dark); font-size:1.25rem;">👤 ${isEn ? 'Who is Eligible? (Eligibility Criteria)' : 'ఎవరు అర్హులు? (అర్హత ప్రమాణాలు)'}</h3>
                    <p style="margin:0; font-size:0.9rem; color:var(--ink-light);">${isEn ? 'Verify your criteria before applying:' : 'దరఖాస్తు చేసుకోవడానికి క్రింది అర్హతలు చూడండి:'}</p>
                </div>
                <div class="guided-step-content">
                    <div style="background:var(--surface-soft); border-radius:8px; border:1px solid var(--border); padding:14px 18px; margin-bottom:14px;">
                        <p style="font-size:1.05rem; line-height:1.7; margin:0; color:var(--ink); font-weight:600;">${window.escapeHtml(elig)}</p>
                    </div>
                    <div style="display:grid; grid-template-columns:1fr; gap:8px;">
                        <div style="display:flex; align-items:flex-start; gap:10px; background:rgba(34,197,94,0.08); border:1px solid rgba(34,197,94,0.3); border-radius:6px; padding:10px 14px;">
                            <span style="font-size:1.2rem;">✅</span>
                            <div>
                                <strong style="font-size:0.92rem; color:#15803d;">${isEn ? 'Resident of Andhra Pradesh' : 'ఆంధ్రప్రదేశ్ రాష్ట్ర నివాసి అయి ఉండాలి'}</strong>
                                <div style="font-size:0.85rem; color:var(--ink-light);">${isEn ? 'Possessing White Ration Card / BPL Rice Card / Aarogyasri Card.' : 'తెల్ల రేషన్ కార్డు, బియ్యం కార్డు లేదా ఆరోగ్యశ్రీ కార్డు ఉండాలి.'}</div>
                            </div>
                        </div>
                        <div style="display:flex; align-items:flex-start; gap:10px; background:rgba(59,130,246,0.08); border:1px solid rgba(59,130,246,0.3); border-radius:6px; padding:10px 14px;">
                            <span style="font-size:1.2rem;">💰</span>
                            <div>
                                <strong style="font-size:0.92rem; color:#1d4ed8;">${isEn ? 'Annual Income Limit' : 'వార్షిక ఆదాయ పరిమితి'}</strong>
                                <div style="font-size:0.85rem; color:var(--ink-light);">${isEn ? 'Annual family income up to ₹5 Lakhs (or landholding under ceiling limits).' : 'కుటుంబ వార్షిక ఆదాయం రూ. 5 లక్షల లోపు లేదా నిర్దేశిత భూపరిమితి లోపు ఉండాలి.'}</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } else if (step === 3) {
            // Slide 3: Benefits & Coverage
            let ben = isEn ? (scheme.simplified?.benefits || scheme.english_description || '') : (scheme.telugu?.benefits || scheme.telugu_description || '');

            stepHtml = `
                <div class="guided-step-header" style="margin-bottom:14px;">
                    <h3 class="guided-step-title" style="margin:0 0 6px 0; color:var(--primary-dark); font-size:1.25rem;">🎁 ${isEn ? 'Key Benefits & Cashless Treatment' : 'పథకం ప్రయోజనాలు మరియు ఉచిత చికిత్స'}</h3>
                    <p style="margin:0; font-size:0.9rem; color:var(--ink-light);">${isEn ? 'Comprehensive entitlements provided under this scheme:' : 'ఈ పథకం ద్వారా లభించే పూర్తి ప్రయోజనాలు:'}</p>
                </div>
                <div class="guided-step-content">
                    <div style="background:linear-gradient(135deg, rgba(13,92,77,0.08) 0%, rgba(13,92,77,0.02) 100%); border:1.5px solid var(--primary); border-radius:8px; padding:16px; margin-bottom:14px;">
                        <div style="font-size:1.1rem; line-height:1.7; color:var(--ink); font-weight:600;">${window.escapeHtml(ben)}</div>
                    </div>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                        <div style="background:var(--surface-soft); border:1px solid var(--border); border-radius:6px; padding:10px 12px;">
                            <div style="font-size:1.2rem;">🏥</div>
                            <strong style="font-size:0.9rem; color:var(--primary-dark);">${isEn ? 'Cashless Inpatient Care' : 'ఉచిత ఇన్-పేషెంట్ చికిత్స'}</strong>
                            <div style="font-size:0.82rem; color:var(--ink-light);">${isEn ? 'Diagnosis, bed charges, surgery & ICU included.' : 'పరీక్షలు, బెడ్ చార్జీలు, సర్జరీ మరియు ఐసీయూ ఉచితం.'}</div>
                        </div>
                        <div style="background:var(--surface-soft); border:1px solid var(--border); border-radius:6px; padding:10px 12px;">
                            <div style="font-size:1.2rem;">💊</div>
                            <strong style="font-size:0.9rem; color:var(--primary-dark);">${isEn ? 'Post-Discharge Medicines' : 'డిశ్చార్జ్ తర్వాత ఉచిత మందులు'}</strong>
                            <div style="font-size:0.82rem; color:var(--ink-light);">${isEn ? 'Free medicines and checkups for prescribed duration.' : 'వైద్యుల సిఫార్సు మేరకు ఫాలో-అప్ మందులు ఉచితంగా ఇస్తారు.'}</div>
                        </div>
                    </div>
                </div>
            `;
        } else if (step === 4) {
            // Slide 4: Required Documents
            let docs = [];
            if (scheme.required_documents && scheme.required_documents.length > 0) {
                docs = scheme.required_documents.map(d => ({
                    name: isEn ? (d.name || d.name_te) : (d.name_te || d.name),
                    mandatory: d.mandatory !== false
                }));
            } else if (scheme.telugu?.documents) {
                docs = scheme.telugu.documents.split(',').map(d => ({ name: d.trim(), mandatory: true }));
            } else {
                docs = [
                    { name: isEn ? 'Aadhaar Card (Patient / Family Head)' : 'ఆధార్ కార్డు (రోగి / కుటుంబ పెద్ద)', mandatory: true },
                    { name: isEn ? 'White Rice Card / Aarogyasri Card' : 'తెల్ల బియ్యం కార్డు / ఆరోగ్యశ్రీ కార్డు', mandatory: true },
                    { name: isEn ? 'Doctor Referral / Hospital Slip' : 'డాక్టర్ ప్రిస్క్రిప్షన్ / ఆసుపత్రి రిఫరల్ పత్రం', mandatory: true },
                    { name: isEn ? 'Bank Passbook (for financial support/Aasara)' : 'బ్యాంకు పాస్‌బుక్ జిరాక్స్ (ఆరోగ్య ఆసరా సాయం కోసం)', mandatory: false }
                ];
            }

            stepHtml = `
                <div class="guided-step-header" style="margin-bottom:14px;">
                    <h3 class="guided-step-title" style="margin:0 0 6px 0; color:var(--primary-dark); font-size:1.25rem;">📋 ${isEn ? 'Required Documents Checklist' : 'అవసరమైన పత్రాల చెక్‌లిస్ట్'}</h3>
                    <p style="margin:0; font-size:0.9rem; color:var(--ink-light);">${isEn ? 'Carry these documents when visiting the hospital or Sachivalayam:' : 'ఆసుపత్రి లేదా సచివాలయానికి వెళ్లేటప్పుడు ఈ పత్రాలు తీసుకెళ్లండి:'}</p>
                </div>
                <div class="guided-step-content">
                    <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:14px;">
                        ${docs.map(d => `
                            <div style="display:flex; align-items:center; gap:10px; background:var(--surface-soft); border:1px solid var(--border); border-radius:6px; padding:10px 14px;">
                                <span style="font-size:1.1rem; color:var(--primary);">📄</span>
                                <div style="flex:1;">
                                    <strong style="font-size:0.95rem; color:var(--ink);">${window.escapeHtml(d.name)}</strong>
                                </div>
                                <span style="font-size:0.75rem; font-weight:700; padding:2px 8px; border-radius:4px; background:${d.mandatory ? 'rgba(220,38,38,0.1)' : 'rgba(107,114,128,0.1)'}; color:${d.mandatory ? '#b91c1c' : '#4b5563'};">
                                    ${d.mandatory ? (isEn ? 'Mandatory' : 'తప్పనిసరి') : (isEn ? 'Optional' : 'ఐచ్ఛికం')}
                                </span>
                            </div>
                        `).join('')}
                    </div>
                    <div style="background:rgba(234,179,8,0.1); border:1px solid rgba(234,179,8,0.4); border-radius:6px; padding:10px 14px; font-size:0.88rem; color:#854d0e;">
                        💡 <strong>${isEn ? 'Tip:' : 'సూచన:'}</strong> ${isEn ? 'If your ration card is missing, contact your local Grama/Ward Sachivalayam for instant verification slip.' : 'రేషన్ కార్డు లేకపోతే గ్రామ/వార్డు సచివాలయంలో సంప్రదించి ధృవీకరణ పత్రం పొందవచ్చు.'}
                    </div>
                </div>
            `;
        } else if (step === 5) {
            // Slide 5: How to Apply / Steps
            const stepsList = [
                {
                    title: isEn ? 'Step 1: Initial Health Checkup' : 'దశ 1: ప్రాథమిక పరీక్ష లేదా రిఫరల్',
                    desc: isEn ? 'Visit your local Village Clinic, PHC, CHC or go directly to any empanelled Network Hospital.' : 'గ్రామ విలేజ్ క్లినిక్, ప్రాథమిక ఆరోగ్య కేంద్రం (PHC) లేదా నేరుగా నెట్‌వర్క్ ఆసుపత్రిని సందర్శించండి.'
                },
                {
                    title: isEn ? 'Step 2: Meet Aarogya Mithra' : 'దశ 2: ఆరోగ్య మిత్ర హెల్ప్ డెస్క్ వద్ద సంప్రదించండి',
                    desc: isEn ? 'Meet the Aarogya Mithra at the hospital reception desk and present your Aadhaar and Rice Card.' : 'ఆసుపత్రి రిసెప్షన్‌లో ఉండే ఆరోగ్య మిత్ర వద్ద ఆధార్ మరియు రేషన్ కార్డు సమర్పించండి.'
                },
                {
                    title: isEn ? 'Step 3: Cashless E-Preauthorization' : 'దశ 3: ఉచిత ఈ-ప్రీఆథరైజేషన్ & చేరిక',
                    desc: isEn ? 'The hospital uploads medical reports electronically. Treatment begins immediately upon trust pre-auth approval.' : 'ఆసుపత్రి యాజమాన్యం ఆన్‌లైన్ ద్వారా అనుమతి పొందుతుంది. వెంటనే ఉచిత నగదు రహిత చికిత్స ప్రారంభమవుతుంది.'
                },
                {
                    title: isEn ? 'Step 4: Discharge & Follow-up Support' : 'దశ 4: డిశ్చార్జ్, ఉచిత మందులు & విశ్రాంతి భత్యం',
                    desc: isEn ? 'Receive free discharge medicines, diagnostic summaries, and eligible Aarogya Aasara post-op financial support.' : 'ఉచిత మందులు, డిశ్చార్జ్ సమ్మరీ మరియు అర్హత కలిగిన వారికి ఆరోగ్య ఆసరా ఆర్థిక సాయం అందుతుంది.'
                }
            ];

            stepHtml = `
                <div class="guided-step-header" style="margin-bottom:14px;">
                    <h3 class="guided-step-title" style="margin:0 0 6px 0; color:var(--primary-dark); font-size:1.25rem;">📝 ${isEn ? 'Step-by-Step Application Procedure' : 'దరఖాస్తు మరియు లబ్ధి పొందే విధానం'}</h3>
                    <p style="margin:0; font-size:0.9rem; color:var(--ink-light);">${isEn ? 'Follow these 4 simple steps to receive benefits:' : 'ఈ 4 దశలను అనుసరించి సులభంగా చికిత్స పొందండి:'}</p>
                </div>
                <div class="guided-step-content">
                    <div style="display:flex; flex-direction:column; gap:10px;">
                        ${stepsList.map((st, idx) => `
                            <div style="display:flex; gap:12px; align-items:flex-start; background:var(--surface-soft); border-radius:8px; border:1px solid var(--border); padding:12px 14px;">
                                <div style="width:28px; height:28px; border-radius:50%; background:var(--primary); color:#fff; font-weight:800; font-size:0.9rem; display:flex; align-items:center; justify-content:center; flex-shrink:0;">${idx + 1}</div>
                                <div>
                                    <strong style="font-size:0.96rem; color:var(--primary-dark); display:block; margin-bottom:2px;">${window.escapeHtml(st.title)}</strong>
                                    <div style="font-size:0.9rem; color:var(--ink-light); line-height:1.5;">${window.escapeHtml(st.desc)}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        } else if (step === 6) {
            // Slide 6: Help Desks, Map, Toll-free
            let contactInfo = scheme.telugu?.contact_office || scheme.contact_office || (isEn ? 'Grama/Ward Secretariat, Network Hospital Help Desk' : 'గ్రామ/వార్డు సచివాలయం, ఆరోగ్య మిత్ర హెల్ప్ డెస్క్');
            let websiteUrl = scheme.official_website || 'https://ysraarogyasri.ap.gov.in';

            stepHtml = `
                <div class="guided-step-header" style="margin-bottom:12px;">
                    <h3 class="guided-step-title" style="margin:0 0 4px 0; color:var(--primary-dark); font-size:1.25rem;">📞 ${isEn ? 'Where to Get Help & Healthcare Map' : 'ఎవరిని సంప్రదించాలి & ఆరోగ్య కేంద్రాల మ్యాప్'}</h3>
                    <p style="margin:0; font-size:0.88rem; color:var(--ink-light);">${isEn ? 'Nearby facilities and 24x7 official helplines:' : 'దగ్గరలోని కేంద్రాలు మరియు టోల్ ఫ్రీ హెల్ప్‌లైన్లు:'}</p>
                </div>
                <div class="guided-step-content">
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:12px;">
                        <div style="background:rgba(13,92,77,0.06); border:1px solid rgba(13,92,77,0.2); border-radius:6px; padding:10px 12px;">
                            <strong style="font-size:0.85rem; color:var(--primary-dark);">📞 104 (24x7)</strong>
                            <div style="font-size:0.8rem; color:var(--ink-light);">${isEn ? 'Medical Advice & Scheme Info' : 'వైద్య సలహా & పథకం సమాచారం'}</div>
                        </div>
                        <div style="background:rgba(220,38,38,0.06); border:1px solid rgba(220,38,38,0.2); border-radius:6px; padding:10px 12px;">
                            <strong style="font-size:0.85rem; color:#b91c1c;">🚑 108</strong>
                            <div style="font-size:0.8rem; color:var(--ink-light);">${isEn ? 'Emergency Ambulance Service' : 'అత్యవసర అంబులెన్స్ సేవ'}</div>
                        </div>
                    </div>

                    <div style="background:var(--surface-soft); border:1px solid var(--border); border-radius:6px; padding:10px 14px; margin-bottom:12px; font-size:0.9rem;">
                        <strong>🏛️ ${isEn ? 'Official Desk:' : 'అధికారిక కేంద్రం:'}</strong> ${window.escapeHtml(contactInfo)}<br>
                        <strong style="margin-top:4px; display:inline-block;">🌐 ${isEn ? 'Official Portal:' : 'పోర్టల్:'}</strong> <a href="${window.escapeHtml(websiteUrl)}" target="_blank" rel="noopener noreferrer" style="color:var(--primary); font-weight:700;">${window.escapeHtml(websiteUrl)}</a>
                    </div>

                    <div class="inline-map-container" id="inlineMapContainer" style="margin-top: 8px;">
                        <div class="map-toolbar" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                            <h4 style="margin:0; font-size:0.92rem;">📍 ${isEn ? 'Nearby Healthcare Facilities' : 'దగ్గరలోని ఆరోగ్య కేంద్రాలు'}</h4>
                            <button class="action-btn" type="button" data-action="expand-map" style="padding: 4px 10px; min-height:32px; font-size:0.82rem;">${isEn ? 'Expand Map' : 'విస్తరించు'}</button>
                        </div>
                        <div id="inlineMap" class="map-container" style="height: 220px; border-radius: 8px; z-index:1; background: #e0e0e0; border: 1px solid #ccc;"></div>
                    </div>

                    <div style="margin-top:14px;">
                        <button class="action-btn whatsapp-share-btn share-whatsapp-btn" type="button" data-scheme="${schemeNameSafe}" style="width:100%; font-size:0.95rem; min-height:44px; justify-content:center;">
                            📱 ${isEn ? 'Share Scheme via WhatsApp' : 'పథకం వివరాలను WhatsApp లో షేర్ చేయండి'}
                        </button>
                    </div>
                </div>
            `;
        }

        if (bodyEl) {
            bodyEl.innerHTML = stepHtml;
        }

        if (prevBtn) {
            prevBtn.style.visibility = step === 1 ? 'hidden' : 'visible';
            prevBtn.innerHTML = `← ${window.t ? window.t('guidedPrev') : (isEn ? 'Back' : 'వెనుకకు')}`;
        }

        if (nextBtn) {
            if (step === 6) {
                nextBtn.innerHTML = `✓ ${window.t ? window.t('guidedFinish') : (isEn ? 'Finish' : 'ముగించు')}`;
                nextBtn.dataset.action = 'guided-close';
                setTimeout(() => {
                    if (window.initInlineMap) window.initInlineMap();
                }, 60);
            } else {
                nextBtn.innerHTML = `${window.t ? window.t('guidedNext') : (isEn ? 'Next' : 'తర్వాత')} →`;
                nextBtn.dataset.action = 'guided-next';
            }
        }
    }

    // --- Initialize ---
    document.addEventListener('DOMContentLoaded', () => {
        initFontSize();
        initTheme();
        renderFavoritesAndRecent();
        renderRecentSearches();

        window.addEventListener('languagechange', () => {
            renderFavoritesAndRecent();
            renderRecentSearches();
        });

        // Single Central Event Delegation
        document.body.addEventListener('click', e => {
            const applySearchBtn = e.target.closest('[data-action="apply-recent-search"]');
            if (applySearchBtn) {
                e.stopPropagation();
                const query = applySearchBtn.dataset.query;
                const searchInput = document.getElementById('searchInput');
                if (searchInput && query) {
                    searchInput.value = query;
                    addRecentSearch(query);
                    if (window.renderSchemeCards) {
                        window.renderSchemeCards(true);
                    }
                    searchInput.focus();
                }
                return;
            }

            const removeSearchBtn = e.target.closest('[data-action="remove-recent-search"]');
            if (removeSearchBtn) {
                e.stopPropagation();
                const query = removeSearchBtn.dataset.query;
                if (query) {
                    removeRecentSearch(query);
                }
                return;
            }

            const clearSearchesBtn = e.target.closest('[data-action="clear-recent-searches"]');
            if (clearSearchesBtn) {
                e.stopPropagation();
                clearRecentSearches();
                return;
            }

            const favBtn = e.target.closest('.favorite-btn');
            if (favBtn) {
                e.stopPropagation();
                toggleFavorite(favBtn.dataset.scheme, favBtn);
                return;
            }

            const chip = e.target.closest('.recent-chip');
            if (chip && window.fetchScheme) {
                e.stopPropagation();
                window.fetchScheme(chip.dataset.scheme);
                return;
            }

            const shareBtn = e.target.closest('.share-result-btn');
            if (shareBtn) {
                e.stopPropagation();
                shareResult(shareBtn.dataset.scheme);
                return;
            }

            const waBtn = e.target.closest('.share-whatsapp-btn');
            if (waBtn) {
                e.stopPropagation();
                shareOnWhatsApp(waBtn.dataset.scheme || window.currentSchemeName);
                return;
            }

            const smsBtn = e.target.closest('.share-sms-btn');
            if (smsBtn) {
                e.stopPropagation();
                shareOnSMS(smsBtn.dataset.scheme || window.currentSchemeName);
                return;
            }

            const printSchemeBtn = e.target.closest('.print-scheme-btn');
            if (printSchemeBtn) {
                e.stopPropagation();
                printFullScheme(printSchemeBtn.dataset.scheme || window.currentSchemeName);
                return;
            }

            const qrCardBtn = e.target.closest('.qr-card-btn');
            if (qrCardBtn) {
                e.stopPropagation();
                const sName = qrCardBtn.dataset.scheme || window.currentSchemeName;
                const slug = qrCardBtn.dataset.slug || window.schemesCatalog?.[sName]?.slug;
                printSchemeQRCard(sName, slug, window.schemesCatalog?.[sName]);
                return;
            }

            const reportBtn = e.target.closest('.report-issue-btn');
            if (reportBtn) {
                e.stopPropagation();
                openFeedbackModal(reportBtn, reportBtn.dataset.scheme || window.currentSchemeName);
                return;
            }

            const guidedBtn = e.target.closest('.guided-mode-btn');
            if (guidedBtn) {
                e.stopPropagation();
                startGuidedMode(guidedBtn.dataset.scheme || window.currentSchemeName);
                return;
            }

            // Symptom Finder entry points
            const symptomBanner = e.target.closest('.symptom-entry-banner');
            if (symptomBanner) {
                openSymptomFinder();
                return;
            }

            const chatBanner = e.target.closest('.chat-entry-banner');
            if (chatBanner) {
                openChat(chatBanner);
                return;
            }

            const symptomCategoryBtn = e.target.closest('.category-card');
            if (symptomCategoryBtn) {
                renderSymptomResults(symptomCategoryBtn.dataset.category);
                return;
            }

            // Centralized CSP-safe event delegation via data-action
            const actionTarget = e.target.closest('[data-action]');
            if (actionTarget) {
                const action = actionTarget.dataset.action;
                if (action === 'start-guided-mode') {
                    e.stopPropagation();
                    startGuidedMode(actionTarget.dataset.scheme || window.currentSchemeName);
                    return;
                }
                if (action === 'guided-next') {
                    e.stopPropagation();
                    nextGuidedStep();
                    return;
                }
                if (action === 'guided-prev') {
                    e.stopPropagation();
                    prevGuidedStep();
                    return;
                }
                if (action === 'guided-step-tab') {
                    e.stopPropagation();
                    goToGuidedStep(actionTarget.dataset.step);
                    return;
                }
                if (action === 'guided-close') {
                    e.stopPropagation();
                    exitGuidedMode();
                    return;
                }
                if (action === 'print-scheme') {
                    e.stopPropagation();
                    printFullScheme(actionTarget.dataset.scheme || window.currentSchemeName);
                    return;
                }
                if (action === 'report-issue') {
                    e.stopPropagation();
                    openFeedbackModal(actionTarget, actionTarget.dataset.scheme || window.currentSchemeName);
                    return;
                }
                if (action === 'show-symptom-categories') {
                    showSymptomCategories();
                    return;
                }
                if (action === 'close-symptom-finder') {
                    closeSymptomFinder();
                    return;
                }
                if (action === 'open-scheme') {
                    if (window.fetchScheme) {
                        window.fetchScheme(actionTarget.dataset.scheme);
                    }
                    return;
                }
                if (action === 'close-feedback') {
                    closeFeedbackModal();
                    return;
                }
                if (action === 'submit-feedback') {
                    submitFeedback();
                    return;
                }
                if (action === 'set-rating') {
                    setRating(actionTarget.dataset.value);
                    return;
                }
                if (action === 'set-feedback-chip') {
                    setFeedbackChip(actionTarget);
                    return;
                }
                if (action === 'expand-map') {
                    e.preventDefault();
                    window.expandMap();
                    return;
                }
                if (action === 'close-map') {
                    window.closeMapOverlay();
                    return;
                }
                if (action === 'open-chat') {
                    openChat(actionTarget);
                    return;
                }
                if (action === 'close-chat') {
                    closeChat();
                    return;
                }
                if (action === 'chat-suggestion') {
                    const input = document.getElementById('chatInput');
                    if (input) input.value = actionTarget.dataset.question;
                    document.getElementById('chatForm')?.dispatchEvent(new Event('submit', { cancelable: true }));
                    return;
                }
                if (action === 'send-chat') {
                    // Let the form's native submit handle it.
                    return;
                }
            }
        });

        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') {
                const guidedOverlay = document.getElementById('guidedModeOverlay');
                if (guidedOverlay && guidedOverlay.style.display === 'flex') {
                    exitGuidedMode();
                }
                const feedbackOverlay = document.getElementById('feedbackOverlay');
                if (feedbackOverlay && !feedbackOverlay.classList.contains('hidden')) {
                    closeFeedbackModal();
                }
                const mapOverlay = document.getElementById('mapOverlay');
                if (mapOverlay && !mapOverlay.classList.contains('hidden')) {
                    window.closeMapOverlay();
                }
                const chatModal = document.getElementById('chatModal');
                if (chatModal && chatModal.open) {
                    closeChat();
                }
                const chatOverlay = document.getElementById('chatOverlay');
                if (chatOverlay && !chatOverlay.classList.contains('hidden')) {
                    closeChat();
                }
                const emergencyModal = document.getElementById('emergencyModal');
                if (emergencyModal && emergencyModal.open) {
                    emergencyModal.close();
                }
            }
        });

        document.getElementById('chatInput')?.addEventListener('keydown', event => {
            if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
                event.preventDefault();
                document.getElementById('chatForm')?.dispatchEvent(new Event('submit', { cancelable: true }));
            }
        });
    });

        // Map Module State
        let mapFacilities = [];
        let inlineMapObj = null;
        let fullMapObj = null;
        let inlineUserMarker = null;
        let fullUserMarker = null;
        let userLat = null;
        let userLng = null;
        let inlineFacilityMarkers = [];
        let fullFacilityMarkers = [];
        const mapState = {
            mode: 'AP',
            district: '',
            mandal: '',
            village: '',
            type: 'all',
            search: ''
        };

        function hasValidCoordinates(fac) {
            if (!fac) return false;
            const lat = Number(fac.lat !== undefined ? fac.lat : fac.latitude);
            const lng = Number(fac.lng !== undefined ? fac.lng : fac.longitude);
            return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
        }

        async function loadFacilities(forceReload = false) {
            if (mapFacilities.length > 0 && !forceReload) return mapFacilities;
            try {
                let url = '/api/facilities?limit=2000';
                if (userLat !== null && userLng !== null) {
                    url += `&lat=${userLat}&lng=${userLng}`;
                }
                const resp = await fetch(url);
                if (resp.ok) {
                    const data = await resp.json();
                    if (Array.isArray(data) && data.length > 0) {
                        mapFacilities = data;
                        populateDropdowns();
                        return mapFacilities;
                    }
                }
            } catch (err) {
                console.warn('Failed to load facilities via API:', err);
            }
            return mapFacilities;
        }

        function populateDropdowns() {
            if (!mapFacilities || !mapFacilities.length) return;
            
            let availableFacilities = mapFacilities;
            if (mapState.mode === 'ANANTHAPURAMU') {
                availableFacilities = availableFacilities.filter(f => f.district === 'Ananthapuramu');
            }

            const isEn = window.getLang && window.getLang() === 'en';
            const distPlaceholder = window.t ? window.t('mapSelectDistrict') : (isEn ? '-- Select District --' : '-- జిల్లాను ఎంచుకోండి --');
            const mandalPlaceholder = window.t ? window.t('mapSelectMandal') : (isEn ? '-- Select Mandal --' : '-- మండలాన్ని ఎంచుకోండి --');
            const villagePlaceholder = window.t ? window.t('mapSelectVillage') : (isEn ? '-- Select Village --' : '-- గ్రామాన్ని ఎంచుకోండి --');

            const districts = [...new Set(availableFacilities.map(f => f.district).filter(Boolean))].sort();
            let distHtml = `<option value="">${window.escapeHtml(distPlaceholder)}</option>`;
            districts.forEach(d => distHtml += `<option value="${d}">${d}</option>`);
            ['districtSelect', 'districtSelectFull'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.innerHTML = distHtml;
            });

            const mandals = mapState.district 
                ? [...new Set(availableFacilities.filter(f => f.district === mapState.district).map(f => f.mandal).filter(Boolean))].sort()
                : [];
            let mandalHtml = `<option value="">${window.escapeHtml(mandalPlaceholder)}</option>`;
            mandals.forEach(m => mandalHtml += `<option value="${m}">${m}</option>`);
            ['mandalSelect', 'mandalSelectFull'].forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    el.innerHTML = mandalHtml;
                    el.disabled = !mapState.district;
                }
            });

            const villages = (mapState.district && mapState.mandal)
                ? [...new Set(availableFacilities.filter(f => f.district === mapState.district && f.mandal === mapState.mandal).map(f => f.village).filter(Boolean))].sort()
                : [];
            let villHtml = `<option value="">${window.escapeHtml(villagePlaceholder)}</option>`;
            villages.forEach(v => villHtml += `<option value="${v}">${v}</option>`);
            ['villageSelect', 'villageSelectFull'].forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    el.innerHTML = villHtml;
                    el.disabled = !mapState.mandal;
                }
            });

            if (mapState.district && !districts.includes(mapState.district)) {
                if (mapState.mode === 'ANANTHAPURAMU') {
                    mapState.district = 'Ananthapuramu';
                } else {
                    mapState.district = '';
                }
            }
            if (mapState.mandal && !mandals.includes(mapState.mandal)) {
                mapState.mandal = '';
            }
            if (mapState.village && !villages.includes(mapState.village)) {
                mapState.village = '';
            }
        }

    function syncUiFromState() {
        ['typeSelect', 'typeSelectFull'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = mapState.type;
        });

        ['districtSelect', 'districtSelectFull'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = mapState.district;
        });

        ['mandalSelect', 'mandalSelectFull'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = mapState.mandal;
        });

        ['villageSelect', 'villageSelectFull'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = mapState.village;
        });

        ['searchInput', 'searchInputFull'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = mapState.search;
        });

        const isEn = window.getLang && window.getLang() === 'en';
        const nextModeLabel =
            mapState.mode === 'AP'
                ? (isEn ? '📍 View Ananthapuramu' : '📍 అనంతపురం')
                : (isEn ? '🗺️ View All AP' : '🗺️ మొత్తం AP');

        ['btnMode', 'btnModeFull'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = nextModeLabel;
        });
    }

    let listenersAttached = false;
    function setupEventListenersOnce() {
        if (listenersAttached) return;
        listenersAttached = true;

        const handleTypeChange = (e) => { 
            mapState.type = e.target.value; 
            syncUiFromState(); 
            applyFiltersAndRender(); 
        };
        const handleDistChange = (e) => { 
            mapState.district = e.target.value; 
            mapState.mandal = ''; 
            mapState.village = ''; 
            populateDropdowns(); 
            syncUiFromState(); 
            applyFiltersAndRender(); 
        };
        const handleMandalChange = (e) => {
            mapState.mandal = e.target.value; 
            mapState.village = ''; 
            populateDropdowns(); 
            syncUiFromState(); 
            applyFiltersAndRender(); 
        };
        const handleVillageChange = (e) => { 
            mapState.village = e.target.value; 
            syncUiFromState(); 
            applyFiltersAndRender(); 
        };
        
        const handleSearch = (e) => {
            mapState.search = e.target.value.toLowerCase().trim();
            syncUiFromState(); 
            applyFiltersAndRender(); 
        };
        
        const handleModeToggle = () => {
            if (mapState.mode === 'ANANTHAPURAMU') {
                mapState.mode = 'AP';
                mapState.district = '';
                mapState.mandal = '';
                mapState.village = '';
                mapState.type = 'all';
                mapState.search = '';
            } else {
                mapState.mode = 'ANANTHAPURAMU';
                mapState.district = 'Ananthapuramu';
                mapState.mandal = '';
                mapState.village = '';
                mapState.type = 'all';
                mapState.search = '';
            }
            populateDropdowns();
            syncUiFromState();
            applyFiltersAndRender();
        };

        const handleLocation = () => {
            if (navigator.geolocation) {
                const isEn = window.getLang && window.getLang() === 'en';
                const btns = [document.getElementById('btnLocation'), document.getElementById('btnLocationFull')];
                const findingText = window.t ? window.t('mapLocationFinding') : (isEn ? '⏳ Locating...' : '⏳ వెతుకుతోంది...');
                const locationBtnText = window.t ? window.t('mapLocationBtn') : (isEn ? '📍 My Location' : '📍 నా స్థానం');
                const yourLocText = window.t ? window.t('mapYourLocationPopup') : (isEn ? 'Your Location' : 'మీ స్థానం');

                btns.forEach(b => { if(b) b.innerHTML = findingText; });
                
                navigator.geolocation.getCurrentPosition(
                    async (pos) => {
                        userLat = pos.coords.latitude;
                        userLng = pos.coords.longitude;
                        await loadFacilities(true);
                        btns.forEach(b => { if(b) b.innerHTML = locationBtnText; });
                        
                        if (inlineMapObj) {
                            if (inlineUserMarker) inlineMapObj.removeLayer(inlineUserMarker);
                            inlineUserMarker = L.circleMarker([userLat, userLng], {radius: 8, fillColor: '#228be6', color: '#fff', weight: 2, opacity: 1, fillOpacity: 0.8})
                                                .addTo(inlineMapObj).bindPopup(`<b>${yourLocText}</b>`);
                        }
                        
                        if (fullMapObj) {
                            if (fullUserMarker) fullMapObj.removeLayer(fullUserMarker);
                            fullUserMarker = L.circleMarker([userLat, userLng], {radius: 8, fillColor: '#228be6', color: '#fff', weight: 2, opacity: 1, fillOpacity: 0.8})
                                              .addTo(fullMapObj).bindPopup(`<b>${yourLocText}</b>`);
                        }
                        
                        applyFiltersAndRender();
                        
                        if (inlineMapObj) {
                            inlineMapObj.setView([userLat, userLng], 15);
                        }
                        if (fullMapObj) {
                            fullMapObj.setView([userLat, userLng], 15);
                        }
                    },
                    (err) => {
                        console.warn(`Geolocation Error [Code: ${err.code}]: ${err.message}`);
                        let errorMsg = window.t ? window.t('mapErrNotFound') : (isEn ? '❌ Location not found' : '❌ స్థానం దొరకలేదు');
                        if (err.code === 1) errorMsg = window.t ? window.t('mapErrDenied') : (isEn ? '❌ Location permission denied' : '❌ అనుమతి నిరాకరించబడింది');
                        else if (err.code === 2) errorMsg = window.t ? window.t('mapErrUnavailable') : (isEn ? '❌ Location unavailable' : '❌ స్థానం అందుబాటులో లేదు');
                        else if (err.code === 3) errorMsg = window.t ? window.t('mapErrTimeout') : (isEn ? '❌ Location request timed out' : '❌ సమయం ముగిసింది');
                        
                        btns.forEach(b => { if(b) b.innerHTML = errorMsg; });
                        setTimeout(() => { btns.forEach(b => { if(b) b.innerHTML = locationBtnText; }); }, 3000);
                    },
                    { enableHighAccuracy: true, timeout: 15000 }
                );
            }
        };

        ['typeSelect', 'typeSelectFull'].forEach(id => { const el = document.getElementById(id); if (el) el.addEventListener('change', handleTypeChange); });
        ['districtSelect', 'districtSelectFull'].forEach(id => { const el = document.getElementById(id); if (el) el.addEventListener('change', handleDistChange); });
        ['mandalSelect', 'mandalSelectFull'].forEach(id => { const el = document.getElementById(id); if (el) el.addEventListener('change', handleMandalChange); });
        ['villageSelect', 'villageSelectFull'].forEach(id => { const el = document.getElementById(id); if (el) el.addEventListener('change', handleVillageChange); });
        ['searchInput', 'searchInputFull'].forEach(id => { const el = document.getElementById(id); if (el) el.addEventListener('input', handleSearch); });
        ['btnMode', 'btnModeFull'].forEach(id => { const el = document.getElementById(id); if (el) el.addEventListener('click', handleModeToggle); });
        ['btnLocation', 'btnLocationFull'].forEach(id => { const el = document.getElementById(id); if (el) el.addEventListener('click', handleLocation); });
    }

    function fitFacilitiesBounds(map, facilities) {
        if (!map) return;

        let minLat = 90;
        let maxLat = -90;
        let minLng = 180;
        let maxLng = -180;
        let hasPoints = false;

        const validFacilities = (facilities || []).filter(hasValidCoordinates);

        if (validFacilities.length > 0) {
            validFacilities.forEach(f => {
                const lat = Number(f.lat);
                const lng = Number(f.lng);
                if (lat < minLat) minLat = lat;
                if (lat > maxLat) maxLat = lat;
                if (lng < minLng) minLng = lng;
                if (lng > maxLng) maxLng = lng;
                hasPoints = true;
            });
        }

        if (userLat !== null && userLng !== null) {
            if (userLat < minLat) minLat = userLat;
            if (userLat > maxLat) maxLat = userLat;
            if (userLng < minLng) minLng = userLng;
            if (userLng > maxLng) maxLng = userLng;
            hasPoints = true;
        }

        if (!hasPoints) return;

        if (minLat === maxLat && minLng === maxLng) {
            map.setView([minLat, minLng], 14);
            return;
        }

        const bounds = [[minLat, minLng], [maxLat, maxLng]];
        map.fitBounds(bounds, { padding: [20, 20], maxZoom: 14 });
    }

    function applyFiltersAndRender() {
        if (!mapFacilities || !mapFacilities.length) return;
        
        let filtered = mapFacilities;
        
        if (mapState.mode === 'ANANTHAPURAMU') {
            filtered = filtered.filter(f => f.district === 'Ananthapuramu');
        }
        
        if (mapState.type !== 'all') {
            if (mapState.type === 'Hospital') {
                filtered = filtered.filter(f =>
                    typeof f.type === 'string' &&
                    f.type.toLowerCase().includes('hospital')
                );
            } else {
                filtered = filtered.filter(f => f.type === mapState.type);
            }
        }
        if (mapState.mode === 'AP' && mapState.district) {
            filtered = filtered.filter(f => f.district === mapState.district);
        }
        if (mapState.mandal) filtered = filtered.filter(f => f.mandal === mapState.mandal);
        if (mapState.village) filtered = filtered.filter(f => f.village === mapState.village);
        
        if (mapState.search) {
            filtered = filtered.filter(f => {
                return (f.name && f.name.toLowerCase().includes(mapState.search)) ||
                       (f.village && f.village.toLowerCase().includes(mapState.search)) ||
                       (f.mandal && f.mandal.toLowerCase().includes(mapState.search)) ||
                       (f.district && f.district.toLowerCase().includes(mapState.search));
            });
        }
        
        const isEn = window.getLang && window.getLang() === 'en';
        const resultText = window.t ? window.t('mapFoundCount', { count: filtered.length }) : (isEn ? `Found: ${filtered.length}` : `కనుగొనబడినవి: ${filtered.length}`);
        ['searchResults', 'searchResultsFull'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerText = resultText;
        });

        if (filtered.length > 0) {
            if (inlineMapObj) {
                fitFacilitiesBounds(inlineMapObj, filtered);
                renderFacilitiesOnMap(inlineMapObj, filtered, inlineFacilityMarkers);
            }
            if (fullMapObj) {
                fitFacilitiesBounds(fullMapObj, filtered);
                renderFacilitiesOnMap(fullMapObj, filtered, fullFacilityMarkers);
            }
        } else {
            if (inlineMapObj) {
                inlineFacilityMarkers.forEach(m => inlineMapObj.removeLayer(m));
                inlineFacilityMarkers.length = 0;
                fitFacilitiesBounds(inlineMapObj, []);
            }
            if (fullMapObj) {
                fullFacilityMarkers.forEach(m => fullMapObj.removeLayer(m));
                fullFacilityMarkers.length = 0;
                fitFacilitiesBounds(fullMapObj, []);
            }
        }
    }

    function getMarkerIcon(type) {
        let emoji = '🏥';
        if (type === 'PHC') emoji = '🩺';
        if (type === 'CHC') emoji = '🚑';
        
        return L.divIcon({
            html: `<div style="font-size:24px; text-shadow: 0 0 2px white; text-align:center;">${emoji}</div>`,
            className: 'custom-div-icon',
            iconSize: [30, 30],
            iconAnchor: [15, 15],
            popupAnchor: [0, -15]
        });
    }

    function renderFacilitiesOnMap(map, facilities, markersArray) {
        markersArray.forEach(m => map.removeLayer(m));
        markersArray.length = 0;
        
        let renderedCount = 0;
        let singleMarkerToOpen = null;
        const isEn = window.getLang && window.getLang() === 'en';
        const contactLabel = window.t ? window.t('mapContact') : (isEn ? 'Contact:' : 'సంప్రదించండి:');
        const distLabel = window.t ? window.t('mapDist') : (isEn ? 'Distance:' : 'దూరం:');
        const kmUnit = window.t ? window.t('mapKm') : (isEn ? 'km' : 'కి.మీ');
        
        facilities.forEach(fac => {
            if (!hasValidCoordinates(fac)) return;
            
            const lat = Number(fac.lat !== undefined ? fac.lat : fac.latitude);
            const lng = Number(fac.lng !== undefined ? fac.lng : fac.longitude);
            const marker = L.marker([lat, lng], {
                icon: getMarkerIcon(fac.type || fac.facility_type)
            }).addTo(map);
            
            renderedCount++;
            singleMarkerToOpen = marker;
            
            const safeName = window.escapeHtml(fac.name || '');
            const safeType = window.escapeHtml(fac.type || fac.facility_type || '');
            const safeVillage = window.escapeHtml(fac.village || '');
            const safeMandal = window.escapeHtml(fac.mandal || '');
            const safeDistrict = window.escapeHtml(fac.district || '');
            const safeContact = window.escapeHtml(fac.contact || fac.phone || '');
            
            let popupContent = '';
            if (safeName) popupContent += `<b>${safeName}</b><br>`;
            if (safeType) popupContent += `<i>${safeType}</i><br>`;
            
            let locParts = [];
            if (safeVillage) locParts.push(safeVillage);
            if (safeMandal) locParts.push(`${safeMandal} (${isEn ? 'Mandal' : 'మండలం'})`);
            if (safeDistrict) locParts.push(safeDistrict);
            
            if (locParts.length > 0) popupContent += locParts.join(', ') + '<br>';
            if (safeContact) popupContent += `<b>${contactLabel}</b> ${safeContact}<br>`;
            if (fac.distance_km !== undefined && fac.distance_km !== null) {
                popupContent += `<b>${distLabel}</b> ${fac.distance_km} ${kmUnit}<br>`;
            }
            
            marker.bindPopup(popupContent);
            markersArray.push(marker);
        });
        
        if (renderedCount === 1 && singleMarkerToOpen) {
            setTimeout(() => {
                singleMarkerToOpen.openPopup();
            }, 200);
        }
    }

    window.initInlineMap = async function() {
        const container = document.getElementById('inlineMap');
        const containerWrap = document.getElementById('inlineMapContainer');
        if (!container || !containerWrap || !window.L) return;
        
        containerWrap.style.display = 'block';
        setupEventListenersOnce();
        
        if (inlineMapObj) {
            inlineMapObj.remove();
            inlineMapObj = null;
            inlineFacilityMarkers = [];
            inlineUserMarker = null;
        }
        
        inlineMapObj = L.map('inlineMap');
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 18
        }).addTo(inlineMapObj);
        
        if (userLat !== null && userLng !== null) {
            const isEn = window.getLang && window.getLang() === 'en';
            const yourLocText = window.t ? window.t('mapYourLocationPopup') : (isEn ? 'Your Location' : 'మీ స్థానం');
            inlineUserMarker = L.circleMarker([userLat, userLng], {
                radius: 8, fillColor: '#228be6', color: '#fff', weight: 2, opacity: 1, fillOpacity: 0.8
            }).addTo(inlineMapObj).bindPopup(`<b>${yourLocText}</b>`);
        }

        setTimeout(() => inlineMapObj.invalidateSize(), 100);

        await loadFacilities();
        applyFiltersAndRender();
    };

    window.expandMap = async function() {
        const overlay = document.getElementById('fullScreenMapContainer') || document.getElementById('mapOverlay');
        const mapDiv = document.getElementById('fullScreenMap');
        if (!overlay || !mapDiv || !window.L) return;
        
        overlay.style.display = 'flex';
        overlay.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        setupEventListenersOnce();
        
        if (!fullMapObj) {
            fullMapObj = L.map('fullScreenMap');
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 18
            }).addTo(fullMapObj);
            
            if (userLat !== null && userLng !== null) {
                const isEn = window.getLang && window.getLang() === 'en';
                const yourLocText = window.t ? window.t('mapYourLocationPopup') : (isEn ? 'Your Location' : 'మీ స్థానం');
                fullUserMarker = L.circleMarker([userLat, userLng], {
                    radius: 8, fillColor: '#228be6', color: '#fff', weight: 2, opacity: 1, fillOpacity: 0.8
                }).addTo(fullMapObj).bindPopup(`<b>${yourLocText}</b>`);
            }
        }
        
        if (inlineMapObj) {
            fullMapObj.setView(inlineMapObj.getCenter(), inlineMapObj.getZoom());
        }
        
        setTimeout(() => fullMapObj.invalidateSize(), 200);

        await loadFacilities();
        applyFiltersAndRender();
    };

    window.initMap = window.expandMap;

    window.closeMapOverlay = function() {
        const overlay = document.getElementById('fullScreenMapContainer') || document.getElementById('mapOverlay');
        if (overlay) {
            overlay.style.display = 'none';
            overlay.classList.add('hidden');
            document.body.style.overflow = '';
            
            if (fullMapObj && inlineMapObj) {
                inlineMapObj.setView(fullMapObj.getCenter(), fullMapObj.getZoom());
            }
        }
    };

    // Listen for language change events to re-render active interactive views
    window.addEventListener('languagechange', () => {
        renderFavoritesAndRecent();
        if (currentGuidedSchemeName) {
            renderGuidedStep(currentGuidedStep);
        }
        if (activeSymptomCategory) {
            renderSymptomResults(activeSymptomCategory);
        }
        populateDropdowns();
        syncUiFromState();
        applyFiltersAndRender();
    });

    const uxExports = {
        startGuidedMode,
        exitGuidedMode,
        nextGuidedStep,
        prevGuidedStep,
        goToGuidedStep,
        renderGuidedStep,
        renderStepPills,
        toggleFavorite,
        isFavorite,
        getFavorites,
        renderFavoritesAndRecent,
        initFontSize,
        setFontSize,
        initTheme,
        toggleContrast,
        applyTheme,
        openFeedbackModal,
        closeFeedbackModal,
        submitFeedback,
        initMap: window.expandMap,
        expandMap: window.expandMap,
        closeMapOverlay: window.closeMapOverlay,
        addRecent,
        getRecentSearches,
        addRecentSearch,
        removeRecentSearch,
        clearRecentSearches,
        renderRecentSearches,
        openSymptomFinder,
        closeSymptomFinder,
        showSymptomCategories,
        applyFontSize
    };

    window.SmartGovUX = uxExports;

    if (!window.SmartGovEnhanced) {
        window.SmartGovEnhanced = {};
    }
    window.SmartGovEnhanced.initMap = window.expandMap;
    window.SmartGovEnhanced.expandMap = window.expandMap;
    window.SmartGovEnhanced.closeMapOverlay = window.closeMapOverlay;
    window.SmartGovEnhanced.loadFacilities = loadFacilities;

    return uxExports;
})();
