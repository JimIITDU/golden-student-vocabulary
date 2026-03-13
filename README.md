# 📚 Golden Student Voc@bulary — Website

> A full-stack e-commerce website for selling vocabulary books to Bangladeshi students. Built with vanilla JavaScript, Firebase, and deployed on Netlify.

🌐 **Live Demo:** [goldenstudentvocubulary.netlify.app](https://goldenstudentvocubulary.netlify.app)
🔧 **Admin Panel:** [goldenstudentvocubulary.netlify.app/admin](https://goldenstudentvocubulary.netlify.app/admin)

---

## ✨ Features

### Customer Site
- Browse books by class (filter buttons auto-generated)
- PDF preview via Google Drive links
- Add to cart — multiple books
- Delivery fee + website fee breakdown
- WhatsApp order with full order summary
- Order confirmation screen with Order ID
- Phone number validation (Bangladeshi format)
- Fully responsive — mobile first
- All content loaded from Firebase (real-time)

### Admin Panel
- Firebase email/password authentication
- **Book Management** — add, edit, delete books with cover image upload (base64), PDF link, stock status, AI description generator
- **Order Management** — view all orders, filter by status, update status, add notes, WhatsApp customer directly
- **Site Settings** — change all site text, colors, contact info, delivery fee, author photo — all without touching code

### Technical
- Vanilla JS — no framework, no build process
- Firebase Firestore for database
- Firebase Authentication for admin login
- Netlify serverless function for AI description (Hugging Face)
- Google Analytics integrated
- OG meta tags for social sharing
- Zero running cost (Firebase Spark + Netlify free tier)

---

## 📄 Documentation

- [Admin Manual](https://docs.google.com/document/d/1NTlyiFGR_zjUfCpF-mIHdz40TWQYiua3atpKRIm9u0A/view?tab=t.0) — For the website admin
- [User Manual](https://docs.google.com/document/d/1NTlyiFGR_zjUfCpF-mIHdz40TWQYiua3atpKRIm9u0A/view?tab=t.c5l5rwc0zmug) — For customers
- [Firebase Setup Guide](docs/FIREBASE_SETUP.md) — For developers

## 🏗️ Project Structure

```
/
├── index.html                  ← Customer-facing website
├── admin/
│   └── index.html              ← Admin panel (login protected)
├── css/
│   ├── style.css               ← Main site styles (CSS variables for theming)
│   └── admin.css               ← Admin panel styles
├── js/
│   ├── firebase-config.js      ← ⚠️ Firebase credentials (gitignored)
│   ├── main.js                 ← Customer site logic
│   └── admin.js                ← Admin panel logic
├── netlify/
│   └── functions/
│       └── generate-desc.js    ← Serverless function for AI description
├── assets/
│   ├── logo.jpg                ← Site logo
│   └── covers/                 ← Book cover images
├── docs/
│   ├── FIREBASE_SETUP.md       ← Firebase setup guide
│   ├── GSV_Admin_Manual.pdf    ← Admin user manual
│   └── GSV_User_Manual.pdf     ← Customer user manual
├── .env                        ← ⚠️ Environment variables (gitignored)
├── .gitignore
└── netlify.toml                ← Netlify configuration
```

---

## 🚀 Quick Start (for developers)

### Prerequisites
- A Firebase account (free)
- A Netlify account (free)
- A Hugging Face account (free) — for AI description feature

### 1. Clone the repository
```bash
git clone https://github.com/YOURUSERNAME/golden-student-vocabulary.git
cd golden-student-vocabulary
```

### 2. Set up Firebase
Follow the full guide in [`docs/FIREBASE_SETUP.md`](docs/FIREBASE_SETUP.md)

### 3. Add Firebase config
Create `js/firebase-config.js` (already gitignored):
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

### 4. Set up environment variables
Create `.env` file (already gitignored):
```
HF_TOKEN=hf_your_huggingface_token_here
```

Also add `HF_TOKEN` to Netlify environment variables:
Netlify Dashboard → Site configuration → Environment variables

### 5. Deploy to Netlify
Connect your GitHub repo to Netlify — it will auto-deploy on every push.

---

## 📦 Order Flow

```
Customer browses books
       ↓
Adds to cart (localStorage)
       ↓
Fills order form (name, phone, address)
       ↓
Clicks "Send via WhatsApp"
       ↓
WhatsApp opens with pre-filled order message
       ↓
Order saved to Firebase Firestore
       ↓
Admin sees order in dashboard
       ↓
Admin updates status → Completed
```

---

## 🎨 Theme & Customization

All colors are CSS variables — changeable from admin panel without touching code:

| Variable | Default | Used for |
|---|---|---|
| `--color-primary` | `#F9A8D4` | Backgrounds, borders |
| `--color-primary-dark` | `#EC4899` | Buttons, navbar |
| `--color-secondary-dark` | `#22C55E` | Prices, success |
| `--color-accent-dark` | `#EAB308` | Badges, labels |

---

## 🔒 Security

- Firebase credentials stored in `firebase-config.js` (gitignored)
- Hugging Face token stored in `.env` (gitignored) and Netlify env vars
- Firestore security rules: only authenticated admin can write
- Admin login via Firebase Authentication
- Netlify serverless function safely proxies AI API calls

---

## 📋 Order Status Types

| Status | Meaning |
|---|---|
| ⏳ Pending | Order received, not yet confirmed |
| ✅ Confirmed | Order confirmed by admin |
| 🚚 Shipped | Book dispatched |
| 🎉 Completed | Customer received the book |
| ❌ Cancelled | Order cancelled |
| 🚫 Rejected | Order rejected |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla HTML, CSS, JavaScript |
| Database | Firebase Firestore |
| Auth | Firebase Authentication |
| Hosting | Netlify (free tier) |
| Serverless | Netlify Functions |
| AI | Hugging Face (Mistral-7B) |
| Analytics | Google Analytics 4 |
| Fonts | Hind Siliguri, Playfair Display |

---

## 👨‍💻 Developer

**Akidul Islam**
- WhatsApp: [01768-962690](https://wa.me/8801768962690)
- Facebook: [facebook.com/Akidul201103](https://facebook.com/Akidul201103)

---

## 📄 License

This project was built for **Golden Student Voc@bulary** by Enamuzzaman Adil.
Feel free to use this as a template for similar e-commerce projects.