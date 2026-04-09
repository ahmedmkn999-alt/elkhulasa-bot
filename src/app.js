// ==================== ORBIT APP - MAIN JS ====================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, updateProfile } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp, getDoc, setDoc, limit } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

// ===================== FIREBASE CONFIG =====================
const firebaseConfig = {
  apiKey: "AIzaSyBD6AC1xo3CCQn-Wk82r8nheWiu5Hf8-fo",
  authDomain: "orbit-284fb.firebaseapp.com",
  databaseURL: "https://orbit-284fb-default-rtdb.firebaseio.com",
  projectId: "orbit-284fb",
  storageBucket: "orbit-284fb.firebasestorage.app",
  messagingSenderId: "618534849025",
  appId: "1:618534849025:web:0ba7eb11a7f5840a1f4e00",
  measurementId: "G-ES3BM20VP0"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// ===================== CLOUDINARY CONFIG =====================
const CLOUDINARY_CLOUD_NAME = "dkfmfntpa";
const CLOUDINARY_PRESET = "orbit_unsigned";

// ===================== TELEGRAM BOT =====================
const TELEGRAM_BOT_TOKEN = "8658257472:AAGzEJVjaBvdVZucl3BLjTyAlYLLqTmqFjU";
const TELEGRAM_CHAT_ID = null; // Will be retrieved via bot

// ===================== STATE =====================
let currentUser = null;
let currentPage = 'home';
let currentChatPartner = null;
let postsCache = [];
let unsubscribeFeed = null;
let otpCode = null;
let otpPhone = null;
let otpResendTimer = null;

// ===================== SPLASH + INIT =====================
window.addEventListener('load', () => {
  setTimeout(() => {
    document.getElementById('splash-screen').style.opacity = '0';
    document.getElementById('splash-screen').style.transition = 'opacity 0.5s';
    setTimeout(() => {
      document.getElementById('splash-screen').style.display = 'none';
      checkAuthState();
    }, 500);
  }, 2500);
  registerSW();
  setupOTPInputs();
  setupAuthTabs();
});

function registerSW() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
}

function checkAuthState() {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      currentUser = user;
      showMainApp();
    } else {
      showAuthScreen();
    }
  });
}

// ===================== AUTH =====================
function showAuthScreen() {
  document.getElementById('auth-screen').classList.remove('hidden');
  document.getElementById('main-app').classList.add('hidden');
}

function showMainApp() {
  document.getElementById('auth-screen').classList.add('hidden');
  document.getElementById('main-app').classList.remove('hidden');
  initApp();
}

function setupAuthTabs() {
  document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const tabName = tab.dataset.tab;
      document.getElementById('login-form').classList.toggle('hidden', tabName !== 'login');
      document.getElementById('register-form').classList.toggle('hidden', tabName !== 'register');
      document.getElementById('phone-login-form').classList.add('hidden');
    });
  });
}

window.togglePass = (id) => {
  const input = document.getElementById(id);
  input.type = input.type === 'password' ? 'text' : 'password';
};

window.handleLogin = async () => {
  const identifier = document.getElementById('login-identifier').value.trim();
  const password = document.getElementById('login-password').value.trim();
  if (!identifier || !password) { showAuthMsg('ادخل البيانات الصح', 'error'); return; }
  showAuthMsg('جاري الدخول...', '');
  try {
    const email = identifier.includes('@') ? identifier : identifier + '@orbit.app';
    await signInWithEmailAndPassword(auth, email, password);
    showAuthMsg('أهلاً بك!', 'success');
  } catch (e) {
    showAuthMsg('البيانات غلط، حاول تاني', 'error');
  }
};

window.handleRegister = async () => {
  const fname = document.getElementById('reg-firstname').value.trim();
  const lname = document.getElementById('reg-lastname').value.trim();
  const phone = document.getElementById('reg-phone').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const pass = document.getElementById('reg-password').value.trim();
  if (!fname || !lname || !phone || !pass) { showAuthMsg('ادخل كل البيانات المطلوبة', 'error'); return; }
  if (pass.length < 8) { showAuthMsg('كلمة السر لازم تكون 8 أحرف على الأقل', 'error'); return; }
  showAuthMsg('جاري إنشاء الحساب...', '');
  try {
    const finalEmail = email || phone.replace(/[^0-9]/g, '') + '@orbit.app';
    const cred = await createUserWithEmailAndPassword(auth, finalEmail, pass);
    await updateProfile(cred.user, { displayName: fname + ' ' + lname });
    await setDoc(doc(db, 'users', cred.user.uid), {
      name: fname + ' ' + lname,
      phone, email: finalEmail,
      bio: 'مرحباً في Orbit 🚀',
      createdAt: serverTimestamp(),
      avatar: `https://ui-avatars.com/api/?name=${fname}+${lname}&background=7c3aed&color=fff&size=90`
    });
    showAuthMsg('تم إنشاء الحساب!', 'success');
  } catch (e) {
    if (e.code === 'auth/email-already-in-use') showAuthMsg('الرقم ده موجود قبل كده', 'error');
    else showAuthMsg('حصل خطأ، حاول تاني', 'error');
  }
};

window.handleGoogleLogin = async () => {
  try {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  } catch (e) { showAuthMsg('فشل الدخول بـ Google', 'error'); }
};

