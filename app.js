```javascript
// LSRTA Portal Shared App Logic
// Clean rebuild compatible with all portal pages.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getDatabase,
  ref,
  set,
  push,
  get,
  update,
  remove,
  onValue
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyCjAEOpWBS6k-tApaVY3aldpS1m8OYC3b4",
  authDomain: "lsrta-portal.firebaseapp.com",
  databaseURL: "https://lsrta-portal-default-rtdb.firebaseio.com",
  projectId: "lsrta-portal",
  storageBucket: "lsrta-portal.firebasestorage.app",
  messagingSenderId: "29459242340",
  appId: "1:29459242340:web:ad2a93f4783667ee816e71"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);

export const API_BASE = "https://lsrta-api.daniela-e0c.workers.dev";

export const PORTFOLIOS = {
  all: "All Portfolios",
  nc_gladysh: "NC Gladysh Capital",
  sc_platinum: "SC Platinum Estates",
  tx_acorn: "TX Acorn Ridge"
};

export function $(id) {
  return document.getElementById(id);
}

export function show(id, text = "") {
  const el = typeof id === "string" ? $(id) : id;
  if (!el) return;
  if (text) el.textContent = text;
  el.classList.add("show");
  el.style.display = "block";
}

export function hide(id) {
  const el = typeof id === "string" ? $(id) : id;
  if (!el) return;
  el.classList.remove("show");
  el.style.display = "none";
}

export function money(value) {
  const n = Number(value || 0);
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  });
}

export function pct(value) {
  if (value === null || value === undefined || value === "") return "0%";
  return `${Number(value).toFixed(1)}%`;
}

export async function doLogin(email, password) {
  return await signInWithEmailAndPassword(auth, email, password);
}

export async function doSignup(name, email, password) {
  const userCred = await createUserWithEmailAndPassword(auth, email, password);

  await set(ref(db, `users/${userCred.user.uid}`), {
    uid: userCred.user.uid,
    name: name || email,
    email,
    role: "member",
    createdAt: new Date().toISOString()
  });

  return userCred;
}

export async function doSignOut() {
  await signOut(auth);
  window.location.href = "index.html";
}

export function requireLogin(callback) {
  onAuthStateChanged(auth, (user) => {

    if (!user) {
      window.location.href = "index.html";
      return;
    }

    window.currentUser = user;

    if (typeof callback === "function") {
      callback(user);
    }

  });
}

export function shell(activePage, title, subtitle = "") {

  const nav = [
    ["dashboard.html", "🏠", "Dashboard"],
    ["reports.html", "📊", "Reports"],
    ["bulk.html", "📦", "Bulk Analysis"],
    ["compare.html", "🔄", "Compare"],
    ["rentroll.html", "📋", "Rent Roll"],
    ["chat.html", "💬", "Team Chat"],
    ["admin.html", "⚙️", "Admin Panel"]
  ];

  return `
    <nav class="sidebar">

      <div class="sidebar-brand">
        <div class="brand-eye">Internal Portal</div>

        <div class="brand-name small">
          Legacy<br><span>Signature</span>
        </div>

        <div class="brand-sub">
          Rental Trend Analyzer
        </div>
      </div>

      <div class="sidebar-nav">

        ${nav.map(([href, icon, label]) => `
          <a class="nav-item ${href === activePage ? "active" : ""}" href="${href}">
            <span class="nav-icon">${icon}</span>
            <span>${label}</span>
          </a>
        `).join("")}

      </div>

      <div class="sidebar-footer">
        <button class="btn btn-outline" id="logoutBtn" type="button">
          Sign Out
        </button>
      </div>

    </nav>

    <main class="main">

      <header class="topbar">
        <div>
          <div class="topbar-title">${title || ""}</div>
          <div class="topbar-sub">${subtitle || ""}</div>
        </div>
      </header>

      <section class="content" id="pageContent"></section>

    </main>
  `;
}

document.addEventListener("click", (event) => {

  if (event.target && event.target.id === "logoutBtn") {
    doSignOut();
  }

});

export async function api(path, payload = null, method = "POST") {

  const options = {
    method,
    headers: {
      "Content-Type": "application/json"
    }
  };

  if (payload !== null && method !== "GET") {
    options.body = JSON.stringify(payload);
  }

  const res = await fetch(`${API_BASE}${path}`, options);

  let data = null;

  try {
    data = await res.json();
  } catch {
    data = {
      error: await res.text()
    };
  }

  if (!res.ok || data?.success === false || data?.error) {
    throw new Error(data?.error || `Request failed: ${res.status}`);
  }

  return data;
}

export async function askAI(prompt, max_tokens = 1200) {

  const body = {
    model: "claude-3-5-sonnet-20241022",
    max_tokens,
    messages: [
      {
        role: "user",
        content: prompt
      }
    ]
  };

  const data = await api("/", body);

  return (
    data?.content?.[0]?.text ||
    data?.completion ||
    JSON.stringify(data, null, 2)
  );
}

export async function saveKpis(record) {

  const clean = {
    ...record,
    savedAt: new Date().toISOString(),
    timestamp: Date.now()
  };

  const newRef = push(ref(db, "kpis"));

  await set(newRef, clean);

  return newRef.key;
}

export async function loadKpis() {

  const snap = await get(ref(db, "kpis"));

  if (!snap.exists()) return [];

  return Object.entries(snap.val())
    .map(([id, value]) => ({
      id,
      ...value
    }))
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
}

export async function saveReport(record) {

  const newRef = push(ref(db, "reports"));

  await set(newRef, {
    ...record,
    savedAt: new Date().toISOString(),
    timestamp: Date.now()
  });

  return newRef.key;
}

export async function loadReports() {

  const snap = await get(ref(db, "reports"));

  if (!snap.exists()) return [];

  return Object.entries(snap.val())
    .map(([id, value]) => ({
      id,
      ...value
    }))
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
}

export async function saveChatMessage(channel, message) {

  const user = auth.currentUser;

  const newRef = push(ref(db, `chat/${channel || "general"}`));

  await set(newRef, {
    message,
    uid: user?.uid || null,
    email: user?.email || "Unknown",
    createdAt: new Date().toISOString(),
    timestamp: Date.now()
  });

  return newRef.key;
}

export function listenChat(channel, callback) {

  return onValue(ref(db, `chat/${channel || "general"}`), (snap) => {

    const rows = snap.exists()
      ? Object.entries(snap.val()).map(([id, value]) => ({
          id,
          ...value
        }))
      : [];

    rows.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

    callback(rows);

  });

}

window.firebaseApp = app;
window.auth = auth;
window.db = db;
window.API_BASE = API_BASE;
window.loginUser = doLogin;
window.logoutUser = doSignOut;
window.onPortalAuth = (callback) => onAuthStateChanged(auth, callback);
```
