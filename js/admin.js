// ═══════════════════════════════════════════
// ADMIN PANEL — JAVASCRIPT
// ═══════════════════════════════════════════

import { db, auth } from '../js/firebase-config.js';
import {
    collection, getDocs, doc, getDoc, addDoc, updateDoc,
    deleteDoc, serverTimestamp, query, orderBy, setDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import {
    signInWithEmailAndPassword, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

let allOrders    = [];
let allBooks     = [];
let siteSettings = {};
let pendingCoverFile = null;

// ══════════════════════════════════════════
// AUTH
// ══════════════════════════════════════════
onAuthStateChanged(auth, user => {
    if (user) {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('admin-app').style.display    = 'grid';
        document.getElementById('admin-email-display').textContent = user.email;
        loadOrders();
        loadAdminBooks();
        loadSettings();
    } else {
        document.getElementById('login-screen').style.display = 'flex';
        document.getElementById('admin-app').style.display    = 'none';
    }
});

window.doLogin = async function() {
    const email = document.getElementById('admin-email').value.trim();
    const pass  = document.getElementById('admin-password').value;
    const btn   = document.getElementById('login-btn');
    const err   = document.getElementById('login-error');

    err.style.display = 'none';
    btn.disabled = true;
    btn.textContent = 'লগইন হচ্ছে...';

    try {
        await signInWithEmailAndPassword(auth, email, pass);
    } catch (e) {
        err.textContent  = 'ইমেইল বা পাসওয়ার্ড ভুল।';
        err.style.display = 'block';
        btn.disabled     = false;
        btn.textContent  = 'লগইন করুন';
    }
};

window.doLogout = () => signOut(auth);

// ── ENTER KEY on login ────────────────────
document.getElementById('admin-password')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') window.doLogin();
});

