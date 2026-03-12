// ═══════════════════════════════════════════
// GOLDEN STUDENT VOCABULARY — MAIN JS
// ═══════════════════════════════════════════

import { db } from './firebase-config.js';
import {
    collection, getDocs, doc, getDoc, addDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let cart = JSON.parse(localStorage.getItem('gsv_cart') || '[]');
let siteSettings = {};

// ── INIT ──────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    await loadSiteSettings();
    await loadBooks();
    renderCart();
    setupPaymentToggle();
    setupScrollAnimations();
});

// ══════════════════════════════════════════
// SETTINGS — loads from Firebase and applies
// everything to the page
// ══════════════════════════════════════════
async function loadSiteSettings() {
    try {
        const snap = await getDoc(doc(db, 'settings', 'site'));
        if (snap.exists()) {
            siteSettings = snap.data();
            applySettings(siteSettings);
        }
    } catch (e) {
        console.log('Using default settings');
    }
}

function applySettings(s) {
    const root = document.documentElement;

    // Colors
    if (s.colorPrimary)       root.style.setProperty('--color-primary',        s.colorPrimary);
    if (s.colorPrimaryDark)   root.style.setProperty('--color-primary-dark',   s.colorPrimaryDark);
    if (s.colorPrimaryLight)  root.style.setProperty('--color-primary-light',  s.colorPrimaryLight);
    if (s.colorSecondary)     root.style.setProperty('--color-secondary',      s.colorSecondary);
    if (s.colorSecondaryDark) root.style.setProperty('--color-secondary-dark', s.colorSecondaryDark);
    if (s.colorAccent)        root.style.setProperty('--color-accent',         s.colorAccent);
    if (s.colorAccentDark)    root.style.setProperty('--color-accent-dark',    s.colorAccentDark);

    // All editable text fields — key in Firebase matches data-editable attribute
    const textFields = [
        'hero-badge', 'title-main', 'title-sub', 'tagline', 'hero-desc',
        'books-title', 'books-subtitle', 'about-title', 'about-text',
        'feat1-title', 'feat1-text', 'feat2-title', 'feat2-text', 'feat3-title', 'feat3-text',
        'author-name', 'author-creds', 'author-exp',
        'contact-title', 'contact-sub', 'footer-text', 'footer-tag'
    ];
    textFields.forEach(key => {
        if (s[key]) {
            const el = document.querySelector(`[data-editable="${key}"]`);
            if (el) el.textContent = s[key];
        }
    });

    // Contact links — update both href and displayed text
    if (s['contact-phone']) {
        const el = document.querySelector('a[href^="tel:"]');
        if (el) {
            el.href = 'tel:+' + s['contact-phone'].replace(/\D/g, '');
            const span = el.querySelector('span:last-child');
            if (span) span.textContent = s['contact-phone'];
        }
    }
    if (s['contact-whatsapp']) {
        const el = document.querySelector('a[href^="https://wa.me/"]');
        if (el) {
            el.href = 'https://wa.me/' + s['contact-whatsapp'].replace(/\D/g, '');
            const span = el.querySelector('span:last-child');
            if (span) span.textContent = s['contact-whatsapp'];
        }
    }
    if (s['contact-email']) {
        const el = document.querySelector('a[href^="mailto:"]');
        if (el) {
            el.href = 'mailto:' + s['contact-email'];
            const span = el.querySelector('span:last-child');
            if (span) span.textContent = s['contact-email'];
        }
    }

    // For WhatsApp order sending
    if (s.whatsappNumber) window._adminWhatsapp = s.whatsappNumber;
}

window.closeSuccess = function() {
    document.getElementById('success-modal').classList.remove('open');
};

// ══════════════════════════════════════════
// BOOKS
// ══════════════════════════════════════════
async function loadBooks() {
    const grid = document.getElementById('books-grid');
    try {
        const snap = await getDocs(collection(db, 'books'));
        if (snap.empty) {
            grid.innerHTML = `<div class="books-loading"><p>কোনো বই পাওয়া যায়নি।</p></div>`;
            return;
        }
        const books = [];
        snap.forEach(d => books.push({ id: d.id, ...d.data() }));
        books.sort((a, b) => (a.order || 99) - (b.order || 99));
        grid.innerHTML = '';
        books.forEach((book, i) => grid.appendChild(createBookCard(book, i)));
    } catch (e) {
        console.error(e);
        grid.innerHTML = `<div class="books-loading"><p>বই লোড করতে সমস্যা হয়েছে।</p></div>`;
    }
}

