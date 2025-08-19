import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff } from "lucide-react";

interface CameraProps {
  onStream?: (stream: MediaStream | null) => void;
  className?: string;
}

export function CameraComponent({ onStream, className = "" }: CameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCamera = async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: "environment", // Use back camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      setStream(mediaStream);
      setIsActive(true);
      onStream?.(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Cannot access camera. Please ensure camera permissions are granted.");
      onStream?.(null);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsActive(false);
      onStream?.(null);
      
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />
      
      {error && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4">
          <div className="text-center text-white">
            <CameraOff className="h-12 w-12 mx-auto mb-2" />
            <p className="text-sm">{error}</p>
            <Button 
              onClick={startCamera} 
              variant="outline" 
              size="sm"
              className="mt-2 text-black"
            >
              Try Again
            </Button>
          </div>
        </div>
      )}
      
      {!isActive && !error && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
          <Button onClick={startCamera} size="lg" className="bg-primary hover:bg-primary-dark">
            <Camera className="h-5 w-5 mr-2" />
            Start Camera
          </Button>
        </div>
      )}
    </div>
  );
}
