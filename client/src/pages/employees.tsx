import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import EmployeeCard from "@/components/ui/data-display/EmployeeCard";
import { EmployeeModal } from "@/components/ui/modals/EmployeeModal";
import ConfirmDeleteModal from "@/components/ui/modals/ConfirmDeleteModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { EmployeeWithAssignedApartments } from "@shared/schema";
import { EmployeeFormData } from "@/components/ui/modals/types";

export default function Employees() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<{ id: number, name: string } | null>(null);

  // Fetch employees
  const { data: employees = [], isLoading } = useQuery<EmployeeWithAssignedApartments[]>({
    queryKey: [`/api/employees${searchQuery ? `?search=${searchQuery}` : ''}`],
  });

  // Create employee mutation
  const createEmployeeMutation = useMutation({
    mutationFn: (data: EmployeeFormData) => 
      apiRequest('POST', '/api/employees', data),
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast({
        title: "Successo",
        description: "Cliente creato con successo",
      });
      setIsEmployeeModalOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: `Errore durante la creazione: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Delete employee mutation
  const deleteEmployeeMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest('DELETE', `/api/employees/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast({
        title: "Successo",
        description: "Cliente eliminato con successo",
      });
      setIsDeleteModalOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: `Errore durante l'eliminazione: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Event handlers
  const handleOpenEmployeeModal = () => {
    setIsEmployeeModalOpen(true);
  };

  const handleEmployeeClick = (id: number) => {
    navigate(`/employees/${id}`);
  };

  const handleOpenDeleteModal = (id: number, name: string) => {
    setEmployeeToDelete({ id, name });
    setIsDeleteModalOpen(true);
  };

  const handleEmployeeSubmit = (data: EmployeeFormData) => {
    createEmployeeMutation.mutate(data);
  };

  const handleDeleteConfirm = () => {
    if (employeeToDelete) {
      deleteEmployeeMutation.mutate(employeeToDelete.id);
    }
  };

  const isPending = createEmployeeMutation.isPending || deleteEmployeeMutation.isPending;

  return (
    <>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-semibold text-dark">Clienti</h2>
        <div className="flex items-center gap-4">
          <div className="relative flex-grow max-w-md">
            <Input
              type="search"
              placeholder="Cerca clienti..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            />
            <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
          </div>
          <Button 
            onClick={handleOpenEmployeeModal}
            disabled={isPending}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-4 py-2 rounded-lg transition-colors flex items-center whitespace-nowrap"
          >
            <i className="fas fa-plus mr-2"></i> AGGIUNGI
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-gray-600">Caricamento clienti...</p>
        </div>
      ) : employees.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {employees.map((employee) => (
            <EmployeeCard
              key={employee.id}
              employee={employee}
              onDelete={handleOpenDeleteModal}
              onClick={() => handleEmployeeClick(employee.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-white rounded-lg shadow">
          <i className="fas fa-users text-gray-300 text-5xl mb-4"></i>
          <h3 className="text-xl font-medium text-gray-600 mb-2">Nessun cliente trovato</h3>
          <p className="text-gray-500 mb-4">
            {searchQuery 
              ? "Nessun risultato corrisponde alla tua ricerca." 
              : "Non ci sono ancora clienti. Inizia aggiungendone uno!"}
          </p>
          <Button 
            onClick={handleOpenEmployeeModal}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <i className="fas fa-plus mr-2"></i> AGGIUNGI CLIENTE
          </Button>
        </div>
      )}

      {/* Modals */}
      <EmployeeModal
        isOpen={isEmployeeModalOpen}
        onClose={() => setIsEmployeeModalOpen(false)}
        onSubmit={handleEmployeeSubmit}
      />

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        message={`Sei sicuro di voler eliminare il cliente "${employeeToDelete?.name}"?`}
      />
    </>
  );
}
