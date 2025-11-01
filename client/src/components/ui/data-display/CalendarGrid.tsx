import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { format, addMonths, subMonths, parseISO, getDaysInMonth, getDay, setDate, isSameDay } from "date-fns";
import { it } from "date-fns/locale";
import { ApartmentWithAssignedEmployees } from "@shared/schema";
import { ChevronLeft, ChevronRight } from "lucide-react";

type CalendarGridProps = {
  year: number;
  month: number;
  apartments: ApartmentWithAssignedEmployees[];
  onMonthChange: (year: number, month: number) => void;
};

export default function CalendarGrid({ year, month, apartments, onMonthChange }: CalendarGridProps) {
  const [, navigate] = useLocation();
  const currentDate = new Date();
  const viewDate = new Date(year, month - 1, 1);

  const handlePrevMonth = () => {
    const prevMonth = subMonths(viewDate, 1);
    onMonthChange(prevMonth.getFullYear(), prevMonth.getMonth() + 1);
  };

  const handleNextMonth = () => {
    const nextMonth = addMonths(viewDate, 1);
    onMonthChange(nextMonth.getFullYear(), nextMonth.getMonth() + 1);
  };

  // Group apartments by date
  const apartmentsByDate: Record<string, ApartmentWithAssignedEmployees[]> = {};
  apartments.forEach(apt => {
    const dateStr = apt.cleaning_date;
    if (!apartmentsByDate[dateStr]) {
      apartmentsByDate[dateStr] = [];
    }
    apartmentsByDate[dateStr].push(apt);
  });

  const renderCalendarDays = () => {
    const days = [];
    const daysInMonth = getDaysInMonth(viewDate);

    // Get the day of the week for the first day of the month (0 = Sunday, 1 = Monday, etc.)
    // Adjust for Monday as the first day of the week
    let firstDayOfMonth = getDay(setDate(viewDate, 1));
    firstDayOfMonth = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // Adjust for Monday start

    // Add empty cells for days before the first of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-28 border p-1 bg-gray-50"></div>
      );
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const dateStr = format(date, 'yyyy-MM-dd');
      const isToday = isSameDay(date, currentDate);

      const dayApartments = apartmentsByDate[dateStr] || [];

      days.push(
        <div
          key={dateStr}
          className={`h-28 border p-1 cursor-pointer hover:bg-gray-50 transition-colors relative group ${
            isToday ? 'bg-primary/10' : ''
          }`}
          onClick={() => navigate(`/calendar/${year}/${month}/${day}`)}
          data-date={dateStr}
        >
          <div className={`absolute top-1 left-1 font-medium ${isToday ? 'text-primary' : ''}`}>
            {day}
          </div>

          {dayApartments.length > 0 && (
            <div className="mt-6 space-y-1">
              {dayApartments.slice(0, 2).map(apt => (
                <div
                  key={apt.id}
                  className="bg-primary/20 rounded px-1 py-0.5 text-xs truncate"
                  title={apt.name}
                >
                  {apt.name}
                </div>
              ))}
              {dayApartments.length > 2 && (
                <div className="text-xs text-gray-500">
                  +{dayApartments.length - 2} altri
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-dark">Calendario</h2>
        <div className="flex items-center space-x-2">
          <button
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            onClick={handlePrevMonth}
            aria-label="Mese precedente"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="text-lg font-medium">
            {format(viewDate, 'MMMM yyyy', { locale: it })}
          </div>
          <button
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            onClick={handleNextMonth}
            aria-label="Mese successivo"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Calendar Header */}
        <div className="grid grid-cols-7 text-center border-b">
          <div className="py-3 font-medium text-gray-600">Lun</div>
          <div className="py-3 font-medium text-gray-600">Mar</div>
          <div className="py-3 font-medium text-gray-600">Mer</div>
          <div className="py-3 font-medium text-gray-600">Gio</div>
          <div className="py-3 font-medium text-gray-600">Ven</div>
          <div className="py-3 font-medium text-gray-600">Sab</div>
          <div className="py-3 font-medium text-gray-600">Dom</div>
        </div>

        {/* Calendar Days Grid */}
        <div className="grid grid-cols-7 text-sm">
          {renderCalendarDays()}
        </div>
      </div>
    </div>
  );
}
