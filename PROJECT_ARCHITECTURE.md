# 🏛️ SmartGovAI - System Architecture & Technical Documentation

SmartGovAI is an offline-resilient, Telugu-first public health welfare advisor designed for Andhra Pradesh citizens. It enables users to search, simplify, compare, and get real-time AI guidance on state and national health schemes (such as Dr. YSR Aarogyasri ₹25 Lakhs coverage, Aarogya Asara, maternal assistance, free medicines, and dialysis support).

---

## 🛠️ Technology Stack

| Category | Technology / Library | Purpose & Function |
| :--- | :--- | :--- |
| **Backend Framework** | Node.js (v18+) & Express.js | Core Web Server, REST API routes, scheme retrieval, and Gemini AI proxy endpoints. |
| **Templating Engine** | EJS (Embedded JavaScript) | Dynamic SSR (Server-Side Rendering) for main portal view (`views/portal.ejs`). |
| **AI Engine** | `@google/genai` TypeScript SDK | Gemini models integration for real-time scheme simplification and multi-turn chat. |
| **AI Models Used** | `gemini-3.5-flash`<br>`gemini-3.1-flash-lite`<br>`gemini-3.1-pro-preview` | Balanced queries (`3.5-flash`), high-speed voice responses (`3.1-flash-lite`), and complex medical eligibility queries (`3.1-pro-preview`). |
| **Frontend Utilities** | Native Vanilla JavaScript (ES6+) | Modern client-side logic without heavy framework overhead. |
| **Bundler & Minifier** | `esbuild` | Ultra-fast bundling of React-based analytics/dashboard bundle (`recharts-dashboard.bundle.js`). |
| **Interactive Charts** | Recharts (React) | Visualizing hospital coverage, scheme popularity, and eligibility statistics. |
| **Interactive Maps** | Leaflet.js (`leaflet.js` & OpenStreetMap) | Locating nearby empanelled hospitals, Primary Health Centres (PHCs), and Grama Sachivalayams. |
| **Speech Recognition** | Browser Web Speech API (`webkitSpeechRecognition`) | Voice-to-Text search in Telugu (`te-IN`) and English (`en-IN`). |
| **Speech Synthesis** | Microsoft Edge Neural TTS via Backend (`/api/tts`) | Server-synthesized natural MP3 voice playback for Telugu (`te-IN-ShrutiNeural`) and English (`en-IN-NeerjaNeural`). |
| **Localization & i18n** | Custom Client-side i18n Engine (`public/js/i18n.js`) | Dynamic bilingual toggle between Telugu (తెలుగు) and English. |
| **PWA & Offline** | Service Worker (`service-worker.js`), Web App Manifest | Caching static assets and offline search functionality. |
| **Styling** | Custom CSS3 with CSS Variables (`public/css/theme.css`) & Tailwind CSS | Responsive design, glassmorphism, dark mode toggle, and accessible typography. |

---

## 📁 Repository Directory & File Map

```
SmartGovAI-2026/
├── server.js                      # Main Express server entry point (API routes, Gemini proxy, NLP retrieval)
├── package.json                   # NPM dependencies, build scripts, and lint configs
├── metadata.json                  # Application metadata, permissions, and applet identifier
├── README.md                      # Primary project overview, setup commands, and user rules
├── PROJECT_ARCHITECTURE.md        # Complete system architectural guide and technology documentation
│
├── views/                         # EJS View Templates (Server-Side Rendered)
│   ├── portal.ejs                 # Main Application Portal UI (Search, Schemes, AI Assistant, Hospital Map)
│   ├── analytics.ejs              # Government Portal Analytics & Hospital Empanelment Dashboard
│   ├── offline.ejs                # Offline Fallback Page served when network disconnects
│   └── admin_login.ejs            # Administrative authentication view
│
├── public/                        # Static Frontend Web Assets
│   ├── css/
│   │   ├── theme.css              # Main application stylesheet (Responsive UI, Dark Mode, Chat, Schemes)
│   │   └── tailwind.css           # Tailwind CSS directives
│   ├── js/
│   │   ├── app-client.js          # Core client controller (DOM events, PWA sync, Audio TTS, WhatsApp share)
│   │   ├── scheme-chatbot.js      # Multi-turn SchemeChatbot component (Gemini API, Auto-scroll, Avatars, Export)
│   │   ├── scheme-nlp-search.js   # Client-side NLP fuzzy matching, recent search history, and instant filter
│   │   ├── i18n.js                # Bilingual dictionary & translation engine (Telugu <-> English)
│   │   └── recharts-dashboard.bundle.js # Esbuild bundled React Recharts dashboard
│   ├── assets/                    # Static images, icons, Leaflet assets, and audio pre-caches
│   ├── service-worker.js          # Service Worker script handling offline caching and cache-first strategies
│   └── manifest.json              # Progressive Web App (PWA) manifest file
│
├── src/                           # Frontend React Components
│   └── dashboard/
│       └── index.jsx              # Recharts analytics dashboard components
│
├── services/                      # Backend Core Business Services
│   ├── schemeData.js              # Authoritative AP Health Scheme Knowledge Base (Aarogyasri, Asara, etc.)
│   └── geminiService.js           # Gemini AI client initialization, prompt engineering, and fallback handlers
│
├── scripts/                       # Helper & Build Utilities
│   ├── build.js                   # Build script invoking esbuild for bundle compilation
│   ├── generate_audio.py          # Python gTTS pipeline to pre-render Telugu audio MP3s for scheme summaries
│   └── verify_offline.js          # Verification script checking offline cache integrity
│
└── docs/                          # Additional Documentation & Specifications
```