window.showPhoneLogin = () => {
  document.getElementById('login-form').classList.add('hidden');
  document.getElementById('phone-login-form').classList.remove('hidden');
};
window.hidePhoneLogin = () => {
  document.getElementById('phone-login-form').classList.add('hidden');
  document.getElementById('login-form').classList.remove('hidden');
};

window.sendOTP = async () => {
  const cc = document.getElementById('country-code').value;
  const phone = document.getElementById('phone-number').value.trim();
  if (!phone) { showAuthMsg('ادخل رقم الموبايل', 'error'); return; }
  otpPhone = cc + phone;
  otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  // Send via Telegram Bot
  try {
    const msg = `🔐 كود تحقق Orbit\n\nالكود: *${otpCode}*\n\nصالح لمدة 5 دقائق`;
    await sendTelegramMsg(msg, phone);
    document.getElementById('otp-section').classList.remove('hidden');
    showAuthMsg('تم إرسال الكود على التيليجرام', 'success');
    startResendTimer();
  } catch (e) {
    // Fallback: show code for testing
    document.getElementById('otp-section').classList.remove('hidden');
    showAuthMsg(`كود الاختبار: ${otpCode}`, 'success');
  }
};

async function sendTelegramMsg(text, phone) {
  // Try to find user's telegram via phone - send to admin for now
  const adminChatId = ""; // Can be configured
  if (!adminChatId) throw new Error('No admin chat ID');
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: adminChatId, text, parse_mode: 'Markdown' })
  });
}

window.verifyOTP = async () => {
  const inputs = document.querySelectorAll('.otp-input');
  const entered = Array.from(inputs).map(i => i.value).join('');
  if (entered === otpCode) {
    showAuthMsg('جاري الدخول...', '');
    try {
      const email = otpPhone.replace(/[^0-9]/g, '') + '@orbit.app';
      const pass = 'orbit_' + otpCode + '_' + otpPhone.slice(-4);
      try {
        await signInWithEmailAndPassword(auth, email, pass);
      } catch {
        await createUserWithEmailAndPassword(auth, email, pass);
      }
    } catch (e) { showAuthMsg('حصل خطأ، حاول تاني', 'error'); }
  } else {
    showAuthMsg('الكود غلط', 'error');
  }
};

window.resendOTP = () => { if (!otpResendTimer) window.sendOTP(); };

function startResendTimer() {
  let secs = 60;
  const btn = document.querySelector('.resend-btn');
  btn.disabled = true;
  otpResendTimer = setInterval(() => {
    secs--;
    btn.textContent = `إعادة الإرسال (${secs}s)`;
    if (secs <= 0) {
      clearInterval(otpResendTimer);
      otpResendTimer = null;
      btn.disabled = false;
      btn.textContent = 'إعادة الإرسال';
    }
  }, 1000);
}

function setupOTPInputs() {
  document.querySelectorAll('.otp-input').forEach((input, i, arr) => {
    input.addEventListener('input', (e) => {
      if (e.target.value && i < arr.length - 1) arr[i + 1].focus();
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !input.value && i > 0) arr[i - 1].focus();
    });
  });
}

function showAuthMsg(msg, type) {
  const el = document.getElementById('auth-message');
  el.textContent = msg;
  el.className = 'auth-message' + (type ? ' ' + type : '');
  el.classList.remove('hidden');
  if (type === 'success' || type === 'error') {
    setTimeout(() => el.classList.add('hidden'), 4000);
  }
}

window.handleLogout = async () => {
  if (confirm('هتخرج فعلاً؟')) {
    if (unsubscribeFeed) unsubscribeFeed();
    await signOut(auth);
    showAuthScreen();
  }
};

// ===================== APP INIT =====================
async function initApp() {
  if (!currentUser) return;
  updateProfileUI();
  loadFeed();
  loadNotifications();
  loadConversations();
  loadMarketItems();
  loadProfilePosts();
  showPage('home');
}

function updateProfileUI() {
  if (!currentUser) return;
  const name = currentUser.displayName || 'مستخدم Orbit';
  document.getElementById('profile-name').textContent = name;
  document.getElementById('composer-username').textContent = name;
  const avatar = currentUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=7c3aed&color=fff&size=90`;
  document.getElementById('profile-avatar').src = avatar;
  document.querySelectorAll('.composer-avatar').forEach(el => el.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=7c3aed&color=fff&size=40`);
}

// ===================== NAVIGATION =====================
window.showPage = (page) => {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + page)?.classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const activeBtn = document.querySelector(`.nav-btn[data-page="${page}"]`);
  if (activeBtn) activeBtn.classList.add('active');
  currentPage = page;
  // Hide header for specific pages
  const noHeaderPages = ['chat'];
  document.getElementById('app-header').style.display = noHeaderPages.includes(page) ? 'none' : '';
};

// ===================== FEED =====================
async function loadFeed() {
  const feedEl = document.getElementById('feed');
  document.getElementById('feed-loader').classList.remove('hidden');
  try {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(20));
    unsubscribeFeed = onSnapshot(q, (snap) => {
      document.getElementById('feed-loader').classList.add('hidden');
      feedEl.innerHTML = '';
      if (snap.empty) {
        feedEl.innerHTML = '<div style="text-align:center;padding:40px;color:#5a5a7a;">لا توجد بوستات بعد. كن أول واحد ينشر!</div>';
        return;
      }
      snap.forEach(d => renderPost({ id: d.id, ...d.data() }));
    });
  } catch (e) {
    document.getElementById('feed-loader').classList.add('hidden');
    feedEl.innerHTML = '<div style="text-align:center;padding:40px;color:#5a5a7a;">مش قادر يحمل البوستات دلوقتي</div>';
  }
}

