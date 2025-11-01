import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import CalendarGrid from "@/components/ui/data-display/CalendarGrid";
import { ApartmentWithAssignedEmployees } from "@shared/schema";

export default function Calendar() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1); // JavaScript months are 0-indexed
  
  // Fetch apartment data for current month
  const { data: apartments = [], isLoading } = useQuery<ApartmentWithAssignedEmployees[]>({
    queryKey: [`/api/calendar/${year}/${month}`],
  });

  const handleMonthChange = (newYear: number, newMonth: number) => {
    setYear(newYear);
    setMonth(newMonth);
  };

  return (
    <div>
      {isLoading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#70fad3]"></div>
          <p className="mt-2 text-gray-600">Caricamento calendario...</p>
        </div>
      ) : (
        <CalendarGrid
          year={year}
          month={month}
          apartments={apartments}
          onMonthChange={handleMonthChange}
        />
      )}
    </div>
  );
}