// ══════════════════════════════════════════
// TAB NAVIGATION
// ══════════════════════════════════════════
document.querySelectorAll('.nav-item[data-tab]').forEach(item => {
    item.addEventListener('click', e => {
        e.preventDefault();
        const tab = item.getAttribute('data-tab');
        document.querySelectorAll('.nav-item[data-tab]').forEach(n => n.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        item.classList.add('active');
        document.getElementById(`tab-${tab}`).classList.add('active');
    });
});

// ══════════════════════════════════════════
// ORDERS
// ══════════════════════════════════════════
window.loadOrders = async function() {
    const list    = document.getElementById('orders-list');
    const loading = document.getElementById('orders-loading');
    loading.style.display = 'flex';
    list.innerHTML = '';

    try {
        const q    = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        allOrders  = [];
        snap.forEach(d => allOrders.push({ id: d.id, ...d.data() }));
        loading.style.display = 'none';
        renderOrders(allOrders);
    } catch (e) {
        loading.innerHTML = `<p style="color:red">অর্ডার লোড ব্যর্থ: ${e.message}</p>`;
    }
};

window.filterOrders = function() {
    const val      = document.getElementById('order-filter').value;
    const filtered = val === 'all' ? allOrders : allOrders.filter(o => o.status === val);
    renderOrders(filtered);
};

function renderOrders(orders) {
    const list = document.getElementById('orders-list');
    if (orders.length === 0) {
        list.innerHTML = '<div class="loading-state"><p>কোনো অর্ডার নেই।</p></div>';
        return;
    }
    list.innerHTML = orders.map(buildOrderCard).join('');
}

function buildOrderCard(o) {
    const date = o.createdAt?.toDate
        ? o.createdAt.toDate().toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric' })
        : 'N/A';

    const itemLines = (o.items || []).map(i =>
        `<div class="order-item-row">
            <span>${i.title} × ${i.qty}</span>
            <span>৳${(i.price || 0) * (i.qty || 1)}</span>
        </div>`
    ).join('');

    const waNum     = (o.phone || '').replace(/\D/g, '');
    const waNumFull = waNum.startsWith('0') ? '88' + waNum : waNum;
    const waMsg     = encodeURIComponent(
`✅ *অর্ডার কনফার্মেশন — Golden Student Voc@bulary*

প্রিয় ${o.name},
আপনার অর্ডার (${o.orderId}) কনফার্ম হয়েছে।
শীঘ্রই ডেলিভারি পাবেন। ধন্যবাদ! 📚`
    );

    return `
    <div class="order-card status-${o.status || 'pending'}" id="order-${o.id}">
        <div class="order-top">
            <div>
                <div class="order-id">${o.orderId || o.id}</div>
                <div class="order-date">${date}</div>
            </div>
            <span class="status-badge badge-${o.status || 'pending'}">${statusLabel(o.status)}</span>
        </div>
        <div class="order-info">
            <div class="order-info-item"><strong>${o.name || ''}</strong>নাম</div>
            <div class="order-info-item"><strong>${o.phone || ''}</strong>ফোন</div>
            <div class="order-info-item"><strong>Cash on Delivery</strong>পেমেন্ট</div>
            <div class="order-info-item"><strong>${o.address || ''}</strong>ঠিকানা</div>
        </div>
        <div class="order-items-list">
            ${itemLines}
            <div class="order-total"><span>মোট</span><strong>৳${o.total || 0}</strong></div>
        </div>
        <div class="order-actions-row">
            <select class="status-select" id="status-${o.id}">
                <option value="pending"   ${o.status === 'pending'   ? 'selected' : ''}>⏳ পেন্ডিং</option>
                <option value="confirmed" ${o.status === 'confirmed' ? 'selected' : ''}>✅ কনফার্মড</option>
                <option value="shipped"   ${o.status === 'shipped'   ? 'selected' : ''}>🚚 শিপড</option>
                <option value="completed" ${o.status === 'completed' ? 'selected' : ''}>🎉 সম্পন্ন</option>
                <option value="cancelled" ${o.status === 'cancelled' ? 'selected' : ''}>❌ বাতিল</option>
                <option value="rejected"  ${o.status === 'rejected'  ? 'selected' : ''}>🚫 প্রত্যাখ্যাত</option>
            </select>
            <div class="date-row">
                <input type="date" class="date-input" id="date-${o.id}" value="${o.deliveryDate || ''}" title="ডেলিভারির তারিখ">
                <button class="btn-today" onclick="setToday('${o.id}')" title="আজকের তারিখ সেট করুন">📅 আজ</button>
            </div>
            <a class="btn-wa" href="https://wa.me/${waNumFull}?text=${waMsg}" target="_blank">💬 WhatsApp</a>
        </div>
        <div class="order-notes">
            <input type="text" class="note-input" id="note-${o.id}"
                   placeholder="নোট লিখুন..."
                   value="${o.notes || ''}">
        </div>
        <div class="order-save-row">
            <button class="btn-save-order" onclick="saveOrderChanges('${o.id}')">💾 সেভ করুন</button>
        </div>
    </div>`;
}

function statusLabel(s) {
    const labels = {
        pending: 'পেন্ডিং', confirmed: 'কনফার্মড', shipped: 'শিপড',
        completed: 'সম্পন্ন', cancelled: 'বাতিল', rejected: 'প্রত্যাখ্যাত'
    };
    return labels[s] || 'পেন্ডিং';
}

window.setToday = function(id) {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById(`date-${id}`).value = today;
};

window.saveOrderChanges = async function(id) {
    const status = document.getElementById(`status-${id}`).value;
    const date   = document.getElementById(`date-${id}`).value;
    const notes  = document.getElementById(`note-${id}`).value;

    try {
        await updateDoc(doc(db, 'orders', id), { status, deliveryDate: date, notes });

        // Update card visuals
        const card = document.getElementById(`order-${id}`);
        if (card) {
            card.className = `order-card status-${status}`;
            const badge = card.querySelector('.status-badge');
            badge.className   = `status-badge badge-${status}`;
            badge.textContent = statusLabel(status);
        }
        showAdminToast('✅ অর্ডার সেভ হয়েছে!');
    } catch (e) {
        showAdminToast('সেভ ব্যর্থ: ' + e.message);
    }
};

// ══════════════════════════════════════════
// BOOKS
// ══════════════════════════════════════════
window.loadAdminBooks = async function() {
    const grid    = document.getElementById('admin-books-grid');
    const loading = document.getElementById('books-loading');
    loading.style.display = 'flex';
    grid.innerHTML = '';

    try {
        const snap = await getDocs(collection(db, 'books'));
        allBooks   = [];
        snap.forEach(d => allBooks.push({ id: d.id, ...d.data() }));
        allBooks.sort((a, b) => (a.order || 99) - (b.order || 99));
        loading.style.display = 'none';

        if (allBooks.length === 0) {
            grid.innerHTML = '<div class="loading-state"><p>কোনো বই নেই। নতুন বই যোগ করুন।</p></div>';
            return;
        }

        grid.innerHTML = allBooks.map(book => `
            <div class="admin-book-card">
                <img class="admin-book-img"
                     src="${book.coverUrl || '../assets/covers/placeholder.svg'}"
                     onerror="this.src='../assets/covers/placeholder.svg'"
                     alt="${book.classLabel || ''}">
                <div class="admin-book-body">
                    <div class="admin-book-title">${book.classLabel || ''}</div>
                    <div class="admin-book-price">৳${book.price || 0}</div>
                    <div class="admin-book-btns">
                        <button class="btn-edit" onclick="editBook('${book.id}')">✏️ সম্পাদনা</button>
                        <button class="btn-delete" onclick="deleteBook('${book.id}')">🗑</button>
                    </div>
                </div>
            </div>`
        ).join('');
    } catch (e) {
        loading.innerHTML = `<p style="color:red">লোড ব্যর্থ: ${e.message}</p>`;
    }
};

window.openBookModal = function() {
    document.getElementById('book-modal-title').textContent = 'নতুন বই যোগ করুন';
    document.getElementById('edit-book-id').value = '';
    ['book-title', 'book-class-label', 'book-price',
     'book-weight', 'book-order', 'book-desc', 'book-pdf-url', 'book-cover-url'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    document.getElementById('cover-preview-wrap').innerHTML =
        `<span class="upload-icon">🖼️</span><p>ছবি আপলোড করতে ক্লিক করুন</p><small>PNG, JPG — সর্বোচ্চ 5MB</small>`;
    pendingCoverFile = null;
    document.getElementById('book-modal').classList.add('open');
};

window.closeBookModal = function() {
    document.getElementById('book-modal').classList.remove('open');
};

window.editBook = function(id) {
    const book = allBooks.find(b => b.id === id);
    if (!book) return;

    document.getElementById('book-modal-title').textContent = 'বই সম্পাদনা করুন';
    document.getElementById('edit-book-id').value     = id;
    document.getElementById('book-title').value       = book.title || '';
    document.getElementById('book-class-label').value = book.classLabel || '';
    document.getElementById('book-price').value       = book.price || '';
    document.getElementById('book-weight').value      = book.weight || '';
    document.getElementById('book-order').value       = book.order || '';
    document.getElementById('book-desc').value        = book.description || '';
    document.getElementById('book-pdf-url').value     = book.pdfUrl || '';
    document.getElementById('book-stock').value       = book.stock || 'in_stock';
    document.getElementById('book-cover-url').value   = book.coverUrl || '';

    if (book.coverUrl) {
        document.getElementById('cover-preview-wrap').innerHTML =
            `<img src="${book.coverUrl}" style="max-height:120px;border-radius:6px;margin:0 auto;">
             <p style="margin-top:0.5rem;font-size:0.85rem;color:green">✓ কভার আপলোড করা আছে</p>`;
    }

    pendingCoverFile = null;
    document.getElementById('book-modal').classList.add('open');
};

window.deleteBook = async function(id) {
    if (!confirm('এই বইটি মুছে দেবেন? এই কাজ ফেরানো যাবে না।')) return;
    try {
        await deleteDoc(doc(db, 'books', id));
        showAdminToast('বই মুছে গেছে');
        loadAdminBooks();
    } catch (e) { showAdminToast('মুছতে ব্যর্থ: ' + e.message); }
};

window.previewCover = function(input) {
    if (!input.files[0]) return;
    pendingCoverFile = input.files[0];
    const reader = new FileReader();
    reader.onload = e => {
        document.getElementById('cover-preview-wrap').innerHTML =
            `<img src="${e.target.result}" style="max-height:120px;border-radius:6px;margin:0 auto;">
             <p style="margin-top:0.5rem;font-size:0.85rem;">${input.files[0].name}</p>`;
    };
    reader.readAsDataURL(input.files[0]);
};

window.saveBook = async function() {
    const btn = document.getElementById('save-book-btn');
    btn.disabled = true;
    btn.textContent = 'সেভ হচ্ছে...';

    try {
        const editId     = document.getElementById('edit-book-id').value;
        let   coverUrl   = document.getElementById('book-cover-url').value;
        const pdfUrl     = document.getElementById('book-pdf-url').value.trim();
        const classLabel = document.getElementById('book-class-label').value.trim();
        const price      = Number(document.getElementById('book-price').value);

        if (!classLabel) { showAdminToast('শ্রেণি লিখুন'); btn.disabled = false; btn.textContent = '💾 সেভ করুন'; return; }
        if (!price)      { showAdminToast('মূল্য লিখুন');  btn.disabled = false; btn.textContent = '💾 সেভ করুন'; return; }

        // If admin picked a new cover image — convert to base64 and store as data URL
        // (This works without Firebase Storage)
        if (pendingCoverFile) {
            coverUrl = await fileToBase64(pendingCoverFile);
        }

        const data = {
            title:       document.getElementById('book-title').value.trim() || 'Golden Student Voc@bulary',
            classLabel,
            price,
            stock:       document.getElementById('book-stock').value,
            weight:      Number(document.getElementById('book-weight').value) || null,
            order:       Number(document.getElementById('book-order').value) || 99,
            description: document.getElementById('book-desc').value.trim(),
            coverUrl:    coverUrl || '',
            pdfUrl:      pdfUrl || '',
            updatedAt:   serverTimestamp()
        };

        if (editId) {
            await updateDoc(doc(db, 'books', editId), data);
            showAdminToast('বই আপডেট হয়েছে ✓');
        } else {
            data.createdAt = serverTimestamp();
            await addDoc(collection(db, 'books'), data);
            showAdminToast('নতুন বই যোগ হয়েছে ✓');
        }

        closeBookModal();
        loadAdminBooks();
    } catch (e) {
        showAdminToast('সেভ ব্যর্থ: ' + e.message);
        console.error(e);
    }

    btn.disabled    = false;
    btn.textContent = '💾 সেভ করুন';
};

// Convert image file to base64 — stores directly in Firestore
// Works without Firebase Storage (no paid plan needed)
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        // Resize image before storing to keep Firestore document size small
        const reader = new FileReader();
        reader.onload = e => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX = 600;
                let w = img.width, h = img.height;
                if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; }
                if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; }
                canvas.width = w; canvas.height = h;
                canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                resolve(canvas.toDataURL('image/jpeg', 0.8));
            };
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// ══════════════════════════════════════════
// AI DESCRIPTION
// ══════════════════════════════════════════
window.generateDescription = async function() {
    const classLabel = document.getElementById('book-class-label').value.trim();
    const title      = document.getElementById('book-title').value.trim();

    if (!classLabel) { showAdminToast('আগে শ্রেণি লিখুন'); return; }

    const btn     = document.getElementById('ai-desc-btn');
    const loading = document.getElementById('ai-desc-loading');
    btn.disabled  = true;
    loading.style.display = 'block';

    try {
        const prompt = `Write a short 1-2 sentence book description in Bengali for a vocabulary book called "${title || 'Golden Student Voc@bulary'}"
         for ${classLabel} students in Bangladesh. It covers word meanings, synonyms, antonyms, and parts of speech from the national board textbook. Return only the description text, nothing else.`;

        const response = await fetch('/.netlify/functions/generate-desc', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ classLabel, title })
        });
        const data = await response.json();
        const text = data.text || '';
        if (text) {
            document.getElementById('book-desc').value = text.trim();
            showAdminToast('✨ AI লিখেছে!');
        } else {
            showAdminToast('AI থেকে কিছু পাওয়া যায়নি');
        }
    } catch (e) {
        showAdminToast('AI ব্যর্থ — নিজে লিখুন');
    }

    btn.disabled          = false;
    loading.style.display = 'none';
};