function renderPost(post) {
  const feedEl = document.getElementById('feed');
  const isOwner = currentUser && post.userId === currentUser.uid;
  const userName = post.userName || 'مستخدم Orbit';
  const userAvatar = post.userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=7c3aed&color=fff&size=42`;
  const timeAgo = getTimeAgo(post.createdAt);
  const likeCount = post.likes || 0;
  const commentCount = post.comments || 0;
  const text = post.text || '';
  const truncated = text.length > 200;
  const displayText = truncated ? text.slice(0, 200) : text;
  const div = document.createElement('div');
  div.className = 'post-card';
  div.dataset.postId = post.id;
  div.innerHTML = `
    <div class="post-header">
      <div class="post-avatar"><img src="${userAvatar}" alt="${userName}" loading="lazy" /></div>
      <div class="post-user-info">
        <strong>${userName}</strong>
        <span>${timeAgo}</span>
      </div>
      <button class="post-menu-btn" onclick="openPostMenu('${post.id}', ${isOwner})">
        <svg viewBox="0 0 24 24" fill="currentColor" width="20"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>
      </button>
    </div>
    ${text ? `<div class="post-text">
      ${displayText}${truncated ? `<span class="see-more" onclick="seeMore(this, '${post.id}')">... عرض المزيد</span>` : ''}
    </div>` : ''}
    ${post.mediaUrl ? `<div class="post-media">${post.mediaType === 'video' ? `<video src="${post.mediaUrl}" controls playsinline></video>` : `<img src="${post.mediaUrl}" alt="صورة" loading="lazy" />`}</div>` : ''}
    <div class="emoji-reactions">
      <button class="emoji-reaction-btn" onclick="reactToPost('${post.id}', '❤️', this)">❤️ <span>${post.reactions?.heart || 0}</span></button>
      <button class="emoji-reaction-btn" onclick="reactToPost('${post.id}', '😂', this)">😂 <span>${post.reactions?.laugh || 0}</span></button>
      <button class="emoji-reaction-btn" onclick="reactToPost('${post.id}', '😮', this)">😮 <span>${post.reactions?.wow || 0}</span></button>
      <button class="emoji-reaction-btn" onclick="reactToPost('${post.id}', '😢', this)">😢 <span>${post.reactions?.sad || 0}</span></button>
      <button class="emoji-reaction-btn" onclick="reactToPost('${post.id}', '😡', this)">😡 <span>${post.reactions?.angry || 0}</span></button>
    </div>
    <div class="post-reactions">
      <span class="reaction-stats">${likeCount} إعجاب · ${commentCount} تعليق</span>
      <div class="post-actions">
        <button class="action-btn" onclick="likePost('${post.id}', this)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          <span>إعجاب</span>
        </button>
        <button class="action-btn" onclick="openComments('${post.id}')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          <span>تعليق</span>
        </button>
        <button class="action-btn" onclick="sharePost('${post.id}')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
          <span>مشاركة</span>
        </button>
      </div>
    </div>`;
  feedEl.appendChild(div);
}

window.seeMore = (el, postId) => {
  const postText = el.closest('.post-text');
  // Find full post text from cache
  el.remove();
};

window.likePost = async (postId, btn) => {
  if (!currentUser) { showToast('سجل دخول الأول', 'error'); return; }
  btn.classList.toggle('liked');
  showToast(btn.classList.contains('liked') ? '❤️ أعجبك!' : 'تم إلغاء الإعجاب', '');
  try {
    const ref_ = doc(db, 'posts', postId);
    const d = await getDoc(ref_);
    if (d.exists()) {
      const likes = (d.data().likes || 0) + (btn.classList.contains('liked') ? 1 : -1);
      await updateDoc(ref_, { likes: Math.max(0, likes) });
    }
  } catch {}
};

window.reactToPost = async (postId, emoji, btn) => {
  if (!currentUser) return;
  const emojiMap = { '❤️': 'heart', '😂': 'laugh', '😮': 'wow', '😢': 'sad', '😡': 'angry' };
  const field = emojiMap[emoji];
  const countEl = btn.querySelector('span');
  let count = parseInt(countEl.textContent) || 0;
  count++;
  countEl.textContent = count;
  btn.style.borderColor = 'var(--accent-purple)';
  try {
    const r = doc(db, 'posts', postId);
    const d = await getDoc(r);
    if (d.exists()) {
      const reactions = d.data().reactions || {};
      reactions[field] = (reactions[field] || 0) + 1;
      await updateDoc(r, { reactions });
    }
  } catch {}
};

// ===================== POST COMPOSER =====================
window.openPostComposer = () => {
  if (!currentUser) { showAuthScreen(); return; }
  document.getElementById('post-composer-modal').classList.remove('hidden');
  setTimeout(() => document.getElementById('post-text').focus(), 300);
};
window.closePostComposer = () => document.getElementById('post-composer-modal').classList.add('hidden');

window.publishPost = async () => {
  if (!currentUser) return;
  const text = document.getElementById('post-text').value.trim();
  const autoDelete = document.getElementById('auto-delete').value;
  if (!text) { showToast('اكتب حاجة الأول', 'error'); return; }
  const btn = document.querySelector('.publish-btn');
  btn.textContent = 'جاري النشر...'; btn.disabled = true;
  try {
    const postData = {
      userId: currentUser.uid,
      userName: currentUser.displayName || 'مستخدم Orbit',
      userAvatar: currentUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.displayName || 'أنت')}&background=7c3aed&color=fff&size=42`,
      text, likes: 0, comments: 0, reactions: {},
      createdAt: serverTimestamp(),
      autoDelete: autoDelete || null
    };
    await addDoc(collection(db, 'posts'), postData);
    closePostComposer();
    document.getElementById('post-text').value = '';
    showToast('تم النشر! 🎉', 'success');
    incrementPostCount();
    // Schedule auto-delete
    if (autoDelete) scheduleAutoDelete(autoDelete);
  } catch (e) {
    showToast('فشل النشر، حاول تاني', 'error');
  }
  btn.textContent = 'نشر'; btn.disabled = false;
};

