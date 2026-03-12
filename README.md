# Golden Student Voc@bulary — Website

## 📁 Project Structure

```
/
├── index.html              ← Customer-facing website
├── admin/
│   └── index.html          ← Admin panel (login protected)
├── css/
│   ├── style.css           ← Main site styles
│   └── admin.css           ← Admin panel styles
├── js/
│   ├── firebase-config.js  ← ⚠️ Put your Firebase credentials here
│   ├── main.js             ← Customer site logic
│   └── admin.js            ← Admin panel logic
├── assets/
│   ├── covers/             ← Book cover images (uploaded via admin)
│   └── pdfs/               ← PDF previews (uploaded via admin)
└── docs/
    └── FIREBASE_SETUP.md   ← Step-by-step Firebase setup guide
```

## 🚀 Quick Start

1. **Read `docs/FIREBASE_SETUP.md`** — follow all 10 steps
2. **Paste your Firebase config** into `js/firebase-config.js`
3. **Open `index.html`** in your browser
4. **Open `admin/index.html`** to log in and add books

## ✨ Features

- **Customer site**: Browse books, PDF preview, add to cart, WhatsApp order
- **Admin panel**: Login, add/edit/delete books, manage orders, change colors & text
- **Firebase**: Real-time database, file storage, secure authentication
- **Theme**: Soft pink/green/yellow — all colors changeable from admin

## 📞 Order Flow

Customer → fills cart → enters name/phone/address → clicks order →
WhatsApp opens with pre-filled message to your number →
Order also saved to Firebase → visible in admin order management
