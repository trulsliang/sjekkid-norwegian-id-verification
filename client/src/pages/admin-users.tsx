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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Plus, ArrowLeft, Shield, User, Trash2, Menu, X, Building, FileText, BarChart3, LogOut, Filter, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import { Link, useLocation } from "wouter";
import { createUserRequestSchema, type CreateUserRequest, type AdminUser, type Organization, type DeleteConfirmation } from "@shared/schema";

export default function AdminUsers() {
  const { user, logout, isAuthenticated } = useAdminAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isFormExpanded, setIsFormExpanded] = useState(false);
  const [organizationFilter, setOrganizationFilter] = useState<number | null>(null);
  
  const sessionId = localStorage.getItem('adminSessionId');

  useEffect(() => {
    if (!sessionId) {
      setLocation("/admin/login");
      return;
    }
    if (user && !['admin', 'org_admin'].includes(user.role)) {
      setLocation("/admin");
      return;
    }
  }, [sessionId, user, setLocation]);

  // Always call hooks first, then handle rendering
  const { data: users, isLoading: usersLoading } = useQuery<AdminUser[]>({
    queryKey: ['/api', 'admin', 'users'],
    enabled: !!sessionId && !!user,
  });

  const { data: organizations, isLoading: orgsLoading } = useQuery<Organization[]>({
    queryKey: ['/api', 'admin', 'organizations'],
    enabled: !!sessionId && !!user,
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: CreateUserRequest) => {
      const response = await apiRequest("POST", "/api/admin/users", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api', 'admin', 'users'] });
      toast({
        title: "Bruker opprettet",
        description: "Ny bruker ble opprettet",
      });
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Feil",
        description: error.message || "Kunne ikke opprette bruker",
        variant: "destructive",
      });
    },
  });

  const form = useForm<CreateUserRequest>({
    resolver: zodResolver(createUserRequestSchema),
    defaultValues: {
      username: "",
      password: "",
      organizationId: user?.role === 'org_admin' ? (user.organizationId || 0) : 0,
      role: "user",
    },
  });

  const deactivateUserMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("PATCH", `/api/admin/users/${id}/deactivate`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api', 'admin', 'users'] });
      toast({
        title: "Bruker deaktivert",
        description: "Brukeren ble deaktivert",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Feil",
        description: error.message || "Kunne ikke deaktivere bruker",
        variant: "destructive",
      });
    },
  });

  const activateUserMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("PATCH", `/api/admin/users/${id}/activate`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api', 'admin', 'users'] });
      toast({
        title: "Bruker aktivert",
        description: "Brukeren ble aktivert",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Feil",
        description: error.message || "Kunne ikke aktivere bruker",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async ({ id, confirmation }: { id: number; confirmation: DeleteConfirmation }) => {
      const response = await apiRequest("DELETE", `/api/admin/users/${id}`, confirmation);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api', 'admin', 'users'] });
      toast({
        title: "User deleted",
        description: "The user was permanently deleted",
      });
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Could not delete user",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateUserRequest) => {
    createUserMutation.mutate(data);
  };

  const handleLogout = () => {
    logout();
    setLocation("/admin/login");
  };

  const handleDeleteClick = (userObj: AdminUser) => {
    setUserToDelete(userObj);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async (confirmation: DeleteConfirmation) => {
    if (userToDelete) {
      deleteUserMutation.mutate({ id: userToDelete.id, confirmation });
    }
  };

  // Filter users based on organization filter
  const filteredUsers = users?.filter(userItem => {
    if (organizationFilter === null) return true;
    return userItem.organizationId === organizationFilter;
  }) || [];

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

  if (!['admin', 'org_admin'].includes(user?.role || '')) {
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
          <h1 className="text-lg font-medium text-gray-900">
            {user?.role === 'org_admin' ? 'Mine brukere' : 'Brukere'}
          </h1>
          
          {/* Desktop logout button */}
          <div className="hidden md:flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {user?.username} ({organizations?.find(org => org.id === user?.organizationId)?.name || 'Ukjent organisasjon'})
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
                    {user?.username} ({organizations?.find(org => org.id === user?.organizationId)?.name || 'Ukjent organisasjon'})
                  </span>
                </div>
                
                <Link href="/admin" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start text-gray-700 hover:text-gray-900 hover:bg-gray-100">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
                
                {user?.role === 'admin' && (
                  <Link href="/admin/organizations" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start text-gray-700 hover:text-gray-900 hover:bg-gray-100">
                      <Building className="h-4 w-4 mr-2" />
                      Organisasjoner
                    </Button>
                  </Link>
                )}
                
                <Link href="/admin/users" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start text-gray-700 hover:text-gray-900 hover:bg-gray-100 bg-gray-100">
                    <Users className="h-4 w-4 mr-2" />
                    {user?.role === 'org_admin' ? 'Mine brukere' : 'Brukere'}
                  </Button>
                </Link>
                
                <Link href="/admin/reports" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start text-gray-700 hover:text-gray-900 hover:bg-gray-100">
                    <FileText className="h-4 w-4 mr-2" />
                    {user?.role === 'org_admin' ? 'Mine rapporter' : user?.role === 'admin' ? 'Rapporter' : 'Mine statistikker'}
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
        <div className="space-y-6">
          {/* Create User Form */}
          <Card>
            <CardHeader>
              <button 
                onClick={() => setIsFormExpanded(!isFormExpanded)}
                className="w-full flex items-center justify-between text-lg font-medium hover:text-primary transition-colors"
              >
                <div className="flex items-center">
                  <Plus className="h-5 w-5 mr-2" />
                  Opprett ny bruker
                </div>
                {isFormExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </button>
            </CardHeader>
            {isFormExpanded && (
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Brukernavn</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Skriv inn brukernavn"
                              {...field}
                              disabled={createUserMutation.isPending}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Passord</FormLabel>
                          <FormControl>
                            <Input 
                              type="password"
                              placeholder="Minimum 6 tegn"
                              {...field}
                              disabled={createUserMutation.isPending}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="organizationId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Organisasjon</FormLabel>
                          <FormControl>
                            {user?.role === 'admin' ? (
                              <Select
                                value={field.value?.toString()}
                                onValueChange={(value) => field.onChange(parseInt(value))}
                                disabled={createUserMutation.isPending || orgsLoading}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Velg organisasjon" />
                                </SelectTrigger>
                                <SelectContent>
                                  {organizations?.map((org) => (
                                    <SelectItem key={org.id} value={org.id.toString()}>
                                      {org.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input
                                value={organizations?.find(org => org.id === user?.organizationId)?.name || 'Din organisasjon'}
                                disabled={true}
                                className="bg-gray-50"
                              />
                            )}
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rolle</FormLabel>
                          <FormControl>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                              disabled={createUserMutation.isPending}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">Bruker</SelectItem>
                                {user?.role === 'admin' && <SelectItem value="org_admin">Organisasjon admin</SelectItem>}
                                {user?.role === 'admin' && <SelectItem value="admin">Administrator</SelectItem>}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full md:w-auto bg-primary hover:bg-primary-dark"
                    disabled={createUserMutation.isPending}
                  >
                    {createUserMutation.isPending ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Oppretter...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Plus className="h-4 w-4" />
                        <span>Opprett bruker</span>
                      </div>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
            )}
          </Card>

          {/* Users List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Eksisterende brukere</h3>
                {user?.role === 'admin' && organizations && organizations.length > 1 && (
                  <div className="flex items-center space-x-2">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <Select
                      value={organizationFilter?.toString() || "all"}
                      onValueChange={(value) => setOrganizationFilter(value === "all" ? null : parseInt(value))}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filtrer etter organisasjon" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Alle organisasjoner</SelectItem>
                        {organizations.map((org) => (
                          <SelectItem key={org.id} value={org.id.toString()}>
                            {org.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : filteredUsers && filteredUsers.length > 0 ? (
                <div className="space-y-3">
                  {filteredUsers.map((userItem) => (
                    <div key={userItem.id} className="border rounded-lg p-4">
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                        {/* User Info Section */}
                        <div className="lg:col-span-8">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            {userItem.role === 'admin' ? (
                              <Shield className="h-4 w-4 text-primary flex-shrink-0" />
                            ) : userItem.role === 'org_admin' ? (
                              <Building className="h-4 w-4 text-blue-600 flex-shrink-0" />
                            ) : (
                              <User className="h-4 w-4 text-gray-500 flex-shrink-0" />
                            )}
                            <h4 className="font-medium text-gray-800 min-w-0 truncate">{userItem.username}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs whitespace-nowrap ${
                              userItem.role === 'admin' 
                                ? 'bg-primary text-white' 
                                : userItem.role === 'org_admin'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {userItem.role === 'admin' ? 'Administrator' : userItem.role === 'org_admin' ? 'Org Admin' : 'Bruker'}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs whitespace-nowrap ${
                              userItem.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {userItem.isActive ? 'Aktiv' : 'Inaktiv'}
                            </span>
                          </div>
                          
                          {userItem.organizationId && organizations && (
                            <p className="text-sm text-gray-600 mb-2 truncate">
                              <span className="font-medium">Organisasjon:</span> {organizations?.find((org) => org.id === userItem.organizationId)?.name || 'Ukjent'}
                            </p>
                          )}
                          
                          <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                            <span className="whitespace-nowrap">
                              <span className="font-medium">Opprettet:</span> {userItem.createdAt ? new Date(userItem.createdAt).toLocaleDateString('nb-NO') : 'Ukjent'}
                            </span>
                            {userItem.lastLogin && (
                              <span className="whitespace-nowrap">
                                <span className="font-medium">Sist innlogget:</span> {new Date(userItem.lastLogin).toLocaleDateString('nb-NO')}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Actions Section */}
                        <div className="lg:col-span-4 flex flex-wrap gap-2 lg:justify-end">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteClick(userItem)}
                            disabled={deleteUserMutation.isPending || userItem.id === user?.id || user?.role === 'org_admin'}
                            data-testid={`button-delete-user-${userItem.id}`}
                            className="flex-shrink-0"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Slett
                          </Button>
                          {userItem.isActive ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deactivateUserMutation.mutate(userItem.id)}
                              disabled={deactivateUserMutation.isPending || userItem.id === user?.id}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                              data-testid={`button-deactivate-user-${userItem.id}`}
                            >
                              {deactivateUserMutation.isPending ? "Deaktiverer..." : "Deaktiver"}
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => activateUserMutation.mutate(userItem.id)}
                              disabled={activateUserMutation.isPending}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50 flex-shrink-0"
                              data-testid={`button-activate-user-${userItem.id}`}
                            >
                              {activateUserMutation.isPending ? "Aktiverer..." : "Aktiver"}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Ingen brukere funnet</p>
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
          setUserToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete User"
        description="This will permanently delete the user and all associated data."
        entityName={userToDelete?.username || ""}
        isDeleting={deleteUserMutation.isPending}
      />
    </div>
  );
}