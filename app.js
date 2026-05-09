import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getDatabase,
  ref,
  set,
  push,
  get,
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

  if (text) {
    el.textContent = text;
  }

  el.style.display = "block";
}

export function hide(id) {
  const el = typeof id === "string" ? $(id) : id;
  if (!el) return;

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

  if (value === null || value === undefined || value === "") {
    return "0%";
  }

  return Number(value).toFixed(1) + "%";
}

export async function doLogin(email, password) {
  return await signInWithEmailAndPassword(auth, email, password);
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

    if (callback) {
      callback(user);
    }

  });

}

export function shell(activePage, title, subtitle) {

  return `
  <div class="main-shell">

    <aside class="sidebar">

      <div class="sidebar-brand">
        <div class="brand-eye">Internal Portal</div>

        <div class="brand-name">
          Legacy<br><span>Signature</span>
        </div>

        <div class="brand-sub">
          Rental Trend Analyzer
        </div>
      </div>

      <nav class="sidebar-nav">

        <a class="nav-item" href="dashboard.html">Dashboard</a>
        <a class="nav-item" href="reports.html">Reports</a>
        <a class="nav-item" href="bulk.html">Bulk Analysis</a>
        <a class="nav-item" href="compare.html">Compare</a>
        <a class="nav-item" href="rentroll.html">Rent Roll</a>
        <a class="nav-item" href="chat.html">Chat</a>
        <a class="nav-item" href="admin.html">Admin</a>

      </nav>

    </aside>

    <main class="main-content">

      <div class="topbar">
        <div class="topbar-title">${title}</div>
        <div class="topbar-sub">${subtitle}</div>
      </div>

      <div id="pageContent"></div>

    </main>

  </div>
  `;
}

export async function api(path, payload) {

  const res = await fetch(API_BASE + path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload || {})
  });

  const data = await res.json();

  if (!res.ok || data.error) {
    throw new Error(data.error || "Request failed");
  }

  return data;
}

export async function askAI(prompt, max_tokens = 1200) {

  const data = await api("/", {
    model: "claude-3-5-sonnet-20241022",
    max_tokens: max_tokens,
    messages: [
      {
        role: "user",
        content: prompt
      }
    ]
  });

  if (
    data &&
    data.content &&
    data.content[0] &&
    data.content[0].text
  ) {
    return data.content[0].text;
  }

  return "No AI response.";
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

  if (!snap.exists()) {
    return [];
  }

  const rows = [];

  Object.entries(snap.val()).forEach(([id, value]) => {
    rows.push({
      id,
      ...value
    });
  });

  rows.sort((a, b) => {
    return (b.timestamp || 0) - (a.timestamp || 0);
  });

  return rows;
}

window.loginUser = doLogin;
window.logoutUser = doSignOut;
window.auth = auth;
window.db = db;
window.API_BASE = API_BASE;
