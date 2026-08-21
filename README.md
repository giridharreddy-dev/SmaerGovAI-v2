# SmartGov Health Portal
**Civic Technology for Inclusive Healthcare**

[![Version](https://img.shields.io/badge/version-1.1.0-blue.svg)](#)
[![Platform](https://img.shields.io/badge/platform-Web%20%7C%20PWA%20%7C%20Mobile-lightgrey.svg)](#)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-success.svg)](#)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

## Overview
SmartGov Health Portal is an **offline-first Progressive Web Application (PWA)** engineered specifically to bridge the digital divide in healthcare access for citizens in rural Andhra Pradesh, India. Built with a modern Node.js and Express backend, it enables users to discover, evaluate, and comprehend state and national healthcare welfare schemes—all delivered through an accessible, **Telugu-first** interface.

> 📖 **User Guide**: Looking for instructions on how to use the app? **[Read the User Guide here](docs/USER_GUIDE.md)**.

## Core Value Proposition
Rural citizens face substantial barriers to government welfare due to language constraints, limited digital literacy, and unreliable internet connectivity. SmartGov addresses these challenges head-on:
- **Telugu-First Design**: Native translation and localized UI ensure zero language barriers for the regional population.
- **Offline-First Resilience**: Critical functions, including scheme discovery, eligibility evaluation, and Text-to-Speech (TTS) audio guides, operate entirely offline via advanced PWA caching.
- **Multimodal AI Assistance**: Integration with Google Gemini Vision models enables users to upload complex, scanned government health orders (GOs) or medical records for instant OCR extraction and Telugu simplification.
- **Privacy by Design**: All eligibility data and checklists are processed locally on the client (`localStorage`), ensuring Zero-Trust data handling.

## Key Capabilities

### 🏛️ Interactive Scheme Catalog
A highly responsive, searchable repository of all major state healthcare provisions (e.g., *Dr. YSR Aarogyasri*, *Jagananna Vidya Deevena*, *Ayushman Bharat*). 

### 🎙️ Immersive Voice Assistance
Dual-layer auditory feedback:
1. **High-Fidelity Offline TTS**: Pre-generated MP3 voiceovers cached securely for offline playback.
2. **On-the-Fly Web Speech API**: Dynamic fallback for text-to-speech synthesis directly in the browser.

### 🧠 Gemini Vision & OCR Engine
Users can upload PDFs or scanned images (up to 20MB) of complex government documents. Using Tesseract.js and the **Gemini 2.5 Flash Vision API**, the portal parses the text, extracts key eligibility and benefit data, and translates it into accessible Telugu points in real time.

### 📍 Offline-Ready Facility Locator
Integrated Haversine distance logic and Leaflet.js mapping allow users to locate the nearest Primary Health Centers (PHCs) and Village Clinics based on their geolocation, functioning seamlessly on low bandwidths.

---

## Technical Architecture
The application follows a decoupled, robust monolithic structure optimized for rapid deployment and edge caching.

- **Backend**: Node.js & Express.js
- **Frontend**: Vanilla JavaScript (ES6+), EJS Templating, CSS3 (Custom Civic Design System)
- **AI Integration**: `@google/genai` (Gemini 2.5 Flash), `tesseract.js` (Fallback OCR)
- **Data Persistence**: Client-side `localStorage`, Server-side `multer` in-memory streams for ephemeral AI processing.
- **Routing**: `express.Router` managing API and static asset delivery.

## Local Development & Setup

### Prerequisites
- **Node.js** (v18.x or higher)
- **npm** (v9.x or higher)
- A valid **Google Gemini API Key** (for AI features)

### Installation
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
   ```bash
   cp .env.example .env
   # Edit .env and insert your GEMINI_API_KEY
   ```

4. **Launch the Application**
   ```bash
   npm run dev
   ```
   The portal will be accessible at `http://localhost:3000`.

---

## Project Structure
```text
.
├── backend.js              # Core Node.js/Express server (Routing & AI Integrations)
├── package.json            # Dependency manifest & scripts
├── public/                 # Static assets (Served to client)
│   ├── assets/             # Icons, logos, and Leaflet map resources
│   ├── css/                # Civic Design System (theme.css)
│   ├── js/                 # Client-side logic (app-client.js, i18n.js)
│   └── service-worker.js   # PWA offline caching logic
├── views/                  # EJS server-side HTML templates
│   └── dashboard.ejs       # Main application layout
├── data/                   # JSON databases (schemes, facilities, audio)
└── docs/                   # Extended architectural documentation
```

## Security & Ethical AI Guidelines
- **Zero-Retention Processing**: Documents uploaded for AI analysis are processed entirely in memory (`multer.memoryStorage()`) and are destroyed instantly after the Gemini request completes. No files are saved to disk.
- **Content Security Policy (CSP)**: Strict headers mitigate XSS and injection attacks.
- **AI Hallucination Mitigation**: The AI is strictly prompt-engineered to extract factual data from the *provided document only*, eliminating external hallucination risks. Users are continually reminded that AI output requires official verification.

## Contributing
We welcome contributions from developers, localization experts, and civic tech enthusiasts. Please read our [Contribution Guidelines](CONTRIBUTING.md) to get started.

## License
Distributed under the MIT License. See `LICENSE` for more information.
