import { db } from "./db";
import {
  apartments,
  employees,
  assignments,
  users,
  type Apartment,
  type InsertApartment,
  type Employee,
  type InsertEmployee,
  type Assignment,
  type InsertAssignment,
  type ApartmentWithAssignedEmployees,
  type EmployeeWithAssignedApartments,
  type SafeUser,
} from "@shared/schema";
// Importa tutti gli operatori Drizzle necessari
import { eq, desc, count, and, or, like, sql, gte, lte, inArray } from "drizzle-orm";

// --- Funzioni Helper per le Date ---

// Restituisce il primo e l'ultimo giorno di un mese in formato YYYY-MM-DD
function getMonthBounds(year: number, month: number) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0); // Giorno 0 del mese successivo = ultimo giorno del mese corrente
  return {
    start: startDate.toISOString().split('T')[0], // YYYY-MM-DD
    end: endDate.toISOString().split('T')[0],     // YYYY-MM-DD
  };
}

// Restituisce un giorno specifico in formato YYYY-MM-DD
function getDayString(year: number, month: number, day: number) {
    // Aggiunge 1 a 'day' perché il costruttore Date è 0-indexed per i mesi
    const date = new Date(year, month - 1, day);
    return date.toISOString().split('T')[0];
}

// --- Definizione della Classe Storage ---

export class DatabaseStorage {

  // --- Operazioni Appartamenti ---

  async getApartments(
    userId: number,
    options: { sortBy?: string; search?: string }
  ): Promise<ApartmentWithAssignedEmployees[]> {
    const { sortBy, search } = options;

    // Query relazionale per trovare appartamenti
    const result = await db.query.apartments.findMany({
      where: and(
        eq(apartments.user_id, userId),
        search // Aggiungi la clausola di ricerca se 'search' è fornito
          ? or(
              like(apartments.name, `%${search}%`),
              like(apartments.notes, `%${search}%`)
            )
          : undefined
      ),
      with: {
        assignments: { // Carica le assegnazioni collegate
          with: {
            employee: true, // E per ogni assegnazione, carica l'impiegato
          },
        },
      },
      orderBy: // Ordina i risultati
        sortBy === "name"
          ? [desc(apartments.name)]
          : [desc(apartments.cleaning_date)],
    });

    // Trasforma i dati nel formato atteso dal frontend
    return result.map((apt) => ({
      ...apt,
      employees: apt.assignments.map((ass) => ass.employee),
    }));
  }

  async getApartment(
    userId: number,
    id: number
  ): Promise<ApartmentWithAssignedEmployees | null> {
    const result = await db.query.apartments.findFirst({
      where: and(eq(apartments.user_id, userId), eq(apartments.id, id)),
      with: {
        assignments: {
          with: {
            employee: true,
          },
        },
      },
    });

    if (!result) return null;

    // Trasforma i dati
    return {
      ...result,
      employees: result.assignments.map((ass) => ass.employee),
    };
  }

  async createApartment(
    userId: number,
    apartmentData: Omit<InsertApartment, 'user_id'>,
    employee_ids: number[]
  ): Promise<Apartment> {
    // Usa una transazione per assicurarti che entrambe le operazioni (creazione e assegnazione) vadano a buon fine
    return await db.transaction(async (tx) => {
      // 1. Crea l'appartamento
      const [newApartment] = await tx
        .insert(apartments)
        .values({ ...apartmentData, user_id: userId })
        .returning();

      // 2. Crea le assegnazioni (solo se ci sono ID)
      if (employee_ids && employee_ids.length > 0) {
        const assignmentsData = employee_ids.map((empId) => ({
          apartment_id: newApartment.id,
          employee_id: empId,
        }));
        await tx.insert(assignments).values(assignmentsData);
      }

      return newApartment;
    });
  }

  async updateApartment(
    userId: number,
    id: number,
    apartmentData: Omit<InsertApartment, 'user_id'>,
    employee_ids: number[]
  ): Promise<Apartment> {
    return await db.transaction(async (tx) => {
      // 1. Aggiorna i dati dell'appartamento
      const [updatedApartment] = await tx
        .update(apartments)
        .set(apartmentData)
        .where(and(eq(apartments.user_id, userId), eq(apartments.id, id)))
        .returning();

      // 2. Elimina le vecchie assegnazioni per questo appartamento
      await tx
        .delete(assignments)
        .where(eq(assignments.apartment_id, id));

      // 3. Crea le nuove assegnazioni
      if (employee_ids && employee_ids.length > 0) {
        const assignmentsData = employee_ids.map((empId) => ({
          apartment_id: updatedApartment.id,
          employee_id: empId,
        }));
        await tx.insert(assignments).values(assignmentsData);
      }

      return updatedApartment;
    });
  }

  async deleteApartment(userId: number, id: number): Promise<void> {
    await db
      .delete(apartments)
      .where(and(eq(apartments.user_id, userId), eq(apartments.id, id)));
    // Le assegnazioni collegate vengono eliminate automaticamente
    // grazie a 'onDelete: "cascade"' nello schema.
  }

  // --- Operazioni Impiegati ---

