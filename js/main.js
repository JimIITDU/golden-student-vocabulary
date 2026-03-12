// ═══════════════════════════════════════════
// GOLDEN STUDENT VOCABULARY — MAIN JS
// ═══════════════════════════════════════════

import { db, storage } from './firebase-config.js';
import {
    collection, getDocs, doc, getDoc, addDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { ref, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

// ── CART STATE ────────────────────────────
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

// ── LOAD SITE SETTINGS (colors, contact info etc) ──
async function loadSiteSettings() {
    try {
        const snap = await getDoc(doc(db, 'settings', 'site'));
        if (snap.exists()) {
            siteSettings = snap.data();
            applySettings(siteSettings);
        }
    } catch (e) {
        console.log('Settings load skipped — using defaults');
    }
}

function applySettings(s) {
    const root = document.documentElement;
    if (s.colorPrimary)       root.style.setProperty('--color-primary',        s.colorPrimary);
    if (s.colorPrimaryDark)   root.style.setProperty('--color-primary-dark',   s.colorPrimaryDark);
    if (s.colorPrimaryLight)  root.style.setProperty('--color-primary-light',  s.colorPrimaryLight);
    if (s.colorSecondary)     root.style.setProperty('--color-secondary',      s.colorSecondary);
    if (s.colorSecondaryDark) root.style.setProperty('--color-secondary-dark', s.colorSecondaryDark);
    if (s.colorAccent)        root.style.setProperty('--color-accent',         s.colorAccent);
    if (s.colorAccentDark)    root.style.setProperty('--color-accent-dark',    s.colorAccentDark);

    // Editable text fields
    document.querySelectorAll('[data-editable]').forEach(el => {
        const key = el.getAttribute('data-editable');
        if (s[key]) el.textContent = s[key];
    });

    // Update contact links
    if (s['contact-phone']) {
        const el = document.querySelector('[href^="tel:"]');
        if (el) el.href = 'tel:' + s['contact-phone'].replace(/\s|-/g,'');
    }
    if (s['contact-whatsapp']) {
        const el = document.querySelector('[href^="https://wa.me/"]');
        if (el) el.href = 'https://wa.me/' + s['contact-whatsapp'].replace(/\s|+|-/g,'');
    }
    if (s.whatsappNumber) window._adminWhatsapp = s.whatsappNumber;
    if (s.bkashNumber)    window._bkashNumber   = s.bkashNumber;
}

// ── LOAD BOOKS FROM FIREBASE ──────────────
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
        books.sort((a,b) => (a.order||99) - (b.order||99));

        grid.innerHTML = '';
        books.forEach((book, i) => {
            grid.appendChild(createBookCard(book, i));
        });
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

    card.innerHTML = `
        <div class="book-image-wrap">
            <img src="${book.coverUrl || 'assets/covers/placeholder.png'}"
                 alt="${book.title || ''}"
                 onerror="this.src='assets/covers/placeholder.png'">
            <span class="class-badge">${book.classLabel || ''}</span>
        </div>
        <div class="book-body">
            <h3 class="book-name">${book.title || 'Golden Student Voc@bulary'}</h3>
            <p class="book-class-label">${book.classNameBn || ''}</p>
            <p class="book-desc">${book.description || ''}</p>
            <div class="book-meta">
                <span class="book-price">৳${book.price || 0}</span>
                ${book.weight ? `<span class="book-weight">${book.weight}g</span>` : ''}
            </div>
            <div class="book-actions">
                ${book.pdfUrl
                    ? `<button class="btn-preview" onclick="openPreview('${book.pdfUrl}')">👁 একটু পড়ে দেখুন</button>`
                    : `<button class="btn-preview" disabled style="opacity:0.4;cursor:default">📄 শীঘ্রই আসছে</button>`
                }
                <button class="btn-add-cart ${inCart ? 'added':''}"
                        id="cart-btn-${book.id}"
                        onclick="addToCart(${JSON.stringify(JSON.stringify(book))})">
                    ${inCart ? '✓ কার্টে আছে' : '🛒 কার্টে যোগ করুন'}
                </button>
            </div>
        </div>
    `;
    return card;
}

// ── PDF PREVIEW ───────────────────────────
window.openPreview = function(url) {
    window.open(url, '_blank');
};

// ── CART FUNCTIONS ────────────────────────
window.addToCart = function(bookJson) {
    const book = JSON.parse(bookJson);
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
};

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
    document.getElementById('cart-count').textContent = cart.reduce((s,i) => s + (i.qty||1), 0);
}

