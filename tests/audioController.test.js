/**
 * tests/audioController.test.js
 * =============================================================================
 * Unified Audio Architecture Test Suite
 * =============================================================================
 * Validates:
 *   1. Telugu /api/tts voice & synthesis (te-IN-ShrutiNeural)
 *   2. English /api/tts voice & synthesis (en-IN-NeerjaNeural)
 *   3. Missing text handling
 *   4. Invalid language handling & fallback
 *   5. Audio controller play
 *   6. Audio controller pause
 *   7. Audio controller resume
 *   8. Audio controller stop
 *   9. Stop clears the queue
 *  10. Language switch stops current audio & resets queue
 *  11. No browser SpeechSynthesis remains in codebase
 *  12. Only one audio object can play at a time
 *  13. Read-aloud progresses section-by-section
 *  14. Audio completion advances to the next section
 *  15. TTS failure does not break the UI / state
 */

import { jest } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generate_text_audio, getVoiceConfig, sanitizeTeluguSpeechText } from '../services/audioService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock HTML5 Audio for Node environment
class MockAudio {
    constructor(src) {
        this.src = src;
        this.paused = true;
        this.currentTime = 0;
        this.duration = 10;
        this.ended = false;
        this.onplay = null;
        this.onpause = null;
        this.onended = null;
        this.onerror = null;
    }

    play() {
        this.paused = false;
        if (typeof this.onplay === 'function') {
            this.onplay();
        }
        return Promise.resolve();
    }

    pause() {
        this.paused = true;
        if (typeof this.onpause === 'function') {
            this.onpause();
        }
    }

    // Helper to simulate audio completion
    simulateEnd() {
        this.ended = true;
        this.paused = true;
        if (typeof this.onended === 'function') {
            this.onended();
        }
    }

    // Helper to simulate audio error
    simulateError(errorMessage = 'Network Error') {
        this.error = { message: errorMessage };
        if (typeof this.onerror === 'function') {
            this.onerror(new Error(errorMessage));
        }
    }
}

