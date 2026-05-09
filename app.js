// Firebase App Config + Shared Portal Logic

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
  update,
  remove,
  onValue
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCjAEOpWBS6k-tApaVY3aldpS1m8OYC3b4",
  authDomain: "lsrta-portal.firebaseapp.com",
  databaseURL: "https://lsrta-portal-default-rtdb.firebaseio.com",
  projectId: "lsrta-portal",
  storageBucket: "lsrta-portal.firebasestorage.app",
  messagingSenderId: "29459242340",
  appId: "1:29459242340:web:a15cc3ada8fad299816e71"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Services
const auth = getAuth(app);
const db = getDatabase(app);

// Export globally
window.firebaseApp = app;
window.auth = auth;
window.db = db;

// Shared Worker Endpoint
window.API_BASE = "https://lsrta-api.daniela-e0c.workers.dev";

// Auth Helper
window.loginUser = async function(email, password) {
  return await signInWithEmailAndPassword(auth, email, password);
};

// Logout Helper
window.logoutUser = async function() {
  return await signOut(auth);
};

// Auth State
window.onPortalAuth = function(callback) {
  onAuthStateChanged(auth, callback);
};

// Database Helpers
window.dbSet = async function(path, data) {
  return await set(ref(db, path), data);
};

window.dbUpdate = async function(path, data) {
  return await update(ref(db, path), data);
};

window.dbGet = async function(path) {
  return await get(ref(db, path));
};

window.dbPush = async function(path, data) {
  return await push(ref(db, path), data);
};

window.dbRemove = async function(path) {
  return await remove(ref(db, path));
};

window.dbListen = function(path, callback) {
  return onValue(ref(db, path), callback);
};

console.log("LSRTA App Initialized");