function renderCart() {
    const body   = document.getElementById('cart-items');
    const footer = document.getElementById('cart-footer');
    const count  = cart.reduce((s,i) => s + (i.qty||1), 0);

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
                 src="${item.coverUrl || 'assets/covers/placeholder.png'}"
                 onerror="this.src='assets/covers/placeholder.png'"
                 alt="${item.classLabel||''}">
            <div class="cart-item-info">
                <div class="cart-item-name">${item.classLabel || item.title}</div>
                <div class="cart-item-price">৳${subtotal}</div>
            </div>
            <div class="cart-item-controls">
                <button class="qty-btn" onclick="changeQty('${item.id}',-1)">−</button>
                <span class="qty-num">${item.qty || 1}</span>
                <button class="qty-btn" onclick="changeQty('${item.id}',1)">+</button>
                <button class="remove-item" onclick="removeFromCart('${item.id}')">🗑</button>
            </div>
        </div>`;
    }).join('');

    document.getElementById('cart-total-amount').textContent = `৳${total}`;
    footer.style.display = '';
}

// ── CART OPEN / CLOSE ─────────────────────
window.openCart = function() {
    document.getElementById('cart-modal').classList.add('open');
};
window.closeCart = function() {
    document.getElementById('cart-modal').classList.remove('open');
};

// ── CHECKOUT ──────────────────────────────
window.openCheckout = function() {
    closeCart();
    buildCheckoutSummary();
    document.getElementById('checkout-modal').classList.add('open');
};
window.closeCheckout = function() {
    document.getElementById('checkout-modal').classList.remove('open');
};

function buildCheckoutSummary() {
    const box = document.getElementById('checkout-summary');
    if (cart.length === 0) { box.innerHTML = ''; return; }
    let total = 0;
    let rows = cart.map(item => {
        const sub = (item.price||0) * (item.qty||1);
        total += sub;
        return `<div class="summary-row">
            <span>${item.classLabel} × ${item.qty}</span>
            <span>৳${sub}</span>
        </div>`;
    }).join('');
    box.innerHTML = rows + `<div class="summary-total"><span>মোট</span><strong>৳${total}</strong></div>`;
}

// ── PAYMENT METHOD TOGGLE ─────────────────
function setupPaymentToggle() {
    document.querySelectorAll('.payment-opt').forEach(opt => {
        opt.addEventListener('click', () => {
            document.querySelectorAll('.payment-opt').forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
            const val = opt.querySelector('input').value;
            const info = document.getElementById('bkash-info');
            if (val === 'bkash' || val === 'nagad' || val === 'rocket') {
                const num = window._bkashNumber || '01XXX-XXXXXX';
                document.getElementById('bkash-number').textContent = num;
                info.style.display = '';
            } else {
                info.style.display = 'none';
            }
        });
    });
}

// ── PLACE ORDER (WhatsApp + Firebase) ─────
window.placeOrder = async function() {
    const name    = document.getElementById('order-name').value.trim();
    const phone   = document.getElementById('order-phone').value.trim();
    const address = document.getElementById('order-address').value.trim();
    const payment = document.querySelector('input[name="payment"]:checked')?.value || 'cod';
    const txn     = document.getElementById('order-txn')?.value.trim() || '';

    if (!name || !phone || !address) {
        showToast('⚠️ নাম, ফোন এবং ঠিকানা আবশ্যক'); return;
    }
    if (cart.length === 0) {
        showToast('কার্ট খালি'); return;
    }

    const total = cart.reduce((s,i) => s + (i.price||0)*(i.qty||1), 0);
    const orderId = 'GSV' + Date.now();
    const paymentLabels = { cod:'Cash on Delivery', bkash:'bKash', nagad:'Nagad', rocket:'Rocket' };

    // Build WhatsApp message
    const bookLines = cart.map(i => `• ${i.classLabel}: ৳${i.price} × ${i.qty} = ৳${(i.price||0)*(i.qty||1)}`).join('\n');
    const waMsg = encodeURIComponent(
`🛒 *নতুন অর্ডার — Golden Student Voc@bulary*

📋 *অর্ডার ID:* ${orderId}
👤 *নাম:* ${name}
📞 *ফোন:* ${phone}
🏠 *ঠিকানা:* ${address}
💳 *পেমেন্ট:* ${paymentLabels[payment] || payment}
${txn ? `🔖 *Transaction ID:* ${txn}` : ''}

📚 *অর্ডারকৃত বই:*
${bookLines}

💰 *মোট: ৳${total}*`
    );

    // Save order to Firebase
    try {
        await addDoc(collection(db, 'orders'), {
            orderId, name, phone, address,
            payment, txn,
            items: cart.map(i => ({
                bookId: i.id,
                title: i.classLabel || i.title,
                price: i.price,
                qty:   i.qty || 1
            })),
            total,
            status:    'pending',
            createdAt: serverTimestamp()
        });
    } catch (e) {
        console.error('Order save error:', e);
        // Don't block WhatsApp — still send
    }

    // Open WhatsApp
    const waNum = (window._adminWhatsapp || siteSettings.whatsappNumber || '8801521432606').replace(/\D/g,'');
    window.open(`https://wa.me/${waNum}?text=${waMsg}`, '_blank');

    // Clear cart
    cart = [];
    saveCart();
    renderCart();
    closeCheckout();
    showToast('✅ অর্ডার পাঠানো হয়েছে!');
};

// ── SCROLL ANIMATIONS ─────────────────────
function setupScrollAnimations() {
    const obs = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                e.target.style.opacity = '1';
                e.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.about-section, .contact-section').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
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

// ── CLOSE MODALS ON BACKDROP CLICK ────────
document.addEventListener('click', e => {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('open');
    }
});