---

## 📄 File Details & Functional Descriptions

### 1. `server.js`
* **Purpose**: Serves as the central HTTP server built on Express.js.
* **Key Functions**:
  - Handles page routing (`/`, `/analytics`, `/offline`).
  - `/api/chat` & `/chat`: Proxies multi-turn queries to Gemini models (`gemini-3.5-flash`, `gemini-3.1-pro-preview`, `gemini-3.1-flash-lite`).
  - `/api/simplify`: Simplifies technical government scheme notifications into 3-bullet points in Telugu/English.
  - `/api/hospitals`: Returns GeoJSON/JSON lists of AP network hospitals with filter by district and specialty.
  - Implements grounded fallbacks if network or AI quotas are reached.

### 2. `views/portal.ejs`
* **Purpose**: Primary user interface template rendered for citizens.
* **Key Sections**:
  - Top Navigation & Language / Text-Size Controls.
  - Scheme Search Bar with Voice Button (`#voiceBtn`), Clear Button, and Enter trigger.
  - Feature Cards (`Ask AI Assistant`, `Step-by-Step Scheme Slides`, `Nearby Hospitals Map`, `Emergency Helplines`).
  - Multi-Turn Gemini Chat Dialog (`#chatModal`).
  - Scheme Cards List with Filtering by Category (Maternal, Elderly, Surgery, Emergency).
  - Hospital Empanelment Map Container (`#hospitalMap`).

### 3. `public/js/scheme-chatbot.js`
* **Purpose**: Modular `SchemeChatbot` frontend class powering the real-time AI assistant.
* **Key Features**:
  - Multi-turn conversation state (`this.history`).
  - Model complexity switching (`fast`, `general`, `complex`).
  - Auto-scroll behavior (`scrollToBottom()`) with layout reflow compensation.
  - Distinct User (`👤`) and Gemini Assistant (`🤖`) message bubble avatars.
  - Live typing indicator with animated bouncing dots (`typingBounce`).
  - **Export History**: Download conversation history as a formatted `.txt` transcript (`downloadHistory()`).

### 4. `public/js/app-client.js`
* **Purpose**: Client-side event orchestrator.
* **Key Features**:
  - Handles modal openings/closings (`chatModal`, `schemeDetailModal`, `hospitalMapModal`).
  - Binds Text-to-Speech audio triggers with unified AudioController and `/api/tts`.
  - Manages WhatsApp sharing deep-links with formatted scheme summaries.
  - Handles PWA install prompts and Service Worker registration logs.

### 5. `public/js/i18n.js`
* **Purpose**: Complete internationalization (i18n) dictionary.
* **Key Features**:
  - Holds comprehensive translation keys in Telugu (`te`) and English (`en`).
  - Exposes `window.t(key)` and `window.setLang(lang)` functions.
  - Dynamically updates DOM elements with `data-i18n`, `data-i18n-placeholder`, `data-i18n-title`.

### 6. `public/js/scheme-nlp-search.js`
* **Purpose**: Client-side fuzzy search and NLP query parser.
* **Key Features**:
  - Tokenizes input queries (e.g., "delivery", "cancer", "క్యాన్సర్", "operation", "25 lakhs").
  - Matches queries against local scheme catalog instantly without network delay.
  - Stores recent searches in `localStorage` with quick-clear buttons.

### 7. `services/schemeData.js`
* **Purpose**: Authoritative AP Healthcare Scheme Database.
* **Key Schemes Included**:
  - **Dr. YSR Aarogyasri**: Free treatment up to ₹25 Lakhs per family per year for 3,257 procedures.
  - **YSR Aarogya Asara**: Daily post-operative allowance (₹225/day up to ₹5,000/month) during recovery.
  - **YSR Jagananna Amma Vodi / Maternal Aid**: Financial and healthcare assistance for pregnant women and newborn care.
  - **Free Dialysis & Thalassemia Support**: Monthly pension allowance of ₹10,000 and free dialysis at PHCs.
  - **108 / 104 / 102 Helplines**: Free emergency ambulance and medical tele-consultation services.

---

## 🔒 Security & Privacy Guarantees

- **Client-Side Data Isolation**: User eligibility inputs, income choices, and search histories are stored purely within browser `localStorage` and never transmitted to external trackers.
- **No API Key Exposure**: All Gemini AI interactions occur via secure server-side Express proxy routes (`/api/chat`, `/api/simplify`). No API keys exist in client JS bundles.
