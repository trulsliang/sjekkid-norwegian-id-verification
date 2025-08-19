import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useToast } from "@/hooks/use-toast";

import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { FileText, Plus, ArrowLeft, Download, CheckCircle, Circle, Menu, X, Building, Users, BarChart3, LogOut } from "lucide-react";
import { Link, useLocation } from "wouter";
import { generateReportRequestSchema, generateAllOrganizationsReportRequestSchema, type GenerateReportRequest, type GenerateAllOrganizationsReportRequest, type Organization, type MonthlyReport } from "@shared/schema";

export default function AdminReports() {
  const { user, logout, isAuthenticated } = useAdminAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [organizationName, setOrganizationName] = useState<string>('');
  const [reportType, setReportType] = useState<'single' | 'all'>('single');


  
  const sessionId = localStorage.getItem('adminSessionId');

  useEffect(() => {
    if (!sessionId) {
      setLocation("/");
      return;
    }
  }, [sessionId, setLocation]);

  // Fetch organization name for user display
  useEffect(() => {
    const fetchOrganization = async () => {
      if (user?.organizationId) {
        try {
          const response = await fetch('/api/admin/organizations', {
            headers: {
              'Authorization': `Bearer ${sessionId}`
            }
          });
          if (response.ok) {
            const orgs = await response.json();
            const userOrg = orgs.find((org: any) => org.id === user.organizationId);
            setOrganizationName(userOrg?.name || 'Ukjent organisasjon');
          }
        } catch (error) {
          console.error('Failed to fetch organization:', error);
          setOrganizationName('Ukjent organisasjon');
        }
      }
    };

    if (user) {
      fetchOrganization();
    }
  }, [user, sessionId]);

  // Always call hooks first
  const { data: organizations } = useQuery<Organization[]>({
    queryKey: ['/api', 'admin', 'organizations'],
    enabled: !!sessionId && !!user && user.role === 'admin',
  });

  const { data: reports, isLoading: reportsLoading } = useQuery<MonthlyReport[]>({
    queryKey: ['/api', 'admin', 'reports', selectedOrgId],
    queryFn: () => fetch(`/api/admin/reports?organizationId=${selectedOrgId || user?.organizationId}`, {
      headers: { Authorization: `Bearer ${sessionId}` }
    }).then(res => res.json()),
    enabled: !!sessionId && !!user && Boolean(selectedOrgId || user?.organizationId),
  });

  const generateReportMutation = useMutation({
    mutationFn: async (data: GenerateReportRequest) => {
      const response = await apiRequest("POST", "/api/admin/reports/generate", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api', 'admin', 'reports'] });
      toast({
        title: "Rapport generert",
        description: "Ny månedlig rapport ble opprettet",
      });
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Feil",
        description: error.message || "Kunne ikke generere rapport",
        variant: "destructive",
      });
    },
  });

  const form = useForm<GenerateReportRequest>({
    resolver: zodResolver(generateReportRequestSchema),  
    defaultValues: {
      organizationId: user?.role === 'org_admin' ? user.organizationId : (selectedOrgId || 1),
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
    },
  });

  // Set organization ID for org_admin users when user data is available
  useEffect(() => {
    if (user?.role === 'org_admin' && user.organizationId) {
      setSelectedOrgId(user.organizationId);
      form.setValue('organizationId', user.organizationId);
    }
  }, [user, form]);

  const allOrgForm = useForm<GenerateAllOrganizationsReportRequest>({
    resolver: zodResolver(generateAllOrganizationsReportRequestSchema),
    defaultValues: {
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
    },
  });

  const generateAllOrganizationsReportMutation = useMutation({
    mutationFn: async (data: GenerateAllOrganizationsReportRequest) => {
      const sessionId = localStorage.getItem('adminSessionId');
      const response = await fetch("/api/admin/reports/generate-all", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${sessionId}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to generate comprehensive report");
      }

      // Handle CSV download with better mobile browser support
      const blob = await response.blob();
      
      // Get filename from response headers or create default
      const contentDisposition = response.headers.get('content-disposition');
      const filename = contentDisposition 
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `comprehensive-report-${data.year}-${data.month.toString().padStart(2, '0')}.csv`;
      
      // Try different download methods for better mobile compatibility
      if (typeof navigator !== 'undefined' && navigator.share && blob.size > 0) {
        // Use Web Share API on mobile if available
        try {
          const file = new File([blob], filename, { type: 'text/csv' });
          await navigator.share({ files: [file] });
          return { success: true };
        } catch (shareError) {
          console.log('Web Share API not supported or failed, falling back to direct download');
        }
      }
      
      // Fallback to traditional download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      link.style.display = 'none';
      
      // Force trigger download
      document.body.appendChild(link);
      setTimeout(() => {
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
      
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Omfattende rapport lastet ned",
        description: "CSV-filen med alle organisasjoner er lastet ned",
      });
      allOrgForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Feil",
        description: error.message || "Kunne ikke generere omfattende rapport",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: GenerateReportRequest) => {
    generateReportMutation.mutate(data);
  };

  const onSubmitAllOrg = (data: GenerateAllOrganizationsReportRequest) => {
    generateAllOrganizationsReportMutation.mutate(data);
  };

  const handleLogout = () => {
    logout();
    setLocation("/");
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



  return (
    <div className="min-h-screen bg-surface">
      {/* Header with hamburger menu and page title */}
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
            {user?.role === 'org_admin' ? 'Mine rapporter' : 'Rapporter'}
          </h1>
          
          {/* Desktop logout button */}
          <div className="hidden md:flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {user?.username} ({organizationName || 'Ukjent organisasjon'})
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
                    {user?.username} ({organizationName || 'Ukjent organisasjon'})
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
                
                {['admin', 'org_admin'].includes(user?.role || '') && (
                  <Link href="/admin/users" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start text-gray-700 hover:text-gray-900 hover:bg-gray-100">
                      <Users className="h-4 w-4 mr-2" />
                      {user?.role === 'org_admin' ? 'Mine brukere' : 'Brukere'}
                    </Button>
                  </Link>
                )}
                
                <Link href="/admin/reports" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start text-gray-700 hover:text-gray-900 hover:bg-gray-100 bg-gray-100">
                    <FileText className="h-4 w-4 mr-2" />
                    {user?.role === 'org_admin' ? 'Mine rapporter' : 'Rapporter'}
                  </Button>
                </Link>
                
                <Link href="/scanning" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start text-gray-700 hover:text-gray-900 hover:bg-gray-100">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Start skanning
                  </Button>
                </Link>
                
                <div className="border-t border-gray-200 pt-2 mt-2">
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
          {/* Content based on user role */}
          {['admin', 'org_admin'].includes(user?.role || '') ? (
            <>
            {/* Admin Report Type Selection */}
            {user?.role === 'admin' && (
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-medium">Rapporttype</h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex space-x-4">
                      <button
                        onClick={() => setReportType('single')}
                        className={`flex-1 p-3 rounded-lg border-2 transition-colors ${
                          reportType === 'single' 
                            ? 'border-primary bg-primary/5 text-primary' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="font-medium">Enkelt organisasjon</div>
                        <div className="text-sm text-gray-600">Generer rapport for én organisasjon</div>
                      </button>
                      <button
                        onClick={() => setReportType('all')}
                        className={`flex-1 p-3 rounded-lg border-2 transition-colors ${
                          reportType === 'all' 
                            ? 'border-primary bg-primary/5 text-primary' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="font-medium">Alle organisasjoner</div>
                        <div className="text-sm text-gray-600">Omfattende rapport med MFX ID</div>
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Generate Report Form */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-medium flex items-center">
                  <Plus className="h-5 w-5 mr-2" />
                  {user?.role === 'admin' && reportType === 'all' 
                    ? 'Generer omfattende rapport' 
                    : 'Generer ny rapport'}
                </h3>
              </CardHeader>
              <CardContent>
                {user?.role === 'admin' && reportType === 'all' ? (
                  <Form {...allOrgForm}>
                    <form onSubmit={allOrgForm.handleSubmit(onSubmitAllOrg)} className="space-y-4">
                      <FormField
                        control={allOrgForm.control}
                        name="month"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Måned</FormLabel>
                            <FormControl>
                              <Select
                                value={field.value?.toString()}
                                onValueChange={(value) => field.onChange(parseInt(value))}
                                disabled={generateAllOrganizationsReportMutation.isPending}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Velg måned" />
                                </SelectTrigger>
                                <SelectContent>
                                  {Array.from({ length: 12 }, (_, i) => (
                                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                                      {new Date(2000, i).toLocaleDateString('no-NO', { month: 'long' })}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={allOrgForm.control}
                        name="year"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>År</FormLabel>
                            <FormControl>
                              <Select
                                value={field.value?.toString()}
                                onValueChange={(value) => field.onChange(parseInt(value))}
                                disabled={generateAllOrganizationsReportMutation.isPending}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Velg år" />
                                </SelectTrigger>
                                <SelectContent>
                                  {Array.from({ length: 11 }, (_, i) => (
                                    <SelectItem key={2020 + i} value={(2020 + i).toString()}>
                                      {2020 + i}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button 
                        type="submit" 
                        className="w-full bg-primary hover:bg-primary-dark"
                        disabled={generateAllOrganizationsReportMutation.isPending}
                      >
                        {generateAllOrganizationsReportMutation.isPending ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Genererer...</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <Plus className="h-4 w-4" />
                            <span>Generer omfattende rapport</span>
                          </div>
                        )}
                      </Button>
                    </form>
                  </Form>
                ) : (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                                  onValueChange={(value) => {
                                    field.onChange(parseInt(value));
                                    setSelectedOrgId(parseInt(value));
                                  }}
                                  disabled={generateReportMutation.isPending}
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
                                  value={organizations?.[0]?.name || 'Din organisasjon'}
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
                      name="month"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Måned</FormLabel>
                          <FormControl>
                            <Select
                              value={field.value?.toString()}
                              onValueChange={(value) => field.onChange(parseInt(value))}
                              disabled={generateReportMutation.isPending}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                                  <SelectItem key={month} value={month.toString()}>
                                    {new Date(0, month - 1).toLocaleString('nb-NO', { month: 'long' })}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="year"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>År</FormLabel>
                          <FormControl>
                            <Select
                              value={field.value?.toString()}
                              onValueChange={(value) => field.onChange(parseInt(value))}
                              disabled={generateReportMutation.isPending}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
                                  <SelectItem key={year} value={year.toString()}>
                                    {year}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      className="w-full bg-primary hover:bg-primary-dark"
                      disabled={generateReportMutation.isPending}
                      data-testid="button-generate-report"
                    >
                      {generateReportMutation.isPending ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Genererer...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Plus className="h-4 w-4" />
                          <span>Generer rapport</span>
                        </div>
                      )}
                    </Button>
                  </form>
                </Form>
                )}
              </CardContent>
            </Card>
            </>
          ) : (
            // User: Today's Statistics
            <Card>
              <CardHeader>
                <h3 className="text-lg font-medium flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Dagens statistikker
                </h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {Array.isArray(reports) ? reports.reduce((sum, report) => sum + report.totalScans, 0) : 0}
                      </div>
                      <div className="text-sm text-gray-600">Totale skanninger</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {Array.isArray(reports) ? reports.reduce((sum, report) => sum + report.successfulScans, 0) : 0}
                      </div>
                      <div className="text-sm text-gray-600">Vellykkede</div>
                    </div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-700">
                      {Array.isArray(reports) && reports.length > 0 
                        ? Math.round((reports.reduce((sum, report) => sum + report.successfulScans, 0) / reports.reduce((sum, report) => sum + report.totalScans, 0)) * 100) 
                        : 0}%
                    </div>
                    <div className="text-sm text-gray-600">Suksessrate</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Download Reports for Users */}
          {user?.role === 'user' && (
            <Card>
              <CardHeader>
                <h3 className="text-lg font-medium flex items-center">
                  <Download className="h-5 w-5 mr-2" />
                  Last ned rapporter
                </h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reports && reports.length > 0 ? (
                    reports.map((report) => (
                      <div key={report.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">
                            {new Date(0, report.month - 1).toLocaleString('nb-NO', { month: 'long' })} {report.year}
                          </div>
                          <div className="text-sm text-gray-600">
                            {report.totalScans} skanninger, {report.successfulScans} vellykkede
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4 mr-2" />
                          Last ned
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-4">
                      Ingen rapporter tilgjengelig
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Existing Reports */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-medium">Eksisterende rapporter</h3>
            </CardHeader>
            <CardContent>
              {reportsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : reports && reports.length > 0 ? (
                <div className="space-y-3">
                  {reports.map((report: any) => (
                    <div 
                      key={report.id} 
                      className="p-4 border rounded-lg bg-white dark:bg-gray-800"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">
                            {new Date(0, report.month - 1).toLocaleString('nb-NO', { month: 'long' })} {report.year}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {report.totalScans} totale skanninger • {report.successfulScans} vellykkede
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Generert: {new Date(report.createdAt).toLocaleDateString('nb-NO')}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {report.isInvoiced ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <Circle className="h-5 w-5 text-gray-400" />
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-primary hover:text-primary-dark"
                            data-testid={`button-download-report-${report.id}`}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Last ned
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Ingen rapporter funnet</p>
                  <p className="text-sm">Generer din første rapport ved å bruke skjemaet til venstre</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>


      </div>
    </div>
  );
}