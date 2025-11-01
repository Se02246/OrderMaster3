import { Button } from "@/components/ui/button";
import { ConfirmDeleteModalProps } from "./types";

export default function ConfirmDeleteModal({ isOpen, onClose, onConfirm, message }: ConfirmDeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
        <div className="p-6">
          <div className="mb-4">
            <h3 className="text-xl font-semibold text-dark mb-2">Conferma Eliminazione</h3>
            <p className="text-gray-600">{message}</p>
          </div>
          
          <div className="flex justify-end space-x-3">
            <Button
              onClick={onClose}
              variant="outline"
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
            >
              ANNULLA
            </Button>
            <Button
              onClick={onConfirm}
              variant="destructive"
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
            >
              ELIMINA
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
