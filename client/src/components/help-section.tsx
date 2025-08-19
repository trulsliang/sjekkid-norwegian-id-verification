import { Card, CardContent } from "@/components/ui/card";
import { HelpCircle, Info } from "lucide-react";

export function HelpSection() {
  const steps = [
    {
      number: 1,
      text: "Brukeren åpner BankID-appen og velger \"Vis legitimasjon\""
    },
    {
      number: 2,
      text: "En QR-kode genereres som er gyldig i begrenset tid"
    },
    {
      number: 3,
      text: "Skann QR-koden med denne appen for å bekrefte identiteten"
    }
  ];

  return (
    <Card className="w-full max-w-md mx-auto shadow-sm">
      <CardContent className="p-6">
        <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
          <HelpCircle className="h-5 w-5 text-primary mr-2" />
          Slik bruker du ID-verifisering
        </h3>
        
        <div className="space-y-4 text-sm text-gray-600">
          {steps.map((step) => (
            <div key={step.number} className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                {step.number}
              </div>
              <p>{step.text}</p>
            </div>
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-800 flex items-start">
            <Info className="h-4 w-4 mr-1 flex-shrink-0 mt-0.5" />
            Denne tjenesten bruker offisiell norsk BankID-infrastruktur og er sikker å bruke.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
