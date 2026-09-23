# 🏛️ SmartGovAI Health Portal
**Civic Technology for Inclusive Healthcare & Public Welfare in Andhra Pradesh**

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](#)
[![Platform](https://img.shields.io/badge/platform-Web%20%7C%20PWA%20%7C%20Mobile-lightgrey.svg)](#)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-success.svg)](#)
[![React](https://img.shields.io/badge/React-18.x-61dafb.svg)](#)
[![Gemini API](https://img.shields.io/badge/Gemini%20API-%40google%2Fgenai-8e44ad.svg)](#)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore%20%26%20Auth-ffca28.svg)](#)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

---

## 📖 Overview
**SmartGovAI** is an offline-resilient, bilingual (**Telugu-first** & English) civic technology portal engineered to make healthcare welfare schemes accessible to every citizen in Andhra Pradesh. 

By integrating state healthcare provisions (such as **Dr. YSR Aarogyasri ₹25 Lakhs free hospital coverage**, **YSR Aarogya Asara**, maternal aid, free medicines, and dialysis pensions) with multimodal **Gemini AI**, interactive **React / Recharts** analytics, **Firebase Firestore & Auth**, and **PWA offline caching**, SmartGovAI ensures citizens receive instant, verified, and simplified guidance—even in low-bandwidth rural regions.

> 🏛️ **Deep Architectural Directory**: Need detailed documentation on every file in the codebase? Read **[PROJECT_ARCHITECTURE.md](PROJECT_ARCHITECTURE.md)**.

---

## 🛠️ Technology Stack

| Category | Technology / Library | Purpose & Implementation |
| :--- | :--- | :--- |
| **Backend** | **Node.js (v18+) & Express.js** | Core web application server, REST APIs, and server-side proxy routes for Gemini AI. |
| **Frontend UI** | **Vanilla ES6 JS, EJS, Tailwind CSS** | Server-side rendered views (`portal.ejs`, `analytics.ejs`) and modular client controllers. |
| **Data & Charts** | **React & Recharts** | High-performance interactive analytics dashboard bundled via `esbuild`. |
| **AI Engine** | **`@google/genai` TypeScript SDK** | Gemini models (`gemini-3.5-flash`, `gemini-3.1-flash-lite`, `gemini-3.1-pro-preview`) for multi-turn assistance and document simplification. |
| **Database & Auth** | **Firebase (Firestore & Auth)** | Cloud database persistence for application metadata, user accounts, and security rule enforcement. |
| **Interactive Maps** | **Leaflet.js & OpenStreetMap** | Geolocation mapping for empanelled hospitals, Primary Health Centres (PHCs), and Grama Sachivalayams. |
| **Voice & Speech** | **Web Speech API** | Voice-to-Text search in Telugu (`te-IN`) & English and client-side Text-to-Speech (TTS) audio guides. |
| **PWA & Offline** | **Service Worker & Manifest** | Cache-first offline asset delivery and standalone web app installation. |

---

## ✨ Key Capabilities & Features

### 1. 🤖 Gemini AI Healthcare Specialist (`SchemeChatbot`)
- **Multi-Turn Intelligence**: Interactive AI assistant offering model speed controls (**Fast / Flash Lite**, **General / 3.5 Flash**, **In-Depth / Pro Preview**).
- **Strict Domain Guardrails**: Trained as a dedicated AP Healthcare Specialist. Automatically refuses off-topic queries (e.g. movies, sports, weather) to deliver focused, hallucination-free guidance.
- **Auto-Scroll & Typing Animations**: Real-time message streaming feedback with smooth DOM auto-scrolling.
- **Transcript Export**: One-click download of the entire chat history as a formatted text summary (`.txt`) with official helpline numbers (108, 104, 102).

### 2. 🔍 Voice-Enabled NLP Search & Filtering
- Voice-to-Text button (`🎤`) supporting spoken Telugu and English queries.
- Fuzzy client-side search engine (`scheme-nlp-search.js`) tokenizing keywords and matching relevant health schemes instantly without latency.
- Recent search query memory stored in browser `localStorage`.

### 3. 📊 React Analytics Dashboard (`analytics.ejs`)
- Interactive Recharts visualizer displaying hospital empanelment, district coverage, procedure costs, and scheme popularity statistics.
- Pre-compiled using `esbuild` for instant loading (`public/js/recharts-dashboard.bundle.js`).

### 4. 🗺️ Offline-Ready Network Hospital Locator
- Leaflet.js interactive map finding nearby government hospitals, private network hospitals, and PHCs with Haversine distance calculation and district filtering.

### 5. 🌐 Offline Resilience & Bilingual i18n
- **Service Worker (`service-worker.js`)**: Caches static assets, stylesheets, icons, and scheme databases for offline operation.
- **Dynamic Translation (`i18n.js`)**: Seamless instant language toggle between Telugu (తెలుగు) and English without page reloads.

---

## 🏛️ Application Architecture

```text
SmartGovAI-2026/
├── server.js                      # Main Express server (API routes, Gemini proxy, NLP retrieval)
├── package.json                   # NPM manifest, build scripts, and lint configs
├── PROJECT_ARCHITECTURE.md        # Comprehensive file-by-file directory map
├── README.md                      # Primary project overview and setup instructions
│
├── views/                         # EJS View Templates
│   ├── portal.ejs                 # Main Citizen Portal UI (Search, Schemes, Chat, Map)
│   ├── analytics.ejs              # Recharts Analytics & Hospital Empanelment Dashboard
│   └── offline.ejs                # Offline Fallback Page
│
├── public/                        # Static Assets
│   ├── css/theme.css              # Responsive styles, glassmorphism, and dark mode theme
│   ├── js/
│   │   ├── app-client.js          # Main client orchestrator & TTS audio handler
│   │   ├── scheme-chatbot.js      # Multi-turn SchemeChatbot component
│   │   ├── scheme-nlp-search.js   # Instant NLP fuzzy search and query tokenization
│   │   ├── i18n.js                # Bilingual Telugu/English dictionary
│   │   └── recharts-dashboard.bundle.js # Esbuild bundled React Recharts dashboard
│   ├── service-worker.js          # PWA offline cache worker
│   └── manifest.json              # Web App Manifest
│
├── src/dashboard/                 # React Source Code
│   └── index.jsx                  # Recharts Analytics components
│
└── services/                      # Core Business Logic
    ├── schemeData.js              # Authoritative AP Health Scheme Knowledge Base
    └── geminiService.js           # Gemini AI initialization & prompt engineering
```

---

## 🚀 Setup & Local Development

### Prerequisites
- **Node.js**: v18.x or higher
- **npm**: v9.x or higher
- **Google Gemini API Key**: Obtain from [Google AI Studio](https://aistudio.google.com/)

### Installation Steps

1. **Clone the Repository**
   ```bash
   git clone https://github.com/your-org/SmartGovAI-2026.git
   cd SmartGovAI-2026
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the root directory:
   ```env
   PORT=3000
   GEMINI_API_KEY=your_gemini_api_key_here
   NODE_ENV=development
   ```

4. **Build Frontend Bundles**
   Compile the React Recharts dashboard bundle using `esbuild`:
   ```bash
   npm run build
   ```

5. **Start the Development Server**
   ```bash
   npm run dev
   ```
   Open your browser and visit: `http://localhost:3000`

6. **Validate & Lint Codebase**
   ```bash
   npm run lint
   ```

---

## 🔒 Security, Privacy & Compliance

- **Server-Side API Key Proxy**: All Gemini AI calls are routed through server-side Express proxies (`/api/chat`, `/api/simplify`). No API keys or credentials are exposed in client JavaScript bundles.
- **Client-Side Eligibility Isolation**: User inputs, eligibility questionnaires, and local search histories remain strictly inside the browser's `localStorage` and are never logged or sold.
- **Zero-Trust Firebase Rules**: Firestore database access is governed by strict rules (`firestore.rules`) enforcing authentication check and document-level authorization.

---

## 📄 License
Distributed under the **MIT License**. Built with ❤️ for civic empowerment and public healthcare accessibility in Andhra Pradesh.
