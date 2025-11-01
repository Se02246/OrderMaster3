// ... (imports) ...
import { db } from "./db";
// === INIZIO MODIFICA ===
// Aggiungi 'users' per avere il tipo corretto
import { users, SafeUser } from "@shared/schema";
// === FINE MODIFICA ===
import { eq } from "drizzle-orm";
import { type Express } from "express";

// ... (configurazione store) ...
export const PgStore = ConnectPgSimple(session);
const sessionStore = new PgStore({
  conString: process.env.DATABASE_URL,
  tableName: "sessions", 
});


export function setupAuth(app: Express) {
  // ... (app.use(session...)) ...
  app.use(
    session({
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

  // ... (passport.use(new LocalStrategy...)) ...
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
      // === INIZIO MODIFICA ===
      // Seleziona esplicitamente per assicurarti che theme_color sia incluso
      const [user] = await db.select({
        id: users.id,
        email: users.email,
        theme_color: users.theme_color
      }).from(users).where(eq(users.id, id)).limit(1);
      // === FINE MODIFICA ===
      
      if (user) {
        // Ora non c'è più hashed_password da rimuovere
        done(null, user as SafeUser); // Il tipo corrisponde a SafeUser
      } else {
        done(new Error("Utente non trovato"), null);
      }
    } catch (err) {
      done(err, null);
    }
  });
}
