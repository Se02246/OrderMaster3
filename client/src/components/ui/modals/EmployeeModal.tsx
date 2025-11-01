import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  type Employee,
  insertEmployeeSchema,
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

import { type ModalProps } from "./types";

type FormValues = z.infer<typeof insertEmployeeSchema>;

interface EmployeeModalProps extends ModalProps {
  onSuccess?: (employee: Employee) => void;
}

export function EmployeeModal({
  // mode, // Rimuoviamo il commento problematico e il parametro non usato
  isOpen,
  onClose,
  onSuccess,
}: EmployeeModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(insertEmployeeSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
    },
  });

  React.useEffect(() => {
    if (isOpen) {
      form.reset({
        first_name: "",
        last_name: "",
      });
    }
  }, [isOpen, form]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      return apiRequest("POST", "/api/employees", values);
    },
    onSuccess: async (res) => {
      const newEmployee = await res.json();
      toast({
        title: "Cliente creato",
        description: `${newEmployee.first_name} ${newEmployee.last_name} è stato aggiunto.`,
      });
      // Invalida solo la query dei dipendenti
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      
      // Chiama la callback di successo se fornita
      if (onSuccess) {
        onSuccess(newEmployee);
      }
      onClose(); // Chiude il modal
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile creare il cliente.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: FormValues) => {
    mutation.mutate(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nuovo Cliente</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Mario" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cognome</FormLabel>
                    <FormControl>
                      <Input placeholder="Rossi" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button variant="ghost" type="button" onClick={onClose}>
                Annulla
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Creazione..." : "Crea Cliente"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
