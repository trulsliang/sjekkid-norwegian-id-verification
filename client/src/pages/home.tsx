import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { createApiUrl } from "@/config/api";
import { QRScanner } from "@/components/qr-scanner";
import { VerificationResultComponent } from "@/components/verification-result";
import { ErrorDisplay } from "@/components/error-display";
import { LoadingState } from "@/components/loading-state";
import { HelpSection } from "@/components/help-section";
import { Shield, MoreVertical } from "lucide-react";
import { Link } from "wouter";
import type { VerificationResult } from "@shared/schema";

type AppState = "scanning" | "loading" | "success" | "error";

interface ApiError {
  message: string;
  error: string;
  details?: any;
}

export default function Home() {
  const [appState, setAppState] = useState<AppState>("scanning");
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [technicalError, setTechnicalError] = useState<string>("");
  const { toast } = useToast();

  const verifyQRMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await fetch(createApiUrl("/api/verify-demo"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sessionId }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    },
    onSuccess: (data: VerificationResult) => {
      setVerificationResult(data);
      setAppState("success");
      toast({
        title: "Identitet bekreftet",
        description: "ID-kortet er gyldig og bekreftet via BankID",
      });
    },
    onError: (error: any) => {
      console.error("Verification failed:", error);
      
      let userMessage = "En uventet feil oppstod under verifikasjon.";
      let technical = error.message || "Unknown error";
      
      // Handle specific API errors - use the detailed message from server when available
      if (error.response && error.response.data && error.response.data.message) {
        // Use the detailed server message directly
        userMessage = error.response.data.message;
      } else if (error.message?.includes("400")) {
        if (error.message.includes("INVALID_SESSION_ID")) {
          userMessage = "QR-koden er ugyldig. Kontroller at den kommer fra BankID-appen.";
        } else if (error.message.includes("SESSION_ALREADY_USED")) {
          userMessage = "Denne QR-koden har allerede blitt brukt. Be om en ny QR-kode fra BankID-appen.";
        } else if (error.message.includes("VERIFICATION_FAILED")) {
          userMessage = "QR-koden er ugyldig eller utløpt. Be om en ny QR-kode fra BankID-appen.";
        }
      } else if (error.message?.includes("401")) {
        userMessage = "Autentisering med BankID mislyktes. Prøv igjen senere.";
      } else if (error.message?.includes("500")) {
        userMessage = "Server-feil. Prøv igjen om litt.";
      }
      
      setErrorMessage(userMessage);
      setTechnicalError(technical);
      setAppState("error");
    },
  });

  const handleScanSuccess = (sessionId: string) => {
    setAppState("loading");
    verifyQRMutation.mutate(sessionId);
  };

  const handleScanError = (error: string) => {
    setErrorMessage(error);
    setTechnicalError("");
    setAppState("error");
  };

  const resetToScanning = () => {
    setAppState("scanning");
    setVerificationResult(null);
    setErrorMessage("");
    setTechnicalError("");
  };

  const showHelp = () => {
    toast({
      title: "Trenger du hjelp?",
      description: "Kontakt support hvis problemet vedvarer.",
    });
  };

  return (
    <div className="min-h-screen bg-surface font-roboto">
      {/* Header */}
      <header className="bg-primary text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8" />
              <div>
                <h1 className="text-xl font-medium">Støe ID Verification</h1>
                <p className="text-blue-100 text-sm">Sikker identitetsbekreftelse</p>
              </div>
            </div>
            <Link href="/admin/login">
              <button className="p-2 rounded-full hover:bg-blue-700 transition-colors" title="Administrator">
                <MoreVertical className="h-5 w-5" />
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 max-w-md">
        {appState === "scanning" && (
          <div className="mb-8">
            <QRScanner 
              onScanSuccess={handleScanSuccess}
              onError={handleScanError}
              isScanning={verifyQRMutation.isPending}
            />
          </div>
        )}

        {appState === "loading" && (
          <div className="mb-8">
            <LoadingState currentStep="authenticating" />
          </div>
        )}

        {appState === "success" && verificationResult && (
          <div className="mb-8">
            <VerificationResultComponent 
              result={verificationResult}
              onReset={resetToScanning}
            />
          </div>
        )}

        {appState === "error" && (
          <div className="mb-8">
            <ErrorDisplay 
              error={errorMessage}
              technicalError={technicalError}
              onRetry={resetToScanning}
              onShowHelp={showHelp}
            />
          </div>
        )}

        {/* Help Section - Always visible */}
        <HelpSection />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="container mx-auto px-4 py-6 max-w-md">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
              <a href="#" className="hover:text-primary transition-colors">Support</a>
            </div>
            <p className="text-xs text-gray-400">
              © TL 2025
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
