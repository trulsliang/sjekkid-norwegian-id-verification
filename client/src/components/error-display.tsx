import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, HelpCircle } from "lucide-react";
import { useEffect } from "react";
import { playErrorSound } from "@/lib/audioUtils";

interface ErrorDisplayProps {
  error: string;
  technicalError?: string;
  onRetry: () => void;
  onShowHelp?: () => void;
}

export function ErrorDisplay({ error, technicalError, onRetry, onShowHelp }: ErrorDisplayProps) {
  // Play error sound when component mounts
  useEffect(() => {
    playErrorSound();
  }, []);

  return (
    <Card className="w-full max-w-md mx-auto overflow-hidden border-l-4 border-error verification-error">
      <CardContent className="p-6">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-6 w-6 text-error flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-800 mb-2">Verifisering mislyktes</h3>
            <p className="text-gray-600 text-sm mb-4">
              {error}
            </p>
            
            {/* Error details */}
            {technicalError && (
              <div className="bg-red-50 rounded-lg p-3 mb-4">
                <p className="text-xs text-red-600 font-mono break-all">
                  {technicalError}
                </p>
              </div>
            )}
            
            <div className="flex space-x-3">
              <Button 
                onClick={onRetry}
                className="flex-1 bg-primary hover:bg-primary-dark text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Prøv igjen
              </Button>
              {onShowHelp && (
                <Button 
                  onClick={onShowHelp}
                  variant="outline"
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  <HelpCircle className="h-4 w-4 mr-1" />
                  Hjelp
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
