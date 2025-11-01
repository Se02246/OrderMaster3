import 'dotenv/config';
// === INIZIO MODIFICA ===
// Importa 'express' come namespace per compatibilità ESM/CJS
import * as expressNs from 'express';
// @ts-ignore: Accedi all'export .default
const express = expressNs.default;
// Importa i tipi separatamente
import { type Express } from "express";
// === FINE MODIFICA ===
import { setupVite } from './vite';
import { registerRoutes } from './routes';
import { setupAuth } from './auth';

async function startServer() {
  const app: Express = express(); // Questa riga ora funzionerà
  const port = process.env.PORT || 3000;

  // Middleware per il parsing del corpo JSON
  // Nota: express.json() è un middleware integrato
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
