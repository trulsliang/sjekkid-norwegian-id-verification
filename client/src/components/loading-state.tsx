import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Loader2 } from "lucide-react";

interface LoadingStateProps {
  currentStep?: "scanning" | "authenticating" | "verifying";
}

export function LoadingState({ currentStep = "authenticating" }: LoadingStateProps) {
  const steps = [
    { id: "scanning", label: "QR-kode lest", completed: currentStep !== "scanning" },
    { id: "authenticating", label: "Autentiserer med BankID", completed: currentStep === "verifying" },
    { id: "verifying", label: "Henter brukerdata", completed: false },
  ];

  return (
    <Card className="w-full max-w-md mx-auto overflow-hidden">
      <CardContent className="p-8 text-center">
        <div className="relative mx-auto w-16 h-16 mb-4">
          <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
        <h3 className="text-lg font-medium text-gray-800 mb-2">Bekrefter identitet</h3>
        <p className="text-gray-600 text-sm mb-4">Kontakter BankID for verifisering...</p>
        
        {/* Progress steps */}
        <div className="space-y-2 text-left max-w-xs mx-auto">
          {steps.map((step) => (
            <div key={step.id} className="flex items-center space-x-3 text-sm">
              {step.completed ? (
                <CheckCircle className="h-4 w-4 text-secondary" />
              ) : step.id === currentStep ? (
                <Loader2 className="h-4 w-4 text-primary animate-spin" />
              ) : (
                <div className="w-4 h-4 border-2 border-gray-300 rounded-full"></div>
              )}
              <span className={step.completed ? "text-gray-600" : step.id === currentStep ? "text-gray-800 font-medium" : "text-gray-400"}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
