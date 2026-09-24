/**
 * public/js/audio-controller.js
 * =============================================================================
 * SmartGovAI Unified Audio Controller
 * =============================================================================
 * Single source of truth for all audio playback across Telugu & English.
 * Exclusively uses server-generated Edge-TTS MP3s via /api/tts.
 *
 * Supported Voice Models:
 *   - Telugu:  te-IN-ShrutiNeural
 *   - English: en-IN-NeerjaNeural
 *
 * Zero browser SpeechSynthesis. Controllable section-by-section queue playback.
 */

(function (root, factory) {
    const globalScope = typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : this));
    const instance = factory();
    if (globalScope) {
        globalScope.AudioController = instance;
        // Also provide global convenience shortcuts for backwards compatibility
        globalScope.speakText = function(text, lang, btn) {
            return instance.play(text, { lang: lang, triggerBtn: btn });
        };
        globalScope.speakTts = function(text, lang) {
            return instance.play(text, { lang: lang });
        };
        globalScope.speakPageAloud = function(btn) {
            return instance.speakPageAloud(btn);
        };
        globalScope.stopSpeech = function() {
            return instance.stop();
        };
    }
    if (typeof module === 'object' && module && module.exports) {
        module.exports = instance;
    }
}(typeof self !== 'undefined' ? self : (typeof globalThis !== 'undefined' ? globalThis : this), function () {
    'use strict';

    // State object - Single Source of Truth
    const state = {
        currentAudio: null,
        currentText: '',
        currentLanguage: 'te',
        isPlaying: false,
        isPaused: false,
        isLoading: false,
        currentSection: null, // { id, title, text, lang }
        currentSectionIndex: -1,
        queue: [], // Array of section objects
        activeMode: 'idle', // 'idle' | 'single' | 'queue'
        listeners: new Set(),
        lastError: null,
        triggerButton: null
    };

    /**
     * Get current active UI language ('te' | 'en')
     */
    function resolveLanguage(explicitLang) {
        if (explicitLang === 'en' || explicitLang === 'en-IN') return 'en';
        if (explicitLang === 'te' || explicitLang === 'te-IN') return 'te';
        if (typeof window !== 'undefined' && window.getLang && typeof window.getLang === 'function') {
            return window.getLang() === 'en' ? 'en' : 'te';
        }
        if (typeof window !== 'undefined' && window.SmartGovI18n && typeof window.SmartGovI18n.getLang === 'function') {
            return window.SmartGovI18n.getLang() === 'en' ? 'en' : 'te';
        }
        if (typeof document !== 'undefined' && document.documentElement.getAttribute('lang') === 'en') {
            return 'en';
        }
        return 'te';
    }

    // Monotonically increasing playback session ID to invalidate stale async promises and aborts
    let currentPlaybackSession = 0;

    /**
     * Checks if an error is a benign abort/cancellation triggered by switching tracks or pausing
     */
    function isAbortError(err) {
        if (!err) return false;
        if (err.name === 'AbortError' || err.code === 20) return true;
        const msg = String(err.message || err).toLowerCase();
        return msg.includes('interrupted') ||
               msg.includes('pause') ||
               msg.includes('abort') ||
               msg.includes('cancel') ||
               msg.includes('new load request') ||
               msg.includes('play() request was interrupted');
    }

    /**
     * Subscribe to state updates
     */
    function subscribe(listener) {
        if (typeof listener === 'function') {
            state.listeners.add(listener);
        }
        return function unsubscribe() {
            state.listeners.delete(listener);
        };
    }

    /**
     * Notify state change to listeners and update DOM UI
     */
    function notify() {
        const snapshot = getSnapshot();
        state.listeners.forEach(fn => {
            try { fn(snapshot); } catch (e) { console.error('AudioController listener error:', e); }
        });
        if (typeof document !== 'undefined') {
            updateDOMUI(snapshot);
        }
    }

    function getSnapshot() {
        return {
            isPlaying: state.isPlaying,
            isPaused: state.isPaused,
            isLoading: state.isLoading,
            currentText: state.currentText,
            currentLanguage: state.currentLanguage,
            currentSection: state.currentSection ? { ...state.currentSection } : null,
            currentSectionIndex: state.currentSectionIndex,
            queueLength: state.queue.length,
            queue: state.queue.slice(),
            activeMode: state.activeMode,
            lastError: state.lastError
        };
    }

    /**
     * Stop active audio and clear the queue completely
     */
    function stop() {
        currentPlaybackSession++; // Invalidate active session immediately
        if (state.currentAudio) {
            const oldAudio = state.currentAudio;
            state.currentAudio = null;
            oldAudio._aborted = true;
            oldAudio._sessionId = 0;
            // Remove listeners immediately to avoid phantom events
            oldAudio.onplay = null;
            oldAudio.onpause = null;
            oldAudio.onended = null;
            oldAudio.onerror = null;
            try {
                oldAudio.pause();
                oldAudio.currentTime = 0;
                oldAudio.removeAttribute('src');
                if (typeof oldAudio.load === 'function') {
                    oldAudio.load();
                }
            } catch (e) {
                // Ignore pause/abort errors
            }
        }

        state.isPlaying = false;
        state.isPaused = false;
        state.isLoading = false;
        state.currentText = '';
        state.currentSection = null;
        state.currentSectionIndex = -1;
        state.queue = [];
        state.activeMode = 'idle';
        state.lastError = null;

        notify();
        return true;
    }

    /**
     * Pause active audio without clearing the queue
     */
    function pause() {
        if (state.currentAudio && !state.currentAudio.paused) {
            try {
                state.currentAudio.pause();
            } catch (e) {
                console.warn('AudioController pause warning:', e);
            }
        }
        state.isPaused = true;
        state.isPlaying = false;
        state.isLoading = false;
        notify();
        return true;
    }

    /**
     * Resume active audio from paused position
     */
    function resume() {
        if (state.currentAudio && state.isPaused) {
            state.isLoading = true;
            notify();
            const playPromise = state.currentAudio.play();
            if (playPromise && typeof playPromise.then === 'function') {
                playPromise.then(() => {
                    state.isPlaying = true;
                    state.isPaused = false;
                    state.isLoading = false;
                    notify();
                }).catch(err => {
                    console.error('AudioController resume failed:', err);
                    state.isPlaying = false;
                    state.isPaused = true;
                    state.isLoading = false;
                    notify();
                });
            } else {
                state.isPlaying = true;
                state.isPaused = false;
                state.isLoading = false;
                notify();
            }
            return true;
        }

        // If paused between queue items
        if (state.queue.length > 0 && state.currentSectionIndex >= 0 && state.currentSectionIndex < state.queue.length) {
            playSection(state.queue[state.currentSectionIndex]);
            return true;
        }

        return false;
    }

    /**
     * Build TTS Audio URL
     */
    function buildTtsUrl(text, lang) {
        const cleanText = (text || '').trim().slice(0, 1500);
        return `/api/tts?text=${encodeURIComponent(cleanText)}&lang=${encodeURIComponent(lang)}`;
    }

    /**
     * Play single text snippet
     */
    function play(text, options) {
        const opts = options || {};
        if (!text || typeof text !== 'string' || !text.trim()) {
            return false;
        }

        // Stop any currently playing audio and clear previous queue
        stop();

        const lang = resolveLanguage(opts.lang);
        state.currentLanguage = lang;
        state.currentText = text.trim();
        state.activeMode = 'single';
        state.currentSection = {
            id: opts.id || 'single',
            title: opts.title || (lang === 'en' ? 'Audio Guide' : 'ఆడియో గైడ్'),
            text: text.trim(),
            lang: lang
        };
        state.currentSectionIndex = 0;
        state.queue = [state.currentSection];
        state.triggerButton = opts.triggerBtn || null;
        state.isLoading = true;
        state.lastError = null;

        notify();
        return executeAudioPlayback(text.trim(), lang);
    }

    /**
     * Play a controlled list of sections one by one
     */
    function playQueue(sections, options) {
        const opts = options || {};
        if (!Array.isArray(sections) || sections.length === 0) {
            return false;
        }

        // Filter valid sections with non-empty text
        const validSections = sections
            .map((sec, idx) => ({
                id: sec.id || `section-${idx + 1}`,
                title: sec.title || (opts.lang === 'en' ? `Section ${idx + 1}` : `భాగం ${idx + 1}`),
                text: (sec.text || '').trim(),
                lang: resolveLanguage(sec.lang || opts.lang)
            }))
            .filter(sec => sec.text.length > 0);

        if (validSections.length === 0) {
            return false;
        }

        // Stop any currently playing audio and reset
        stop();

        const lang = resolveLanguage(opts.lang);
        state.currentLanguage = lang;
        state.activeMode = 'queue';
        state.queue = validSections;
        state.currentSectionIndex = 0;
        state.triggerButton = opts.triggerBtn || null;
        state.lastError = null;

        return playCurrentQueueIndex();
    }

    /**
     * Play the section at currentSectionIndex in the queue
     */
    function playCurrentQueueIndex() {
        if (state.activeMode !== 'queue') return false;
        if (state.currentSectionIndex < 0 || state.currentSectionIndex >= state.queue.length) {
            // Queue complete!
            stop();
            return true;
        }

        const section = state.queue[state.currentSectionIndex];
        state.currentSection = section;
        state.currentText = section.text;
        state.currentLanguage = resolveLanguage(section.lang || state.currentLanguage);
        state.isLoading = true;
        state.isPlaying = false;
        state.isPaused = false;

        notify();
        return executeAudioPlayback(section.text, state.currentLanguage);
    }

    /**
     * Instantiate Audio element and handle playback lifecycle
     */
    function executeAudioPlayback(text, lang) {
        const sessionId = ++currentPlaybackSession;
        const ttsUrl = buildTtsUrl(text, lang);
        let audio;

        try {
            if (typeof Audio !== 'undefined') {
                audio = new Audio(ttsUrl);
            } else if (typeof window !== 'undefined' && window.Audio) {
                audio = new window.Audio(ttsUrl);
            } else {
                throw new Error('Audio element not supported in this environment');
            }
        } catch (instantiateErr) {
            console.error('AudioController instantiation error:', instantiateErr);
            handlePlaybackError(instantiateErr, sessionId);
            return false;
        }

        audio._sessionId = sessionId;
        audio._aborted = false;
        state.currentAudio = audio;

        audio.onplay = function () {
            if (audio._aborted || audio._sessionId !== currentPlaybackSession) return;
            state.isPlaying = true;
            state.isPaused = false;
            state.isLoading = false;
            notify();
        };

        audio.onpause = function () {
            if (audio._aborted || audio._sessionId !== currentPlaybackSession) return;
            // Only toggle pause if not naturally transitioning
            if (state.isPlaying && !audio.ended) {
                state.isPaused = true;
                state.isPlaying = false;
                notify();
            }
        };

        audio.onended = function () {
            if (audio._aborted || audio._sessionId !== currentPlaybackSession) return;
            handleAudioEnded();
        };

        audio.onerror = function (errEvent) {
            if (audio._aborted || audio._sessionId !== currentPlaybackSession) return;
            const err = (audio.error && audio.error.message) ? audio.error.message : 'Audio playback error';
            console.error('AudioController playback error event:', err);
            handlePlaybackError(new Error(err), sessionId);
        };

        // Trigger play
        try {
            const playPromise = audio.play();
            if (playPromise && typeof playPromise.then === 'function') {
                playPromise.then(() => {
                    if (audio._aborted || audio._sessionId !== currentPlaybackSession) {
                        try { audio.pause(); } catch (e) {}
                        return;
                    }
                    state.isPlaying = true;
                    state.isPaused = false;
                    state.isLoading = false;
                    notify();
                }).catch(playErr => {
                    // Suppress abort/interruption errors when user paused, stopped, or clicked another tile
                    if (audio._aborted || audio._sessionId !== currentPlaybackSession || isAbortError(playErr)) {
                        return;
                    }
                    console.warn('AudioController play() promise caught:', playErr.message);
                    handlePlaybackError(playErr, sessionId);
                });
            }
        } catch (syncErr) {
            if (audio._aborted || audio._sessionId !== currentPlaybackSession || isAbortError(syncErr)) {
                return false;
            }
            handlePlaybackError(syncErr, sessionId);
            return false;
        }

        return true;
    }

    /**
     * Handle audio track natural end
     */
    function handleAudioEnded() {
        if (state.activeMode === 'queue') {
            const nextIndex = state.currentSectionIndex + 1;
            if (nextIndex < state.queue.length) {
                state.currentSectionIndex = nextIndex;
                playCurrentQueueIndex();
                return;
            }
        }

        // Single track or reached end of queue
        stop();
    }

    /**
     * Handle TTS / Audio error gracefully without crashing or showing false alarms on track aborts
     */
    function handlePlaybackError(error, sessionId) {
        // Discard error if it belongs to a past session or was aborted by the user
        if (sessionId && sessionId !== currentPlaybackSession) {
            return;
        }
        if (isAbortError(error)) {
            return;
        }

        state.lastError = error ? (error.message || String(error)) : 'Unknown audio error';
        const isEn = state.currentLanguage === 'en';
        const friendlyMessage = isEn
            ? 'Audio could not be loaded. Please click to retry.'
            : 'ఆడియో లోడ్ కాలేదు. దయచేసి మళ్లీ ప్రయత్నించండి.';

        if (typeof window !== 'undefined' && typeof window.showToast === 'function') {
            window.showToast(friendlyMessage, 'error');
        }

        // Clean up audio without crashing
        if (state.currentAudio && (state.currentAudio._sessionId === sessionId || !sessionId)) {
            try {
                state.currentAudio.pause();
            } catch (e) {}
            state.currentAudio = null;
        }
        state.isPlaying = false;
        state.isPaused = false;
        state.isLoading = false;
        notify();
    }

    /**
     * Explicit Language Switch handler:
     * When user switches Telugu <-> English, immediately stop playing audio,
     * clear the queue, and reset controls to idle.
     */
    function onLanguageChange(newLang) {
        const resolved = resolveLanguage(newLang);
        stop();
        state.currentLanguage = resolved;
        notify();
    }

    /**
     * Full Page / Scheme Read Aloud:
     * Collects ONLY meaningful visible scheme content (Title, Overview, Eligibility, Benefits, Documents, Steps).
     * Excludes buttons, navigation, headers, footers, technical IDs, and hidden elements.
     */
    function speakPageAloud(btn) {
        if (typeof document === 'undefined') return false;

        const isEn = resolveLanguage() === 'en';

        // 1. Title
        const titleEl = document.querySelector('.result-head h2') || document.querySelector('#resultArea h2');
        const schemeTitle = titleEl ? titleEl.textContent.replace(/✨\s*AI-Generated/gi, '').trim() : '';

        // 2. Subtitle / Level
        const subEls = Array.from(document.querySelectorAll('.result-head p'));
        const subText = subEls.map(p => p.textContent.trim()).filter(Boolean).join(' • ');

        // 3. Sections from info cards
        const infoCards = Array.from(document.querySelectorAll('.info-list .info-card, #resultArea .info-card'));
        const sections = [];

        if (schemeTitle) {
            sections.push({
                id: 'scheme-title',
                title: isEn ? 'Scheme Title' : 'పథకం పేరు',
                text: `${schemeTitle}. ${subText}`
            });
        }

        infoCards.forEach((card, idx) => {
            const h3 = card.querySelector('h3');
            const p = card.querySelector('p');
            const sectionTitle = h3 ? h3.textContent.trim() : (isEn ? `Detail ${idx + 1}` : `వివరం ${idx + 1}`);
            const sectionText = p ? p.textContent.trim() : '';
            if (sectionText) {
                sections.push({
                    id: `card-${idx}`,
                    title: sectionTitle,
                    text: `${sectionTitle}: ${sectionText}`
                });
            }
        });

        // 4. Required documents if present
        const docItems = Array.from(document.querySelectorAll('.checklist-item label, .doc-checklist label'));
        if (docItems.length > 0) {
            const docsList = docItems.map(item => item.textContent.trim()).filter(Boolean).join(', ');
            sections.push({
                id: 'docs',
                title: isEn ? 'Required Documents' : 'కావలసిన పత్రాలు',
                text: isEn ? `Required documents: ${docsList}` : `కావలసిన పత్రాలు: ${docsList}`
            });
        }

        if (sections.length === 0) {
            const emptyMsg = isEn ? 'Please select a scheme to listen.' : 'దయచేసి వినడానికి ముందుగా ఒక పథకాన్ని ఎంచుకోండి.';
            if (typeof window !== 'undefined' && typeof window.showToast === 'function') {
                window.showToast(emptyMsg, 'warning');
            }
            return false;
        }

        return playQueue(sections, { lang: isEn ? 'en' : 'te', triggerBtn: btn });
    }

    /**
     * Update DOM UI:
     * Controls the floating / persistent Audio Bar and syncs section audio buttons.
     */
    function updateDOMUI(snap) {
        if (typeof document === 'undefined') return;

        // 1. Ensure audio controller container exists in DOM
        let bar = document.getElementById('smartgovAudioPlayerBar');
        if (!bar) {
            bar = createAudioPlayerBarElement();
            document.body.appendChild(bar);
        }

        const isEn = snap.currentLanguage === 'en';

        // 2. Visibility: Show player whenever active (playing, paused, loading)
        const isActive = snap.isPlaying || snap.isPaused || snap.isLoading;
        if (isActive) {
            bar.classList.remove('hidden');
            bar.style.display = 'flex';
        } else {
            bar.classList.add('hidden');
            bar.style.display = 'none';
        }

        // 3. Update Status and Section Progress
        const titleEl = document.getElementById('audioBarTitle');
        const progressEl = document.getElementById('audioBarProgress');
        const playPauseBtn = document.getElementById('audioBarPlayPauseBtn');
        const stopBtn = document.getElementById('audioBarStopBtn');

        if (titleEl) {
            if (snap.isLoading) {
                titleEl.textContent = isEn ? '⏳ Loading audio...' : '⏳ ఆడియో లోడ్ అవుతోంది...';
            } else if (snap.currentSection) {
                const prefix = snap.isPaused
                    ? (isEn ? '⏸ Paused: ' : '⏸ నిలిపివేయబడింది: ')
                    : (isEn ? '🔊 Reading: ' : '🔊 చదువుతున్నాం: ');
                titleEl.textContent = `${prefix}${snap.currentSection.title}`;
            } else {
                titleEl.textContent = isEn ? '🔊 SmartGov Voice Guide' : '🔊 స్మార్ట్‌గవ్ వాయిస్ గైడ్';
            }
        }

        if (progressEl) {
            if (snap.queueLength > 1 && snap.currentSectionIndex >= 0) {
                progressEl.textContent = `${snap.currentSectionIndex + 1} / ${snap.queueLength}`;
                progressEl.style.display = 'inline-block';
            } else {
                progressEl.style.display = 'none';
            }
        }

        // 4. Update Play / Pause / Resume Button
        if (playPauseBtn) {
            if (snap.isLoading) {
                playPauseBtn.disabled = true;
                playPauseBtn.innerHTML = `<span class="btn-icon">⏳</span> <span class="btn-text">${isEn ? 'Loading...' : 'లోడింగ్...'}</span>`;
            } else if (snap.isPlaying) {
                playPauseBtn.disabled = false;
                playPauseBtn.setAttribute('aria-label', isEn ? 'Pause Audio' : 'ఆడియో పాజ్ చేయండి');
                playPauseBtn.innerHTML = `<span class="btn-icon">⏸️</span> <span class="btn-text">${isEn ? 'Pause' : 'పాజ్'}</span>`;
            } else if (snap.isPaused) {
                playPauseBtn.disabled = false;
                playPauseBtn.setAttribute('aria-label', isEn ? 'Resume Audio' : 'ఆడియో కొనసాగించండి');
                playPauseBtn.innerHTML = `<span class="btn-icon">▶️</span> <span class="btn-text">${isEn ? 'Resume' : 'కొనసాగించండి'}</span>`;
            } else {
                playPauseBtn.disabled = false;
                playPauseBtn.setAttribute('aria-label', isEn ? 'Listen' : 'వినండి');
                playPauseBtn.innerHTML = `<span class="btn-icon">🔊</span> <span class="btn-text">${isEn ? 'Listen' : 'వినండి'}</span>`;
            }
        }

        // 5. Update Stop Button
        if (stopBtn) {
            stopBtn.setAttribute('aria-label', isEn ? 'Stop Audio' : 'ఆడియో ఆపండి');
            stopBtn.innerHTML = `<span class="btn-icon">⏹️</span> <span class="btn-text">${isEn ? 'Stop' : 'ఆపండి'}</span>`;
        }

        // 6. Sync inline Speak Page Buttons on the page
        const speakPageBtns = document.querySelectorAll('.speak-page-btn');
        speakPageBtns.forEach(btn => {
            if (isActive) {
                if (snap.isPlaying) {
                    btn.classList.add('audio-active');
                    btn.innerHTML = `⏸️ ${isEn ? 'Pause Voice Guide' : 'ఆడియో పాజ్ చేయండి'}`;
                } else if (snap.isPaused) {
                    btn.classList.add('audio-active');
                    btn.innerHTML = `▶️ ${isEn ? 'Resume Voice Guide' : 'ఆడియో కొనసాగించండి'}`;
                } else if (snap.isLoading) {
                    btn.innerHTML = `⏳ ${isEn ? 'Loading Audio...' : 'ఆడియో లోడ్ అవుతోంది...'}`;
                }
            } else {
                btn.classList.remove('audio-active');
                btn.innerHTML = `🔊 ${isEn ? 'Listen in English (Neural Voice)' : 'పథకం వివరాలు వినండి (తెలుగు వాయిస్)'}`;
            }
        });

        // 7. Sync Section Audio Buttons
        const sectionBtns = document.querySelectorAll('.section-audio-btn');
        sectionBtns.forEach(btn => {
            const btnSecId = btn.dataset.sectionId || btn.dataset.title;
            const isThisSectionPlaying = isActive && snap.currentSection && (snap.currentSection.id === btnSecId || snap.currentSection.title === btnSecId);
            if (isThisSectionPlaying) {
                btn.classList.add('active-playing');
                btn.textContent = snap.isPaused ? '▶️' : '⏸️';
                btn.title = snap.isPaused ? (isEn ? 'Resume' : 'కొనసాగించండి') : (isEn ? 'Pause' : 'పాజ్');
            } else {
                btn.classList.remove('active-playing');
                btn.textContent = '🔊';
                btn.title = isEn ? 'Listen to this section' : 'ఈ విభాగం వినండి';
            }
        });
    }

    /**
     * Create floating touch-friendly audio player element with civic theme styling
     */
    function createAudioPlayerBarElement() {
        const div = document.createElement('div');
        div.id = 'smartgovAudioPlayerBar';
        div.className = 'smartgov-audio-bar hidden';
        div.setAttribute('role', 'region');
        div.setAttribute('aria-label', 'Audio Player Controls');

        div.innerHTML = `
            <div class="audio-bar-content">
                <div class="audio-bar-info">
                    <span id="audioBarTitle" class="audio-bar-title">🔊 స్మార్ట్‌గవ్ వాయిస్ గైడ్</span>
                    <span id="audioBarProgress" class="audio-bar-progress" style="display:none;">1 / 1</span>
                </div>
                <div class="audio-bar-controls">
                    <button type="button" id="audioBarPlayPauseBtn" class="audio-control-btn btn-playpause" aria-label="Pause/Resume">
                        <span class="btn-icon">⏸️</span> <span class="btn-text">పాజ్</span>
                    </button>
                    <button type="button" id="audioBarStopBtn" class="audio-control-btn btn-stop" aria-label="Stop Audio">
                        <span class="btn-icon">⏹️</span> <span class="btn-text">ఆపండి</span>
                    </button>
                </div>
            </div>
        `;

        // Bind Control Events
        const playPauseBtn = div.querySelector('#audioBarPlayPauseBtn');
        const stopBtn = div.querySelector('#audioBarStopBtn');

        if (playPauseBtn) {
            playPauseBtn.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                if (state.isPlaying) {
                    pause();
                } else if (state.isPaused) {
                    resume();
                }
            });
        }

        if (stopBtn) {
            stopBtn.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                stop();
            });
        }

        return div;
    }

    // Return Public API
    return {
        // State getters
        getState: getSnapshot,
        getAudio: function () { return state.currentAudio; },
        getCurrentLanguage: function () { return state.currentLanguage; },
        isPlaying: function () { return state.isPlaying; },
        isPaused: function () { return state.isPaused; },
        isLoading: function () { return state.isLoading; },
        getQueue: function () { return state.queue.slice(); },

        // Playback Actions
        play: play,
        playQueue: playQueue,
        pause: pause,
        resume: resume,
        stop: stop,
        speakPageAloud: speakPageAloud,

        // Lifecycle & Configuration
        onLanguageChange: onLanguageChange,
        resolveLanguage: resolveLanguage,
        subscribe: subscribe,
        notify: notify
    };
}));
