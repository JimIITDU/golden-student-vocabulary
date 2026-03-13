# Firebase Setup Guide

Complete step-by-step guide to set up Firebase for Golden Student Voc@bulary.

---

## Prerequisites
- A Google account
- A web browser

---

## Step 1 — Create Firebase Project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project**
3. Project name: `golden-student-vocabulary`
4. Disable Google Analytics (not needed)
5. Click **Create project**

---

## Step 2 — Enable Firestore Database

1. Left sidebar → **Firestore Database**
2. Click **Create database**
3. Select **Start in production mode**
4. Location: **asia-south1** (Mumbai — closest to Bangladesh)
5. Click **Enable**

---

## Step 3 — Set Firestore Security Rules

1. Firestore Database → **Rules** tab
2. Replace everything with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /books/{bookId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /orders/{orderId} {
      allow create: if true;
      allow read, update, delete: if request.auth != null;
    }
    match /settings/{docId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

3. Click **Publish**

---

## Step 4 — Enable Authentication

1. Left sidebar → **Authentication**
2. Click **Get started**
3. **Sign-in method** tab → **Email/Password** → Enable → **Save**

---

## Step 5 — Create Admin User

1. Authentication → **Users** tab
2. Click **Add user**
3. Enter admin email and password
4. Click **Add user**

---

## Step 6 — Register Web App

1. Project Overview → click **</>** (Web) icon
2. App nickname: `gsv-web`
3. Click **Register app**
4. Copy the `firebaseConfig` object

---

## Step 7 — Create Settings Document

1. Firestore → **Data** tab
2. **+ Start collection** → ID: `settings`
3. Document ID: `site`
4. Add fields:

| Field | Type | Value |
|---|---|---|
| `deliveryFeePerBook` | number | `0` |
| `websiteFee` | number | `0` |
| `whatsappNumber` | string | `01XXXXXXXXX` |

---

## Step 8 — Add Firebase Config

Create `js/firebase-config.js`:

```javascript
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
```

> ⚠️ This file is gitignored — never commit it to GitHub.

---

## Step 9 — Netlify Environment Variables

For the AI description feature, add to Netlify:
- Dashboard → Site configuration → Environment variables
- Key: `HF_TOKEN` — Value: your Hugging Face token from [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)

---

## Step 10 — Verify & Test

1. Open site in browser → books section loads
2. Login to admin → dashboard appears
3. Add a test book → appears on customer site
4. Place a test order → appears in order management

---

## Troubleshooting

| Problem | Solution |
|---|---|
| Login fails | Check email/password in Firebase Auth |
| Books not loading | Check Firestore rules are published |
| Settings not saving | Make sure `settings/site` document exists |
| AI description fails | Check `HF_TOKEN` in Netlify env vars |

---

## Firebase Free Plan Limits

| Resource | Free Limit |
|---|---|
| Firestore reads | 50,000/day |
| Firestore writes | 20,000/day |
| Storage | 1 GB |
| Authentication | Unlimited |

---

*For help: Akidul Islam — WhatsApp: 01768-962690*