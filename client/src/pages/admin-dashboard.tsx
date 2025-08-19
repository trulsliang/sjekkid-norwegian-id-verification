import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Building, FileText, BarChart3, LogOut, Plus, Menu, X } from "lucide-react";
import { Link, useLocation } from "wouter";
import { type DashboardData } from "@shared/schema";

export default function AdminDashboard() {
  const { user, logout, isAuthenticated } = useAdminAuth();
  const [, setLocation] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const sessionId = localStorage.getItem('adminSessionId');
  
  const { data: dashboardData, isLoading, error } = useQuery<DashboardData>({
    queryKey: ['/api', 'admin', 'dashboard'],
    enabled: !!sessionId && !!user,
    retry: false,
  });

  // Handle authentication errors from dashboard API
  useEffect(() => {
    if (error && (error as Error).message.includes('401')) {
      // Session is invalid on server, clear local storage and redirect
      localStorage.removeItem('adminSessionId');
      localStorage.removeItem('adminUser');
      logout();
      setLocation("/");
    }
  }, [error, logout, setLocation]);

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  const isAdmin = user?.role === 'admin';
  const isOrgAdmin = user?.role === 'org_admin';
  const hasAdminAccess = isAdmin || isOrgAdmin;

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated && !sessionId) {
      setLocation("/");
    }
  }, [isAuthenticated, sessionId, setLocation]);

  // Redirect regular users to scanning page
  useEffect(() => {
    if (user && user.role === 'user') {
      setLocation("/scanning");
    }
  }, [user, setLocation]);

  // Show loading while authentication is being verified
  if (!sessionId || !user) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
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
          <h1 className="text-lg font-medium text-gray-900">Dashboard</h1>
          
          {/* Desktop logout button */}
          <div className="hidden md:flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {user?.username} ({dashboardData?.organization?.name || 'Ukjent organisasjon'})
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
                    {user?.username} ({dashboardData?.organization?.name || 'Ukjent organisasjon'})
                  </span>
                </div>
                
                <Link href="/admin" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start text-gray-700 hover:text-gray-900 hover:bg-gray-100 bg-gray-100">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
                
                {isAdmin && (
                  <Link href="/admin/organizations" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start text-gray-700 hover:text-gray-900 hover:bg-gray-100" data-testid="button-organizations">
                      <Building className="h-4 w-4 mr-2" />
                      Organisasjoner
                    </Button>
                  </Link>
                )}
                
                {hasAdminAccess && (
                  <Link href="/admin/users" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start text-gray-700 hover:text-gray-900 hover:bg-gray-100" data-testid="button-users">
                      <Users className="h-4 w-4 mr-2" />
                      {isOrgAdmin ? "Mine brukere" : "Brukere"}
                    </Button>
                  </Link>
                )}
                
                <Link href="/admin/reports" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start text-gray-700 hover:text-gray-900 hover:bg-gray-100">
                    <FileText className="h-4 w-4 mr-2" />
                    {isOrgAdmin ? 'Mine rapporter' : 'Rapporter'}
                  </Button>
                </Link>
                
                <Link href="/scanning" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start text-gray-700 hover:text-gray-900 hover:bg-gray-100">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Start skanning
                  </Button>
                </Link>
                
                {isAdmin && (
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start"
                    onClick={async () => {
                      try {
                        const sessionId = localStorage.getItem('adminSessionId');
                        if (!sessionId) return;
                        
                        const response = await fetch('/api/admin/audit-logs/download', {
                          headers: {
                            'Authorization': `Bearer ${sessionId}`
                          }
                        });
                        
                        if (!response.ok) {
                          throw new Error('Download failed');
                        }
                        
                        const blob = await response.blob();
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
                        document.body.appendChild(a);
                        a.click();
                        window.URL.revokeObjectURL(url);
                        document.body.removeChild(a);
                        setIsMenuOpen(false);
                      } catch (error) {
                        console.error('Failed to download audit logs:', error);
                      }
                    }}
                    data-testid="button-download-audit-logs"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Last ned logfiler
                  </Button>
                )}
                
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

      <div className="container mx-auto px-4 py-6">

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Current Month Stats */}
            {dashboardData?.currentMonthStats && (
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-medium">Denne måneden</h3>
                  <p className="text-sm text-gray-600">
                    {dashboardData.month && dashboardData.year && 
                      `${new Date(0, dashboardData.month - 1).toLocaleString('nb-NO', { month: 'long' })} ${dashboardData.year}`
                    }
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Totale skanninger:</span>
                      <span className="font-medium">{dashboardData.currentMonthStats.totalScans}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Vellykkede:</span>
                      <span className="font-medium text-secondary">{dashboardData.currentMonthStats.successfulScans}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Suksessrate:</span>
                      <span className="font-medium">
                        {dashboardData.currentMonthStats.totalScans > 0 
                          ? Math.round((dashboardData.currentMonthStats.successfulScans / dashboardData.currentMonthStats.totalScans) * 100)
                          : 0}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Organization Info */}
            {dashboardData?.organization && (
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-medium">Din organisasjon</h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-600">Navn:</span>
                      <p className="font-medium">{dashboardData.organization.name}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">E-post:</span>
                      <p className="font-medium">{dashboardData.organization.contactEmail}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Admin Overview */}
            {isAdmin && dashboardData?.organizations && (
              <Card className="md:col-span-2 lg:col-span-3">
                <CardHeader>
                  <h3 className="text-lg font-medium">Alle organisasjoner</h3>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Organisasjon</th>
                          <th className="text-left py-2">E-post</th>
                          <th className="text-right py-2">Totale skanninger</th>
                          <th className="text-right py-2">Vellykkede</th>
                          <th className="text-right py-2">Suksessrate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dashboardData.organizations.map((item) => (
                          <tr key={item.organization.id} className="border-b">
                            <td className="py-2 font-medium">{item.organization.name}</td>
                            <td className="py-2 text-gray-600">{item.organization.contactEmail}</td>
                            <td className="py-2 text-right">{item.stats.totalScans}</td>
                            <td className="py-2 text-right text-secondary">{item.stats.successfulScans}</td>
                            <td className="py-2 text-right">
                              {item.stats.totalScans > 0 
                                ? Math.round((item.stats.successfulScans / item.stats.totalScans) * 100)
                                : 0}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-medium">Hurtighandlinger</h3>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/admin/reports">
                  <Button className="w-full justify-start" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Generer rapport
                  </Button>
                </Link>
                {isAdmin && (
                  <>
                    <Link href="/admin/organizations">
                      <Button className="w-full justify-start" variant="outline" data-testid="button-new-organization">
                        <Building className="h-4 w-4 mr-2" />
                        Ny organisasjon
                      </Button>
                    </Link>
                    <Link href="/admin/users">
                      <Button className="w-full justify-start" variant="outline" data-testid="button-new-user">
                        <Users className="h-4 w-4 mr-2" />
                        Ny bruker
                      </Button>
                    </Link>
                  </>
                )}
                <Link href="/scanning">
                  <Button className="w-full justify-start" variant="outline">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Start skanning
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}