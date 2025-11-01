import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import ApartmentCard from "@/components/ui/data-display/ApartmentCard";
import { ApartmentModal } from "@/components/ui/modals/ApartmentModal";
import ConfirmDeleteModal from "@/components/ui/modals/ConfirmDeleteModal";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ApartmentWithAssignedEmployees, EmployeeWithAssignedApartments, Employee } from "@shared/schema";
import { ApartmentFormData } from "@/components/ui/modals/types";

export default function EmployeeDetail() {
  const { toast } = useToast();
  const params = useParams<{ id: string }>();
  const employeeId = parseInt(params.id || "0");
  
  // State for modals
  const [isApartmentModalOpen, setIsApartmentModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentApartment, setCurrentApartment] = useState<ApartmentWithAssignedEmployees | undefined>(undefined);
  const [apartmentToDelete, setApartmentToDelete] = useState<{ id: number, name: string } | null>(null);

  // Fetch employee details
  const { data: employee, isLoading: isLoadingEmployee } = useQuery<EmployeeWithAssignedApartments>({
    queryKey: [`/api/employees/${employeeId}`],
  });

  // Fetch all employees for the apartment form
  const { data: allEmployees = [] } = useQuery<Employee[]>({
    queryKey: ['/api/employees'],
  });

  // Update apartment mutation
  const updateApartmentMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: ApartmentFormData }) => 
      apiRequest('PUT', `/api/apartments/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast({
        title: "Successo",
        description: "Ordine aggiornato con successo",
      });
      setIsApartmentModalOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: `Errore durante l'aggiornamento: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Delete apartment mutation
  const deleteApartmentMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest('DELETE', `/api/apartments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast({
        title: "Successo",
        description: "Ordine eliminato con successo",
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
  const handleOpenEditModal = (id: number) => {
    // First fetch the complete apartment data
    fetch(`/api/apartments/${id}`)
      .then(res => res.json())
      .then(data => {
        setCurrentApartment(data);
        setIsApartmentModalOpen(true);
      })
      .catch(err => {
        toast({
          title: "Errore",
          description: `Errore durante il recupero dei dati: ${err.message}`,
          variant: "destructive",
        });
      });
  };

  const handleOpenDeleteModal = (id: number, name: string) => {
    setApartmentToDelete({ id, name });
    setIsDeleteModalOpen(true);
  };

  const handleApartmentSubmit = (data: ApartmentFormData) => {
    if (currentApartment) {
      updateApartmentMutation.mutate({ id: currentApartment.id, data });
    }
  };

  const handleDeleteConfirm = () => {
    if (apartmentToDelete) {
      deleteApartmentMutation.mutate(apartmentToDelete.id);
    }
  };

  if (!employeeId) {
    return (
      <div className="text-center py-8 bg-white rounded-lg shadow">
        <i className="fas fa-exclamation-triangle text-yellow-500 text-5xl mb-4"></i>
        <h3 className="text-xl font-medium text-gray-600 mb-2">ID cliente non valido</h3>
        <Link href="/employees">
          <a className="mt-4 inline-block text-[#70fad3] hover:underline">
            <i className="fas fa-arrow-left mr-2"></i> Torna a Clienti
          </a>
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8">
        <Link href="/employees">
          <a className="text-gray-600 hover:text-gray-900 flex items-center mb-4">
            <i className="fas fa-arrow-left mr-2"></i> Torna a Clienti
          </a>
        </Link>

        {isLoadingEmployee ? (
          <div className="h-6 w-48 bg-gray-200 animate-pulse rounded"></div>
        ) : employee ? (
          <h2 className="text-2xl font-semibold text-dark">
            {`${employee.first_name} ${employee.last_name}`}
          </h2>
        ) : (
          <div className="text-red-500">Cliente non trovato</div>
        )}
      </div>
      
      <div className="mb-6">
        <h3 className="text-xl font-medium text-dark mb-4">Ordini Correlati</h3>
        
        {isLoadingEmployee ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#70fad3]"></div>
            <p className="mt-2 text-gray-600">Caricamento ordini...</p>
          </div>
        ) : employee && employee.apartments.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {employee.apartments.map((apartment) => (
              <ApartmentCard
                key={apartment.id}
                apartment={{
                  ...apartment,
                  employees: employee ? [{ id: employee.id, first_name: employee.first_name, last_name: employee.last_name }] : []
                }}
                onEdit={handleOpenEditModal}
                onDelete={handleOpenDeleteModal}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-white rounded-lg shadow">
            <i className="fas fa-clipboard-list text-gray-300 text-5xl mb-4"></i>
            <h3 className="text-xl font-medium text-gray-600 mb-2">Nessun ordine assegnato</h3>
            <p className="text-gray-500">
              Questo cliente non ha ancora ordini assegnati.
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      <ApartmentModal
        isOpen={isApartmentModalOpen}
        onClose={() => setIsApartmentModalOpen(false)}
        onSubmit={handleApartmentSubmit}
        apartment={currentApartment}
        employees={allEmployees}
      />

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        message={`Sei sicuro di voler eliminare l'ordine "${apartmentToDelete?.name}"?`}
      />
    </>
  );
}
