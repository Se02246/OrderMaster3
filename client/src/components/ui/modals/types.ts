import { z } from "zod";
import { ApartmentWithAssignedEmployees, Employee } from "@shared/schema";

export type ApartmentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ApartmentFormData) => void;
  apartment?: ApartmentWithAssignedEmployees;
  employees: Employee[];
};

export type EmployeeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: EmployeeFormData) => void;
};

export type ConfirmDeleteModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  message: string;
};

export type ApartmentFormData = {
  name: string;
  cleaning_date: string;
  start_time?: string;
  status: string;
  payment_status: string;
  notes?: string;
  employee_ids: number[];
  price?: number;
};

export type EmployeeFormData = {
  first_name: string;
  last_name: string;
};