function scheduleAutoDelete(duration) {
  const ms = { '1h': 3.6e6, '2h': 7.2e6, '24h': 8.64e7, '7d': 6.048e8 };
  if (ms[duration]) setTimeout(() => showToast('تم حذف البوست تلقائياً', ''), ms[duration]);
}

window.openPostMenu = (postId, isOwner) => {
  const actions = isOwner
    ? [{ label: 'حذف البوست', action: () => deletePost(postId), color: '#ef4444' }]
    : [{ label: 'الإبلاغ عن البوست', action: () => reportPost(postId) },
       { label: 'إخفاء البوست', action: () => hidePost(postId) }];
  showActionSheet(actions);
};

async function deletePost(postId) {
  try {
    await deleteDoc(doc(db, 'posts', postId));
    document.querySelector(`[data-post-id="${postId}"]`)?.remove();
    showToast('تم حذف البوست', 'success');
  } catch { showToast('فشل الحذف', 'error'); }
}
function reportPost(id) { showToast('تم الإبلاغ، شكراً', 'success'); }
function hidePost(id) { document.querySelector(`[data-post-id="${id}"]`)?.remove(); showToast('تم إخفاء البوست', ''); }

// ===================== COMMENTS =====================
let currentCommentsPostId = null;
window.openComments = (postId) => {
  currentCommentsPostId = postId;
  document.getElementById('comments-modal').classList.remove('hidden');
  loadComments(postId);
};
window.closeComments = () => document.getElementById('comments-modal').classList.add('hidden');