  async getEmployees(
    userId: number,
    options: { search?: string }
  ): Promise<EmployeeWithAssignedApartments[]> {
    const { search } = options;

    const result = await db.query.employees.findMany({
      where: and(
        eq(employees.user_id, userId),
        search
          ? or(
              like(employees.first_name, `%${search}%`),
              like(employees.last_name, `%${search}%`)
            )
          : undefined
      ),
      with: {
        assignments: {
          with: {
            apartment: true,
          },
        },
      },
      orderBy: [desc(employees.last_name), desc(employees.first_name)],
    });

    // Trasforma i dati
    return result.map((emp) => ({
      ...emp,
      apartments: emp.assignments.map((ass) => ass.apartment),
    }));
  }

  async getEmployee(
    userId: number,
    id: number
  ): Promise<EmployeeWithAssignedApartments | null> {
    const result = await db.query.employees.findFirst({
      where: and(eq(employees.user_id, userId), eq(employees.id, id)),
      with: {
        assignments: {
          with: {
            apartment: true,
          },
        },
      },
    });

    if (!result) return null;

    // Trasforma i dati
    return {
      ...result,
      apartments: result.assignments.map((ass) => ass.apartment),
    };
  }

  async createEmployee(
    userId: number,
    employeeData: InsertEmployee
  ): Promise<Employee> {
    const [newEmployee] = await db
      .insert(employees)
      .values({ ...employeeData, user_id: userId })
      .returning();
    return newEmployee;
  }

  async deleteEmployee(userId: number, id: number): Promise<void> {
    await db
      .delete(employees)
      .where(and(eq(employees.user_id, userId), eq(employees.id, id)));
    // Le assegnazioni collegate vengono eliminate in cascata.
  }
  
  // --- Operazioni Calendario ---

  async getApartmentsByMonth(
    userId: number,
    year: number,
    month: number
  ): Promise<ApartmentWithAssignedEmployees[]> {
    const { start, end } = getMonthBounds(year, month);
    
    const result = await db.query.apartments.findMany({
        where: and(
            eq(apartments.user_id, userId),
            gte(apartments.cleaning_date, start), // Data >= primo giorno del mese
            lte(apartments.cleaning_date, end)   // Data <= ultimo giorno del mese
        ),
        with: {
            assignments: {
                with: {
                    employee: true,
                },
            },
        },
        orderBy: [desc(apartments.cleaning_date)]
    });
    
    return result.map((apt) => ({
      ...apt,
      employees: apt.assignments.map((ass) => ass.employee),
    }));
  }
  
  async getApartmentsByDate(
    userId: number,
    year: number,
    month: number,
    day: number
  ): Promise<ApartmentWithAssignedEmployees[]> {
    const dateString = getDayString(year, month, day);
    
    const result = await db.query.apartments.findMany({
        where: and(
            eq(apartments.user_id, userId),
            eq(apartments.cleaning_date, dateString) // Data = giorno specifico
        ),
        with: {
            assignments: {
                with: {
                    employee: true,
                },
            },
        },
        orderBy: [desc(apartments.start_time)] // Ordina per ora di inizio
    });
    
    return result.map((apt) => ({
      ...apt,
      employees: apt.assignments.map((ass) => ass.employee),
    }));
  }

  // --- Operazioni Statistiche ---

  async getStatistics(userId: number): Promise<any> {
    // 1. Ordini totali
    const [totalOrdersResult] = await db
      .select({ value: count() })
      .from(apartments)
      .where(eq(apartments.user_id, userId));

    // 2. Top 3 Impiegati
    const topEmployeesResult = await db
      .select({
        employee_id: assignments.employee_id,
        first_name: employees.first_name,
        last_name: employees.last_name,
        orderCount: count(assignments.apartment_id),
      })
      .from(assignments)
      .leftJoin(employees, eq(assignments.employee_id, employees.id))
      .where(eq(employees.user_id, userId)) // Filtra per l'utente corretto
      .groupBy(assignments.employee_id, employees.first_name, employees.last_name)
      .orderBy(desc(sql`count(assignments.apartment_id)`))
      .limit(3);

    const topEmployees = topEmployeesResult.map((emp) => ({
      name: `${emp.first_name || ""} ${emp.last_name || ""}`.trim(),
      count: Number(emp.orderCount),
    }));

    // 3. Top 3 Giorni più produttivi
    const busiestDaysResult = await db
      .select({
        date: apartments.cleaning_date,
        count: count(),
      })
      .from(apartments)
      .where(eq(apartments.user_id, userId)) // Filtra per l'utente
      .groupBy(apartments.cleaning_date)
      .orderBy(desc(count()))
      .limit(3);
      
    const busiestDays = busiestDaysResult.map(day => ({
        date: day.date,
        count: Number(day.count)
    }));

    return {
      totalOrders: totalOrdersResult.value,
      topEmployees,
      busiestDays,
    };
  }

  // --- Operazioni Utente ---

  async updateUserTheme(userId: number, themeColor: string): Promise<SafeUser> {
    const [updatedUser] = await db
      .update(users)
      .set({ theme_color: themeColor })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        email: users.email,
        theme_color: users.theme_color,
      });

    if (!updatedUser) {
      throw new Error("User not found or update failed");
    }
    return updatedUser;
  }
}

// Esporta un'istanza singola della classe
export const storage = new DatabaseStorage();
