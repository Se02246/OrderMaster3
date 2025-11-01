import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Registra il Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('Service Worker registrato con successo:', registration);
    }).catch(registrationError => {
      console.log('Registrazione del Service Worker fallita:', registrationError);
    });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
