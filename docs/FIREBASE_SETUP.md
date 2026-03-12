# 🔥 Firebase Setup Guide — Golden Student Voc@bulary

Follow these steps ONE TIME to connect your website to Firebase.

---

## STEP 1 — Create a Firebase Project

1. Go to https://console.firebase.google.com
2. Click **"Add project"**
3. Name it: `golden-student-vocabulary`
4. Disable Google Analytics (not needed)
5. Click **Create project**

---

## STEP 2 — Enable Firestore Database

1. In Firebase console → left menu → **Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode** (for now)
4. Select region: `asia-south1` (Mumbai — closest to Bangladesh)
5. Click **Enable**

---

## STEP 3 — Enable Firebase Storage

1. Left menu → **Storage**
2. Click **Get started**
3. Choose **Start in test mode**
4. Click **Done**

---

## STEP 4 — Enable Authentication

1. Left menu → **Authentication**
2. Click **Get started**
3. Under **Sign-in method** → Enable **Email/Password**
4. Click **Save**

---

## STEP 5 — Create Your Admin User

1. In Authentication → **Users** tab
2. Click **Add user**
3. Enter your admin email and password
4. Click **Add user**
5. ⚠️ Remember these — this is how you log into the admin panel

---

## STEP 6 — Get Your Firebase Config

1. In Firebase console → ⚙️ Project Settings (gear icon)
2. Scroll down to **"Your apps"** section
3. Click **"</>"** (Web app icon)
4. Register app name: `gsv-web`
5. You'll see a config object like this:

```js
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "golden-student-vocabulary.firebaseapp.com",
  projectId: "golden-student-vocabulary",
  storageBucket: "golden-student-vocabulary.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

---

## STEP 7 — Paste Config into Your Project

Open `js/firebase-config.js` and replace the placeholder values:

```js
const firebaseConfig = {
    apiKey:            "YOUR_ACTUAL_API_KEY",
    authDomain:        "YOUR_PROJECT.firebaseapp.com",
    projectId:         "YOUR_PROJECT",
    storageBucket:     "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId:             "YOUR_APP_ID"
};
```

---

## STEP 8 — Create Initial Settings Document

In Firestore → **settings** collection → add document with ID `site`:

```
whatsappNumber:  "8801521432606"
contact-phone:   "+880 1521-432606"
contact-email:   "adilenamuzzaman12@gmail.com"
bkashNumber:     ""
```

---

## STEP 9 — Set Firestore Security Rules

In Firestore → **Rules** tab, paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Orders: anyone can create, only admin can read/write
    match /orders/{orderId} {
      allow create: if true;
      allow read, update, delete: if request.auth != null;
    }

    // Books: anyone can read, only admin can write
    match /books/{bookId} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    // Settings: anyone can read, only admin can write
    match /settings/{doc} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

---

## STEP 10 — Set Storage Security Rules

In Storage → **Rules** tab, paste:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

---

## ✅ Done! 

Now:
- Open `index.html` in your browser → customer site works
- Open `admin/index.html` → log in with your email/password
- Add your first book from the admin panel
- The books will instantly appear on the customer site

---

## 🌐 Deployment to Netlify

1. Go to https://netlify.com → Sign up free
2. Drag your entire project folder onto the Netlify dashboard
3. Your site goes live with a URL like `random-name.netlify.app`
4. Buy a domain and connect it from Netlify settings

---

*Questions? This file is in your docs/ folder for reference.*
