import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, Trophy, CalendarClock } from "lucide-react";
import { formatDateForDisplay } from "@/lib/date-utils";

// Definisco i nuovi tipi per i dati
type TopEmployee = {
  name: string;
  count: number;
};

type ProductiveDay = {
  date: string;
  count: number;
};

type StatisticsData = {
  totalOrders: number;
  topEmployees: TopEmployee[];
  busiestDays: ProductiveDay[];
};

export default function Statistics() {
  const { data: stats, isLoading, isError } = useQuery<StatisticsData>({
    queryKey: ['/api/statistics'],
  });

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#70fad3]"></div>
        <p className="mt-2 text-gray-600">Caricamento statistiche...</p>
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div className="text-center py-8 bg-white rounded-lg shadow">
        <i className="fas fa-exclamation-triangle text-red-500 text-5xl mb-4"></i>
        <h3 className="text-xl font-medium text-gray-700 mb-2">Errore</h3>
        <p className="text-gray-500">Impossibile caricare le statistiche.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-dark">Statistiche</h2>

      {/* Griglia Metriche */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Ordini Totali */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ordini Totali</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">Totale ordini registrati</p>
          </CardContent>
        </Card>

        {/* Top 3 Clienti */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Top 3 Clienti
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topEmployees.length > 0 ? (
              <ol className="list-decimal list-inside space-y-2">
                {stats.topEmployees.map((employee, index) => (
                  <li key={index} className="text-sm">
                    <span className="font-medium">{employee.name || "Cliente non definito"}</span>
                    <span className="text-muted-foreground"> ({employee.count} {employee.count === 1 ? 'ordine' : 'ordini'})</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-muted-foreground">Nessun dato disponibile.</p>
            )}
          </CardContent>
        </Card>

        {/* Top 3 Giorni Produttivi */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-blue-500" />
              Top 3 Giorni Produttivi
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.busiestDays.length > 0 ? (
              <ol className="list-decimal list-inside space-y-2">
                {stats.busiestDays.map((day, index) => (
                  <li key={index} className="text-sm">
                    <span className="font-medium">{formatDateForDisplay(day.date)}</span>
                    <span className="text-muted-foreground"> ({day.count} {day.count === 1 ? 'ordine' : 'ordini'})</span>
                  </li>
                ))}
              </ol>
            ) : (
               <p className="text-sm text-muted-foreground">Nessun dato disponibile.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
