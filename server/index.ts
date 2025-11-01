// === INIZIO MODIFICA ===
// Importa i moduli 'path' e 'url' di Node
import path from 'path';
import { fileURLToPath } from 'url';
// === FINE MODIFICA ===

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
  
  // Carica 'dotenv' solo se non siamo in produzione
  if (process.env.NODE_ENV !== 'production') {
    try {
      const dotenv = await import('dotenv');
      dotenv.config();
      console.log("Variabili .env caricate per lo sviluppo.");
    } catch (e) {
      console.warn("Impossibile caricare 'dotenv'. Assicurati che sia installato se sei in sviluppo.");
    }
  }

  // === INIZIO MODIFICA ===
  // Setup necessario per __dirname in ES Modules
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  // === FINE MODIFICA ===

  const app: Express = express();
  const port = process.env.PORT || 3000;

  // Middleware per il parsing del corpo JSON
  app.use(express.json());

  // Setup autenticazione (Passport.js e sessioni)
  setupAuth(app);
  
  // Setup route API (DEVE venire prima del catch-all del frontend)
  await registerRoutes(app);

  // Setup Vite (sviluppo) o serving file statici (produzione)
  if (process.env.NODE_ENV !== 'production') {
    // Modalità Sviluppo: Vite gestisce il frontend
    await setupVite(app);
  } else {
    // === INIZIO MODIFICA ===
    // Modalità Produzione: Servi i file buildati da 'dist/public'
    
    // 1. Definisci il percorso della cartella 'public'
    const publicFolderPath = path.join(__dirname, 'public');

    // 2. Servi tutti i file statici (CSS, JS, immagini)
    app.use(express.static(publicFolderPath));

    // 3. Catch-all per la SPA (Single Page Application)
    // Per qualsiasi altra richiesta (es. /calendar, /employees),
    // invia index.html. Il router React (wouter) prenderà il controllo.
    app.get('*', (req, res) => {
      res.sendFile(path.join(publicFolderPath, 'index.html'));
    });
    // === FINE MODIFICA ===
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
