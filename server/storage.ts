import { eq, and, like, or, inArray, desc, asc, sql, count } from "drizzle-orm";
import { db } from "./db";

import {
  apartments,
  employees,
  assignments,
  type Apartment,
  type InsertApartment,
  type Employee,
  type InsertEmployee,
  type Assignment,
  type InsertAssignment,
  type ApartmentWithAssignedEmployees,
  type EmployeeWithAssignedApartments,
} from "@shared/schema";

export interface IStorage {
  // Apartment operations
  getApartments(userId: number, options?: { sortBy?: string; search?: string }): Promise<ApartmentWithAssignedEmployees[]>;
  getApartment(userId: number, id: number): Promise<ApartmentWithAssignedEmployees | undefined>;
  createApartment(userId: number, apartment: InsertApartment, employeeIds?: number[]): Promise<ApartmentWithAssignedEmployees>;
  updateApartment(userId: number, id: number, apartment: InsertApartment, employeeIds?: number[]): Promise<ApartmentWithAssignedEmployees>;
  deleteApartment(userId: number, id: number): Promise<void>;

  // Employee operations
  getEmployees(userId: number, options?: { search?: string }): Promise<EmployeeWithAssignedApartments[]>;
  getEmployee(userId: number, id: number): Promise<EmployeeWithAssignedEmployees | undefined>;
  createEmployee(userId: number, employee: InsertEmployee): Promise<Employee>;
  deleteEmployee(userId: number, id: number): Promise<void>;

  // Calendar operations
  getApartmentsByMonth(userId: number, year: number, month: number): Promise<ApartmentWithAssignedEmployees[]>;
  getApartmentsByDate(userId: number, year: number, month: number, day: number): Promise<ApartmentWithAssignedEmployees[]>;

  // Assignment operations
  createAssignment(assignment: InsertAssignment): Promise<Assignment>;
  deleteAssignmentsByApartment(apartmentId: number): Promise<void>;

  // Statistics operation
  getStatistics(userId: number): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // Helper method to fetch employees assigned to an apartment
  // Questo non ha bisogno di userId perché l'appartamento è già filtrato per utente
  private async getEmployeesForApartment(apartmentId: number): Promise<Employee[]> {
    return db
      .select({
        id: employees.id,
        first_name: employees.first_name,
        last_name: employees.last_name,
        user_id: employees.user_id, // Includi user_id se necessario
      })
      .from(employees)
      .innerJoin(assignments, eq(assignments.employee_id, employees.id))
      .where(eq(assignments.apartment_id, apartmentId));
  }

  // Helper method to fetch apartments assigned to an employee
  // Questo non ha bisogno di userId perché il dipendente è già filtrato per utente
  private async getApartmentsForEmployee(employeeId: number): Promise<Apartment[]> {
    const results = await db
      .select()
      .from(apartments)
      .innerJoin(assignments, eq(assignments.apartment_id, apartments.id))
      .where(eq(assignments.employee_id, employeeId));

    // Mappa i risultati per restituire solo i dati dell'appartamento
    return results.map(result => result.apartments);
  }

  async getApartments(userId: number, options?: { sortBy?: string; search?: string }): Promise<ApartmentWithAssignedEmployees[]> {
    let query = db.select().from(apartments).where(eq(apartments.user_id, userId));

    // Apply search if provided
    if (options?.search) {
      const searchTerm = `%${options.search}%`;
      query = query.where(
        and(
          eq(apartments.user_id, userId),
          or(
            like(apartments.name, searchTerm),
            like(apartments.notes || '', searchTerm),
            like(apartments.status, searchTerm),
            like(apartments.payment_status, searchTerm)
          )
        )
      );
    }

    // Apply sorting
    if (options?.sortBy === 'name') {
      query = query.orderBy(asc(apartments.name));
    } else {
      query = query.orderBy(desc(apartments.cleaning_date));
    }

    const apartmentsList = await query;

    const results: ApartmentWithAssignedEmployees[] = [];
    for (const apt of apartmentsList) {
      const employees = await this.getEmployeesForApartment(apt.id);
      results.push({
        ...apt,
        employees,
      });
    }
    return results;
  }

  async getApartment(userId: number, id: number): Promise<ApartmentWithAssignedEmployees | undefined> {
    const [apartment] = await db
      .select()
      .from(apartments)
      .where(and(eq(apartments.id, id), eq(apartments.user_id, userId)));

    if (!apartment) return undefined;

    const employees = await this.getEmployeesForApartment(id);
    return { ...apartment, employees };
  }

  async createApartment(userId: number, apartment: InsertApartment, employeeIds: number[] = []): Promise<ApartmentWithAssignedEmployees> {
    const [result] = await db
      .insert(apartments)
      .values({ ...apartment, user_id: userId }) // Assicura che user_id sia impostato
      .returning();

    for (const employeeId of employeeIds) {
      await this.createAssignment({
        apartment_id: result.id,
        employee_id: employeeId,
      });
    }

    const employees = await this.getEmployeesForApartment(result.id);
    return { ...result, employees };
  }