// ══════════════════════════════════════════
// SETTINGS
// ══════════════════════════════════════════
async function loadSettings() {
    try {
        const snap = await getDoc(doc(db, 'settings', 'site'));
        if (snap.exists()) {
            siteSettings = snap.data();
            populateSettingsForm(siteSettings);
        }
    } catch (e) {}
    setupColorSync();
}

function populateSettingsForm(s) {
    // Simple map: Firebase key → input element ID
    const map = {
        whatsappNumber:      's-whatsapp',
        deliveryFeePerBook:  's-delivery-fee',
        'contact-phone':     's-phone',
        'contact-email':     's-email',
        colorPrimary:        's-color-primary',
        colorPrimaryDark:    's-color-primary-dark',
        colorSecondaryDark:  's-color-secondary',
        colorAccentDark:     's-color-accent',
        'hero-badge':        's-hero-badge',
        'title-main':        's-title-main',
        tagline:             's-tagline',
        'hero-desc':         's-hero-desc',
        'about-text':       's-about-text',
        'feat1-title':      's-feat1-title',
        'feat1-text':       's-feat1-text',
        'feat2-title':      's-feat2-title',
        'feat2-text':       's-feat2-text',
        'feat3-title':      's-feat3-title',
        'feat3-text':       's-feat3-text',
        'author-name':      's-author-name',
        'author-creds':      's-author-creds',
        'author-exp':        's-author-exp',
    };

    Object.entries(map).forEach(([key, id]) => {
        const el = document.getElementById(id);
        if (!el || !s[key]) return;
        el.value = s[key];
    });
}