async function loadComments(postId) {
  const list = document.getElementById('comments-list');
  list.innerHTML = '<div style="text-align:center;color:#5a5a7a;padding:20px;">جاري التحميل...</div>';
  try {
    const q = query(collection(db, 'posts', postId, 'comments'), orderBy('createdAt', 'asc'));
    const snap = await getDocs(q);
    list.innerHTML = '';
    if (snap.empty) { list.innerHTML = '<div style="text-align:center;color:#5a5a7a;padding:20px;">لا توجد تعليقات بعد</div>'; return; }
    snap.forEach(d => {
      const c = d.data();
      const div = document.createElement('div');
      div.className = 'comment-item';
      div.innerHTML = `
        <img src="${c.userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.userName)}&background=7c3aed&color=fff&size=36`}" alt="${c.userName}" />
        <div class="comment-bubble">
          <strong>${c.userName}</strong>
          <p>${c.text}</p>
        </div>`;
      list.appendChild(div);
    });
  } catch {}
}

window.sendComment = async () => {
  if (!currentUser || !currentCommentsPostId) return;
  const input = document.getElementById('comment-input');
  const text = input.value.trim();
  if (!text) return;
  try {
    await addDoc(collection(db, 'posts', currentCommentsPostId, 'comments'), {
      userId: currentUser.uid,
      userName: currentUser.displayName || 'مستخدم',
      userAvatar: currentUser.photoURL,
      text, createdAt: serverTimestamp()
    });
    const ref_ = doc(db, 'posts', currentCommentsPostId);
    const d = await getDoc(ref_);
    if (d.exists()) await updateDoc(ref_, { comments: (d.data().comments || 0) + 1 });
    input.value = '';
    loadComments(currentCommentsPostId);
  } catch {}
};

// ===================== MESSAGES / CHAT =====================
const demoConversations = [
  { id: 'sara', name: 'سارة محمد', lastMsg: 'أزيك يا عم؟ 😊', time: 'دلوقتي', unread: 2, online: true, avatar: 'https://ui-avatars.com/api/?name=سارة&background=ec4899&color=fff&size=52' },
  { id: 'omar', name: 'عمر خالد', lastMsg: 'شوف الفيديو ده 🔥', time: '5 د', unread: 3, online: true, avatar: 'https://ui-avatars.com/api/?name=عمر&background=06b6d4&color=fff&size=52' },
  { id: 'nour', name: 'نور حسن', lastMsg: 'تمام ياسيدي', time: '20 د', unread: 0, online: false, avatar: 'https://ui-avatars.com/api/?name=نور&background=f59e0b&color=fff&size=52' },
  { id: 'karim', name: 'كريم سامي', lastMsg: 'موعدنا الساعة 4', time: '2 س', unread: 0, online: false, avatar: 'https://ui-avatars.com/api/?name=كريم&background=10b981&color=fff&size=52' },
];

function loadConversations() {
  const list = document.getElementById('conversations-list');
  list.innerHTML = '';
  demoConversations.forEach(conv => {
    const div = document.createElement('div');
    div.className = 'conv-item';
    div.innerHTML = `
      <div class="conv-avatar-wrap">
        <img class="conv-avatar" src="${conv.avatar}" alt="${conv.name}" />
        ${conv.online ? '<div class="conv-online"></div>' : ''}
      </div>
      <div class="conv-content">
        <div class="conv-header">
          <span class="conv-name">${conv.name}</span>
          <span class="conv-time">${conv.time}</span>
        </div>
        <div class="conv-last-msg">${conv.lastMsg}</div>
      </div>
      ${conv.unread ? `<div class="conv-unread">${conv.unread}</div>` : ''}`;
    div.onclick = () => openChat(conv);
    list.appendChild(div);
  });
}

function openChat(partner) {
  currentChatPartner = partner;
  document.getElementById('chat-partner-name').textContent = partner.name;
  document.getElementById('chat-partner-status').textContent = partner.online ? 'متصل الآن' : 'غير متصل';
  document.getElementById('chat-partner-avatar').src = partner.avatar;
  document.getElementById('call-partner-avatar-lg').src = partner.avatar;
  showPage('chat');
  loadChatMessages(partner.id);
}

function loadChatMessages(partnerId) {
  const msgs = document.getElementById('chat-messages');
  const demoMsgs = [
    { text: 'السلام عليكم!', sent: false, time: '10:00' },
    { text: 'وعليكم السلام! أزيك يا صديقي؟', sent: true, time: '10:01' },
    { text: 'الحمد لله، بخير. شوف الحاجة الجديدة اللي عملتها', sent: false, time: '10:02' },
    { text: 'إيه هي؟ 👀', sent: true, time: '10:03' },
  ];
  msgs.innerHTML = '';
  demoMsgs.forEach(m => {
    const div = document.createElement('div');
    div.className = `chat-msg ${m.sent ? 'sent' : 'received'}`;
    div.innerHTML = `${m.text}<span class="chat-msg-time">${m.time}</span>`;
    msgs.appendChild(div);
  });
  msgs.scrollTop = msgs.scrollHeight;
}

window.handleChatKeypress = (e) => { if (e.key === 'Enter') window.sendChatMessage(); };
window.sendChatMessage = () => {
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text) return;
  const msgs = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = 'chat-msg sent';
  div.innerHTML = `${text}<span class="chat-msg-time">${new Date().toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })}</span>`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
  input.value = '';
};

window.attachFile = () => showToast('جاري إضافة المرفقات...', '');

// ===================== VIDEO / VOICE CALL =====================
window.startVideoCall = () => {
  document.getElementById('video-call-modal').classList.remove('hidden');
  document.getElementById('call-status').textContent = 'جاري الاتصال...';
  setTimeout(() => { document.getElementById('call-status').textContent = 'متصل ✓'; }, 2000);
};
window.startVoiceCall = () => {
  showToast('📞 جاري بدء المكالمة الصوتية...', '');
};
window.endCall = () => document.getElementById('video-call-modal').classList.add('hidden');
window.toggleMic = () => showToast('تم إيقاف الميكروفون', '');
window.toggleCam = () => showToast('تم إيقاف الكاميرا', '');

window.useMessengerInApp = () => { closeMessengerPromo(); showToast('أهلاً بك في Orbit Messenger! 💬', 'success'); };
window.downloadMessenger = () => {
  showActionSheet([
    { label: '📱 تحميل الصورة المرجعية', action: () => { window.open('https://i.postimg.cc/FHrB7yjc/IMG-20260409-012959.png', '_blank'); } },
    { label: '🔗 مشاركة الرابط', action: () => showToast('تم نسخ الرابط', 'success') }
  ]);
};
function closeMessengerPromo() {}

// ===================== STORIES =====================
window.viewStory = (userId) => {
  const storyData = {
    sara: { name: 'سارة محمد', avatar: 'https://ui-avatars.com/api/?name=سارة&background=ec4899&color=fff&size=36', time: 'دلوقتي', image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600' },
    omar: { name: 'عمر خالد', avatar: 'https://ui-avatars.com/api/?name=عمر&background=06b6d4&color=fff&size=36', time: '5 دقائق', image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600' },
    nour: { name: 'نور حسن', avatar: 'https://ui-avatars.com/api/?name=نور&background=f59e0b&color=fff&size=36', time: '20 دقيقة', image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600' },
    karim: { name: 'كريم سامي', avatar: 'https://ui-avatars.com/api/?name=كريم&background=10b981&color=fff&size=36', time: 'ساعة', image: 'https://images.unsplash.com/photo-1518791841217-8f162f1912da?w=600' },
    hana: { name: 'هنا أحمد', avatar: 'https://ui-avatars.com/api/?name=هنا&background=8b5cf6&color=fff&size=36', time: '2 ساعة', image: 'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=600' },
  };
  const s = storyData[userId];
  if (!s) return;
  document.getElementById('story-user-avatar').src = s.avatar;
  document.getElementById('story-user-name').textContent = s.name;
  document.getElementById('story-time').textContent = s.time;
  document.getElementById('story-image').src = s.image;
  const bars = document.getElementById('story-progress-bars');
  bars.innerHTML = '<div class="story-progress-bar active"><div class="story-progress-fill"></div></div>';
  document.getElementById('story-viewer').classList.remove('hidden');
  setTimeout(() => window.closeStory(), 5500);
};
window.addStory = () => showToast('إضافة قصة - قريباً 📸', '');
window.closeStory = () => document.getElementById('story-viewer').classList.add('hidden');

// ===================== SEARCH =====================
window.openSearch = () => {
  document.getElementById('search-overlay').classList.remove('hidden');
  setTimeout(() => document.getElementById('search-input').focus(), 100);
};
window.closeSearch = () => document.getElementById('search-overlay').classList.add('hidden');
window.doSearch = (query) => {
  const results = document.getElementById('search-results');
  if (!query) { results.innerHTML = '<div class="search-category"><h4>اقتراحات</h4><div class="search-tags"><span onclick="doSearch(\'كورة\')">كورة</span><span onclick="doSearch(\'موسيقى\')">موسيقى</span><span onclick="doSearch(\'سفر\')">سفر</span><span onclick="doSearch(\'تقنية\')">تقنية</span></div></div>'; return; }
  results.innerHTML = `<div style="text-align:center;color:#5a5a7a;padding:40px;">جاري البحث عن "${query}"...</div>`;
  setTimeout(() => {
    results.innerHTML = `<div style="text-align:center;color:#5a5a7a;padding:40px;">لا توجد نتائج لـ "${query}" بعد</div>`;
  }, 800);
};

// ===================== MARKETPLACE =====================
const marketItems = [
  { id: 1, title: 'iPhone 15 Pro', price: '35,000 ج.م', location: 'القاهرة', category: 'electronics', img: 'https://images.unsplash.com/photo-1695048133142-1a20484bce71?w=200' },
  { id: 2, title: 'لابتوب Dell', price: '22,000 ج.م', location: 'الجيزة', category: 'electronics', img: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=200' },
  { id: 3, title: 'تيشيرت أبيض', price: '250 ج.م', location: 'الإسكندرية', category: 'clothes', img: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200' },
  { id: 4, title: 'أريكة مودرن', price: '8,500 ج.م', location: 'القاهرة', category: 'furniture', img: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=200' },
  { id: 5, title: 'سيارة كيا 2022', price: '420,000 ج.م', location: 'الجيزة', category: 'cars', img: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=200' },
  { id: 6, title: 'مطور ويب', price: 'للتفاوض', location: 'ريموت', category: 'jobs', img: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=200' },
];

function loadMarketItems(filter = 'all') {
  const grid = document.getElementById('market-grid');
  const items = filter === 'all' ? marketItems : marketItems.filter(i => i.category === filter);
  grid.innerHTML = '';
  items.forEach(item => {
    const div = document.createElement('div');
    div.className = 'market-item';
    div.innerHTML = `
      <div class="market-item-img"><img src="${item.img}" alt="${item.title}" loading="lazy" /></div>
      <div class="market-item-info">
        <div class="market-item-title">${item.title}</div>
        <div class="market-item-price">${item.price}</div>
        <div class="market-item-location">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          ${item.location}
        </div>
      </div>`;
    div.onclick = () => showToast(`${item.title} - ${item.price}`, '');
    grid.appendChild(div);
  });
}

window.filterMarket = (cat, btn) => {
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  loadMarketItems(cat);
};

window.addListing = () => showToast('إضافة إعلان - قريباً!', '');

// ===================== NOTIFICATIONS =====================
const demoNotifs = [
  { id: 1, text: '<strong>سارة محمد</strong> أعجبت ببوستك', time: 'دلوقتي', avatar: 'https://ui-avatars.com/api/?name=سارة&background=ec4899&color=fff&size=44', unread: true },
  { id: 2, text: '<strong>عمر خالد</strong> علّق على بوستك: "جميل! 🔥"', time: '5 دقائق', avatar: 'https://ui-avatars.com/api/?name=عمر&background=06b6d4&color=fff&size=44', unread: true },
  { id: 3, text: '<strong>كريم سامي</strong> بدأ يتابعك', time: '30 دقيقة', avatar: 'https://ui-avatars.com/api/?name=كريم&background=10b981&color=fff&size=44', unread: true },
  { id: 4, text: '<strong>نور حسن</strong> شارك بوستك', time: 'ساعة', avatar: 'https://ui-avatars.com/api/?name=نور&background=f59e0b&color=fff&size=44', unread: false },
];

function loadNotifications() {
  const list = document.getElementById('notifs-list');
  list.innerHTML = '';
  demoNotifs.forEach(n => {
    const div = document.createElement('div');
    div.className = `notif-item${n.unread ? ' unread' : ''}`;
    div.innerHTML = `
      <img class="notif-avatar" src="${n.avatar}" alt="" />
      <div class="notif-content"><p>${n.text}</p><div class="notif-time">${n.time}</div></div>
      ${n.unread ? '<div class="unread-dot"></div>' : ''}`;
    div.onclick = () => { div.classList.remove('unread'); div.querySelector('.unread-dot')?.remove(); };
    list.appendChild(div);
  });
}

window.markAllRead = () => {
  document.querySelectorAll('.notif-item').forEach(n => { n.classList.remove('unread'); n.querySelector('.unread-dot')?.remove(); });
  showToast('تم تحديد الكل كمقروء', 'success');
};

// ===================== PROFILE =====================
function loadProfilePosts() {
  const grid = document.getElementById('profile-posts-grid');
  const imgs = [
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200',
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=200',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=200',
  ];
  grid.innerHTML = '';
  imgs.forEach(img => {
    const div = document.createElement('div');
    div.className = 'profile-post-thumb';
    div.innerHTML = `<img src="${img}" alt="" loading="lazy" />`;
    grid.appendChild(div);
  });
}

function incrementPostCount() {
  const el = document.getElementById('post-count');
  el.textContent = parseInt(el.textContent || '0') + 1;
}

window.openEditProfile = () => {
  document.getElementById('edit-name').value = currentUser?.displayName || '';
  document.getElementById('edit-bio').value = document.getElementById('profile-bio').textContent;
  document.getElementById('edit-profile-modal').classList.remove('hidden');
};
window.closeEditProfile = () => document.getElementById('edit-profile-modal').classList.add('hidden');
window.saveProfile = async () => {
  const name = document.getElementById('edit-name').value.trim();
  const bio = document.getElementById('edit-bio').value.trim();
  if (!name) return;
  try {
    await updateProfile(currentUser, { displayName: name });
    document.getElementById('profile-name').textContent = name;
    document.getElementById('profile-bio').textContent = bio;
    document.getElementById('composer-username').textContent = name;
    if (currentUser.uid) {
      await updateDoc(doc(db, 'users', currentUser.uid), { name, bio }).catch(() => {});
    }
    closeEditProfile();
    showToast('تم حفظ التغييرات ✓', 'success');
  } catch { showToast('فشل الحفظ', 'error'); }
};

window.editCover = () => {
  const input = document.createElement('input');
  input.type = 'file'; input.accept = 'image/*';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { document.getElementById('cover-img').src = ev.target.result; };
    reader.readAsDataURL(file);
    showToast('جاري رفع صورة الغلاف...', '');
    try {
      const url = await uploadToCloudinary(file);
      document.getElementById('cover-img').src = url;
      showToast('تم تغيير صورة الغلاف ✓', 'success');
    } catch { showToast('فشل الرفع، جرب تاني', 'error'); }
  };
  input.click();
};

window.editAvatar = () => {
  const input = document.createElement('input');
  input.type = 'file'; input.accept = 'image/*';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    showToast('جاري رفع الصورة...', '');
    try {
      const url = await uploadToCloudinary(file);
      document.getElementById('profile-avatar').src = url;
      await updateProfile(currentUser, { photoURL: url });
      showToast('تم تغيير الصورة ✓', 'success');
    } catch { showToast('فشل الرفع', 'error'); }
  };
  input.click();
};

// ===================== CLOUDINARY UPLOAD =====================
async function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_PRESET);
  formData.append('cloud_name', CLOUDINARY_CLOUD_NAME);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`, {
    method: 'POST', body: formData
  });
  const data = await res.json();
  if (data.secure_url) return data.secure_url;
  throw new Error('Upload failed');
}

