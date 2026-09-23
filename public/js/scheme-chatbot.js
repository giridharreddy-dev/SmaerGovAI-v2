/**
 * SchemeChatbot - Real-time AI Health Scheme Assistant powered by Gemini API
 * Provides multi-turn conversational AI, voice recognition, TTS playback,
 * and grounded Andhra Pradesh & National Healthcare scheme guidance.
 */

class SchemeChatbot {
    constructor(options = {}) {
        this.containerId = options.containerId || 'chatModal';
        this.apiEndpoint = options.apiEndpoint || '/api/chat';
        this.history = [];
        this.mode = options.mode || 'general'; // 'fast' (flash-lite), 'general' (3.5-flash), 'complex' (3.1-pro)
        this.lang = options.lang || (window.getLang ? window.getLang() : 'en');
        this.isListening = false;
        this.isThinking = false;
        this.recognition = null;
        this.onMessageReceived = options.onMessageReceived || null;
    }

    /**
     * Initialize the chatbot and bind event listeners
     */
    init() {
        const dialog = document.getElementById(this.containerId);
        if (!dialog) {
            console.warn(`[SchemeChatbot] Target container '#${this.containerId}' not found.`);
            return;
        }

        const form = document.getElementById('chatForm');
        const input = document.getElementById('chatInput');
        const micBtn = document.getElementById('chatMicBtn');
        const clearBtn = document.getElementById('chatClearHistoryBtn');

        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const text = input ? input.value.trim() : '';
                if (text) {
                    if (input) input.value = '';
                    await this.sendMessage(text);
                }
            });
        }

        if (micBtn) {
            micBtn.addEventListener('click', () => this.toggleVoiceInput());
        }

        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.reset());
        }

        const downloadBtn = document.getElementById('downloadChatBtn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => this.downloadHistory());
        }

        // Handle model selector pills if present
        const modelPills = document.querySelectorAll('.chat-model-pill, .model-chip');
        modelPills.forEach(pill => {
            pill.addEventListener('click', () => {
                modelPills.forEach(p => {
                    p.classList.remove('active');
                    p.setAttribute('aria-checked', 'false');
                });
                pill.classList.add('active');
                pill.setAttribute('aria-checked', 'true');
                this.mode = pill.dataset.mode || 'general';
                this.updateModelBadge();
            });
        });

        // Sync initial language
        window.addEventListener('languagechange', (e) => {
            if (e.detail && e.detail.lang) {
                this.lang = e.detail.lang;
            }
        });

        console.log('🤖 SchemeChatbot initialized with Gemini API integration.');
    }

    /**
     * Download conversation history as formatted text file
     */
    downloadHistory() {
        const isEn = (window.getLang ? window.getLang() : this.lang) === 'en';
        if (!this.history || this.history.length === 0) {
            alert(isEn 
                ? 'No conversation history available to download.' 
                : 'డౌన్‌లోడ్ చేయడానికి ఎటువంటి చాట్ సంభాషణ నమోదు కాలేదు.');
            return;
        }

        const now = new Date();
        const formattedDate = now.toLocaleDateString() + ' ' + now.toLocaleTimeString();

        let exportContent = `===========================================================\n`;
        exportContent += ` SmartGovAI - Healthcare & Welfare Schemes Chat Summary\n`;
        exportContent += ` Date & Time: ${formattedDate}\n`;
        exportContent += ` Total Exchanged Turns: ${this.history.length}\n`;
        exportContent += `===========================================================\n\n`;

        this.history.forEach((turn, idx) => {
            const isUser = turn.role === 'user';
            const speaker = isUser 
                ? (isEn ? '👤 User' : '👤 మీరు (యూజర్)')
                : (isEn ? '🤖 SmartGovAI Health Advisor' : '🤖 SmartGovAI ఆరోగ్య సహాయకుడు');
            
            exportContent += `-----------------------------------------------------------\n`;
            exportContent += `Turn #${idx + 1} - ${speaker}\n`;
            exportContent += `-----------------------------------------------------------\n`;
            exportContent += `${turn.content || turn.text || ''}\n\n`;
        });

        exportContent += `===========================================================\n`;
        exportContent += ` Official Helplines:\n`;
        exportContent += ` • Emergency Ambulance: 108\n`;
        exportContent += ` • Health Information & Advice: 104\n`;
        exportContent += ` • Mother & Child Drop Back Service: 102\n`;
        exportContent += `===========================================================\n`;

        const blob = new Blob([exportContent], { type: 'text/plain;charset=utf-8' });
        const downloadUrl = URL.createObjectURL(blob);
        const downloadLink = document.createElement('a');
        const filenameDate = now.toISOString().slice(0, 10);
        downloadLink.download = `SmartGovAI-Health-Chat-${filenameDate}.txt`;
        downloadLink.href = downloadUrl;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
    }

    /**
     * Send user question to Gemini API and stream/render response
     */
    async sendMessage(query, overrideMode = null) {
        if (!query || this.isThinking) return;

        const effectiveMode = overrideMode || this.mode;
        const messagesContainer = document.getElementById('chatMessages');
        const isEn = (window.getLang ? window.getLang() : this.lang) === 'en';

        // 1. Append User Message
        this.appendMessage('user', query);
        this.history.push({ role: 'user', content: query });

        // 2. Show Typing Indicator
        this.isThinking = true;
        const typingId = this.showTypingIndicator(effectiveMode);

        try {
            // 3. Call Gemini Chat API Endpoint
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: query,
                    history: this.history.slice(-10),
                    lang: isEn ? 'en' : 'te',
                    mode: effectiveMode
                })
            });

            const data = await response.json();
            this.removeTypingIndicator(typingId);
            this.isThinking = false;

            if (data.error) {
                const errMsg = isEn ? `Sorry, an error occurred: ${data.error}` : `క్షమించండి, ప్రతిస్పందన లోపం: ${data.error}`;
                this.appendMessage('assistant', errMsg);
                return;
            }

            const answer = data.response || data.answer || data.text || (isEn ? 'No response received.' : 'సమాధానం అందలేదు.');
            const matchedSchemes = data.matched_schemes || [];
            const modelUsed = data.model_used || this.getModelLabel(effectiveMode);

            // 4. Append AI Assistant Message
            this.appendMessage('assistant', answer, {
                model: modelUsed,
                matchedSchemes: matchedSchemes
            });

            // Auto-scroll to bottom after message is added
            this.scrollToBottom(true);

            // 5. Update Conversation History
            this.history.push({ role: 'assistant', content: answer });

            if (typeof this.onMessageReceived === 'function') {
                this.onMessageReceived(answer, data);
            }

        } catch (err) {
            console.error('[SchemeChatbot] Error sending message:', err);
            this.removeTypingIndicator(typingId);
            this.isThinking = false;

            const fallbackText = isEn 
                ? 'Network issue detected. Please verify your connection or re-try your health scheme query.'
                : 'నెట్‌వర్క్ ఇబ్బంది ఉంది. దయచేసి మీ ఇంటర్నెట్ కనెక్షన్ సరిచూసుకుని మళ్ళీ ప్రయత్నించండి.';
            this.appendMessage('assistant', fallbackText);
            this.scrollToBottom(true);
        }
    }

    /**
     * Auto-scroll the chat message window to the bottom
     */
    scrollToBottom(smooth = true) {
        const container = document.getElementById('chatMessages');
        if (!container) return;

        const performScroll = () => {
            try {
                container.scrollTo({
                    top: container.scrollHeight,
                    behavior: smooth ? 'smooth' : 'auto'
                });
            } catch (e) {
                container.scrollTop = container.scrollHeight;
            }
        };

        // Scroll immediately
        performScroll();

        // Secondary scroll after DOM reflow / layout calculation
        requestAnimationFrame(() => {
            performScroll();
            setTimeout(performScroll, 60);
            setTimeout(performScroll, 200);
        });
    }

    /**
     * Append a message bubble to the chat thread
     */
    appendMessage(role, text, meta = {}) {
        const container = document.getElementById('chatMessages');
        if (!container) return;

        const isUser = role === 'user';
        const isEn = (window.getLang ? window.getLang() : this.lang) === 'en';

        const wrapper = document.createElement('div');
        wrapper.className = `chat-bubble-wrap ${isUser ? 'user-wrap' : 'bot-wrap'}`;

        const avatar = document.createElement('div');
        avatar.className = `chat-avatar ${isUser ? 'user-avatar' : 'bot-avatar'}`;
        avatar.setAttribute('aria-hidden', 'true');
        avatar.innerHTML = isUser ? '👤' : '🤖';

        const bubble = document.createElement('div');
        bubble.className = `chat-bubble ${isUser ? 'user-bubble' : 'bot-bubble'}`;

        if (isUser) {
            bubble.innerHTML = `<p>${this.escapeHtml(text)}</p>`;
            wrapper.appendChild(bubble);
            wrapper.appendChild(avatar);
        } else {
            let formattedText = this.formatResponseText(text);
            let schemeBtnsHtml = '';

            if (meta.matchedSchemes && meta.matchedSchemes.length > 0) {
                schemeBtnsHtml = `
                    <div class="chat-matched-schemes" style="margin-top: 10px; padding-top: 8px; border-top: 1px solid rgba(0,0,0,0.08); display: flex; flex-wrap: wrap; gap: 6px;">
                        <span style="font-size: 0.72rem; color: #64748b; font-weight: 600; width: 100%;">
                            ${isEn ? '📌 Related Health Schemes:' : '📌 సంబంధిత ఆరోగ్య పథకాలు:'}
                        </span>
                        ${meta.matchedSchemes.map(s => `
                            <button type="button" class="chat-scheme-btn" onclick="if(window.fetchScheme){window.fetchScheme('${this.escapeHtml(s)}'); document.getElementById('chatModal')?.close();}" style="background: var(--primary-light, #e0f2fe); color: var(--primary-dark, #0369a1); border: 1px solid #bae6fd; border-radius: 6px; padding: 4px 8px; font-size: 0.75rem; font-weight: 700; cursor: pointer;">
                                🔍 ${this.escapeHtml(s)}
                            </button>
                        `).join('')}
                    </div>
                `;
            }

            const modelBadge = meta.model ? `<span class="chat-model-badge" style="font-size: 0.68rem; background: #f1f5f9; color: #475569; padding: 2px 6px; border-radius: 4px; font-weight: 600; float: right;">🤖 ${this.escapeHtml(meta.model)}</span>` : '';

            bubble.innerHTML = `
                ${modelBadge}
                <div class="bot-text">${formattedText}</div>
                ${schemeBtnsHtml}
            `;
            wrapper.appendChild(avatar);
            wrapper.appendChild(bubble);
        }

        container.appendChild(wrapper);
        this.scrollToBottom(true);
    }

    /**
     * Show animated typing indicator while Gemini generates answer
     */
    showTypingIndicator(mode) {
        const container = document.getElementById('chatMessages');
        if (!container) return null;

        const id = 'typing_' + Date.now();
        const isEn = (window.getLang ? window.getLang() : this.lang) === 'en';
        const modelName = this.getModelLabel(mode);

        const wrapper = document.createElement('div');
        wrapper.id = id;
        wrapper.className = 'chat-bubble-wrap bot-wrap typing-wrap';
        wrapper.innerHTML = `
            <div class="chat-avatar bot-avatar" aria-hidden="true">🤖</div>
            <div class="chat-bubble bot typing" style="display: inline-flex; align-items: center; gap: 8px;">
                <div class="typing-dots-container" style="display: flex; align-items: center; gap: 4px;">
                    <span class="typing-dot"></span>
                    <span class="typing-dot"></span>
                    <span class="typing-dot"></span>
                </div>
                <span class="typing-status-text" style="font-size: 0.78rem; color: #64748b; font-weight: 600;">
                    ${isEn ? `Gemini (${modelName}) typing...` : `జెమిని (${modelName}) టైప్ చేస్తోంది...`}
                </span>
            </div>
        `;

        container.appendChild(wrapper);
        this.scrollToBottom(true);
        return id;
    }

    removeTypingIndicator(id) {
        if (!id) return;
        const el = document.getElementById(id);
        if (el) el.remove();
    }

    /**
     * Format Gemini response with basic Markdown bullet points and bolding
     */
    formatResponseText(text) {
        if (!text) return '';
        let formatted = this.escapeHtml(text)
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n\n/g, '<br><br>')
            .replace(/\n• (.*?)(?=<br>|\n|$)/g, '<br>• $1')
            .replace(/\n/g, '<br>');
        return `<p>${formatted}</p>`;
    }

    /**
     * Voice-to-Text Speech Recognition Toggle
     */
    toggleVoiceInput() {
        const micBtn = document.getElementById('chatMicBtn');
        const isEn = (window.getLang ? window.getLang() : this.lang) === 'en';

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert(isEn ? 'Speech recognition is not supported in this browser.' : 'మీ బ్రౌజర్‌లో వాయిస్ రికగ్నిషన్ సపోర్ట్ లేదు.');
            return;
        }

        if (this.isListening) {
            if (this.recognition) this.recognition.stop();
            this.isListening = false;
            if (micBtn) micBtn.classList.remove('listening');
            return;
        }

        try {
            this.recognition = new SpeechRecognition();
            this.recognition.lang = isEn ? 'en-IN' : 'te-IN';
            this.recognition.continuous = false;
            this.recognition.interimResults = true;

            this.recognition.onstart = () => {
                this.isListening = true;
                if (micBtn) micBtn.classList.add('listening');
            };

            this.recognition.onresult = (e) => {
                let interim = '';
                let final = '';

                for (let i = e.resultIndex; i < e.results.length; ++i) {
                    if (e.results[i].isFinal) {
                        final += e.results[i][0].transcript;
                    } else {
                        interim += e.results[i][0].transcript;
                    }
                }

                const spoken = (final || interim).trim();
                const input = document.getElementById('chatInput');
                if (input && spoken) {
                    input.value = spoken;
                }

                if (final) {
                    this.isListening = false;
                    if (micBtn) micBtn.classList.remove('listening');
                    this.sendMessage(final);
                }
            };

            this.recognition.onerror = (e) => {
                this.isListening = false;
                if (micBtn) micBtn.classList.remove('listening');
            };

            this.recognition.start();

        } catch (err) {
            console.error('[SchemeChatbot] Voice error:', err);
            this.isListening = false;
            if (micBtn) micBtn.classList.remove('listening');
        }
    }

    /**
     * Reset chat conversation
     */
    reset() {
        this.history = [];
        const container = document.getElementById('chatMessages');
        if (container) {
            const isEn = (window.getLang ? window.getLang() : this.lang) === 'en';
            container.innerHTML = `
                <div class="chat-bubble-wrap bot-wrap">
                    <div class="chat-avatar bot-avatar" aria-hidden="true">🤖</div>
                    <div class="chat-bubble bot-bubble">
                        <p>${isEn 
                            ? '👋 Hello! I am your SmartGovAI Health Advisor powered by Gemini. Ask me any question about Andhra Pradesh & National Health Schemes.' 
                            : '👋 నమస్కారం! నేను Gemini ద్వారా నడిచే SmartGovAI ఆరోగ్య సహాయకుడిని. ఆంధ్రప్రదేశ్ మరియు జాతీయ ఆరోగ్య పథకాల గురించి నన్ను ఏదైనా ప్రశ్న అడగండి.'
                        }</p>
                    </div>
                </div>
            `;
        }
    }

    open() {
        const dialog = document.getElementById(this.containerId);
        if (dialog && typeof dialog.showModal === 'function') {
            dialog.showModal();
            document.getElementById('chatInput')?.focus();
        }
    }

    close() {
        const dialog = document.getElementById(this.containerId);
        if (dialog && typeof dialog.close === 'function') {
            dialog.close();
        }
    }

    getModelLabel(mode) {
        if (mode === 'fast') return 'gemini-3.1-flash-lite';
        if (mode === 'complex') return 'gemini-3.1-pro-preview';
        return 'gemini-3.5-flash';
    }

    updateModelBadge() {
        const badge = document.getElementById('chatActiveModelBadge');
        if (badge) {
            badge.textContent = `🤖 ${this.getModelLabel(this.mode)}`;
        }
    }

    escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}

// Global Export
window.SchemeChatbot = SchemeChatbot;
window.smartGovChatbot = new SchemeChatbot();

document.addEventListener('DOMContentLoaded', () => {
    window.smartGovChatbot.init();
});