function setupColorSync() {
    document.querySelectorAll('.color-picker-item').forEach(item => {
        item.addEventListener('click', () => {
            item.querySelector('input[type="color"]').click();
        });
    });
}

window.resetColors = function() {
    if (!confirm('ডিফল্ট রঙে ফিরে যাবেন?')) return;
    document.getElementById('s-color-primary').value      = '#F9A8D4';
    document.getElementById('s-color-primary-dark').value = '#EC4899';
    document.getElementById('s-color-secondary').value    = '#22C55E';
    document.getElementById('s-color-accent').value       = '#EAB308';
    showAdminToast('ডিফল্ট রঙ সেট হয়েছে — সেভ করুন');
};

window.saveSettings = async function() {
    const s = {
        whatsappNumber:     document.getElementById('s-whatsapp').value.trim(),
        deliveryFeePerBook: Number(document.getElementById('s-delivery-fee').value) || 0,
        'contact-phone':    document.getElementById('s-phone').value.trim(),
        'contact-whatsapp': document.getElementById('s-phone').value.trim(), // same number
        'contact-email':    document.getElementById('s-email').value.trim(),
        colorPrimary:       document.getElementById('s-color-primary').value,
        colorPrimaryDark:   document.getElementById('s-color-primary-dark').value,
        colorSecondaryDark: document.getElementById('s-color-secondary').value,
        colorAccentDark:    document.getElementById('s-color-accent').value,
        'hero-badge':       document.getElementById('s-hero-badge').value.trim(),
        'title-main':       document.getElementById('s-title-main').value.trim(),
        tagline:            document.getElementById('s-tagline').value.trim(),
        'hero-desc':        document.getElementById('s-hero-desc').value.trim(),
        'about-text':       document.getElementById('s-about-text').value.trim(),
        'feat1-title':      document.getElementById('s-feat1-title').value.trim(),
        'feat1-text':       document.getElementById('s-feat1-text').value.trim(),
        'feat2-title':      document.getElementById('s-feat2-title').value.trim(),
        'feat2-text':       document.getElementById('s-feat2-text').value.trim(),
        'feat3-title':      document.getElementById('s-feat3-title').value.trim(),
        'feat3-text':       document.getElementById('s-feat3-text').value.trim(),
        'author-name':      document.getElementById('s-author-name').value.trim(),
        'author-creds':     document.getElementById('s-author-creds').value.trim(),
        'author-exp':       document.getElementById('s-author-exp').value.trim(),
        updatedAt:          serverTimestamp()
    };

    try {
        // setDoc with merge:true creates the document if it doesn't exist,
        // or updates it if it does — no more try/catch addDoc fallback needed
        await setDoc(doc(db, 'settings', 'site'), s, { merge: true });
        const msg = document.getElementById('settings-saved');
        msg.style.display = 'inline';
        setTimeout(() => msg.style.display = 'none', 3000);
        showAdminToast('সেটিংস সেভ হয়েছে ✓');
    } catch (e) {
        showAdminToast('সেভ ব্যর্থ: ' + e.message);
    }
};

// ══════════════════════════════════════════
// TOAST + MODALS
// ══════════════════════════════════════════
function showAdminToast(msg) {
    const t = document.getElementById('admin-toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2800);
}

document.querySelectorAll('.modal-backdrop').forEach(b => {
    b.addEventListener('click', e => {
        if (e.target === b) b.classList.remove('open');
    });
});