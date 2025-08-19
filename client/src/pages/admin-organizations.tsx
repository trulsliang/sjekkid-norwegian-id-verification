import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Building, Plus, ArrowLeft, Trash2, Menu, X, Users, FileText, BarChart3, LogOut, ChevronDown, ChevronUp } from "lucide-react";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import { Badge } from "@/components/ui/badge";
import { Link, useLocation } from "wouter";
import { createOrganizationRequestSchema, type CreateOrganizationRequest, type DeleteConfirmation, type Organization } from "@shared/schema";

export default function AdminOrganizations() {
  const { user, logout, isAuthenticated } = useAdminAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [organizationToDelete, setOrganizationToDelete] = useState<Organization | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isFormExpanded, setIsFormExpanded] = useState(false);
  
  const sessionId = localStorage.getItem('adminSessionId');

  // Always call hooks first before any conditional logic
  const { data: organizations, isLoading } = useQuery({
    queryKey: ['/api', 'admin', 'organizations'],
    enabled: !!sessionId && !!user,
  });

  const form = useForm<CreateOrganizationRequest>({
    resolver: zodResolver(createOrganizationRequestSchema),
    defaultValues: {
      name: "",
      contactEmail: "",
      mfxid: "",
    },
  });

  const createOrgMutation = useMutation({
    mutationFn: async (data: CreateOrganizationRequest) => {
      const response = await apiRequest("POST", "/api/admin/organizations", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api', 'admin', 'organizations'] });
      toast({
        title: "Organisasjon opprettet",
        description: "Ny organisasjon ble opprettet",
      });
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Feil",
        description: error.message || "Kunne ikke opprette organisasjon",
        variant: "destructive",
      });
    },
  });

  const deactivateOrgMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("PATCH", `/api/admin/organizations/${id}/deactivate`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api', 'admin', 'organizations'] });
      toast({
        title: "Organisasjon deaktivert",
        description: "Organisasjonen ble deaktivert",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Feil",
        description: error.message || "Kunne ikke deaktivere organisasjon",
        variant: "destructive",
      });
    },
  });

  const activateOrgMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("PATCH", `/api/admin/organizations/${id}/activate`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api', 'admin', 'organizations'] });
      toast({
        title: "Organisasjon aktivert",
        description: "Organisasjonen ble aktivert",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Feil",
        description: error.message || "Kunne ikke aktivere organisasjon",
        variant: "destructive",
      });
    },
  });

  const deleteOrgMutation = useMutation({
    mutationFn: async ({ id, confirmation }: { id: number; confirmation: DeleteConfirmation }) => {
      const response = await apiRequest("DELETE", `/api/admin/organizations/${id}`, confirmation);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api', 'admin', 'organizations'] });
      toast({
        title: "Organization deleted",
        description: "The organization was permanently deleted",
      });
      setDeleteDialogOpen(false);
      setOrganizationToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Could not delete organization",
        variant: "destructive",
      });
    },
  });

  // Handle navigation after all hooks are defined
  useEffect(() => {
    if (!sessionId) {
      setLocation("/admin/login");
      return;
    }
    if (user && user.role !== 'admin') {
      setLocation("/admin");
      return;
    }
  }, [sessionId, user, setLocation]);

  const onSubmit = (data: CreateOrganizationRequest) => {
    createOrgMutation.mutate(data);
  };

  const handleLogout = () => {
    logout();
    setLocation("/admin/login");
  };

  const handleDeleteClick = (organization: Organization) => {
    setOrganizationToDelete(organization);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async (confirmation: DeleteConfirmation) => {
    if (organizationToDelete) {
      deleteOrgMutation.mutate({ id: organizationToDelete.id, confirmation });
    }
  };

  if (!sessionId) {
    return null; // Will redirect via useEffect
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-medium mb-2">Ingen tilgang</h2>
          <p className="text-gray-600 mb-4">Du har ikke tilgang til denne siden</p>
          <Link href="/admin">
            <Button>Tilbake til dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Minimal Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="flex items-center justify-between px-4 py-2">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-gray-600 hover:text-gray-900 md:hidden"
            data-testid="button-toggle-menu"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          <h1 className="text-lg font-medium text-gray-900">Organisasjoner</h1>
          
          {/* Desktop logout button */}
          <div className="hidden md:flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {user?.username} ({Array.isArray(organizations) ? organizations.find((org: any) => org.id === user?.organizationId)?.name : 'Ukjent organisasjon'})
            </span>
            <Button 
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="text-red-600 border-red-600 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4 mr-1" />
              Logg ut
            </Button>
          </div>
        </div>
        
        {/* Collapsible Menu */}
        {isMenuOpen && (
          <div className="bg-white border-t border-gray-200 shadow-lg">
            <div className="px-4 py-4">
              <div className="space-y-2">
                <div className="border-b border-gray-200 pb-2 mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    {user?.username} ({Array.isArray(organizations) ? organizations.find((org: any) => org.id === user?.organizationId)?.name : 'Ukjent organisasjon'})
                  </span>
                </div>
                
                <Link href="/admin" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start text-gray-700 hover:text-gray-900 hover:bg-gray-100">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
                
                <Link href="/admin/organizations" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start text-gray-700 hover:text-gray-900 hover:bg-gray-100 bg-gray-100">
                    <Building className="h-4 w-4 mr-2" />
                    Organisasjoner
                  </Button>
                </Link>
                
                <Link href="/admin/users" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start text-gray-700 hover:text-gray-900 hover:bg-gray-100">
                    <Users className="h-4 w-4 mr-2" />
                    Brukere
                  </Button>
                </Link>
                
                <Link href="/admin/reports" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start text-gray-700 hover:text-gray-900 hover:bg-gray-100">
                    <FileText className="h-4 w-4 mr-2" />
                    Rapporter
                  </Button>
                </Link>
                
                <Link href="/scanning" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start text-gray-700 hover:text-gray-900 hover:bg-gray-100">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Start skanning
                  </Button>
                </Link>
                
                <div className="block md:hidden border-t border-gray-200 pt-2 mt-2">
                  <Button 
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    variant="ghost"
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logg ut
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Create Organization Form */}
          <Card>
            <CardHeader>
              <button 
                onClick={() => setIsFormExpanded(!isFormExpanded)}
                className="w-full flex items-center justify-between text-lg font-medium hover:text-primary transition-colors"
              >
                <div className="flex items-center">
                  <Plus className="h-5 w-5 mr-2" />
                  Opprett ny organisasjon
                </div>
                {isFormExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </button>
            </CardHeader>
            {isFormExpanded && (
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organisasjonsnavn</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Skriv inn organisasjonsnavn"
                            {...field}
                            disabled={createOrgMutation.isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="contactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kontakt e-post</FormLabel>
                        <FormControl>
                          <Input 
                            type="email"
                            placeholder="kontakt@organisasjon.no"
                            {...field}
                            disabled={createOrgMutation.isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="mfxid"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>MFX ID</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Unik MFX identifikator"
                            {...field}
                            disabled={createOrgMutation.isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary-dark"
                    disabled={createOrgMutation.isPending}
                  >
                    {createOrgMutation.isPending ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Oppretter...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Plus className="h-4 w-4" />
                        <span>Opprett organisasjon</span>
                      </div>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
            )}
          </Card>

          {/* Existing Organizations */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-medium">Eksisterende organisasjoner</h3>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : organizations && Array.isArray(organizations) && organizations.length > 0 ? (
                <div className="space-y-3">
                  {(organizations as any[])?.map((org: any) => (
                    <div 
                      key={org.id} 
                      className="p-4 border rounded-lg bg-white dark:bg-gray-800"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{org.name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{org.contactEmail}</p>
                          {org.address && (
                            <p className="text-sm text-gray-500 mt-1">{org.address}</p>
                          )}
                          <div className="flex items-center mt-2">
                            <span className={`text-sm font-medium ${org.isActive ? "text-green-600" : "text-red-600"}`}>
                              {org.isActive ? "Aktiv" : "Inaktiv"}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteClick(org)}
                            disabled={deleteOrgMutation.isPending}
                            data-testid={`button-delete-org-${org.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          {org.isActive ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deactivateOrgMutation.mutate(org.id)}
                              disabled={deactivateOrgMutation.isPending}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              data-testid={`button-deactivate-org-${org.id}`}
                            >
                              {deactivateOrgMutation.isPending ? "Deaktiverer..." : "Deaktiver"}
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => activateOrgMutation.mutate(org.id)}
                              disabled={activateOrgMutation.isPending}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              data-testid={`button-activate-org-${org.id}`}
                            >
                              {activateOrgMutation.isPending ? "Aktiverer..." : "Aktiver"}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Building className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Ingen organisasjoner funnet</p>
                  <p className="text-sm">Opprett din første organisasjon ved å bruke skjemaet til venstre</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setOrganizationToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Organization"
        description="This will permanently delete the organization and all associated data."
        entityName={organizationToDelete?.name || ""}
        isDeleting={deleteOrgMutation.isPending}
      />
    </div>
  );
}