  async updateApartment(userId: number, id: number, apartment: InsertApartment, employeeIds: number[] = []): Promise<ApartmentWithAssignedEmployees> {
    // Verifica prima che l'appartamento appartenga all'utente
    const [existing] = await db.select({ id: apartments.id }).from(apartments).where(and(eq(apartments.id, id), eq(apartments.user_id, userId)));
    if (!existing) {
      throw new Error("Apartment not found or access denied");
    }

    await db
      .update(apartments)
      .set(apartment)
      .where(and(eq(apartments.id, id), eq(apartments.user_id, userId)));

    await this.deleteAssignmentsByApartment(id);

    for (const employeeId of employeeIds) {
      await this.createAssignment({
        apartment_id: id,
        employee_id: employeeId,
      });
    }

    const updatedApartment = await this.getApartment(userId, id);
    if (!updatedApartment) {
      throw new Error(`Apartment with id ${id} not found after update`);
    }
    return updatedApartment;
  }

  async deleteApartment(userId: number, id: number): Promise<void> {
    await db
      .delete(apartments)
      .where(and(eq(apartments.id, id), eq(apartments.user_id, userId)));
  }

  async getEmployees(userId: number, options?: { search?: string }): Promise<EmployeeWithAssignedApartments[]> {
    let query = db.select().from(employees).where(eq(employees.user_id, userId));

    if (options?.search) {
      const searchTerm = `%${options.search}%`;
      query = query.where(
        and(
          eq(employees.user_id, userId),
          or(
            like(employees.first_name, searchTerm),
            like(employees.last_name, searchTerm)
          )
        )
      );
    }

    query = query.orderBy(asc(employees.last_name), asc(employees.first_name));
    const employeesList = await query;

    const results: EmployeeWithAssignedApartments[] = [];
    for (const emp of employeesList) {
      const apartments = await this.getApartmentsForEmployee(emp.id);
      results.push({
        ...emp,
        apartments,
      });
    }
    return results;
  }

  async getEmployee(userId: number, id: number): Promise<EmployeeWithAssignedApartments | undefined> {
    const [employee] = await db
      .select()
      .from(employees)
      .where(and(eq(employees.id, id), eq(employees.user_id, userId)));

    if (!employee) return undefined;

    const apartments = await this.getApartmentsForEmployee(id);
    return { ...employee, apartments };
  }

  async createEmployee(userId: number, employee: InsertEmployee): Promise<Employee> {
    const [result] = await db
      .insert(employees)
      .values({ ...employee, user_id: userId }) // Assicura user_id
      .returning();
    return result;
  }

  async deleteEmployee(userId: number, id: number): Promise<void> {
    await db
      .delete(employees)
      .where(and(eq(employees.id, id), eq(employees.user_id, userId)));
  }

  async getApartmentsByMonth(userId: number, year: number, month: number): Promise<ApartmentWithAssignedEmployees[]> {
    const monthStart = `${year}-${month.toString().padStart(2, '0')}-01`;
    const nextMonth = month === 12 ? `${year + 1}-01-01` : `${year}-${(month + 1).toString().padStart(2, '0')}-01`;

    const apartmentsList = await db
      .select()
      .from(apartments)
      .where(
        and(
          eq(apartments.user_id, userId),
          sql`${apartments.cleaning_date} >= ${monthStart}`,
          sql`${apartments.cleaning_date} < ${nextMonth}`
        )
      )
      .orderBy(asc(apartments.cleaning_date), asc(apartments.start_time));

    const results: ApartmentWithAssignedEmployees[] = [];
    for (const apt of apartmentsList) {
      const employees = await this.getEmployeesForApartment(apt.id);
      results.push({
        ...apt,
        employees,
      });
    }
    return results;
  }

  async getApartmentsByDate(userId: number, year: number, month: number, day: number): Promise<ApartmentWithAssignedEmployees[]> {
    const date = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

    const apartmentsList = await db
      .select()
      .from(apartments)
      .where(and(eq(apartments.cleaning_date, date), eq(apartments.user_id, userId)))
      .orderBy(asc(apartments.start_time));

    const results: ApartmentWithAssignedEmployees[] = [];
    for (const apt of apartmentsList) {
      const employees = await this.getEmployeesForApartment(apt.id);
      results.push({
        ...apt,
        employees,
      });
    }
    return results;
  }

  async createAssignment(assignment: InsertAssignment): Promise<Assignment> {
    // Qui potremmo aggiungere un controllo per assicurarsi che apartment e employee appartengano allo stesso utente
    // Ma per ora, ci fidiamo della logica di business a monte.
    const [result] = await db
      .insert(assignments)
      .values(assignment)
      .returning();
    return result;
  }

  async deleteAssignmentsByApartment(apartmentId: number): Promise<void> {
    // Non serve userId qui perché l'appartamento è già stato validato
    await db
      .delete(assignments)
      .where(eq(assignments.apartment_id, apartmentId));
  }

  async getStatistics(userId: number): Promise<any> {
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
