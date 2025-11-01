// ... (imports) ...
import {
  apartments,
  employees,
  assignments,
  users, // === Aggiungi import users ===
  type Apartment,
  type InsertApartment,
  type Employee,
  type InsertEmployee,
  type Assignment,
  type InsertAssignment,
  type ApartmentWithAssignedEmployees,
  type EmployeeWithAssignedApartments,
  type SafeUser, // === Aggiungi import SafeUser ===
} from "@shared/schema";

export interface IStorage {
  // ... (metodi esistenti) ...
  deleteAssignmentsByApartment(apartmentId: number): Promise<void>;

  // Statistics operation
  getStatistics(userId: number): Promise<any>;

  // === INIZIO MODIFICA ===
  // User operations
  updateUserTheme(userId: number, themeColor: string): Promise<SafeUser>;
  // === FINE MODIFICA ===
}

export class DatabaseStorage implements IStorage {
  // ... (metodi helper e metodi esistenti) ...

  // === INIZIO MODIFICA ===
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
  // === FINE MODIFICA ===
  
  async getStatistics(userId: number): Promise<any> {
    // ... (codice statistiche) ...
    // 1. Ordini totali
    const [totalOrdersResult] = await db.select({
      value: count()
    }).from(apartments)
    .where(eq(apartments.user_id, userId));
    const totalOrders = totalOrdersResult.value;

    // 2. Top 3 Clienti
    const topEmployeesResult = await db
      .select({
        employee_id: assignments.employee_id,
        first_name: employees.first_name,
        last_name: employees.last_name,
        orderCount: count(assignments.apartment_id)
      })
      .from(assignments)
      .leftJoin(employees, eq(assignments.employee_id, employees.id))
      .where(eq(employees.user_id, userId)) // Filtra per utente
      .groupBy(assignments.employee_id, employees.first_name, employees.last_name)
      .orderBy(desc(sql`count(assignments.apartment_id)`))
      .limit(3);

    const topEmployees = topEmployeesResult.map(emp => ({
      name: `${emp.first_name || ''} ${emp.last_name || ''}`.trim(),
      count: Number(emp.orderCount)
    }));

    // 3. Top 3 Giorni più produttivi
    const busiestDaysResult = await db
        .select({
            date: apartments.cleaning_date,
            count: count()
        })
        .from(apartments)
        .where(eq(apartments.user_id, userId)) // Filtra per utente
        .groupBy(apartments.cleaning_date)
        .orderBy(desc(count()))
        .limit(3);

    const busiestDays = busiestDaysResult.map(day => ({
        date: day.date,
        count: Number(day.count)
    }));

    return {
      totalOrders,
      topEmployees,
      busiestDays
    };
  }
}

export const storage = new DatabaseStorage();
