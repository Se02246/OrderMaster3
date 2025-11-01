import { EmployeeWithAssignedApartments } from "@shared/schema";
import { Trash2 } from "lucide-react"; // Importa l'icona Trash2

type EmployeeCardProps = {
  employee: EmployeeWithAssignedApartments;
  onDelete: (id: number, name: string) => void;
  onClick?: () => void;
};

export default function EmployeeCard({ employee, onDelete, onClick }: EmployeeCardProps) {
  const fullName = `${employee.first_name} ${employee.last_name}`;
  const assignmentCount = employee.apartments.length;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); // Impedisce che l'evento di click si propaghi alla card
    onDelete(employee.id, fullName);
  };

  return (
    <div
      className="bg-white rounded-lg shadow hover:shadow-md transition-shadow overflow-hidden cursor-pointer"
      onClick={onClick}
    >
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-lg">{fullName}</h3>
            <p className="text-sm text-gray-600 mt-1">
              <span>{assignmentCount}</span> {assignmentCount === 1 ? 'ordine assegnato' : 'ordini assegnati'}
            </p>
          </div>
          {/* Pulsante di eliminazione con la nuova icona */}
          <button
            className="text-red-500 hover:text-red-700 p-1"
            aria-label="Elimina"
            onClick={handleDelete}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
