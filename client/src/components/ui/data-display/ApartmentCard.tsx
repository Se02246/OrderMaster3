import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import { ApartmentWithAssignedEmployees } from "@shared/schema";
import { Calendar, Clock, Edit, Trash2, Euro } from "lucide-react";

type ApartmentCardProps = {
  apartment: ApartmentWithAssignedEmployees;
  onEdit: (id: number) => void;
  onDelete: (id: number, name: string) => void;
  onClick?: () => void;
};

export default function ApartmentCard({ apartment, onEdit, onDelete, onClick }: ApartmentCardProps) {
  const formattedDate = format(parseISO(apartment.cleaning_date), "dd/MM/yyyy", { locale: it });
  
  // Helper to get status class
  const getStatusClass = (status: string) => {
    switch (status) {
      case "Da Fare":
        return "bg-red-100 text-red-800";
      case "In Corso":
        return "bg-blue-100 text-blue-800";
      case "Fatto":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Helper to get payment status class
  const getPaymentStatusClass = (status: string) => {
    switch (status) {
      case "Da Pagare":
        return "bg-yellow-100 text-yellow-800";
      case "Pagato":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(apartment.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(apartment.id, apartment.name);
  };

  return (
    <div 
      className="bg-white rounded-lg shadow hover:shadow-md transition-shadow overflow-hidden cursor-pointer"
      onClick={onClick}
    >
      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-semibold text-lg text-dark">{apartment.name}</h3>
          <div className="flex space-x-1">
            <button 
              className="text-blue-500 hover:text-blue-700 p-1" 
              aria-label="Modifica"
              onClick={handleEdit}
            >
              <Edit size={16} />
            </button>
            <button 
              className="text-red-500 hover:text-red-700 p-1" 
              aria-label="Elimina"
              onClick={handleDelete}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
        
        <div className="flex items-center mb-3 text-gray-700">
          <Calendar className="text-gray-500 mr-2" size={16} />
          <span>{formattedDate}</span>
          
          {apartment.start_time && (
            <>
              <span className="mx-2 text-gray-400">|</span>
              <Clock className="text-gray-500 mr-1" size={14} />
              <span>{apartment.start_time}</span>
            </>
          )}
        </div>
        
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusClass(apartment.status)}`}>
            {apartment.status}
          </span>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPaymentStatusClass(apartment.payment_status)}`}>
            {apartment.payment_status}
          </span>
          {apartment.price && (
            <div className="flex items-center text-sm text-gray-800 bg-gray-100 rounded-full px-2 py-1">
              <Euro size={14} className="mr-1" />
              <span>{Number(apartment.price).toFixed(2)}</span>
            </div>
          )}
        </div>
        
        <div className="text-sm text-gray-600 mb-3">
          <strong>Assegnato a:</strong>
          <span>{apartment.employees.length > 0 
            ? apartment.employees.map(e => `${e.first_name} ${e.last_name}`).join(', ')
            : ' Nessun cliente assegnato'
          }</span>
        </div>
        
        {apartment.notes && (
          <div className="text-sm text-gray-500 italic">{apartment.notes}</div>
        )}
      </div>
    </div>
  );
}
