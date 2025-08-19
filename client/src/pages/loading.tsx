import { useEffect } from "react";
import { useLocation } from "wouter";

export default function LoadingPage() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Show loading page for 2 seconds, then redirect to login
    const timer = setTimeout(() => {
      setLocation("/");
    }, 2000);

    return () => clearTimeout(timer);
  }, [setLocation]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center space-y-8">
        {/* Logo */}
        <div className="flex items-center justify-center">
          <div className="relative">
            {/* Main logo circle */}
            <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full flex items-center justify-center shadow-lg">
              {/* ID card icon */}
              <svg 
                className="w-12 h-12 text-white" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-6 0"
                />
              </svg>
            </div>
            
            {/* Animated pulse ring */}
            <div className="absolute inset-0 w-24 h-24 border-4 border-blue-300 rounded-full animate-ping opacity-30"></div>
            <div className="absolute inset-2 w-20 h-20 border-2 border-blue-400 rounded-full animate-pulse opacity-50"></div>
          </div>
        </div>

        {/* App name */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-gray-800 tracking-wide">
            SJEKK ID
          </h1>
          <p className="text-gray-600 text-lg">
            Sikker identitetsverifikasjon
          </p>
        </div>

        {/* Loading indicator */}
        <div className="flex items-center justify-center space-x-2">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>

        {/* Subtle tagline */}
        <div className="text-sm text-gray-500 max-w-md mx-auto">
          Laster inn systemet...
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-8 w-full text-center">
        <div className="space-y-2">
          <a href="#" className="text-xs text-gray-500 hover:text-blue-600 transition-colors">Support</a>
          <p className="text-xs text-gray-400">© TL 2025</p>
        </div>
      </div>
    </div>
  );
}