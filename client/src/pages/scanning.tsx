import { useEffect, useState } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { QRScanner } from "@/components/qr-scanner";
import { VerificationResultComponent } from "@/components/verification-result";
import { LoadingState } from "@/components/loading-state";
import { ErrorDisplay } from "@/components/error-display";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QrCode, ArrowLeft, Shield, Menu, X, Building, Users, FileText, BarChart3, LogOut, Smartphone, Contrast, TestTube } from "lucide-react";
import { Link, useLocation } from "wouter";

type VerificationStep = 'scanner' | 'loading' | 'result' | 'error';

export default function Scanning() {
  const { user, logout, isAuthenticated } = useAdminAuth();
  const [, setLocation] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<VerificationStep>('scanner');
  const [verificationData, setVerificationData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [organizationName, setOrganizationName] = useState<string>('');
  const [androidScanInput, setAndroidScanInput] = useState<string>('');
  const [isHighContrast, setIsHighContrast] = useState<boolean>(false);

  useEffect(() => {
    console.log('=== AUTH CHECK ===');
    console.log('isAuthenticated:', isAuthenticated);
    console.log('user:', user);
    console.log('localStorage sessionId:', localStorage.getItem('adminSessionId'));
    
    // Only redirect if we're sure authentication has been checked and failed
    // Don't redirect immediately on initial load when auth state is being loaded
    const sessionId = localStorage.getItem('adminSessionId');
    if (!isAuthenticated && !sessionId) {
      console.log('No authentication and no session found, redirecting to /login');
      setLocation("/login");
      return;
    }
  }, [isAuthenticated, setLocation, user]);

  // Load contrast preference from localStorage
  useEffect(() => {
    const savedContrast = localStorage.getItem('highContrastMode');
    if (savedContrast === 'true') {
      setIsHighContrast(true);
      document.documentElement.classList.add('high-contrast');
    }
  }, []);

  const toggleHighContrast = () => {
    const newContrastMode = !isHighContrast;
    setIsHighContrast(newContrastMode);
    
    if (newContrastMode) {
      document.documentElement.classList.add('high-contrast');
      localStorage.setItem('highContrastMode', 'true');
    } else {
      document.documentElement.classList.remove('high-contrast');
      localStorage.setItem('highContrastMode', 'false');
    }
  };

  // Fetch organization name for user display
  useEffect(() => {
    const fetchOrganization = async () => {
      if (user?.organizationId) {
        try {
          const currentSessionId = localStorage.getItem('adminSessionId');
          const response = await fetch('/api/admin/organizations', {
            headers: {
              'Authorization': `Bearer ${currentSessionId}`,
              'X-Session-ID': currentSessionId || ''
            }
          });
          if (response.ok) {
            const organizations = await response.json();
            const userOrg = organizations.find((org: any) => org.id === user.organizationId);
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
  }, [user]);

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  const handleScanSuccess = async (qrSessionId: string) => {
    try {
      setIsScanning(true);
      setCurrentStep('loading');
      
      // Get fresh session ID from localStorage and validate
      const currentSessionId = localStorage.getItem('adminSessionId');
      
      // Debug logging
      console.log('Starting verification for session:', qrSessionId);
      
      if (!currentSessionId) {
        console.error('No session found in localStorage');
        // Try to redirect to login instead of throwing error
        setLocation('/');
        return;
      }
      
      // Call verification endpoint - use demo endpoint for demo sessions
      const isDemoSession = qrSessionId.startsWith('VisLeg-demo');
      const endpoint = isDemoSession ? '/api/verify-demo' : '/api/verify';
      
      console.log('Demo session check:', isDemoSession, 'for sessionId:', qrSessionId);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(isDemoSession ? 
          { sessionId: qrSessionId } :
          { sessionId: qrSessionId, authSessionId: currentSessionId }
        ),
        cache: 'no-cache',
        credentials: 'same-origin'
      });


      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Verification failed:', response.status, errorData);
        throw new Error(errorData.message || 'Verification failed');
      }

      const data = await response.json();
      setVerificationData(data);
      setCurrentStep('result');
    } catch (err: any) {
      console.error('Verification error:', err);
      
      // Use the specific error message from the server if available
      const errorMessage = err.message || 'Verifikasjon feilet. Vennligst prøv igjen.';
      setError(errorMessage);
      setCurrentStep('error');
    } finally {
      setIsScanning(false);
    }
  };

  const handleScanError = (errorMessage: string) => {
    setError(errorMessage);
    setCurrentStep('error');
  };

  const resetScanning = () => {
    setCurrentStep('scanner');
    setVerificationData(null);
    setError(null);
    setIsScanning(false);
    setAndroidScanInput('');
  };

  const handleAndroidScanSubmit = () => {
    if (androidScanInput.trim()) {
      // Extract session ID from the URL or use the input directly if it's just the session ID
      let sessionId = androidScanInput.trim();
      
      // If it's a full URL, extract the session ID parameter
      if (sessionId.includes('sessionId=')) {
        const urlParams = new URLSearchParams(sessionId.split('?')[1]);
        sessionId = urlParams.get('sessionId') || sessionId;
      }
      
      handleScanSuccess(sessionId);
      setAndroidScanInput('');
    }
  };

  const handleAndroidInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAndroidScanSubmit();
    }
  };

  // Show loading state while authentication is being determined
  const sessionId = localStorage.getItem('adminSessionId');
  if (!isAuthenticated && !sessionId) {
    return null; // Will redirect via useEffect
  }
  
  // Show loading while waiting for user data
  if (!isAuthenticated && sessionId) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Laster inn brukerinformasjon...</p>
        </div>
      </div>
    );
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
          <h1 className="text-lg font-medium text-gray-900">Skanning</h1>
          
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
                  <Button variant="ghost" className="w-full justify-start text-gray-700 hover:text-gray-900 hover:bg-gray-100">
                    <FileText className="h-4 w-4 mr-2" />
                    {user?.role === 'org_admin' ? 'Mine rapporter' : user?.role === 'admin' ? 'Rapporter' : 'Mine statistikker'}
                  </Button>
                </Link>
                
                <Link href="/scanning" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start text-gray-700 hover:text-gray-900 hover:bg-gray-100 bg-gray-100">
                    <QrCode className="h-4 w-4 mr-2" />
                    Start skanning
                  </Button>
                </Link>
                
                {/* High Contrast Toggle */}
                <Button
                  onClick={toggleHighContrast}
                  variant="ghost"
                  className={`w-full justify-start hover:bg-gray-100 ${
                    isHighContrast 
                      ? 'text-yellow-600 bg-yellow-50 hover:bg-yellow-100 contrast-toggle' 
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                  data-testid="button-contrast-toggle"
                  aria-label={isHighContrast ? "Slå av høy kontrast" : "Slå på høy kontrast"}
                >
                  <Contrast className="h-4 w-4 mr-2" />
                  {isHighContrast ? 'Vanlig kontrast' : 'Høy kontrast'}
                </Button>
                

                
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <Button 
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    variant="ghost"
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                    data-testid="button-logout"
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

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {currentStep === 'scanner' && (
            <div className="space-y-6">
              {/* QR Scanner */}
              <QRScanner
                onScanSuccess={handleScanSuccess}
                onError={handleScanError}
                isScanning={isScanning}
              />

              {/* Android Scanner Input - Completely hidden */}
              <div className="hidden">
                <Input
                  type="text"
                  placeholder="Android scan input"
                  value={androidScanInput}
                  onChange={(e) => setAndroidScanInput(e.target.value)}
                  onKeyPress={handleAndroidInputKeyPress}
                  data-testid="input-android-scan"
                />
              </div>



              {/* Instructions */}
              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Shield className="h-6 w-6 text-primary" />
                    <h2 className="text-xl font-medium">Norsk ID-verifikasjon</h2>
                  </div>
                  <p className="text-gray-600">
                    Skann QR-koden fra BankID "Vis legitimasjon" for å verifisere norsk identitet
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h3 className="font-medium mb-2">Slik gjør du:</h3>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
                      <li>Åpne BankID-appen på telefonen din</li>
                      <li>Velg "Vis legitimasjon"</li>
                      <li>Generer QR-kode</li>
                      <li>Klikk på "Start skanning" ovenfor</li>
                      <li>Hold QR-koden foran kameraet</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {currentStep === 'loading' && (
            <LoadingState />
          )}

          {currentStep === 'result' && verificationData && (
            <VerificationResultComponent
              result={verificationData}
              onReset={resetScanning}
            />
          )}

          {currentStep === 'error' && (
            <ErrorDisplay
              error={error || 'En ukjent feil oppstod'}
              onRetry={resetScanning}
            />
          )}
          

        </div>


      </div>
    </div>
  );
}