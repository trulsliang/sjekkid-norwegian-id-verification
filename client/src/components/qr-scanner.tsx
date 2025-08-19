import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CameraComponent } from "@/components/ui/camera";
import { QrCode, Camera } from "lucide-react";
import jsQR from "jsqr";

interface QRScannerProps {
  onScanSuccess: (sessionId: string) => void;
  onError: (error: string) => void;
  isScanning?: boolean;
}

export function QRScanner({ onScanSuccess, onError, isScanning = false }: QRScannerProps) {
  const [isActive, setIsActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  const scanQRCode = () => {
    if (!stream || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const video = document.querySelector('video');
    
    if (!ctx || !video || video.videoWidth === 0 || video.videoHeight === 0) {
      // Video not ready yet, continue scanning
      animationRef.current = requestAnimationFrame(scanQRCode);
      return;
    }

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Scan for QR code
    const qrCode = jsQR(imageData.data, imageData.width, imageData.height);
    
    if (qrCode) {
      const sessionId = qrCode.data.trim();
      
      // Validate sessionId format
      if (sessionId.startsWith("VisLeg-")) {
        onScanSuccess(sessionId);
        stopScanning();
        return;
      } else {
        onError("Invalid QR code format. Please use a QR code from BankID app.");
      }
    }

    // Continue scanning
    animationRef.current = requestAnimationFrame(scanQRCode);
  };

  const startScanning = async () => {
    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera access not supported in this browser");
      }

      // Request camera access with fallback options
      let constraints = {
        video: { 
          facingMode: "environment", // Use back camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      let mediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (envError) {
        // Fallback to front camera if environment camera fails
        console.log("Back camera failed, trying front camera:", envError);
        constraints.video = {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        };
        mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      }
      
      setStream(mediaStream);
      setIsActive(true);
    } catch (err: any) {
      console.error("Error accessing camera:", err);
      let errorMessage = "Kan ikke få tilgang til kameraet.";
      
      if (err?.name === 'NotAllowedError') {
        errorMessage = "Kamera tilgang ble nektet. Vennligst tillat kamera tilgang og prøv igjen.";
      } else if (err?.name === 'NotFoundError') {
        errorMessage = "Ingen kamera funnet på enheten.";
      } else if (err?.name === 'NotSupportedError') {
        errorMessage = "Kamera støttes ikke i denne nettleseren.";
      }
      
      onError(errorMessage);
    }
  };

  const stopScanning = () => {
    setIsActive(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    // Stop camera stream
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      
      const video = document.querySelector('video');
      if (video) {
        video.srcObject = null;
      }
    }
  };

  useEffect(() => {
    if (stream && isActive && !isScanning) {
      // Start QR scanning loop
      animationRef.current = requestAnimationFrame(scanQRCode);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [stream, isActive, isScanning]);

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center border-b border-gray-100">
        <div className="flex items-center justify-center mb-2">
          <QrCode className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-xl font-medium text-gray-800">Skann QR-kode</h2>
        <p className="text-gray-600 text-sm">Hold telefonen over QR-koden fra BankID-appen</p>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="relative bg-black h-64">
          {stream ? (
            <video
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              ref={(video) => {
                if (video && stream) {
                  video.srcObject = stream;
                }
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-white text-center">
                <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm opacity-75">Kamera ikke aktivt</p>
              </div>
            </div>
          )}
          
          {/* QR Scanner Frame Overlay */}
          {isActive && stream && (
            <div className="absolute inset-0 bg-black bg-opacity-40">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-48 h-48 border-2 border-white rounded-lg relative scanner-viewfinder">
                  {/* Corner indicators */}
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-secondary rounded-tl-lg scanner-corners"></div>
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-secondary rounded-tr-lg scanner-corners"></div>
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-secondary rounded-bl-lg scanner-corners"></div>
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-secondary rounded-br-lg scanner-corners"></div>
                  
                  {/* Scanning line animation */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-secondary animate-pulse"></div>
                </div>
              </div>
            </div>
          )}
          
          {/* Status indicator */}
          {isActive && stream && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
              <div className="bg-black bg-opacity-50 text-white px-4 py-2 rounded-full text-sm flex items-center space-x-2">
                <div className="w-2 h-2 bg-secondary rounded-full animate-pulse"></div>
                <span>Søker etter QR-kode...</span>
              </div>
            </div>
          )}
        </div>
        
        <div className="p-4 space-y-3">
          {!isActive ? (
            <>
              <Button 
                onClick={startScanning} 
                className="w-full bg-primary hover:bg-primary-dark text-white py-3 px-6 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                disabled={isScanning}
              >
                <Camera className="h-5 w-5" />
                <span>Start skanning</span>
              </Button>
            </>
          ) : (
            <Button 
              onClick={stopScanning} 
              variant="outline"
              className="w-full py-3 px-6 rounded-lg font-medium"
              disabled={isScanning}
            >
              Stopp skanning
            </Button>
          )}
        </div>
      </CardContent>
      
      {/* Hidden canvas for QR code processing */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </Card>
  );
}