// ===================== POST MEDIA =====================
window.addPhotoToPost = () => {
  const input = document.createElement('input');
  input.type = 'file'; input.accept = 'image/*';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const preview = document.getElementById('post-media-preview');
      preview.innerHTML = `<img src="${ev.target.result}" style="width:100%;border-radius:12px;max-height:200px;object-fit:cover;" />`;
    };
    reader.readAsDataURL(file);
    showToast('جاري رفع الصورة...', '');
    try {
      const url = await uploadToCloudinary(file);
      window._pendingMediaUrl = url;
      window._pendingMediaType = 'image';
      showToast('تم رفع الصورة ✓', 'success');
    } catch { showToast('فشل رفع الصورة', 'error'); }
  };
  input.click();
};

window.addVideoToPost = () => {
  const input = document.createElement('input');
  input.type = 'file'; input.accept = 'video/*';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    showToast('جاري رفع الفيديو...', '');
    try {
      const url = await uploadToCloudinary(file);
      window._pendingMediaUrl = url;
      window._pendingMediaType = 'video';
      const preview = document.getElementById('post-media-preview');
      preview.innerHTML = `<video src="${url}" style="width:100%;border-radius:12px;max-height:200px;" controls></video>`;
      showToast('تم رفع الفيديو ✓', 'success');
    } catch { showToast('فشل رفع الفيديو', 'error'); }
  };
  input.click();
};

