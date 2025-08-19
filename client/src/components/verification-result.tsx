import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Verified, RefreshCw, QrCode, AlertTriangle } from "lucide-react";
import type { VerificationResult } from "@shared/schema";
import { useEffect } from "react";
import { playSuccessSound, playWarningSound } from "@/lib/audioUtils";

interface VerificationResultProps {
  result: VerificationResult;
  onReset: () => void;
}

export function VerificationResultComponent({ result, onReset }: VerificationResultProps) {
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('no-NO', {
      timeStyle: 'medium',
      dateStyle: 'long'
    });
  };

  const formatTimeOnly = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('no-NO', {
      timeStyle: 'medium'
    });
  };

  const isUnder18 = result.age && result.age < 18;

  useEffect(() => {
    // Play appropriate sound based on verification result
    if (isUnder18) {
      playWarningSound();
    } else {
      playSuccessSound();
    }
  }, [isUnder18]);

  return (
    <div className="space-y-4">
      {/* Quick Scan Button */}
      <div className="text-center">
        <Button 
          onClick={onReset}
          className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 mx-auto"
        >
          <QrCode className="h-4 w-4" />
          <span>Skann neste person</span>
        </Button>
      </div>

      <Card className="w-full max-w-md mx-auto overflow-hidden">
        <div className={`p-3 text-center text-white ${
          isUnder18 
            ? 'bg-red-600 verification-error' 
            : 'bg-secondary verification-success'
        }`}>
          {isUnder18 ? (
            <AlertTriangle className="h-6 w-6 mx-auto mb-1" />
          ) : (
            <CheckCircle className="h-6 w-6 mx-auto mb-1" />
          )}
          <h3 className="text-base font-medium">
            {isUnder18 ? 'Under 18 år' : 'Identitet bekreftet'}
          </h3>
          <p className={`text-xs ${isUnder18 ? 'text-red-100' : 'text-green-100'}`}>
            {isUnder18 ? 'Person er under myndighetsalder' : 'Gyldig norsk ID-kort'}
          </p>
        </div>
      
      <CardContent className="p-4">
        {/* Compact User Information */}
        <div className="space-y-3">
          {/* Photo and Name Row */}
          <div className="flex items-center space-x-3">
            {result.documentPhoto && result.documentPhoto.length > 100 ? (
              <img 
                src={`data:image/jpeg;base64,${result.documentPhoto}`}
                alt="ID-foto" 
                className="w-16 h-16 rounded-lg object-cover border-2 border-gray-200" 
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' fill='%23e5e7eb'%3E%3Crect width='64' height='64'/%3E%3C/svg%3E";
                }}
              />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
                <span className="text-gray-400 text-xs">Demo</span>
              </div>
            )}
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900">
                {result.firstName} {result.lastName}
              </h3>
              <p className={`text-sm font-medium ${isUnder18 ? 'text-red-600' : 'text-gray-600'}`}>
                Alder: {result.age || 'Ukjent'} år
                {isUnder18 && (
                  <span className="ml-2 text-red-600 font-semibold">(Under 18)</span>
                )}
              </p>
            </div>
          </div>
          
          {/* Status Row */}
          <div className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
            <div className="flex items-center space-x-2">
              <Verified className={`h-4 w-4 ${isUnder18 ? 'text-red-600' : 'text-secondary'}`} />
              <span className={`text-sm font-medium ${isUnder18 ? 'text-red-600' : 'text-secondary'}`}>
                BankID bekreftet
              </span>
            </div>
            <span className="text-xs text-gray-500">
              {formatTimeOnly(result.timestamp)}
            </span>
          </div>
        </div>
      </CardContent>
      </Card>
    </div>
  );
}
