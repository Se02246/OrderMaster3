import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"; // Modificato
import { format } from "date-fns";
import { it } from "date-fns/locale";
import ApartmentCard from "@/components/ui/data-display/ApartmentCard";
import { ApartmentModal } from "@/components/ui/modals/ApartmentModal";
import ConfirmDeleteModal from "@/components/ui/modals/ConfirmDeleteModal";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient"; // Modificato
import { useToast } from "@/hooks/use-toast";
import { ApartmentWithAssignedEmployees, Employee } from "@shared/schema";
import { ApartmentFormData } from "@/components/ui/modals/types";

export default function CalendarDay() {
  const { toast } = useToast();
  const queryClient = useQueryClient(); // Aggiunto
  const params = useParams<{ year: string; month: string; day: string }>();
  
  // Convert params to numbers
  const year = parseInt(params.year || "0");
  const month = parseInt(params.month || "0");
  const day = parseInt(params.day || "0");
  
  // State for modals
  const [isApartmentModalOpen, setIsApartmentModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentApartment, setCurrentApartment] = useState<ApartmentWithAssignedEmployees | undefined>(undefined);
  const [apartmentToDelete, setApartmentToDelete] = useState<{ id: number, name: string } | null>(null);

  // Format the selected date
  const selectedDate = new Date(year, month - 1, day);
  const formattedDate = format(selectedDate, "d MMMM yyyy", { locale: it });
  
  // Prepare the date for new apartment creation
  const formattedDateForInput = format(selectedDate, "yyyy-MM-dd");
  
  // Fetch apartments for the selected date
  const { data: apartments = [], isLoading: isLoadingApartments } = useQuery<ApartmentWithAssignedEmployees[]>({
    queryKey: [`/api/calendar/${year}/${month}/${day}`],
  });

  // Fetch employees for the apartment form
  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ['/api/employees'],
  });

  // Create apartment mutation
  const createApartmentMutation = useMutation({
    mutationFn: (data: ApartmentFormData) => 
      apiRequest('POST', '/api/apartments', data),
    onSuccess: () => {
      // --- INIZIO MODIFICA ---
      // === Correzione: usiamo predicate per createApartmentMutation ===
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          typeof query.queryKey[0] === 'string' && 
          query.queryKey[0].startsWith('/api/apartments') 
      });
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          typeof query.queryKey[0] === 'string' && 
          query.queryKey[0].startsWith('/api/calendar') 
      });
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          typeof query.queryKey[0] === 'string' && 
          query.queryKey[0].startsWith('/api/employees') 
      });
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          typeof query.queryKey[0] === 'string' && 
          query.queryKey[0].startsWith('/api/statistics') 
      });
      // --- FINE MODIFICA ---
      toast({
        title: "Successo",
        description: "Ordine creato con successo",
      });
      setIsApartmentModalOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: `Errore durante la creazione: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Update apartment mutation
  const updateApartmentMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: ApartmentFormData }) => 
      apiRequest('PUT', `/api/apartments/${id}`, data),
    onSuccess: () => {
      // --- INIZIO MODIFICA ---
      // === Correzione: usiamo predicate per updateApartmentMutation ===
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          typeof query.queryKey[0] === 'string' && 
          query.queryKey[0].startsWith('/api/apartments') 
      });
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          typeof query.queryKey[0] === 'string' && 
          query.queryKey[0].startsWith('/api/calendar') 
      });
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          typeof query.queryKey[0] === 'string' && 
          query.queryKey[0].startsWith('/api/employees') 
      });
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          typeof query.queryKey[0] === 'string' && 
          query.queryKey[0].startsWith('/api/statistics') 
      });
      // --- FINE MODIFICA ---
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
    
    // === INIZIO CORREZIONE PER DELETE ===
    onSuccess: () => {
      // Invalida usando predicate per includere query dinamiche
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          typeof query.queryKey[0] === 'string' && 
          query.queryKey[0].startsWith('/api/apartments') 
      });
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          typeof query.queryKey[0] === 'string' && 
          query.queryKey[0].startsWith('/api/calendar') 
      });
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          typeof query.queryKey[0] === 'string' && 
          query.queryKey[0].startsWith('/api/employees') 
      });
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          typeof query.queryKey[0] === 'string' && 
          query.queryKey[0].startsWith('/api/statistics') 
      });
      // === FINE CORREZIONE PER DELETE ===

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
  const handleOpenAddModal = () => {
    setCurrentApartment(undefined);
    setIsApartmentModalOpen(true);
  };

  const handleOpenEditModal = (id: number) => {
    const apartment = apartments?.find(apt => apt.id === id);
    setCurrentApartment(apartment);
    setIsApartmentModalOpen(true);
  };

  const handleOpenDeleteModal = (id: number, name: string) => {
    setApartmentToDelete({ id, name });
    setIsDeleteModalOpen(true);
  };

  const handleApartmentSubmit = (data: ApartmentFormData) => {
    if (currentApartment) {
      updateApartmentMutation.mutate({ id: currentApartment.id, data });
    } else {
      // For new apartments, use the selected date
      createApartmentMutation.mutate({
        ...data,
        cleaning_date: formattedDateForInput,
      });
    }
  };

  const handleDeleteConfirm = () => {
    if (apartmentToDelete) {
      deleteApartmentMutation.mutate(apartmentToDelete.id);
    }
  };

  const isPending = createApartmentMutation.isPending || 
                    updateApartmentMutation.isPending || 
                    deleteApartmentMutation.isPending;

  if (!year || !month || !day || isNaN(selectedDate.getTime())) {
    return (
      <div className="text-center py-8 bg-white rounded-lg shadow">
        <i className="fas fa-exclamation-triangle text-yellow-500 text-5xl mb-4"></i>
        <h3 className="text-xl font-medium text-gray-600 mb-2">Data non valida</h3>
        <Link href="/calendar">
          <a className="mt-4 inline-block text-primary hover:underline">
            <i className="fas fa-arrow-left mr-2"></i> Torna al calendario
          </a>
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4">
        <Link href="/calendar">
          <a className="text-gray-600 hover:text-gray-900 flex items-center mb-4">
            <i className="fas fa-arrow-left mr-2"></i> Torna al calendario
          </a>
        </Link>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-dark">{formattedDate}</h3>
        <Button 
          onClick={handleOpenAddModal}
          disabled={isPending}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-4 py-2 rounded-lg transition-colors flex items-center"
        >
          <i className="fas fa-plus mr-2"></i> AGGIUNGI
        </Button>
      </div>

      {isLoadingApartments ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-gray-600">Caricamento ordini...</p>
        </div>
      ) : apartments.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {apartments.map((apartment) => (
            <ApartmentCard
              key={apartment.id}
              apartment={apartment}
              onEdit={handleOpenEditModal}
              onDelete={handleOpenDeleteModal}
              onClick={() => handleOpenEditModal(apartment.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-white rounded-lg shadow">
          <i className="fas fa-calendar-day text-gray-300 text-5xl mb-4"></i>
          <h3 className="text-xl font-medium text-gray-600 mb-2">Nessun ordine per questa data</h3>
          <p className="text-gray-500 mb-4">
            Non ci sono ordini programmati per il {formattedDate}.
          </p>
          <Button 
            onClick={handleOpenAddModal}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <i className="fas fa-plus mr-2"></i> AGGIUNGI ORDINE
          </Button>
        </div>
      )}

      {/* Modals */}
      <ApartmentModal
        isOpen={isApartmentModalOpen}
        onClose={() => setIsApartmentModalOpen(false)}
        onSubmit={handleApartmentSubmit}
        apartment={currentApartment || {
          id: 0,
          name: "",
          cleaning_date: formattedDateForInput,
          start_time: null,
          end_time: null,
          status: "Da Fare",
          payment_status: "Da Pagare",
          notes: null,
          employees: []
        }}
        employees={employees}
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