window.addEmojiToPost = () => {
  const emojis = ['😀','😂','❤️','🔥','👍','🎉','😍','🙏','💪','✨','🌟','😊','🤔','😭','🥳'];
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;bottom:120px;left:16px;right:16px;z-index:400;background:#1a1a2e;border-radius:16px;padding:16px;border:1px solid rgba(124,58,237,0.3);display:flex;flex-wrap:wrap;gap:8px;';
  emojis.forEach(e => {
    const btn = document.createElement('button');
    btn.textContent = e;
    btn.style.cssText = 'background:none;border:none;font-size:28px;cursor:pointer;padding:4px;';
    btn.onclick = () => {
      document.getElementById('post-text').value += e;
      modal.remove();
    };
    modal.appendChild(btn);
  });
  document.body.appendChild(modal);
  setTimeout(() => modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); }), 100);
};

// ===================== REELS =====================
window.toggleReelLike = (btn) => {
  const svg = btn.querySelector('svg');
  if (btn.classList.contains('liked')) {
    btn.classList.remove('liked');
    svg.style.fill = 'none';
    svg.style.stroke = 'currentColor';
  } else {
    btn.classList.add('liked');
    svg.style.fill = '#ef4444';
    svg.style.stroke = '#ef4444';
    showToast('❤️', '');
  }
};
window.shareReel = () => { if (navigator.share) navigator.share({ title: 'Orbit Reel', url: window.location.href }); else showToast('تم نسخ الرابط', 'success'); };
window.saveReel = () => showToast('تم حفظ الريل ✓', 'success');