describe('Unified Audio Engine (Backend & Frontend)', () => {
    let AudioController;

    beforeAll(async () => {
        // Setup mock browser environment for AudioController
        global.Audio = MockAudio;
        global.window = {
            Audio: MockAudio,
            getLang: () => 'te',
            showToast: jest.fn()
        };
        global.document = {
            documentElement: {
                getAttribute: () => 'te'
            },
            getElementById: () => null,
            querySelectorAll: () => [],
            querySelector: () => null,
            body: {
                appendChild: jest.fn()
            },
            createElement: () => ({
                classList: { add: jest.fn(), remove: jest.fn() },
                setAttribute: jest.fn(),
                querySelector: () => null,
                querySelectorAll: () => [],
                style: {},
                appendChild: jest.fn()
            })
        };

        await import('../public/js/audio-controller.js');
        AudioController = globalThis.AudioController;
    });

    afterEach(() => {
        if (AudioController && typeof AudioController.stop === 'function') {
            AudioController.stop();
        }
    });

    // 1. Telugu /api/tts configuration and voice
    test('1. Telugu TTS uses te-IN-ShrutiNeural voice', async () => {
        const config = getVoiceConfig('te');
        expect(config.voice).toBe('te-IN-ShrutiNeural');
        expect(config.locale).toBe('te-IN');
        expect(config.lang).toBe('te');

        const result = await generate_text_audio('వైఎస్సార్ ఆరోగ్యశ్రీ పథకం', 'te');
        expect(result.voice).toBe('te-IN-ShrutiNeural');
        expect(result.lang).toBe('te');
        expect(Buffer.isBuffer(result.buffer)).toBe(true);
        expect(result.buffer.length).toBeGreaterThan(0);
    });

    // 2. English /api/tts configuration and voice
    test('2. English TTS uses en-IN-NeerjaNeural voice', async () => {
        const config = getVoiceConfig('en');
        expect(config.voice).toBe('en-IN-NeerjaNeural');
        expect(config.locale).toBe('en-IN');
        expect(config.lang).toBe('en');

        const result = await generate_text_audio('Aarogyasri Health Scheme', 'en');
        expect(result.voice).toBe('en-IN-NeerjaNeural');
        expect(result.lang).toBe('en');
        expect(Buffer.isBuffer(result.buffer)).toBe(true);
        expect(result.buffer.length).toBeGreaterThan(0);
    });

    // 3. Missing text handling
    test('3. Missing text raises an error in generate_text_audio and returns false in controller', async () => {
        await expect(generate_text_audio('')).rejects.toThrow('Text parameter is required for TTS synthesis.');
        await expect(generate_text_audio('   ')).rejects.toThrow('Text parameter is required for TTS synthesis.');
        
        const controllerRes = AudioController.play('');
        expect(controllerRes).toBe(false);
    });

    // 4. Invalid language handling
    test('4. Invalid or missing language defaults safely to Telugu', () => {
        const configInvalid = getVoiceConfig('invalid-lang');
        expect(configInvalid.voice).toBe('te-IN-ShrutiNeural');
        expect(configInvalid.lang).toBe('te');

        const resolved = AudioController.resolveLanguage('unknown');
        expect(resolved).toBe('te');
    });

    // 5. Audio controller play
    test('5. Audio controller play starts audio and updates state', () => {
        const result = AudioController.play('ఆరోగ్యశ్రీ పథకం ప్రయోజనాలు', { lang: 'te', title: 'ప్రయోజనాలు' });
        expect(result).toBe(true);

        const state = AudioController.getState();
        expect(state.isPlaying).toBe(true);
        expect(state.isPaused).toBe(false);
        expect(state.currentLanguage).toBe('te');
        expect(state.currentSection).toBeDefined();
        expect(state.currentSection.title).toBe('ప్రయోజనాలు');
        expect(AudioController.getAudio()).toBeInstanceOf(MockAudio);
        expect(AudioController.getAudio().src).toContain('/api/tts?text=');
    });

    // 6. Audio controller pause
    test('6. Audio controller pause pauses active audio without clearing state', () => {
        AudioController.play('Test audio playback', { lang: 'en' });
        expect(AudioController.isPlaying()).toBe(true);

        const pauseRes = AudioController.pause();
        expect(pauseRes).toBe(true);

        const state = AudioController.getState();
        expect(state.isPaused).toBe(true);
        expect(state.isPlaying).toBe(false);
        expect(AudioController.getAudio().paused).toBe(true);
    });

    // 7. Audio controller resume
    test('7. Audio controller resume continues playback from paused state', () => {
        AudioController.play('Resume test audio', { lang: 'en' });
        AudioController.pause();
        expect(AudioController.isPaused()).toBe(true);

        const resumeRes = AudioController.resume();
        expect(resumeRes).toBe(true);

        const state = AudioController.getState();
        expect(state.isPlaying).toBe(true);
        expect(state.isPaused).toBe(false);
    });

    // 8. Audio controller stop
    test('8. Audio controller stop resets audio, sets currentAudio to null, and enters idle state', () => {
        AudioController.play('Stopping test', { lang: 'te' });
        const initialAudio = AudioController.getAudio();
        expect(initialAudio).toBeDefined();

        AudioController.stop();

        const state = AudioController.getState();
        expect(state.isPlaying).toBe(false);
        expect(state.isPaused).toBe(false);
        expect(state.activeMode).toBe('idle');
        expect(AudioController.getAudio()).toBeNull();
        expect(initialAudio.paused).toBe(true);
        expect(initialAudio.currentTime).toBe(0);
    });

    // 9. Stop clears the queue
    test('9. Stop clears the queue and section pointers completely', () => {
        const sections = [
            { id: 'sec1', title: 'విభాగం 1', text: 'మొదటి భాగం' },
            { id: 'sec2', title: 'విభాగం 2', text: 'రెండవ భాగం' }
        ];

        AudioController.playQueue(sections, { lang: 'te' });
        expect(AudioController.getQueue().length).toBe(2);

        AudioController.stop();

        const state = AudioController.getState();
        expect(state.queue.length).toBe(0);
        expect(state.currentSectionIndex).toBe(-1);
        expect(state.currentSection).toBeNull();
    });

    // 10. Language switch stops current audio
    test('10. Language switch immediately stops active audio and resets queue', () => {
        AudioController.play('తెలుగు ఆడియో వివరణ', { lang: 'te' });
        expect(AudioController.isPlaying()).toBe(true);

        // User switches language to English
        AudioController.onLanguageChange('en');

        const state = AudioController.getState();
        expect(state.isPlaying).toBe(false);
        expect(state.isPaused).toBe(false);
        expect(state.currentLanguage).toBe('en');
        expect(AudioController.getAudio()).toBeNull();
    });

    // 11. No browser SpeechSynthesis remains in application code
    test('11. Zero active browser SpeechSynthesis references remain in client scripts', () => {
        const appClientPath = path.resolve(__dirname, '../public/js/app-client.js');
        const audioCtrlPath = path.resolve(__dirname, '../public/js/audio-controller.js');
        const portalEjsPath = path.resolve(__dirname, '../views/portal.ejs');

        const appClientCode = fs.readFileSync(appClientPath, 'utf8');
        const audioCtrlCode = fs.readFileSync(audioCtrlPath, 'utf8');
        const portalEjsCode = fs.readFileSync(portalEjsPath, 'utf8');

        expect(appClientCode).not.toContain('speechSynthesis');
        expect(appClientCode).not.toContain('SpeechSynthesisUtterance');

        expect(audioCtrlCode).not.toContain('speechSynthesis');
        expect(audioCtrlCode).not.toContain('SpeechSynthesisUtterance');

        expect(portalEjsCode).not.toContain('speechSynthesis');
        expect(portalEjsCode).not.toContain('SpeechSynthesisUtterance');
    });

    // 12. Only one audio object can play at a time
    test('12. Only one audio object can play at a time; new playback halts previous audio', () => {
        AudioController.play('First Section Text', { lang: 'en' });
        const firstAudio = AudioController.getAudio();
        expect(firstAudio.paused).toBe(false);

        // Start second playback
        AudioController.play('Second Section Text', { lang: 'en' });
        const secondAudio = AudioController.getAudio();

        expect(firstAudio.paused).toBe(true);
        expect(firstAudio.currentTime).toBe(0);
        expect(secondAudio).not.toBe(firstAudio);
        expect(secondAudio.paused).toBe(false);
    });

    // 13. Read-aloud progresses section-by-section
    test('13. Read-aloud queue correctly partitions content into individual sections', () => {
        const sections = [
            { id: 'title', title: 'పథకం పేరు', text: 'వైఎస్సార్ ఆరోగ్యశ్రీ' },
            { id: 'benefits', title: 'ప్రయోజనాలు', text: 'ఉచిత వైద్య చికిత్సలు' },
            { id: 'eligibility', title: 'అర్హత', text: 'ఆంధ్రప్రదేశ్ నివాసితులు' }
        ];

        const queueRes = AudioController.playQueue(sections, { lang: 'te' });
        expect(queueRes).toBe(true);

        const state = AudioController.getState();
        expect(state.activeMode).toBe('queue');
        expect(state.queue.length).toBe(3);
        expect(state.currentSectionIndex).toBe(0);
        expect(state.currentSection.id).toBe('title');
    });

    // 14. Audio completion advances to the next section
    test('14. Audio natural completion advances to the next queued section', () => {
        const sections = [
            { id: 'step1', title: 'దశ 1', text: 'మొదటి దశ వివరణ' },
            { id: 'step2', title: 'దశ 2', text: 'రెండవ దశ వివరణ' }
        ];

        AudioController.playQueue(sections, { lang: 'te' });
        expect(AudioController.getState().currentSectionIndex).toBe(0);

        // Simulate step 1 audio finished
        const currentAudio = AudioController.getAudio();
        currentAudio.simulateEnd();

        const stateAfterNext = AudioController.getState();
        expect(stateAfterNext.currentSectionIndex).toBe(1);
        expect(stateAfterNext.currentSection.id).toBe('step2');
        expect(stateAfterNext.isPlaying).toBe(true);

        // Simulate step 2 audio finished (queue complete)
        const secondAudio = AudioController.getAudio();
        secondAudio.simulateEnd();

        const stateAfterFinish = AudioController.getState();
        expect(stateAfterFinish.isPlaying).toBe(false);
        expect(stateAfterFinish.activeMode).toBe('idle');
    });

    // 15. TTS failure does not break the UI or throw unhandled exceptions
    test('15. Playback failure is handled gracefully without crashing UI state', () => {
        AudioController.play('Faulty Audio Test', { lang: 'en' });
        const audio = AudioController.getAudio();

        // Simulate network or synthesis error
        audio.simulateError('Failed to fetch /api/tts');

        const state = AudioController.getState();
        expect(state.isPlaying).toBe(false);
        expect(state.isPaused).toBe(false);
        expect(state.lastError).toContain('Failed to fetch');
        expect(AudioController.getAudio()).toBeNull();
    });

    // 16. Clicking another tile in the middle smoothly interrupts previous audio without false error notifications
    test('16. Clicking another tile in the middle switches audio cleanly without showing error toasts', () => {
        global.window.showToast.mockClear();

        // Start playing Tile A (Eligibility)
        AudioController.play('Eligibility: All rural citizens', { lang: 'en', title: 'Eligibility' });
        const firstAudio = AudioController.getAudio();
        expect(AudioController.getState().currentSection.title).toBe('Eligibility');

        // User clicks Tile B (Benefits) while Tile A is still playing/loading
        AudioController.play('Benefits: Free consultations and medicine', { lang: 'en', title: 'Benefits' });
        const secondAudio = AudioController.getAudio();

        expect(firstAudio._aborted).toBe(true);
        expect(secondAudio._aborted).toBe(false);
        expect(AudioController.getState().currentSection.title).toBe('Benefits');

        // Simulate browser abort error on firstAudio as it gets cancelled
        const abortErr = new Error('The play() request was interrupted by a call to pause().');
        abortErr.name = 'AbortError';
        firstAudio.simulateError(abortErr.message);

        // Crucial invariant: showToast MUST NOT have been called with an error for benign interruptions
        expect(global.window.showToast).not.toHaveBeenCalled();
        expect(AudioController.getState().isPlaying).toBe(true);
    });

    // Additional test: sanitizeTeluguSpeechText transforms common English scheme terms
    test('Sanitizes English abbreviations into natural Telugu pronunciation', () => {
        const input = 'Dr. NTR Vaidya Seva (AP Cashless Hospital Care) Dialysis and Benefits:';
        const sanitized = sanitizeTeluguSpeechText(input);
        expect(sanitized).toContain('డాక్టర్ ఎన్టీఆర్ వైద్య సేవ');
        expect(sanitized).toContain('డయాలసిస్');
        expect(sanitized).toContain('పథకం ప్రయోజనాలు:');
        expect(sanitized).not.toContain('AP Cashless');
    });
});