function createBookCard(book, index) {
    const card = document.createElement('div');
    card.className = 'book-card';
    card.style.animationDelay = `${index * 0.1}s`;
    const inCart = cart.some(i => i.id === book.id);
    const pdfUrl = convertDriveLink(book.pdfUrl);

    card.innerHTML = `
        <div class="book-image-wrap">
            <img src="${book.coverUrl || 'assets/covers/placeholder.svg'}"
                 alt="${book.classLabel || ''}"
                 onerror="this.src='assets/covers/placeholder.svg'">
            <span class="class-badge">${book.classLabel || ''}</span>
        </div>
        <div class="book-body">
            <h3 class="book-name">${book.title || 'Golden Student Voc@bulary'}</h3>
            <p class="book-class-label">${book.classLabel || ''}</p>
            <p class="book-desc">${book.description || ''}</p>
            <div class="book-meta">
                <span class="book-price">৳${book.price || 0}</span>
                ${book.weight ? `<span class="book-weight">${book.weight}g</span>` : ''}
            </div>
            <div class="book-actions">
                ${pdfUrl
                    ? `<button class="btn-preview" onclick="openPreview('${pdfUrl}')">👁 একটু পড়ে দেখুন</button>`
                    : `<button class="btn-preview" disabled style="opacity:0.4;cursor:default">📄 শীঘ্রই আসছে</button>`
                }
                ${book.stock === 'out_of_stock'
                    ? `<button class="btn-add-cart out-of-stock" disabled>❌ স্টক শেষ</button>`
                    : book.stock === 'coming_soon'
                    ? `<button class="btn-add-cart out-of-stock" disabled>🔜 শীঘ্রই আসছে</button>`
                    : `<button class="btn-add-cart ${inCart ? 'added' : ''}" id="cart-btn-${book.id}">
                        ${inCart ? '✓ কার্টে আছে' : '🛒 কার্টে যোগ করুন'}
                       </button>`
                }
            </div>
        </div>`;

    // Attach click with book data directly — avoids JSON escaping bugs
    card.querySelector('.btn-add-cart').addEventListener('click', () => addToCart(book));
    return card;
}

// Converts Google Drive share link to a viewable link
function convertDriveLink(url) {
    if (!url) return null;
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match) return `https://drive.google.com/file/d/${match[1]}/view`;
    return url;
}

window.openPreview = function(url) {
    window.open(url, '_blank');
};

// ══════════════════════════════════════════
// CART
// ══════════════════════════════════════════
function addToCart(book) {
    const exists = cart.find(i => i.id === book.id);
    if (exists) {
        exists.qty = (exists.qty || 1) + 1;
        showToast(`${book.classLabel} — পরিমাণ বাড়ানো হয়েছে`);
    } else {
        cart.push({ ...book, qty: 1 });
        showToast(`${book.classLabel} কার্টে যোগ হয়েছে ✓`);
        const btn = document.getElementById(`cart-btn-${book.id}`);
        if (btn) { btn.textContent = '✓ কার্টে আছে'; btn.classList.add('added'); }
    }
    saveCart();
    renderCart();
}

window.removeFromCart = function(bookId) {
    cart = cart.filter(i => i.id !== bookId);
    const btn = document.getElementById(`cart-btn-${bookId}`);
    if (btn) { btn.textContent = '🛒 কার্টে যোগ করুন'; btn.classList.remove('added'); }
    saveCart();
    renderCart();
};

window.changeQty = function(bookId, delta) {
    const item = cart.find(i => i.id === bookId);
    if (!item) return;
    item.qty = (item.qty || 1) + delta;
    if (item.qty <= 0) { window.removeFromCart(bookId); return; }
    saveCart();
    renderCart();
};

function saveCart() {
    localStorage.setItem('gsv_cart', JSON.stringify(cart));
    document.getElementById('cart-count').textContent = cart.reduce((s, i) => s + (i.qty || 1), 0);
}

