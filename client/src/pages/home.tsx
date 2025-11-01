import { useState, useRef } from "react";
// --- 1. MODIFICA: Importa useQueryClient ---
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ApartmentCard from "@/components/ui/data-display/ApartmentCard";
import { ApartmentModal } from "@/components/ui/modals/ApartmentModal";
import ConfirmDeleteModal from "@/components/ui/modals/ConfirmDeleteModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// --- 2. MODIFICA: Rimuovi l'importazione di queryClient ---
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ApartmentWithAssignedEmployees, Employee } from "@shared/schema";
import { ApartmentFormData } from "@/components/ui/modals/types";
import { Palette } from "lucide-react";

export default function Home() {
  const { toast } = useToast();
  // --- 3. MODIFICA: Ottieni il client tramite il hook ---
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "name">("date");
  const [isApartmentModalOpen, setIsApartmentModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentApartment, setCurrentApartment] = useState<ApartmentWithAssignedEmployees | undefined>(undefined);
  const [apartmentToDelete, setApartmentToDelete] = useState<{ id: number, name: string } | null>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    // Convert hex to HSL and set CSS variable
    let r = 0, g = 0, b = 0;
    if (newColor.length == 4) {
      r = parseInt(newColor[1] + newColor[1], 16);
      g = parseInt(newColor[2] + newColor[2], 16);
      b = parseInt(newColor[3] + newColor[3], 16);
    } else if (newColor.length == 7) {
      r = parseInt(newColor.substring(1, 3), 16);
      g = parseInt(newColor.substring(3, 5), 16);
      b = parseInt(newColor.substring(5, 7), 16);
    }
    r /= 255; g /= 255; b /= 255;
    let cmin = Math.min(r,g,b),
        cmax = Math.max(r,g,b),
        delta = cmax - cmin,
        h = 0,
        s = 0,
        l = 0;
    if (delta == 0) h = 0;
    else if (cmax == r) h = ((g - b) / delta) % 6;
    else if (cmax == g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
    h = Math.round(h * 60);
    if (h < 0) h += 360;
    l = (cmax + cmin) / 2;
    s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
    s = +(s * 100).toFixed(1);
    l = +(l * 100).toFixed(1);

    const primaryHsl = `${h} ${s}% ${l}%`;
    document.documentElement.style.setProperty('--primary', primaryHsl);
    localStorage.setItem("themeColor", primaryHsl);
  };

  const openColorPicker = () => {
    colorInputRef.current?.click();
  };


  // Fetch apartments
  const { data: apartments, isLoading: isLoadingApartments } = useQuery<ApartmentWithAssignedEmployees[]>({
    queryKey: [`/api/apartments?sortBy=${sortBy}${searchQuery ? `&search=${searchQuery}` : ''}`],
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
      // --- 4. MODIFICA: Specifica quali query invalidare ---
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
      // --- 4. MODIFICA: Specifica quali query invalidare ---
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
      createApartmentMutation.mutate(data);
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

  return (
    <>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative flex-grow max-w-md">
          <Input
            type="search"
            placeholder="Cerca ordini..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
          />
          <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={openColorPicker}
            className="relative"
          >
            <Palette className="h-5 w-5" />
            <input
              ref={colorInputRef}
              type="color"
              onChange={handleColorChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </Button>
          <div className="relative">
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "date" | "name")}
              className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            >
              <option value="date">ORDINA PER DATA</option>
              <option value="name">ORDINA PER NOME</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <i className="fas fa-chevron-down text-xs"></i>
            </div>
          </div>
          <Button 
            onClick={handleOpenAddModal}
            disabled={isPending}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-4 py-2 rounded-lg transition-colors flex items-center"
          >
            <i className="fas fa-plus mr-2"></i> AGGIUNGI
          </Button>
        </div>
      </div>

      {isLoadingApartments ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-gray-600">Caricamento ordini...</p>
        </div>
      ) : apartments && apartments.length > 0 ? (
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
          <i className="fas fa-home text-gray-300 text-5xl mb-4"></i>
          <h3 className="text-xl font-medium text-gray-600 mb-2">Nessun ordine trovato</h3>
          <p className="text-gray-500 mb-4">
            {searchQuery 
              ? "Nessun risultato corrisponde alla tua ricerca." 
              : "Non ci sono ancora ordini. Inizia aggiungendone uno!"}
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
        apartment={currentApartment}
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
