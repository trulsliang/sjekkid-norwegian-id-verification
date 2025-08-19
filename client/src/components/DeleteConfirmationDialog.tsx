import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { deleteConfirmationSchema, type DeleteConfirmation } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (confirmation: DeleteConfirmation) => Promise<void>;
  title: string;
  description: string;
  entityName: string;
  isDeleting?: boolean;
}

export function DeleteConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  entityName,
  isDeleting = false,
}: DeleteConfirmationDialogProps) {
  const form = useForm({
    resolver: zodResolver(deleteConfirmationSchema),
    defaultValues: {
      confirmation: "" as const,
    },
  });

  const handleSubmit = async (data: any) => {
    try {
      await onConfirm(data as DeleteConfirmation);
      form.reset();
      onClose();
    } catch (error) {
      // Error handling is done by the parent component
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <DialogTitle className="text-left" data-testid="dialog-title">{title}</DialogTitle>
              <DialogDescription className="text-left text-sm text-muted-foreground" data-testid="dialog-description">
                {description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/10">
            <p className="text-sm font-medium text-red-800 dark:text-red-200">
              You are about to permanently delete:
            </p>
            <p className="text-sm font-bold text-red-900 dark:text-red-100" data-testid="entity-name">
              {entityName}
            </p>
            <p className="mt-2 text-xs text-red-700 dark:text-red-300">
              This action cannot be undone. All associated data will be permanently removed.
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="confirmation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Type <span className="font-bold text-red-600 dark:text-red-400">DELETE</span> to confirm
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="DELETE"
                        className="font-mono"
                        autoComplete="off"
                        data-testid="input-confirmation"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isDeleting}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={isDeleting}
                  data-testid="button-delete"
                >
                  {isDeleting ? "Deleting..." : "Delete Permanently"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}