function renderCart() {
    const body   = document.getElementById('cart-items');
    const footer = document.getElementById('cart-footer');
    const count  = cart.reduce((s, i) => s + (i.qty || 1), 0);
    document.getElementById('cart-count').textContent = count;

    if (cart.length === 0) {
        body.innerHTML = `<div class="cart-empty"><span>🛒</span><p>কার্ট খালি আছে</p></div>`;
        footer.style.display = 'none';
        return;
    }

    let total = 0;
    body.innerHTML = cart.map(item => {
        const subtotal = (item.price || 0) * (item.qty || 1);
        total += subtotal;
        return `
        <div class="cart-item">
            <img class="cart-item-img"
                 src="${item.coverUrl || 'assets/covers/placeholder.svg'}"
                 onerror="this.src='assets/covers/placeholder.svg'"
                 alt="${item.classLabel || ''}">
            <div class="cart-item-info">
                <div class="cart-item-name">${item.classLabel || item.title}</div>
                <div class="cart-item-price">৳${subtotal}</div>
            </div>
            <div class="cart-item-controls">
                <button class="qty-btn" onclick="changeQty('${item.id}', -1)">−</button>
                <span class="qty-num">${item.qty || 1}</span>
                <button class="qty-btn" onclick="changeQty('${item.id}', 1)">+</button>
                <button class="remove-item" onclick="removeFromCart('${item.id}')">🗑</button>
            </div>
        </div>`;
    }).join('');

    const totalBooks  = cart.reduce((s, i) => s + (i.qty || 1), 0);
    const deliveryFee = (siteSettings.deliveryFeePerBook || 0) * totalBooks;
    const websiteFee  = siteSettings.websiteFee || 0;
    const grandTotal  = total + deliveryFee + websiteFee;

    document.getElementById('cart-total-amount').innerHTML =
        `<div class="cart-fee-row"><span>বইয়ের মূল্য</span><span>৳${total}</span></div>
         <div class="cart-fee-row"><span>ডেলিভারি ফি</span><span>৳${deliveryFee}</span></div>
         ${websiteFee > 0 ? `<div class="cart-fee-row"><span>ওয়েবসাইট ফি</span><span>৳${websiteFee}</span></div>` : ''}
         <div class="cart-fee-row grand"><span>সর্বমোট</span><span>৳${grandTotal}</span></div>`;
    footer.style.display = '';
}

window.openCart      = () => document.getElementById('cart-modal').classList.add('open');
window.closeCart     = () => document.getElementById('cart-modal').classList.remove('open');
window.closeChbeckout = () => document.getElementById('checkout-modal').classList.remove('open');

window.openCheckout = function() {
    closeCart();
    buildCheckoutSummary();
    document.getElementById('checkout-modal').classList.add('open');
};

function buildCheckoutSummary() {
    const box = document.getElementById('checkout-summary');
    if (cart.length === 0) { box.innerHTML = ''; return; }
    let total = 0;
    const rows = cart.map(item => {
        const sub = (item.price || 0) * (item.qty || 1);
        total += sub;
        return `<div class="summary-row"><span>${item.classLabel} × ${item.qty}</span><span>৳${sub}</span></div>`;
    }).join('');
    const totalBooks  = cart.reduce((s, i) => s + (i.qty || 1), 0);
    const deliveryFee = (siteSettings.deliveryFeePerBook || 0) * totalBooks;
    const websiteFee  = siteSettings.websiteFee || 0;
    const grandTotal  = total + deliveryFee + websiteFee;

    box.innerHTML = rows +
        `<div class="summary-row fee"><span>ডেলিভারি ফি</span><span>৳${deliveryFee}</span></div>
         ${websiteFee > 0 ? `<div class="summary-row fee"><span>ওয়েবসাইট ফি</span><span>৳${websiteFee}</span></div>` : ''}
         <div class="summary-total"><span>সর্বমোট</span><strong>৳${grandTotal}</strong></div>`;
}

function setupPaymentToggle() {
    document.querySelectorAll('.payment-opt:not(.coming-soon)').forEach(opt => {
        opt.addEventListener('click', () => {
            document.querySelectorAll('.payment-opt').forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
        });
    });
}

