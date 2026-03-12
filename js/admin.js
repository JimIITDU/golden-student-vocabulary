// ═══════════════════════════════════════════
// ADMIN PANEL — JAVASCRIPT
// ═══════════════════════════════════════════

import { db, storage, auth } from '../js/firebase-config.js';
import {
    collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc,
    serverTimestamp, query, orderBy, where
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import {
    signInWithEmailAndPassword, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
    ref, uploadBytesResumable, getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

// ── STATE ─────────────────────────────────
let allOrders  = [];
let allBooks   = [];
let pendingCoverFile = null;
let pendingPdfFile   = null;
let siteSettings     = {};

// ── AUTH ──────────────────────────────────
onAuthStateChanged(auth, user => {
    if (user) {
        document.getElementById('login-screen').style.display  = 'none';
        document.getElementById('admin-app').style.display = 'grid';
        document.getElementById('admin-email-display').textContent = user.email;
        loadOrders();
        loadAdminBooks();
        loadSettings();
    } else {
        document.getElementById('login-screen').style.display  = 'flex';
        document.getElementById('admin-app').style.display = 'none';
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
        err.textContent = 'ইমেইল বা পাসওয়ার্ড ভুল।';
        err.style.display = 'block';
        btn.disabled = false;
        btn.textContent = 'লগইন করুন';
    }
};

window.doLogout = async function() {
    await signOut(auth);
};

// ── TAB NAVIGATION ────────────────────────
document.querySelectorAll('.nav-item[data-tab]').forEach(item => {
    item.addEventListener('click', e => {
        e.preventDefault();
        const tab = item.getAttribute('data-tab');
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        item.classList.add('active');
        document.getElementById(`tab-${tab}`).classList.add('active');
    });
});

// ═══════════════════════════════════════════
// ORDERS
// ═══════════════════════════════════════════
window.loadOrders = async function() {
    const list = document.getElementById('orders-list');
    const loading = document.getElementById('orders-loading');
    loading.style.display = 'flex';
    list.innerHTML = '';

    try {
        const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        allOrders = [];
        snap.forEach(d => allOrders.push({ id: d.id, ...d.data() }));
        loading.style.display = 'none';
        renderOrders(allOrders);
    } catch(e) {
        loading.innerHTML = `<p style="color:red">অর্ডার লোড ব্যর্থ: ${e.message}</p>`;
    }
};

window.filterOrders = function() {
    const val = document.getElementById('order-filter').value;
    const filtered = val === 'all' ? allOrders : allOrders.filter(o => o.status === val);
    renderOrders(filtered);
};

function renderOrders(orders) {
    const list = document.getElementById('orders-list');
    if (orders.length === 0) {
        list.innerHTML = '<div class="loading-state"><p>কোনো অর্ডার নেই।</p></div>';
        return;
    }
    list.innerHTML = orders.map(order => buildOrderCard(order)).join('');
}

function buildOrderCard(o) {
    const date = o.createdAt?.toDate
        ? o.createdAt.toDate().toLocaleDateString('bn-BD', {day:'numeric',month:'short',year:'numeric'})
        : 'N/A';

    const payLabels = { cod:'Cash on Delivery', bkash:'bKash', nagad:'Nagad', rocket:'Rocket' };
    const itemLines = (o.items||[]).map(i =>
        `<div class="order-item-row"><span>${i.title} × ${i.qty}</span><span>৳${(i.price||0)*(i.qty||1)}</span></div>`
    ).join('');

    const waMsg = encodeURIComponent(
`✅ *অর্ডার কনফার্মেশন — Golden Student Voc@bulary*

প্রিয় ${o.name},
আপনার অর্ডার (${o.orderId}) কনফার্ম হয়েছে।
শীঘ্রই ডেলিভারি পাবেন। ধন্যবাদ! 📚`
    );
    const waNum = (o.phone||'').replace(/\D/g,'');
    const waNumFull = waNum.startsWith('0') ? '88' + waNum : waNum;

    return `
    <div class="order-card status-${o.status||'pending'}" id="order-${o.id}">
        <div class="order-top">
            <div>
                <div class="order-id">${o.orderId || o.id}</div>
                <div class="order-date">${date}</div>
            </div>
            <span class="status-badge badge-${o.status||'pending'}">${statusLabel(o.status)}</span>
        </div>
        <div class="order-info">
            <div class="order-info-item"><strong>${o.name||''}</strong>নাম</div>
            <div class="order-info-item"><strong>${o.phone||''}</strong>ফোন</div>
            <div class="order-info-item"><strong>${payLabels[o.payment]||o.payment||''}</strong>পেমেন্ট</div>
            <div class="order-info-item"><strong>${o.address||''}</strong>ঠিকানা</div>
        </div>
        <div class="order-items-list">
            ${itemLines}
            <div class="order-total"><span>মোট</span><strong>৳${o.total||0}</strong></div>
        </div>
        <div class="order-actions-row">
            <select class="status-select" onchange="updateOrderStatus('${o.id}', this.value)">
                <option value="pending"   ${o.status==='pending'   ?'selected':''}>⏳ পেন্ডিং</option>
                <option value="confirmed" ${o.status==='confirmed' ?'selected':''}>✅ কনফার্মড</option>
                <option value="shipped"   ${o.status==='shipped'   ?'selected':''}>🚚 শিপড</option>
                <option value="completed" ${o.status==='completed' ?'selected':''}>🎉 সম্পন্ন</option>
                <option value="cancelled" ${o.status==='cancelled' ?'selected':''}>❌ বাতিল</option>
                <option value="rejected"  ${o.status==='rejected'  ?'selected':''}>🚫 প্রত্যাখ্যাত</option>
            </select>
            <input type="date" class="date-input" value="${o.deliveryDate||''}"
                   onchange="updateDeliveryDate('${o.id}', this.value)">
            <a class="btn-wa" href="https://wa.me/${waNumFull}?text=${waMsg}" target="_blank">
                💬 WhatsApp
            </a>
        </div>
        <div class="order-notes">
            <input type="text" placeholder="নোট লিখুন..."
                   value="${o.notes||''}"
                   onblur="updateOrderNote('${o.id}', this.value)">
        </div>
    </div>`;
}

function statusLabel(s) {
    const labels = { pending:'পেন্ডিং', confirmed:'কনফার্মড', shipped:'শিপড',
                     completed:'সম্পন্ন', cancelled:'বাতিল', rejected:'প্রত্যাখ্যাত' };
    return labels[s] || s || 'পেন্ডিং';
}

window.updateOrderStatus = async function(id, status) {
    try {
        await updateDoc(doc(db, 'orders', id), { status });
        const card = document.getElementById(`order-${id}`);
        if (card) {
            card.className = `order-card status-${status}`;
            card.querySelector('.status-badge').className = `status-badge badge-${status}`;
            card.querySelector('.status-badge').textContent = statusLabel(status);
        }
        showAdminToast('স্ট্যাটাস আপডেট হয়েছে ✓');
    } catch(e) { showAdminToast('আপডেট ব্যর্থ: ' + e.message); }
};

window.updateDeliveryDate = async function(id, date) {
    try {
        await updateDoc(doc(db, 'orders', id), { deliveryDate: date });
        showAdminToast('তারিখ সেভ হয়েছে ✓');
    } catch(e) {}
};

window.updateOrderNote = async function(id, notes) {
    try {
        await updateDoc(doc(db, 'orders', id), { notes });
    } catch(e) {}
};

window.closeOrderModal = function() {
    document.getElementById('order-modal').classList.remove('open');
};

// ═══════════════════════════════════════════
// BOOKS
// ═══════════════════════════════════════════
window.loadAdminBooks = async function() {
    const grid = document.getElementById('admin-books-grid');
    const loading = document.getElementById('books-loading');
    loading.style.display = 'flex';
    grid.innerHTML = '';

    try {
        const snap = await getDocs(collection(db, 'books'));
        allBooks = [];
        snap.forEach(d => allBooks.push({ id: d.id, ...d.data() }));
        allBooks.sort((a,b) => (a.order||99) - (b.order||99));
        loading.style.display = 'none';
        grid.innerHTML = allBooks.map(book => `
            <div class="admin-book-card">
                <img class="admin-book-img"
                     src="${book.coverUrl || '../assets/covers/placeholder.png'}"
                     onerror="this.src='../assets/covers/placeholder.png'"
                     alt="${book.title||''}">
                <div class="admin-book-body">
                    <div class="admin-book-title">${book.classLabel||''} — ${book.classNameBn||''}</div>
                    <div class="admin-book-price">৳${book.price||0}</div>
                    <div class="admin-book-btns">
                        <button class="btn-edit" onclick="editBook('${book.id}')">✏️ সম্পাদনা</button>
                        <button class="btn-delete" onclick="deleteBook('${book.id}')">🗑</button>
                    </div>
                </div>
            </div>
        `).join('');
    } catch(e) {
        loading.innerHTML = `<p style="color:red">লোড ব্যর্থ: ${e.message}</p>`;
    }
};

window.openBookModal = function() {
    document.getElementById('book-modal-title').textContent = 'নতুন বই যোগ করুন';
    document.getElementById('edit-book-id').value = '';
    ['book-title','book-class-label','book-class-bn','book-price','book-weight','book-order','book-desc'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    document.getElementById('book-cover-url').value = '';
    document.getElementById('book-pdf-url').value   = '';
    document.getElementById('cover-preview-wrap').innerHTML = `<span class="upload-icon">🖼️</span><p>ছবি আপলোড করতে ক্লিক করুন</p><small>PNG, JPG — সর্বোচ্চ 5MB</small>`;
    document.getElementById('pdf-preview-wrap').innerHTML   = `<span class="upload-icon">📄</span><p>PDF আপলোড করতে ক্লিক করুন</p><small>PDF — সর্বোচ্চ 20MB</small>`;
    pendingCoverFile = null;
    pendingPdfFile   = null;
    document.getElementById('book-modal').classList.add('open');
};

window.closeBookModal = function() {
    document.getElementById('book-modal').classList.remove('open');
};

window.editBook = async function(id) {
    const book = allBooks.find(b => b.id === id);
    if (!book) return;
    document.getElementById('book-modal-title').textContent = 'বই সম্পাদনা করুন';
    document.getElementById('edit-book-id').value     = id;
    document.getElementById('book-title').value       = book.title || '';
    document.getElementById('book-class-label').value = book.classLabel || '';
    document.getElementById('book-class-bn').value    = book.classNameBn || '';
    document.getElementById('book-price').value       = book.price || '';
    document.getElementById('book-weight').value      = book.weight || '';
    document.getElementById('book-order').value       = book.order || '';
    document.getElementById('book-desc').value        = book.description || '';
    document.getElementById('book-cover-url').value   = book.coverUrl || '';
    document.getElementById('book-pdf-url').value     = book.pdfUrl || '';

    if (book.coverUrl) {
        document.getElementById('cover-preview-wrap').innerHTML =
            `<img src="${book.coverUrl}" style="max-height:120px;border-radius:6px;"><p>${book.coverUrl.split('/').pop().split('?')[0]}</p>`;
    }
    if (book.pdfUrl) {
        document.getElementById('pdf-preview-wrap').innerHTML =
            `<span class="upload-icon">📄</span><p style="color:green">PDF আপলোড করা আছে</p>`;
    }
    pendingCoverFile = null;
    pendingPdfFile   = null;
    document.getElementById('book-modal').classList.add('open');
};

window.deleteBook = async function(id) {
    if (!confirm('এই বইটি মুছে দেবেন?')) return;
    try {
        await deleteDoc(doc(db, 'books', id));
        showAdminToast('বই মুছে গেছে');
        loadAdminBooks();
    } catch(e) { showAdminToast('মুছতে ব্যর্থ'); }
};

window.previewCover = function(input) {
    if (!input.files[0]) return;
    pendingCoverFile = input.files[0];
    const reader = new FileReader();
    reader.onload = e => {
        document.getElementById('cover-preview-wrap').innerHTML =
            `<img src="${e.target.result}" style="max-height:120px;border-radius:6px;"><p>${input.files[0].name}</p>`;
    };
    reader.readAsDataURL(input.files[0]);
};

window.previewPdf = function(input) {
    if (!input.files[0]) return;
    pendingPdfFile = input.files[0];
    document.getElementById('pdf-preview-wrap').innerHTML =
        `<span class="upload-icon">📄</span><p style="color:green">${input.files[0].name}</p>`;
};

async function uploadFile(file, path) {
    return new Promise((resolve, reject) => {
        const fileRef = ref(storage, path);
        const task = uploadBytesResumable(fileRef, file);
        const progress = document.getElementById('upload-progress');
        const fill     = document.getElementById('progress-fill');
        const text     = document.getElementById('progress-text');
        progress.style.display = '';

        task.on('state_changed',
            snap => {
                const pct = Math.round(snap.bytesTransferred / snap.totalBytes * 100);
                fill.style.width = pct + '%';
                text.textContent = `আপলোড হচ্ছে... ${pct}%`;
            },
            reject,
            async () => {
                const url = await getDownloadURL(task.snapshot.ref);
                progress.style.display = 'none';
                resolve(url);
            }
        );
    });
}

window.saveBook = async function() {
    const btn = document.getElementById('save-book-btn');
    btn.disabled = true;
    btn.textContent = 'সেভ হচ্ছে...';

    try {
        const editId = document.getElementById('edit-book-id').value;
        let coverUrl = document.getElementById('book-cover-url').value;
        let pdfUrl   = document.getElementById('book-pdf-url').value;

        const bookId = editId || ('book_' + Date.now());

        // Upload cover image if new file selected
        if (pendingCoverFile) {
            coverUrl = await uploadFile(pendingCoverFile, `covers/${bookId}_${pendingCoverFile.name}`);
        }
        // Upload PDF if new file selected
        if (pendingPdfFile) {
            pdfUrl = await uploadFile(pendingPdfFile, `pdfs/${bookId}_${pendingPdfFile.name}`);
        }

        const data = {
            title:       document.getElementById('book-title').value.trim(),
            classLabel:  document.getElementById('book-class-label').value.trim(),
            classNameBn: document.getElementById('book-class-bn').value.trim(),
            price:       Number(document.getElementById('book-price').value),
            weight:      Number(document.getElementById('book-weight').value) || null,
            order:       Number(document.getElementById('book-order').value) || 99,
            description: document.getElementById('book-desc').value.trim(),
            coverUrl, pdfUrl,
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
    } catch(e) {
        showAdminToast('সেভ ব্যর্থ: ' + e.message);
    }

    btn.disabled = false;
    btn.textContent = '💾 সেভ করুন';
};

// ═══════════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════════
async function loadSettings() {
    try {
        const snap = await getDoc(doc(db, 'settings', 'site'));
        if (snap.exists()) {
            siteSettings = snap.data();
            populateSettings(siteSettings);
        }
    } catch(e) {}
    setupColorSync();
}

function populateSettings(s) {
    const map = {
        'whatsappNumber':    's-whatsapp',
        'contact-phone':     's-phone',
        'bkashNumber':       's-bkash',
        'contact-email':     's-email',
        'colorPrimaryDark':  's-color-primary-dark',
        'colorSecondaryDark':'s-color-secondary-dark',
        'colorAccentDark':   's-color-accent-dark',
        'hero-badge':        's-hero-badge',
        'title-main':        's-title-main',
        'tagline':           's-tagline',
        'hero-desc':         's-hero-desc',
        'about-text':        's-about-text',
        'author-name':       's-author-name',
        'author-creds':      's-author-creds',
        'author-exp':        's-author-exp',
    };
    Object.entries(map).forEach(([key, id]) => {
        const el = document.getElementById(id);
        if (el && s[key]) {
            el.value = s[key];
            if (el.type === 'color') {
                const textEl = document.getElementById(id + '-text');
                if (textEl) textEl.value = s[key];
            }
        }
    });
}

function setupColorSync() {
    ['s-color-primary', 's-color-primary-dark', 's-color-secondary', 's-color-accent'].forEach(id => {
        const colorEl = document.getElementById(id);
        const textEl  = document.getElementById(id + '-text');
        if (!colorEl || !textEl) return;
        colorEl.addEventListener('input', () => { textEl.value = colorEl.value; });
        textEl.addEventListener('input', () => {
            if (/^#[0-9A-Fa-f]{6}$/.test(textEl.value)) colorEl.value = textEl.value;
        });
    });
}

window.saveSettings = async function() {
    const s = {
        whatsappNumber:     document.getElementById('s-whatsapp').value.trim(),
        'contact-phone':    document.getElementById('s-phone').value.trim(),
        bkashNumber:        document.getElementById('s-bkash').value.trim(),
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
        'author-name':      document.getElementById('s-author-name').value.trim(),
        'author-creds':     document.getElementById('s-author-creds').value.trim(),
        'author-exp':       document.getElementById('s-author-exp').value.trim(),
        updatedAt:          serverTimestamp()
    };

    try {
        await updateDoc(doc(db, 'settings', 'site'), s);
    } catch(e) {
        // If document doesn't exist yet, create it
        await addDoc(collection(db, 'settings'), { ...s, _id: 'site' });
    }

    const msg = document.getElementById('settings-saved');
    msg.style.display = 'inline';
    setTimeout(() => msg.style.display = 'none', 3000);
    showAdminToast('সেটিংস সেভ হয়েছে ✓');
};

// ── TOAST ─────────────────────────────────
function showAdminToast(msg) {
    const t = document.getElementById('admin-toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2800);
}

// ── CLOSE MODALS ON BACKDROP CLICK ────────
document.querySelectorAll('.modal-backdrop').forEach(b => {
    b.addEventListener('click', e => {
        if (e.target === b) b.classList.remove('open');
    });
});
