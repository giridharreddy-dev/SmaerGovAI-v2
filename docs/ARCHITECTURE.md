# SmartGov Architecture & Engineering Specification

## 1. System Overview
SmartGov is a monolithic Node.js web application engineered with an "Offline-First" Progressive Web App (PWA) methodology. It guarantees access to civic healthcare information in regions with intermittent connectivity while leveraging cutting-edge cloud AI when internet access is available.

## 2. Component Topology

### 2.1 The Backend (Node.js + Express)
The backend operates primarily as a secure router and AI proxy.
- **Stateless Operation**: The server maintains no persistent session state (beyond standard transient HTTP context), allowing it to be seamlessly deployed to serverless environments (e.g., Google Cloud Run).
- **Gemini AI Integration**: The server securely orchestrates calls to the Google Gemini 2.5 Flash API via the `@google/genai` SDK. It securely holds the `GEMINI_API_KEY`, ensuring clients never have direct access to billing credentials.
- **File Upload & OCR Middleware**: Uses `multer` with a rigid 20MB in-memory buffer limit (`multer.memoryStorage()`) to handle file uploads. If an imaged PDF or JPG is detected, it delegates parsing to `pdf-parse` or Gemini Vision for Optical Character Recognition (OCR).

### 2.2 The Frontend (EJS + Vanilla JS)
- **Zero-Build Pipeline**: To maintain maximum simplicity and maintainability for future open-source contributors, the frontend avoids complex build tools (Webpack/Vite). It utilizes standard ES6 modules, CSS3 variables, and vanilla DOM manipulation.
- **Civic Design System**: `public/css/theme.css` implements a bespoke design system featuring WCAG AA compliant contrast ratios, scalable typography (`--app-font-size`), and fluid responsive breakpoints.
- **Client-Side State Management**: The `public/js/app-client.js` module handles all complex UI state (filters, scheme rendering, diagnostic checklists) entirely in the browser using the Web Storage API (`localStorage`).

### 2.3 The Service Worker (PWA)
- **Aggressive Caching**: `public/service-worker.js` intercepts all network requests. It preemptively caches structural HTML, CSS, JavaScript, JSON databases, and MP3 voiceover files upon initial load.
- **Cache-First Strategy**: For static assets and database queries, the worker immediately returns the cached version, falling back to the network only if the cache is empty.

## 3. Data Flow: Multimodal Document Parsing
When a user uploads a government health order (GO):
1. **Client**: Validates file type and size (Max 20MB). Transmits via `FormData` POST.
2. **Express Backend**: `multer` intercepts the file into RAM.
3. **MIME Detection**: Evaluates if the document is a pure text PDF or a scanned image.
4. **AI Processing**: 
   - *Text PDFs*: `pdf-parse` extracts text -> Sent to Gemini.
   - *Scanned Images*: Buffer converted to Base64 -> Sent to Gemini Vision via `inlineData`.
5. **JSON Response**: Gemini enforces a strict JSON schema output containing simplified English and Telugu translations.
6. **Client Render**: Parses JSON and injects beautiful HTML response into the DOM.

## 4. Security Posture
- **No Database Footprint**: Uploaded medical documents are never persisted to a database or filesystem. They exist strictly within ephemeral RAM for the lifecycle of the HTTP request.
- **Client-Side Independence**: Sensitive user inputs (such as checking boxes for health symptoms or income brackets) are never transmitted over the network. The eligibility algorithms execute 100% within the user's local browser memory.
