import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Everyworld from "./Everyworld.jsx";

// API key priority: localStorage > env var (baked at build) > empty (prompts user)
window.GEMINI_API_KEY = localStorage.getItem("gemini-api-key") || import.meta.env.VITE_GEMINI_API_KEY || "";

// IndexedDB storage shim
const DB_NAME = "drama-engine";
const STORE = "kv";
const openDB = () => new Promise((resolve, reject) => {
  const req = indexedDB.open(DB_NAME, 1);
  req.onupgradeneeded = () => req.result.createObjectStore(STORE);
  req.onsuccess = () => resolve(req.result);
  req.onerror = () => reject(req.error);
});
window.storage = {
  async get(key) {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(key);
      req.onsuccess = () => resolve({ value: req.result ?? null });
      req.onerror = () => resolve({ value: null });
    });
  },
  async set(key, value) {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(value, key);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  },
  async del(key) {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(key);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  },
};

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Everyworld />
  </StrictMode>
);