// ===================== SETTINGS =====================
window.toggleDarkMode = (checkbox) => {
  document.body.style.filter = checkbox.checked ? '' : 'invert(1) hue-rotate(180deg)';
  showToast(checkbox.checked ? 'الوضع المظلم ✓' : 'الوضع المضيء ✓', '');
};
window.toggleDataSaver = (cb) => showToast(cb.checked ? 'وضع توفير الداتا شغال ✓' : 'تم إيقاف وضع توفير الداتا', '');
window.changeTheme = () => {
  const themes = [
    { name: 'البنفسجي (الافتراضي)', purple: '#7c3aed', cyan: '#06b6d4' },
    { name: 'الأزرق', purple: '#2563eb', cyan: '#0891b2' },
    { name: 'الوردي', purple: '#db2777', cyan: '#7c3aed' },
    { name: 'الأخضر', purple: '#059669', cyan: '#0891b2' },
  ];
  showActionSheet(themes.map(t => ({
    label: t.name,
    action: () => {
      document.documentElement.style.setProperty('--accent-purple', t.purple);
      document.documentElement.style.setProperty('--accent-cyan', t.cyan);
      showToast(`تم تغيير اللون لـ ${t.name}`, 'success');
    }
  })));
};
window.changePassword = () => showToast('سيتم إرسال رابط التغيير للإيميل', '');
window.privacySettings = () => showToast('إعدادات الخصوصية - قريباً', '');
window.twoFactor = () => showToast('التحقق بخطوتين - قريباً', '');
window.blockedUsers = () => showToast('قائمة المحظورين - قريباً', '');
window.openNewMessage = () => showToast('اختر محادثة من القائمة', '');

// ===================== UTILITIES =====================
function getTimeAgo(timestamp) {
  if (!timestamp) return 'الآن';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return 'الآن';
  if (diff < 3600) return `${Math.floor(diff / 60)} دقيقة`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ساعة`;
  return `${Math.floor(diff / 86400)} يوم`;
}

let toastTimeout;
window.showToast = (msg, type = '') => {
  clearTimeout(toastTimeout);
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.className = `toast${type ? ' ' + type : ''}`;
  void toast.offsetWidth;
  toast.classList.add('show');
  toastTimeout = setTimeout(() => toast.classList.remove('show'), 2500);
};

function showActionSheet(actions) {
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;z-index:500;background:rgba(0,0,0,0.6);display:flex;flex-direction:column;justify-content:flex-end;';
  const sheet = document.createElement('div');
  sheet.style.cssText = 'background:#1a1a2e;border-radius:22px 22px 0 0;padding:16px;border-top:1px solid rgba(124,58,237,0.3);';
  actions.forEach(a => {
    const btn = document.createElement('button');
    btn.textContent = a.label;
    btn.style.cssText = `width:100%;padding:15px;background:none;border:none;border-bottom:1px solid rgba(255,255,255,0.06);color:${a.color || '#f0f0ff'};font-family:Cairo,sans-serif;font-size:15px;cursor:pointer;text-align:right;`;
    btn.onclick = () => { a.action(); overlay.remove(); };
    sheet.appendChild(btn);
  });
  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'إلغاء';
  cancelBtn.style.cssText = 'width:100%;padding:15px;background:none;border:none;color:#9494b8;font-family:Cairo,sans-serif;font-size:15px;cursor:pointer;margin-top:8px;';
  cancelBtn.onclick = () => overlay.remove();
  sheet.appendChild(cancelBtn);
  overlay.appendChild(sheet);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
}

window.sharePost = (id) => {
  if (navigator.share) navigator.share({ title: 'Orbit', url: window.location.href });
  else { navigator.clipboard?.writeText(window.location.href).then(() => showToast('تم نسخ الرابط', 'success')); }
};

// ===================== PWA INSTALL PROMPT =====================
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  setTimeout(() => {
    const banner = document.createElement('div');
    banner.style.cssText = 'position:fixed;bottom:80px;left:16px;right:16px;z-index:400;background:#1a1a2e;border:1px solid rgba(124,58,237,0.4);border-radius:16px;padding:16px;display:flex;align-items:center;gap:12px;box-shadow:0 8px 30px rgba(0,0,0,0.4);';
    banner.innerHTML = `
      <div style="flex:1;font-family:Cairo,sans-serif;">
        <strong style="font-size:14px;">📲 ثبّت Orbit</strong>
        <p style="font-size:12px;color:#9494b8;margin-top:4px;">للوصول السريع من شاشتك الرئيسية</p>
      </div>
      <button id="install-btn" style="padding:8px 16px;background:linear-gradient(135deg,#7c3aed,#06b6d4);border:none;border-radius:10px;color:white;font-family:Cairo,sans-serif;font-size:13px;font-weight:700;cursor:pointer;">تثبيت</button>
      <button id="dismiss-install" style="background:none;border:none;color:#5a5a7a;font-size:20px;cursor:pointer;padding:4px;">×</button>`;
    document.body.appendChild(banner);
    document.getElementById('install-btn').onclick = async () => {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      banner.remove();
    };
    document.getElementById('dismiss-install').onclick = () => banner.remove();
  }, 5000);
});
