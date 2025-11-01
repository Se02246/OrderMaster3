import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { setupAuth } from "./auth"; // Importa la configurazione auth

const app = express();

// === INIZIO MODIFICA ===
// Informa Express che si trova dietro un proxy (Render)
// e di fidarsi delle intestazioni come X-Forwarded-Proto (per HTTPS)
app.set('trust proxy', 1);
// === FINE MODIFICA ===

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// !!! IMPORTANTE: Configura l'autenticazione PRIMA delle route API
setupAuth(app);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });
  
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Usa la porta fornita da Render (process.env.PORT)
  const port = process.env.PORT || 5000;
  
  server.listen({
    port,
    host: "0.0.0.0", // Ascolta su tutti gli indirizzi IP (necessario per Render)
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`); // Registrerà la porta corretta usata
  });
})();
