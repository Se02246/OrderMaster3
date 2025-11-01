import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
// === INIZIO MODIFICA ===
// Importa i moduli CJS come namespace per la compatibilità con esbuild ESM
import * as sessionNs from "express-session";
import * as ConnectPgSimpleNs from "connect-pg-simple";
// @ts-ignore: Accedi all'export .default per i moduli CJS
const session = sessionNs.default;
// @ts-ignore: Accedi all'export .default per i moduli CJS
const ConnectPgSimple = ConnectPgSimpleNs.default;
// === FINE MODIFICA ===
import bcrypt from "bcryptjs";
import { db } from "./db";
import { users, SafeUser } from "@shared/schema";
import { eq } from "drizzle-orm";
import { type Express } from "express";

if (!process.env.SESSION_SECRET) {
  console.warn("ATTENZIONE: SESSION_SECRET non è impostato. Usare un valore di default per lo sviluppo.");
  // throw new Error("SESSION_SECRET must be set in environment variables");
}

export const PgStore = ConnectPgSimple(session); // Questa riga ora funzionerà
const sessionStore = new PgStore({
  conString: process.env.DATABASE_URL,
  tableName: "sessions", 
});


export function setupAuth(app: Express) {
  app.use(
    session({ // 'session' qui è la funzione importata correttamente
      store: sessionStore,
      secret: process.env.SESSION_SECRET || 'dev-secret-key', // Usa una variabile d'ambiente in produzione!
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 giorni
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax", // Aiuta con la protezione CSRF
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  // Configura la strategia local
  passport.use(
    new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
      try {
        const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (!user) {
          return done(null, false, { message: "Email non trovata." });
        }
        
        const isMatch = await bcrypt.compare(password, user.hashed_password);
        if (!isMatch) {
          return done(null, false, { message: "Password errata." });
        }
        
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  // Serializzazione utente per la sessione
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  // Deserializzazione utente dalla sessione
  passport.deserializeUser(async (id: number, done) => {
    try {
      const [user] = await db.select({
        id: users.id,
        email: users.email,
        theme_color: users.theme_color
      }).from(users).where(eq(users.id, id)).limit(1);
      
      if (user) {
        done(null, user as SafeUser);
      } else {
        done(new Error("Utente non trovato"), null);
      }
    } catch (err) {
      done(err, null);
    }
  });
}