// ══════════════════════════════════════════
// ORDER — WhatsApp + Firebase
// ══════════════════════════════════════════
window.placeOrder = async function() {
    const name    = document.getElementById('order-name').value.trim();
    const phone   = document.getElementById('order-phone').value.trim();
    const address = document.getElementById('order-address').value.trim();

    if (!name)    { showToast('⚠️ নাম লিখুন'); return; }
    if (!phone)   { showToast('⚠️ ফোন নম্বর লিখুন'); return; }
    const phoneClean = phone.replace(/\s|-/g, '');
    const validPhone = /^(\+8801|8801|01)[3-9]\d{8}$/.test(phoneClean);
    if (!validPhone) { showToast('⚠️ সঠিক বাংলাদেশি নম্বর দিন। যেমন: 01XXXXXXXXX'); return; }
    if (!address) { showToast('⚠️ ঠিকানা লিখুন'); return; }
    if (cart.length === 0) { showToast('কার্ট খালি'); return; }

    const booksTotal  = cart.reduce((s, i) => s + (i.price || 0) * (i.qty || 1), 0);
    const totalBooks  = cart.reduce((s, i) => s + (i.qty || 1), 0);
    const deliveryFee = (siteSettings.deliveryFeePerBook || 0) * totalBooks;
    const websiteFee  = siteSettings.websiteFee || 0;
    const grandTotal  = booksTotal + deliveryFee + websiteFee;
    const orderId     = 'GSV' + Date.now();

    const bookLines = cart.map(i =>
        `• ${i.classLabel}: ৳${i.price} × ${i.qty} = ৳${(i.price || 0) * (i.qty || 1)}`
    ).join('\n');

    const waMsg = encodeURIComponent(
`🛒 *নতুন অর্ডার — Golden Student Voc@bulary*

📋 *অর্ডার ID:* ${orderId}
👤 *নাম:* ${name}
📞 *ফোন:* ${phone}
🏠 *ঠিকানা:* ${address}
💳 *পেমেন্ট:* Cash on Delivery

📚 *অর্ডারকৃত বই:*
${bookLines}

💰 *বইয়ের মূল্য:* ৳${booksTotal}
🚚 *ডেলিভারি ফি:* ৳${deliveryFee} (৳${siteSettings.deliveryFeePerBook || 0} × ${totalBooks} বই)
🌐 *ওয়েবসাইট ফি:* ৳${websiteFee}
━━━━━━━━━━━━━━
💵 *সর্বমোট: ৳${grandTotal}*`
    );

    // Save order to Firebase
    try {
        await addDoc(collection(db, 'orders'), {
            orderId, name, phone, address,
            payment: 'cod',
            items: cart.map(i => ({
                bookId: i.id,
                title:  i.classLabel || i.title,
                price:  i.price,
                qty:    i.qty || 1
            })),
            booksTotal,
            deliveryFee,
            websiteFee,
            total: grandTotal,
            status:    'pending',
            createdAt: serverTimestamp()
        });
    } catch (e) {
        console.error('Order save error:', e);
    }

    // Open WhatsApp
    const waNum = (window._adminWhatsapp || '8801521432606').replace(/\D/g, '');
    window.open(`https://wa.me/${waNum}?text=${waMsg}`, '_blank');

    // Reset
    cart = [];
    saveCart();
    renderCart();
    closeCheckout();
    document.getElementById('order-name').value    = '';
    document.getElementById('order-phone').value   = '';
    document.getElementById('order-address').value = '';

    // Show success screen
    document.getElementById('success-order-id').textContent = `অর্ডার ID: ${orderId}`;
    document.getElementById('success-details').innerHTML =
        `<div class="success-item"><span>নাম</span><strong>${name}</strong></div>
         <div class="success-item"><span>ফোন</span><strong>${phone}</strong></div>
         <div class="success-item"><span>মোট</span><strong>৳${grandTotal}</strong></div>`;
    document.getElementById('success-modal').classList.add('open');
};

// ── SCROLL ANIMATIONS ─────────────────────
function setupScrollAnimations() {
    const obs = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                e.target.style.opacity = '1';
                e.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.about-section, .contact-section').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(25px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        obs.observe(el);
    });
}

// ── TOAST ─────────────────────────────────
function showToast(msg) {
    let t = document.querySelector('.toast');
    if (!t) {
        t = document.createElement('div');
        t.className = 'toast';
        document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2800);
}

// Close modal on backdrop click
document.addEventListener('click', e => {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('open');
    }
});