# Deploying SmartGovAI to Firebase Hosting & Cloud Functions

This guide provides step-by-step instructions on how to deploy the SmartGovAI Node.js (Express) application to production using Firebase.

Because SmartGovAI includes a dynamic backend (Express API routes, server-side Gemini integration, etc.), we cannot use standard static hosting alone. Instead, we will use **Firebase Cloud Functions** to serve the Node.js backend logic and **Firebase Hosting** to route traffic and serve static frontend assets.

## Prerequisites

1. **Node.js** installed on your local machine.
2. A **Firebase Project** created in the [Firebase Console](https://console.firebase.google.com/).
3. The **Blaze (Pay-as-you-go) Plan** enabled on your Firebase project. *(Note: Cloud Functions for Node.js requires the Blaze plan, though generous free tiers apply).*
4. **Firebase CLI** installed globally on your machine:
   ```bash
   npm install -g firebase-tools
   ```

---

## Step 1: Login and Initialize Firebase

1. Open your terminal in the root folder of the SmartGovAI project.
2. Log in to your Google/Firebase account:
   ```bash
   firebase login
   ```
3. Initialize a new Firebase workspace:
   ```bash
   firebase init
   ```
4. When prompted, select the following features using the Spacebar:
   * **Functions**: Configure a Cloud Functions directory and its files.
   * **Hosting**: Configure files for Firebase Hosting and (optionally) set up GitHub Action deploys.
5. Select **Use an existing project** and choose the Firebase project you created in the console.
6. For Functions setup:
   * Language: **JavaScript**
   * ESLint: **No** (or Yes if you prefer)
   * Install dependencies now: **Yes**
7. For Hosting setup:
   * Public directory: **public**
   * Configure as a single-page app: **No**
   * Set up automatic builds and deploys with GitHub: **No** (can be done later)

---

## Step 2: Adapt the Backend for Cloud Functions

Firebase Functions requires your Express app to be exported as a module rather than listening directly on a port.

1. Move your backend dependencies from the root `package.json` to the `functions/package.json` file, or simply copy the required ones (like `express`, `@google/genai`, `firebase`, `cors`, etc.).
2. In the `functions` folder, open `index.js`.
3. Import your Express app from `server.js` (you may need to tweak `server.js` to export the `app` instance).

### Modifying `server.js` (Root Directory)
At the very bottom of your `server.js`, change the startup script from:
```javascript
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```
To:
```javascript
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
// Export the app for Firebase Functions
export { app };
```

### Modifying `functions/index.js`
In your `functions/index.js`, import and expose the Express app:
```javascript
const functions = require("firebase-functions");
// Note: If server.js is ES Modules (type: "module"), you may need to use dynamic imports 
// or transpile, but ideally, ensure the function loads the Express app.
const { app } = require("../server.js"); 

exports.api = functions.https.onRequest(app);
```

---

## Step 3: Configure Environment Variables (Secrets)

Your application uses sensitive keys, such as `GEMINI_API_KEY`. Firebase handles environment variables securely via Secret Manager.

1. Set your Gemini API key as a Firebase Secret:
   ```bash
   firebase functions:secrets:set GEMINI_API_KEY
   ```
   *(Paste your API key when prompted).*

2. Update your `functions/index.js` to grant the function access to this secret:
   ```javascript
   const { onRequest } = require("firebase-functions/v2/https");
   const { app } = require("../server.js");

   exports.api = onRequest({ secrets: ["GEMINI_API_KEY"] }, app);
   ```

*(Alternative: For non-sensitive configurations, you can create a `.env` file directly inside the `functions/` directory).*

---

## Step 4: Configure Firebase Hosting Rewrites

We need to tell Firebase Hosting to route all dynamic traffic (like `/api/chat`) to your newly created Cloud Function, while continuing to serve static CSS/JS files directly from the `/public` folder.

Open `firebase.json` in the root of your project and update the `hosting` section:

```json
{
  "hosting": {
    "public": "public",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "function": "api"
      }
    ]
  },
  "functions": {
    "source": "functions"
  }
}
```
*This configuration guarantees that if a file exists in `/public`, it is served statically. If it doesn't, the request falls back to your Express `api` function.*

---

## Step 5: Test Locally

Before deploying to production, test the connection locally using the Firebase Emulator:

```bash
firebase emulators:start
```
This will spin up a local server (usually on `localhost:5000`) where you can verify that the frontend loads and the API routes communicate successfully with the Gemini API.

---

## Step 6: Deploy to Production

Once everything is working correctly, deploy the full application (both Hosting and Functions) to Google's production servers:

```bash
firebase deploy
```

When the deployment finishes, the Firebase CLI will output your **Hosting URL** (e.g., `https://your-project-id.web.app`). Your SmartGovAI platform is now live!
