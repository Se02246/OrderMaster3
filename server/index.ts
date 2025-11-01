// RIMUOVI "import 'dotenv/config';" da qui.

// Importa 'express' come namespace per compatibilità ESM/CJS
import * as expressNs from 'express';
// @ts-ignore: Accedi all'export .default
const express = expressNs.default;
// Importa i tipi separatamente
import { type Express } from "express";
import { setupVite } from './vite';
import { registerRoutes } from './routes';
import { setupAuth } from './auth';

async function startServer() {
  
  // === INIZIO MODIFICA ===
  // Carica 'dotenv' solo se non siamo in produzione
  if (process.env.NODE_ENV !== 'production') {
    try {
      // Usiamo un import() dinamico
      // in modo che 'dotenv' non venga cercato in produzione.
      const dotenv = await import('dotenv');
      dotenv.config();
      console.log("Variabili .env caricate per lo sviluppo.");
    } catch (e) {
      console.warn("Impossibile caricare 'dotenv'. Assicurati che sia installato se sei in sviluppo.");
    }
  }
  // === FINE MODIFICA ===

  const app: Express = express();
  const port = process.env.PORT || 3000;

  // Middleware per il parsing del corpo JSON
  app.use(express.json());

  // Setup autenticazione (Passport.js e sessioni)
  setupAuth(app);
  
  // Setup route API
  await registerRoutes(app);

  // Setup Vite in sviluppo
  if (process.env.NODE_ENV !== 'production') {
    await setupVite(app);
  }

  // Avvia il server
  app.listen(port, () => {
    console.log(`🚀 Server in ascolto su http://localhost:${port}`);
  });
}

startServer().catch(err => {
  console.error("Errore fatale durante l'avvio del server:", err);
  process.exit(1);
});
