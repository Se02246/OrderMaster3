import React, { useState } from "react"; 
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  type ApartmentWithAssignedEmployees,
  type Employee,
  apartmentWithEmployeesSchema,
} from "@shared/schema";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, PlusCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

import { type ModalProps } from "./types";
import { EmployeeModal } from "./EmployeeModal";

type FormValues = z.infer<typeof apartmentWithEmployeesSchema>;

type ApartmentModalProps = ModalProps<ApartmentWithAssignedEmployees>;

export function ApartmentModal({
  mode,
  data: apartment,
  isOpen,
  onClose,
}: ApartmentModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);

  // Carica i dipendenti per la selezione
  const { data: employees } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  // Setup del form
  const form = useForm<FormValues>({
    resolver: zodResolver(apartmentWithEmployeesSchema),
    defaultValues: {
      name: apartment?.name ?? "",
      cleaning_date: apartment?.cleaning_date ?? format(new Date(), "yyyy-MM-dd"),
      start_time: apartment?.start_time ?? "",
      status: apartment?.status ?? "Da Fare",
      payment_status: apartment?.payment_status ?? "Da Pagare",
      price: apartment?.price ?? "",
      notes: apartment?.notes ?? "",
      employee_ids: apartment?.employees.map((e) => e.id) ?? [],
    },
  });

  // Resetta il form quando i dati o la modalità cambiano
  React.useEffect(() => {
    if (isOpen) {
      form.reset({
        name: apartment?.name ?? "",
        cleaning_date: apartment?.cleaning_date ?? format(new Date(), "yyyy-MM-dd"),
        start_time: apartment?.start_time ?? "",
        status: apartment?.status ?? "Da Fare",
        payment_status: apartment?.payment_status ?? "Da Pagare",
        price: apartment?.price ?? "",
        notes: apartment?.notes ?? "",
        employee_ids: apartment?.employees.map((e) => e.id) ?? [],
      });
    }
  }, [isOpen, apartment, form]);
  
  // Mutazione per creare/aggiornare l'appartamento
  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const url =
        mode === "edit" ? `/api/apartments/${apartment!.id}` : "/api/apartments";
      const method = mode === "edit" ? "PUT" : "POST";
      return apiRequest(method, url, values);
    },
    onSuccess: () => {
      toast({
        title: `Ordine ${mode === "edit" ? "aggiornato" : "creato"}`,
        description: `L'ordine è stato ${
          mode === "edit" ? "aggiornato" : "creato"
        } con successo.`,
      });
      // Invalida tutte le query relative per aggiornare l'interfaccia
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
          query.queryKey[0].startsWith('/api/statistics') 
      });
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          typeof query.queryKey[0] === 'string' && 
          query.queryKey[0].startsWith('/api/employees') 
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Si è verificato un errore.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: FormValues) => {
    mutation.mutate(values);
  };

  const onEmployeeCreated = () => {
    // Aggiorna l'elenco dei dipendenti
    queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
    setIsEmployeeModalOpen(false);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md sm:max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {mode === "edit" ? "Modifica Ordine" : "Nuovo Ordine"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            {/* Il form inizia qui */}
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 overflow-y-auto px-1">
              {/* Sezione Dati Principali */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Ordine</FormLabel>
                      <FormControl>
                        {/* === MODIFICA 1: Placeholder rimosso === */}
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prezzo</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Es. 50.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Sezione Data e Ora */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cleaning_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col pt-2">
                      {/* === MODIFICA 2: Label cambiata === */}
                      <FormLabel>Data</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn( 
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )} 
                            >
                              {field.value ? (
                                format(new Date(field.value + "T00:00:00"), "PPP", { locale: it })
                              ) : (
                                <span>Scegli una data</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value ? new Date(field.value + "T00:00:00") : undefined}
                            onSelect={(date) =>
                              field.onChange(date ? format(date, "yyyy-MM-dd") : "")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="start_time"
                  render={({ field }) => (
                    <FormItem>
                      {/* === MODIFICA 3: Label cambiata === */}
                      <FormLabel>Ora</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Sezione Stato */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stato Ordine</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleziona stato..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Da Fare">Da Fare</SelectItem>
                          <SelectItem value="In Corso">In Corso</SelectItem>
                          <SelectItem value="Fatto">Fatto</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="payment_status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stato Pagamento</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleziona stato..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Da Pagare">Da Pagare</SelectItem>
                          <SelectItem value="Pagato">Pagato</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Sezione Clienti (Dipendenti) */}
              <FormField
                control={form.control}
                name="employee_ids"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between items-center mb-2">
                      <FormLabel className="text-lg">Clienti Assegnati</FormLabel>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEmployeeModalOpen(true)}
                      >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Nuovo Cliente
                      </Button>
                    </div>
                    <ScrollArea className="h-40 w-full rounded-md border">
                      <FormControl>
                        <ToggleGroup
                          type="multiple"
                          variant="outline"
                          className="flex-wrap justify-start p-4"
                          
                          value={Array.isArray(field.value) ? field.value.map(String) : []}
                          
                          onValueChange={(value: string[]) => {
                            const numericValue = value
                              .map(id => parseInt(id, 10)) 
                              .filter(id => !isNaN(id) && id > 0);
                            
                            field.onChange(numericValue);
                          }}
                        >
                          {employees?.map((employee) => (
                            <ToggleGroupItem
                              key={employee.id}
                              value={String(employee.id)} 
                              // === MODIFICA 4: Stile per selezione ===
                              className="flex gap-2 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary/90"
                              aria-label={`Toggle ${employee.first_name}`}
                            >
                              <User className="h-4 w-4" />
                              {employee.first_name} {employee.last_name}
                            </ToggleGroupItem>
                          ))}
                        </ToggleGroup>
                      </FormControl>
                    </ScrollArea>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Sezione Note */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Note</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Note sull'ordine..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="pt-4">
                <Button variant="ghost" type="button" onClick={onClose}>
                  Annulla
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending
                    ? "Salvataggio..."
                    : mode === "edit"
                    ? "Salva Modifiche"
                    : "Crea Ordine"}
                </Button>
              </DialogFooter>
            {/* Il form finisce qui */}
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Modal per creare un nuovo dipendente/cliente */}
      <EmployeeModal
        mode="create"
        isOpen={isEmployeeModalOpen}
        onClose={() => setIsEmployeeModalOpen(false)}
        onSuccess={onEmployeeCreated}
      />
    </>
  );
}
