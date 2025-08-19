import { useEffect, useState } from "react";
import { useLocation } from "wouter";

export default function SplashPage() {
  const [, setLocation] = useLocation();
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Start showing content after a brief delay
    const showTimer = setTimeout(() => {
      setShowContent(true);
    }, 300);

    // Redirect to login after showing splash
    const redirectTimer = setTimeout(() => {
      setLocation("/login");
    }, 2500);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(redirectTimer);
    };
  }, [setLocation]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center overflow-hidden">
      <div className={`text-center space-y-8 transition-all duration-1000 ${showContent ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'}`}>
        {/* Logo */}
        <div className="flex items-center justify-center">
          <div className="relative">
            {/* Main logo circle with gradient */}
            <div className="w-28 h-28 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-full flex items-center justify-center shadow-2xl border-4 border-white">
              {/* ID verification icon */}
              <svg 
                className="w-14 h-14 text-white" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                strokeWidth={1.5}
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z"
                />
              </svg>
            </div>
            
            {/* Animated pulse rings */}
            <div className="absolute inset-0 w-28 h-28 border-4 border-blue-300 rounded-full animate-ping opacity-20"></div>
            <div className="absolute inset-2 w-24 h-24 border-2 border-blue-400 rounded-full animate-pulse opacity-40"></div>
            
            {/* Sparkle effects */}
            <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400 rounded-full animate-pulse"></div>
            <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-green-400 rounded-full animate-bounce"></div>
          </div>
        </div>

        {/* App name with modern typography */}
        <div className="space-y-3">
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-800 tracking-tight">
            SJEKK ID
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-indigo-600 mx-auto rounded-full"></div>
        </div>

        {/* Elegant loading indicator */}
        <div className="flex items-center justify-center space-x-1">
          <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-3 h-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-3 h-3 bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>

        {/* Tagline */}
        <div className="text-gray-500 max-w-md mx-auto space-y-1">
          <p className="text-sm">Laster inn...</p>
        </div>
      </div>

      {/* Floating geometric shapes */}
      <div className="absolute top-20 left-20 w-16 h-16 bg-blue-100 rounded-full opacity-50 animate-float"></div>
      <div className="absolute bottom-32 right-16 w-12 h-12 bg-indigo-100 rounded-lg opacity-40 animate-float-delayed"></div>
      <div className="absolute top-1/3 right-1/4 w-8 h-8 bg-blue-200 rounded-full opacity-30 animate-pulse"></div>

      {/* Footer */}
      <div className="absolute bottom-8 w-full text-center">
        <div className="space-y-2">
          <a href="#" className="text-xs text-gray-400 hover:text-blue-600 transition-colors">Support</a>
          <p className="text-xs text-gray-300">© TL 2025</p>
        </div>
      </div>
    </div>
  );
}